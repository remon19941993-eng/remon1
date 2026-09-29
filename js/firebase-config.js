// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAo0q_0WP8Te-JArmWMIbPPoy187DdXr_I",
  authDomain: "sham-market-1686f.firebaseapp.com",
  projectId: "sham-market-1686f",
  storageBucket: "sham-market-1686f.firebasestorage.app",
  messagingSenderId: "729799834780",
  appId: "1:729799834780:web:6dd2dcc9b2c0554b280159",
  measurementId: "G-FY6V1KVJM2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

window.firebasePersistenceReady = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function (err) {
  console.warn('Firebase persistence:', err);
});
window.souqiAuthPersistenceEnabled = true;

(function loadSharedMarketplaceEnhancements() {
  var s = document.createElement('script');
  s.src = 'js/marketplace-enhancements.js?v=2';
  s.async = false;
  document.head.appendChild(s);
})();

(function loadGoogleLoginFix() {
  var s = document.createElement('script');
  s.src = 'js/google-login-fix.js?v=1';
  s.async = false;
  document.head.appendChild(s);
})();

(function loadCustomerSessionGuard() {
  var path = String(location.pathname || '').toLowerCase();
  if (!path.endsWith('/customer.html') && !path.endsWith('customer.html')) return;
  var s = document.createElement('script');
  s.src = 'js/customer-session-guard.js?v=3';
  s.async = false;
  document.head.appendChild(s);
})();
