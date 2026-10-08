// Remon marketplace enhancements
(function () {
  'use strict';

  function waUrl(phone, text) {
    var p = String(phone || '').replace(/[^0-9]/g, '');
    if (!p) return '';
    if (p.charAt(0) === '0') p = '963' + p.slice(1);
    return 'https://wa.me/' + p + '?text=' + encodeURIComponent(text || 'مرحباً، أريد الاستفسار عن منتجك في ريمون');
  }

  function hideAdminNotifications() {
    if (!location.pathname.toLowerCase().includes('admin')) return;
    var style = document.createElement('style');
    style.textContent = '.toast{display:none!important}.toast.show{display:none!important}';
    document.head.appendChild(style);
    window.alert = function () {};
  }

  function smartAccountLink(href, label) {
    // يوجد زر «حسابي» واحد فقط: الزبون -> customer.html، التاجر -> vendor.html.
    // لا نحوّل أزرار «انضم كتاجر» أو «دخول التاجر» إلى حسابي.
    var accountLinks = [];
    document.querySelectorAll('.nav-links a[href="customer.html"], .nav-links a[href="vendor.html"], .hero-buttons a[href="customer.html"]').forEach(function(a) {
      accountLinks.push(a);
    });

    // في شريط الصفحات الداخلية نُبقي رابط حساب واحد فقط.
    document.querySelectorAll('.nav-links').forEach(function(nav) {
      var candidates = nav.querySelectorAll('a[href="customer.html"], a[href="vendor.html"]');
      var kept = false;
      candidates.forEach(function(a) {
        if (!kept) {
          a.href = href;
          a.textContent = 'حسابي';
          a.title = 'فتح حسابي';
          a.classList.add('smart-account-link');
          kept = true;
        } else {
          a.style.display = 'none';
        }
      });
      // «انضم كتاجر» يبقى كما هو، ولا يتحول إلى حسابي.
    });

    // في الصفحة الرئيسية: رابط الحساب الوحيد هو زر التسجيل/الحساب في الـ hero.
    document.querySelectorAll('.hero-buttons a[href="customer.html"]').forEach(function(a, i) {
      if (i === 0) {
        a.href = href;
        a.textContent = '👤 حسابي';
        a.title = 'فتح حسابي';
        a.classList.add('smart-account-link');
      } else {
        a.style.display = 'none';
      }
    });
  }

  async function updateSmartNavigation() {
    if (typeof auth === 'undefined') return;
    var user = auth.currentUser;
    var target = 'customer.html';
    var label = 'حسابي';

    if (user) {
      try {
        var v = await db.collection('vendors').doc(user.uid).get();
        if (v.exists) {
          var data = v.data() || {};
          if (data.type === 'vendor' || data.shopName || data.status) target = 'vendor.html';
        }
      } catch (e) {
        // إذا تعذر Firestore لا نكسر الواجهة؛ العميل يذهب لحسابه.
      }
    }
    smartAccountLink(target, label);
  }

  function addVendorPublishButton() {
    if (!location.pathname.toLowerCase().includes('vendor')) return;
    var profile = document.getElementById('panelProfile');
    if (!profile || document.getElementById('smartPublishButton')) return;
    var b = document.createElement('button');
    b.id = 'smartPublishButton';
    b.type = 'button';
    b.className = 'btn btn-primary full';
    b.style.marginTop = '18px';
    b.textContent = '＋ نشر منتج جديد';
    b.onclick = function () {
      if (typeof showTab === 'function') showTab('publish');
      var form = document.getElementById('productForm');
      if (form) form.scrollIntoView({behavior:'smooth', block:'start'});
    };
    profile.appendChild(b);
  }

  function addWhatsAppToElement(container, phone, text) {
    if (!container || container.querySelector('.remon-whatsapp')) return;
    var url = waUrl(phone, text);
    if (!url) return;
    var a = document.createElement('a');
    a.className = 'remon-whatsapp';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = '💬 واتساب';
    a.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#25D366;color:#fff;text-decoration:none;border:0;border-radius:10px;padding:8px 12px;font-family:Cairo,sans-serif;font-weight:700;font-size:12px;margin-top:7px;';
    container.appendChild(a);
  }

  async function addVendorWhatsApp() {
    if (!location.pathname.toLowerCase().includes('vendor')) return;
    if (typeof auth === 'undefined' || !auth.currentUser) return;
    try {
      var snap = await db.collection('vendors').doc(auth.currentUser.uid).get();
      if (!snap.exists) return;
      var v = snap.data() || {};
      var phone = v.phone || '';
      if (!phone) return;
      var host = document.querySelector('#panelProfile') || document.querySelector('#publishCard');
      addWhatsAppToElement(host, phone, 'مرحباً، أريد التواصل مع متجرك في ريمون');
    } catch (e) {}
  }

  async function filterVendorProducts() {
    if (!location.pathname.toLowerCase().includes('vendor') || typeof auth === 'undefined' || !auth.currentUser) return;
    var mine = document.getElementById('panelMine');
    if (!mine) return;
    try {
      var snap = await db.collection('products').where('vendorId', '==', auth.currentUser.uid).get();
      var allowed = {};
      snap.docs.forEach(function (d) { allowed[d.id] = true; });
      // Existing vendor UI normally renders only its own products. This guard removes any
      // remotely rendered product that explicitly belongs to another vendor.
      mine.querySelectorAll('[data-vendor-id]').forEach(function (el) {
        if (el.getAttribute('data-vendor-id') !== auth.currentUser.uid) el.remove();
      });
    } catch (e) {}
  }

  function addProductWhatsAppButtons() {
    if (location.pathname.toLowerCase().includes('admin')) return;
    document.querySelectorAll('.product-card, .product, .my-product, [data-product-id]').forEach(function (card) {
      var phone = card.getAttribute('data-phone') || '';
      if (!phone) {
        var phoneEl = card.querySelector('[data-phone], .phone, .vendor-phone');
        if (phoneEl) phone = phoneEl.textContent || '';
      }
      if (phone) addWhatsAppToElement(card, phone, 'مرحباً، أريد الاستفسار عن هذا المنتج في ريمون');
    });
  }

  function boot() {
    hideAdminNotifications();
    if (typeof auth !== 'undefined') {
      auth.onAuthStateChanged(function () {
        updateSmartNavigation();
        addVendorPublishButton();
        addVendorWhatsApp();
        filterVendorProducts();
      });
    }
    addProductWhatsAppButtons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
