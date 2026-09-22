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

// انتظر اكتمال إعداد جلسة Firebase قبل أي تسجيل دخول/Google redirect.
const firebasePersistenceReady = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// إبقاء الجلسة بعد التحديث / إغلاق التبويب (يتم ذلك عبر firebasePersistenceReady أعلاه).
