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

// اجعل جلسة المستخدم دائمة على نفس الجهاز، ولا تنتهِ عند الانتقال بين صفحات المتجر.
window.firebasePersistenceReady = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function (err) {
  console.warn('Firebase persistence:', err);
});

// تسجيل الخروج يجب أن يحدث فقط من زر «تسجيل خروج» الصريح داخل الواجهة.
window.souqiAuthPersistenceEnabled = true;
