const defaultProducts = [
  { name: 'سماعات لاسلكية فاخرة', price: '499 ل.س', vendor: 'متجر إلكترونيات', category: 'electronics', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', phone: '942591022' },
  { name: 'حقيبة يد أنيقة', price: '699 ل.س', vendor: 'أناقة شامية', category: 'fashion', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80', phone: '942591022' },
  { name: 'ساعة رجالية فاخرة', price: '1250 ل.س', vendor: 'تك زون', category: 'electronics', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', phone: '942591022' },
  { name: 'عطر رجالي فاخر', price: '350 ل.س', vendor: 'جمال الطبيعي', category: 'cosmetics', img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80', phone: '942591022' }
];

const ADMIN_WA = '963942591022';

function getCart() {
  try { return JSON.parse(localStorage.getItem('sham_cart') || '[]'); } catch (e) { return []; }
}
function saveCart(items) {
  localStorage.setItem('sham_cart', JSON.stringify(items));
  updateCartBadge();
}
function updateCartBadge() {
  var n = getCart().reduce(function(s, i) { return s + (i.qty || 1); }, 0);
  document.querySelectorAll('.cart-badge, .badge').forEach(function(el) {
    el.textContent = String(n);
    el.style.display = n > 0 ? 'inline-flex' : 'none';
  });
}

function addToCart(name, price, vendor, img) {
  var cart = getCart();
  var found = cart.find(function(i) { return i.name === name && i.vendor === vendor; });
  if (found) found.qty = (found.qty || 1) + 1;
  else cart.push({ name: name, price: price || '', vendor: vendor || '', img: img || '', qty: 1 });
  saveCart(cart);
  openCart();
}

function removeFromCart(idx) {
  var cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart);
  renderCartDrawer();
}

function contactVendor(phone, productName) {
  var p = (phone || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = p.substring(1);
  if (p.startsWith('963')) { /* ok */ }
  else if (p.length >= 9) p = '963' + p;
  else p = ADMIN_WA;
  var text = encodeURIComponent('مرحبا، أريد الاستفسار عن: ' + (productName || 'منتج من سوق الشام'));
  window.open('https://wa.me/' + p + '?text=' + text, '_blank');
}

function productCardHtml(p) {
  var name = (p.name || '').replace(/'/g, '&#39;');
  var price = (p.price || '').replace(/'/g, '&#39;');
  var vendor = (p.vendor || '').replace(/'/g, '&#39;');
  var phone = (p.phone || '').replace(/'/g, '');
  var img = p.img || '';
  var imgHtml;
  if (img && (img.indexOf('http') === 0 || img.indexOf('data:') === 0)) {
    imgHtml = '<img src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'📦\';">';
  } else {
    imgHtml = '<div style="font-size:48px;display:flex;align-items:center;justify-content:center;height:100%;">📦</div>';
  }
  return '<div class="product-card">' +
    '<div class="product-img">' + imgHtml + '</div>' +
    '<div class="product-info">' +
      '<h4>' + name + '</h4>' +
      '<div class="product-price">' + price + '</div>' +
      '<div class="product-vendor">' + vendor + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;">' +
        '<button type="button" class="btn btn-primary" style="flex:1;padding:8px;font-size:12px;" onclick="contactVendor(\'' + phone + '\',\'' + name + '\')">تواصل واتساب</button>' +
        '<button type="button" class="btn btn-outline" style="flex:1;padding:8px;font-size:12px;" onclick="addToCart(\'' + name + '\',\'' + price + '\',\'' + vendor + '\',\'' + (img.indexOf('data:')===0?'':img).replace(/'/g,'') + '\')">أضف للسلة</button>' +
      '</div>' +
    '</div></div>';
}

function renderProducts(products) {
  var grid = document.getElementById('productsGrid');
  if (!grid) return;
  var list = products && products.length ? products : defaultProducts;
  grid.innerHTML = list.map(productCardHtml).join('');
}

function loadAllProducts() {
  if (typeof getProducts === 'function') {
    getProducts().then(function(list) {
      // منتجات مميزة = منتجات التجار الحقيقية فقط
      var merged = (list && list.length) ? list.slice() : [];
      if (!merged.length) {
        // لا شيء بعد — أظهر رسالة بدلاً من نماذج ثابتة
        var grid = document.getElementById('productsGrid');
        if (grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:30px;">لا توجد منتجات منشورة بعد. كن أول تاجر ينشر!</p>';
        return;
      }
      renderProducts(merged);
    }).catch(function() {
      var grid = document.getElementById('productsGrid');
      if (grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:30px;">تعذر تحميل المنتجات</p>';
    });
  }
}

function openCart() {
  var d = document.getElementById('cartDrawer');
  if (!d) createCartDrawer();
  d = document.getElementById('cartDrawer');
  renderCartDrawer();
  d.classList.add('open');
  var ov = document.getElementById('cartOverlay');
  if (ov) ov.classList.add('open');
}

function closeCart() {
  var d = document.getElementById('cartDrawer');
  if (d) d.classList.remove('open');
  var ov = document.getElementById('cartOverlay');
  if (ov) ov.classList.remove('open');
}

function renderCartDrawer() {
  var body = document.getElementById('cartBody');
  if (!body) return;
  var cart = getCart();
  if (!cart.length) {
    body.innerHTML = '<p style="text-align:center;color:#888;padding:40px 20px;">السلة فارغة</p>';
    return;
  }
  body.innerHTML = cart.map(function(item, idx) {
    return '<div class="cart-item">' +
      '<div class="cart-item-info"><strong>' + item.name + '</strong><br><small>' + (item.vendor||'') + '</small><br><span style="color:#b8860b;">' + (item.price||'') + ' × ' + (item.qty||1) + '</span></div>' +
      '<button type="button" class="btn btn-outline" style="padding:6px 10px;font-size:12px;" onclick="removeFromCart(' + idx + ')">حذف</button>' +
      '</div>';
  }).join('') +
  '<button type="button" class="btn btn-primary full" style="margin-top:16px;" onclick="checkoutWhatsApp()">إتمام الطلب عبر واتساب</button>';
}

function checkoutWhatsApp() {
  var cart = getCart();
  if (!cart.length) return;
  var lines = cart.map(function(i) {
    return '- ' + i.name + ' (' + (i.qty||1) + ') ' + (i.price||'') + ' — ' + (i.vendor||'');
  });
  var text = encodeURIComponent('طلب من سوق الشام:\n' + lines.join('\n'));
  window.open('https://wa.me/' + ADMIN_WA + '?text=' + text, '_blank');
}

function createCartDrawer() {
  if (document.getElementById('cartDrawer')) return;
  var ov = document.createElement('div');
  ov.id = 'cartOverlay';
  ov.className = 'cart-overlay';
  ov.onclick = closeCart;
  document.body.appendChild(ov);
  var d = document.createElement('div');
  d.id = 'cartDrawer';
  d.className = 'cart-drawer';
  d.innerHTML = '<div class="cart-header"><strong>🛒 سلة المشتريات</strong><button type="button" onclick="closeCart()" style="border:0;background:none;font-size:22px;cursor:pointer;">×</button></div><div id="cartBody"></div>';
  document.body.appendChild(d);
}

function openSearch() {
  var q = prompt('ابحث عن منتج:');
  if (!q) return;
  q = q.trim().toLowerCase();
  if (typeof getProducts === 'function') {
    getProducts().then(function(list) {
      var all = (list && list.length ? list : []).concat(defaultProducts);
      var found = all.filter(function(p) {
        return (p.name || '').toLowerCase().indexOf(q) >= 0 ||
               (p.vendor || '').toLowerCase().indexOf(q) >= 0 ||
               (p.desc || '').toLowerCase().indexOf(q) >= 0;
      });
      if (!found.length) { alert('لا توجد نتائج'); return; }
      renderProducts(found);
      window.scrollTo({ top: document.getElementById('productsGrid').offsetTop - 80, behavior: 'smooth' });
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  createCartDrawer();
  updateCartBadge();
  loadAllProducts();
  // ربط الأيقونات
  document.querySelectorAll('[data-action="cart"], .btn-cart').forEach(function(b) {
    b.addEventListener('click', function(e) { e.preventDefault(); openCart(); });
  });
  document.querySelectorAll('[data-action="search"], .btn-search').forEach(function(b) {
    b.addEventListener('click', function(e) { e.preventDefault(); openSearch(); });
  });
  // أعد تحميل المنتجات عند العودة للصفحة
  window.addEventListener('focus', function() { loadAllProducts(); updateCartBadge(); });
});

var currentQuizCat = 'all';
var currentQuizItem = null;

function openQuizCat(cat) {
  currentQuizCat = cat || 'all';
  openQuizDemo();
}
function openQuizDemo() {
  var modal = document.getElementById('quizModal');
  if (!modal) return;
  modal.classList.add('open');
  switchQuizCat(currentQuizCat || 'all');
}
function closeQuiz() {
  var modal = document.getElementById('quizModal');
  if (modal) modal.classList.remove('open');
}
function switchQuizCat(cat) {
  currentQuizCat = cat || 'all';
  var bar = document.getElementById('quizCatBar');
  if (bar) {
    bar.querySelectorAll('button').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-cat') === currentQuizCat);
    });
  }
  var names = { all: 'تحدي شامل', geo: 'جغرافيا', islamic: 'إسلامية', general: 'عامة' };
  var title = document.getElementById('quizTitle');
  if (title) title.textContent = '✨ ' + (names[currentQuizCat] || 'تحدي');
  loadQuizQuestion();
}
function loadQuizQuestion() {
  if (typeof getAvailableQuestion !== 'function') return;
  currentQuizItem = getAvailableQuestion(currentQuizCat);
  var qEl = document.getElementById('quizQuestion');
  var optEl = document.getElementById('quizOptions');
  var res = document.getElementById('quizResult');
  if (res) { res.classList.add('hidden'); res.innerHTML = ''; }
  if (!currentQuizItem) {
    if (qEl) qEl.textContent = 'أحسنت! أنهيت أسئلة هذا القسم.';
    if (optEl) optEl.innerHTML = '<button class="btn btn-primary" onclick="localStorage.removeItem(\'used_q_' + currentQuizCat + '\');loadQuizQuestion();">إعادة من البداية</button>';
    return;
  }
  if (qEl) qEl.textContent = currentQuizItem.q;
  if (optEl) {
    optEl.innerHTML = currentQuizItem.options.map(function(opt, i) {
      return '<button class="option-btn" onclick="checkAnswer(this,' + i + ')">' + opt + '</button>';
    }).join('');
  }
}
function checkAnswer(btn, selectedIndex) {
  if (!currentQuizItem) return;
  var correct = currentQuizItem.correct;
  document.querySelectorAll('#quizOptions .option-btn').forEach(function(b, i) {
    b.disabled = true;
    if (i === correct) b.style.background = '#c8e6c9';
    if (i === selectedIndex && i !== correct) b.style.background = '#ffcdd2';
  });
  if (typeof markQuestionUsed === 'function') markQuestionUsed(currentQuizItem.cat || currentQuizCat, currentQuizItem.index);
  var res = document.getElementById('quizResult');
  if (selectedIndex === correct) {
    var disc = (window.discounts || ['15%'])[Math.floor(Math.random() * (window.discounts || ['15%']).length)];
    if (res) {
      res.classList.remove('hidden');
      res.innerHTML = '<strong>✅ إجابة صحيحة!</strong><br>بطاقة خصم: <span style="color:#b8860b;font-size:22px;">' + disc + '</span>';
    }
  } else if (res) {
    res.classList.remove('hidden');
    res.innerHTML = '<strong>❌ إجابة خاطئة</strong>';
  }
  setTimeout(loadQuizQuestion, 1800);
}
function toggleAI() {
  var panel = document.getElementById('aiPanel');
  if (panel) panel.classList.toggle('open');
}
function aiAsk(type) {
  var reply = document.getElementById('aiReply');
  if (!reply) return;
  if (type === 'products') {
    reply.innerHTML = '📦 اضغط على أي تصنيف رئيسي بالأعلى، أو استخدم أيقونة البحث 🔍 للعثور على منتج.';
    var cats = document.getElementById('categories');
    if (cats) { toggleAI(); cats.scrollIntoView({ behavior: 'smooth' }); }
  } else if (type === 'vendor') {
    reply.innerHTML = '🏪 للتجار: انضم مجاناً 3 أيام من «انضم كتاجر»، انشر منتجاتك من لوحة التاجر، وعدّل أو امسح من «منتجاتي».';
  } else if (type === 'quiz') {
    reply.innerHTML = '✨ أجب على سؤال صحيح لتحصل على بطاقة خصم. جاري فتح التحدي...';
    setTimeout(function() { toggleAI(); if (typeof openQuizDemo === 'function') openQuizDemo(); }, 400);
  } else if (type === 'admin') {
    reply.innerHTML = '📞 الإدارة عبر واتساب: <a href="https://wa.me/963942591022" target="_blank" dir="ltr">+963 942 591 022</a>';
    setTimeout(function() { window.open('https://wa.me/963942591022?text=' + encodeURIComponent('مرحباً إدارة سوق الشام'), '_blank'); }, 500);
  }
}
function aiSend() {
  var input = document.getElementById('aiInput');
  var reply = document.getElementById('aiReply');
  if (!input || !reply) return;
  var q = (input.value || '').trim();
  if (!q) return;
  var low = q.toLowerCase();
  if (low.indexOf('منتج') >= 0 || low.indexOf('بحث') >= 0) aiAsk('products');
  else if (low.indexOf('تاجر') >= 0 || low.indexOf('نشر') >= 0) aiAsk('vendor');
  else if (low.indexOf('سؤال') >= 0 || low.indexOf('خصم') >= 0 || low.indexOf('تحدي') >= 0) aiAsk('quiz');
  else if (low.indexOf('واتس') >= 0 || low.indexOf('ادمن') >= 0 || low.indexOf('إدارة') >= 0 || low.indexOf('تواصل') >= 0) aiAsk('admin');
  else reply.innerHTML = 'فهمت سؤالك. جرّب: المنتجات، نصائح التاجر، التحدي، أو التواصل مع الإدارة عبر واتساب +963942591022';
  input.value = '';
}
document.addEventListener('DOMContentLoaded', function() {
  var inp = document.getElementById('aiInput');
  if (inp) inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); aiSend(); }
  });
});
