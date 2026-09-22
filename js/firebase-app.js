// ===== Firebase App Logic =====

function isAllowedToPublish(vendor) {
  if (!vendor) return false;
  if (vendor.status === "active") return true;
  if (vendor.status === "trial") {
    var join = new Date(vendor.joinDate || vendor.createdAt || vendor.createdAt);
    if (isNaN(join.getTime())) return true;
    var days = (Date.now() - join.getTime()) / (1000 * 60 * 60 * 24);
    return days < 3.01; // 3 أيام كاملة
  }
  return false;
}

function saveVendorLocal(vendor) {
  try {
    var list = JSON.parse(localStorage.getItem("local_vendors") || "[]");
    var found = false;
    list = list.map(function(v) {
      if (v.id === vendor.id) { found = true; return Object.assign({}, v, vendor); }
      return v;
    });
    if (!found) list.unshift(vendor);
    localStorage.setItem("local_vendors", JSON.stringify(list.slice(0, 200)));
  } catch (e) {}
}

function getLocalVendors() {
  try { return JSON.parse(localStorage.getItem("local_vendors") || "[]"); } catch (e) { return []; }
}

function getTrialDaysLeft(vendor) {
  if (!vendor || vendor.status !== "trial") return 0;
  var join = new Date(vendor.joinDate || vendor.createdAt);
  if (isNaN(join.getTime())) return 3;
  var days = 3 - Math.floor((Date.now() - join.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function vendorFromUser(user, extra) {
  extra = extra || {};
  var joinDate = new Date().toISOString().split("T")[0];
  return {
    id: user.uid,
    fullName: extra.fullName || user.displayName || "",
    phone: extra.phone || "",
    shopName: extra.shopName || user.displayName || "متجري",
    category: extra.category || "",
    email: user.email || "",
    status: "trial",
    daysLeft: 3,
    joinDate: joinDate,
    createdAt: joinDate
  };
}

async function ensureVendorDoc(user, extra) {
  extra = extra || {};
  var fallback = vendorFromUser(user, extra);
  try {
    var ref = db.collection("vendors").doc(user.uid);
    var doc = null;
    try {
      doc = await Promise.race([
        ref.get(),
        new Promise(function(_, rej) { setTimeout(function() { rej(new Error("timeout")); }, 8000); })
      ]);
    } catch (e) { doc = null; }

    if (doc && doc.exists) {
      var data = Object.assign({ id: doc.id }, doc.data());
      // انتهاء التجربة تلقائياً بعد 3 أيام
      if (data.status === "trial" && !isAllowedToPublish(data)) {
        data.status = "inactive";
        data.daysLeft = 0;
        try { await ref.update({ status: "inactive", daysLeft: 0 }); } catch (e2) {}
      }
      saveVendorLocal(data);
      return data;
    }

    // تاجر جديد: تجربة 3 أيام
    fallback.status = "trial";
    fallback.daysLeft = 3;
    fallback.joinDate = new Date().toISOString();
    fallback.createdAt = fallback.joinDate;
    try {
      await Promise.race([
        ref.set(fallback),
        new Promise(function(_, rej) { setTimeout(function() { rej(new Error("timeout")); }, 8000); })
      ]);
    } catch (e3) {}
    saveVendorLocal(fallback);
    return fallback;
  } catch (e) {
    saveVendorLocal(fallback);
    return fallback;
  }
}

async function registerMerchant(email, password, data) {
  try {
    var userCred = await auth.createUserWithEmailAndPassword(email, password);
    var vendor = await ensureVendorDoc(userCred.user, data);
    return { success: true, uid: userCred.user.uid, vendor: vendor };
  } catch (e) {
    var msg = e.message || "خطأ";
    if (e.code === "auth/email-already-in-use") msg = "هذا الإيميل مسجل مسبقاً. استخدم Google أو إيميل آخر.";
    if (e.code === "auth/weak-password") msg = "كلمة المرور ضعيفة (6 أحرف على الأقل)";
    if (e.code === "auth/invalid-email") msg = "البريد غير صحيح";
    return { success: false, error: msg };
  }
}

async function loginMerchant(email, password) {
  try {
    var userCred = await auth.signInWithEmailAndPassword(email, password);
    var vendor = await ensureVendorDoc(userCred.user, {});
    return { success: true, vendor: vendor };
  } catch (e) {
    var msg = "الإيميل أو كلمة المرور غير صحيحة. إذا سجّلت عبر Google استخدم زر Google.";
    return { success: false, error: msg };
  }
}

async function loginWithGoogle() {
  try {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    // على الجوال: redirect أسلس — بدون نافذة سوداء
    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
      await auth.signInWithRedirect(provider);
      return { success: true, redirecting: true };
    }
    var result = await auth.signInWithPopup(provider);
    var vendor = await ensureVendorDoc(result.user, {
      fullName: result.user.displayName || "",
      shopName: result.user.displayName || "متجري"
    });
    return { success: true, vendor: vendor };
  } catch (e) {
    if (auth.currentUser) {
      return { success: true, vendor: vendorFromUser(auth.currentUser, {}) };
    }
    // إن فشل popup جرّب redirect
    try {
      var provider2 = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithRedirect(provider2);
      return { success: true, redirecting: true };
    } catch (e2) {
      return { success: false, error: (e2.message || e.message || "فشل الدخول عبر Google") };
    }
  }
}

async function handleGoogleRedirectResult() {
  try {
    var result = await auth.getRedirectResult();
    if (result && result.user) {
      var vendor = await ensureVendorDoc(result.user, {
        fullName: result.user.displayName || "",
        shopName: result.user.displayName || "متجري"
      });
      return { success: true, vendor: vendor };
    }
  } catch (e) {}
  return null;
}

async function getCurrentVendor() {
  var user = auth.currentUser;
  if (!user) return null;
  return await ensureVendorDoc(user, {});
}

// نشر فوري محلياً + محاولة Firestore في الخلفية
async function publishProductToFirebase(product) {
  var payload = {
    name: product.name || "",
    price: product.price || "",
    desc: product.desc || "",
    img: (product.img && product.img.length < 350000) ? product.img : "",
    category: product.category || "",
    vendor: product.vendor || "",
    vendorId: product.vendorId || "",
    phone: product.phone || "",
    createdAt: new Date().toISOString()
  };

  // 1) حفظ محلي فوري — لا ينتظر الشبكة
  try {
    var local = JSON.parse(localStorage.getItem("local_products") || "[]");
    payload.id = "local_" + Date.now();
    local.unshift(payload);
    localStorage.setItem("local_products", JSON.stringify(local.slice(0, 100)));
  } catch (e) {}

  // 2) محاولة السيرفر بدون تعليق الواجهة
  try {
    var serverPayload = Object.assign({}, payload);
    delete serverPayload.id;
    var done = false;
    var timer = setTimeout(function() { done = true; }, 8000);
    db.collection("products").add(serverPayload).then(function() {
      clearTimeout(timer);
    }).catch(function() {
      clearTimeout(timer);
    });
  } catch (e) {}

  return { success: true };
}

async function getProducts(category) {
  var list = [];
  try {
    var local = JSON.parse(localStorage.getItem("local_products") || "[]");
    list = list.concat(local);
  } catch (e) {}
  try {
    var snap = await Promise.race([
      db.collection("products").get(),
      new Promise(function(_, rej) { setTimeout(function() { rej(new Error("t")); }, 5000); })
    ]);
    var remote = snap.docs.map(function(d) { return { id: d.id, ...d.data() }; });
    // دمج بدون تكرار بالاسم+وقت تقريبي
    remote.forEach(function(r) {
      var exists = list.some(function(l) {
        return l.name === r.name && l.vendor === r.vendor && l.price === r.price;
      });
      if (!exists) list.push(r);
    });
  } catch (e) {}
  if (category) list = list.filter(function(p) { return p.category === category; });
  list.sort(function(a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); });
  return list;
}

async function getVendors() {
  var list = [];
  try {
    var snap = await Promise.race([
      db.collection("vendors").get(),
      new Promise(function(_, rej) { setTimeout(function() { rej(new Error("t")); }, 8000); })
    ]);
    list = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
  } catch (e) {}
  // دمج المحلي حتى يظهر من سجّل بجوجل فوراً في الأدمن
  var local = getLocalVendors();
  local.forEach(function(lv) {
    if (!list.some(function(x) { return x.id === lv.id; })) list.push(lv);
  });
  // حدّث حالة التجربة المنتهية
  list = list.map(function(v) {
    if (v.status === "trial" && !isAllowedToPublish(v)) {
      return Object.assign({}, v, { status: "inactive", daysLeft: 0 });
    }
    return v;
  });
  return list;
}

async function setVendorStatus(vendorId, status) {
  var data = {
    status: status,
    daysLeft: status === "active" ? 7 : 0
  };
  if (status === "active") {
    data.activatedAt = new Date().toISOString();
    data.subscription = "weekly_100_syp";
    data.joinDate = data.joinDate || new Date().toISOString();
  }
  var ok = false;
  try {
    await db.collection("vendors").doc(vendorId).set(data, { merge: true });
    ok = true;
  } catch (e1) {
    try {
      await db.collection("vendors").doc(vendorId).update(data);
      ok = true;
    } catch (e2) {}
  }
  // حدّث المحلي دائماً حتى يعمل الأدمن فوراً
  try {
    var list = getLocalVendors();
    var found = false;
    list = list.map(function(v) {
      if (v.id === vendorId) {
        found = true;
        return Object.assign({}, v, data, { id: vendorId });
      }
      return v;
    });
    if (!found) list.unshift(Object.assign({ id: vendorId }, data));
    localStorage.setItem("local_vendors", JSON.stringify(list));
  } catch (e3) {}
  if (!ok) {
    // نجح محلياً على الأقل
  }
  return { success: true };
}

async function registerCustomer(email, password, data) {
  try {
    var userCred = await auth.createUserWithEmailAndPassword(email, password);
    var payload = Object.assign({}, data || {}, {
      email: email,
      id: userCred.user.uid,
      createdAt: new Date().toISOString()
    });
    try {
      await db.collection("customers").doc(userCred.user.uid).set(payload);
    } catch (e) {}
    try {
      var local = JSON.parse(localStorage.getItem("local_customers") || "[]");
      local.unshift(payload);
      localStorage.setItem("local_customers", JSON.stringify(local.slice(0, 200)));
    } catch (e2) {}
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

var _navUpdating = false;
async function updateNavForVendor() {
  if (_navUpdating) return;
  _navUpdating = true;
  try {
    var user = auth.currentUser;
    var links = document.querySelectorAll(".nav-links");
    links.forEach(function(nav) {
      var old = nav.querySelector(".vendor-publish-link");
      if (old) old.remove();
    });
    if (!user) { _navUpdating = false; return; }
    var vendor = null;
    try {
      vendor = await getCurrentVendor();
    } catch (e) {
      vendor = vendorFromUser(user, {});
    }
    if (vendor && isAllowedToPublish(vendor)) {
      links.forEach(function(nav) {
        if (nav.querySelector(".vendor-publish-link")) return;
        var a = document.createElement("a");
        a.href = "vendor.html#publish";
        a.className = "vendor-publish-link nav-cta";
        a.textContent = "🏪 لوحة التاجر";
        a.href = "vendor.html";
        nav.appendChild(a);
      });
    }
  } catch (e) {}
  _navUpdating = false;
}

if (typeof auth !== "undefined") {
  auth.onAuthStateChanged(function(user) {
    setTimeout(updateNavForVendor, 300);
  });
}

async function uploadProductImage(file, vendorId) {
  if (!file) return { success: false, error: "لا صورة", url: "" };
  try {
    if (file.size > 8 * 1024 * 1024) {
      return { success: false, error: "الصورة كبيرة", url: "" };
    }
    var dataUrl = await compressImageFile(file, 400, 0.45);
    if (dataUrl.length > 300000) dataUrl = await compressImageFile(file, 280, 0.35);
    if (dataUrl.length > 350000) return { success: false, error: "الصورة كبيرة بعد الضغط", url: "" };
    return { success: true, url: dataUrl };
  } catch (e) {
    return { success: false, error: e.message || "فشل", url: "" };
  }
}

function compressImageFile(file, maxWidth, quality) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onerror = function() { reject(new Error("فشل قراءة الملف")); };
    reader.onload = function(e) {
      var img = new Image();
      img.onerror = function() { reject(new Error("صورة غير صالحة")); };
      img.onload = function() {
        var w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


async function getMyProducts(vendorId) {
  var all = await getProducts();
  return all.filter(function(p) {
    return p.vendorId === vendorId || (p.id && String(p.id).indexOf("local_") === 0 && p.vendorId === vendorId);
  });
}

async function deleteProduct(product) {
  try {
    // local
    var local = JSON.parse(localStorage.getItem("local_products") || "[]");
    local = local.filter(function(p) {
      if (product.id && p.id === product.id) return false;
      if (p.name === product.name && p.vendor === product.vendor && p.createdAt === product.createdAt) return false;
      return true;
    });
    localStorage.setItem("local_products", JSON.stringify(local));
  } catch (e) {}
  // firestore
  if (product.id && String(product.id).indexOf("local_") !== 0) {
    try {
      await db.collection("products").doc(product.id).delete();
    } catch (e) {}
  } else if (product.name) {
    try {
      var snap = await db.collection("products").where("name", "==", product.name).where("vendorId", "==", product.vendorId || "").get();
      snap.forEach(function(doc) { doc.ref.delete(); });
    } catch (e) {}
  }
  return { success: true };
}

async function updateProduct(product, updates) {
  try {
    var local = JSON.parse(localStorage.getItem("local_products") || "[]");
    local = local.map(function(p) {
      if ((product.id && p.id === product.id) || (p.name === product.name && p.createdAt === product.createdAt)) {
        return Object.assign({}, p, updates);
      }
      return p;
    });
    localStorage.setItem("local_products", JSON.stringify(local));
  } catch (e) {}
  if (product.id && String(product.id).indexOf("local_") !== 0) {
    try {
      await db.collection("products").doc(product.id).update(updates);
    } catch (e) {}
  }
  return { success: true };
}
