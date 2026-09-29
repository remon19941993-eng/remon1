// Stable Google customer login: mobile uses redirect directly; desktop uses popup.
// Capture the Google button before the inline handler so old/slow logic cannot run twice.
(function () {
  function startGoogleLogin(event) {
    var btn = event.target && event.target.closest ? event.target.closest('#googleBtn') : null;
    if (!btn) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (btn.dataset.googleBusy === '1') return;
    btn.dataset.googleBusy = '1';
    btn.disabled = true;
    btn.textContent = 'فتح Google...';

    var status = document.getElementById('googleStatus');
    if (status) status.textContent = 'جاري فتح Google...';

    (async function () {
      try {
        if (window.firebasePersistenceReady) await window.firebasePersistenceReady;

        // A remembered customer should go straight to the account without another login.
        var remembered = false;
        try { remembered = localStorage.getItem('souqi_customer_logged_in') === '1'; } catch (e) {}
        if (remembered && auth.currentUser) {
          if (typeof finishCustomerLogin === 'function') await finishCustomerLogin(auth.currentUser);
          return;
        }

        // Do not let an old vendor session interfere with customer Google login.
        if (auth.currentUser) {
          try { await auth.signOut(); } catch (e2) {}
        }

        try {
          sessionStorage.setItem('souqi_pending_customer', '1');
          sessionStorage.setItem('souqi_auth_mode', 'customer');
        } catch (e3) {}

        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

        // Redirect is the reliable path on mobile browsers; it avoids popup blocking/hanging.
        if (mobile) {
          await auth.signInWithRedirect(provider);
          return;
        }

        var result = await auth.signInWithPopup(provider);
        if (result && result.user && typeof finishCustomerLogin === 'function') {
          await finishCustomerLogin(result.user);
          return;
        }
        throw new Error('لم يتم استلام حساب Google.');
      } catch (err) {
        console.error('Google login fix:', err);
        try { sessionStorage.removeItem('souqi_pending_customer'); } catch (e4) {}
        btn.dataset.googleBusy = '0';
        btn.disabled = false;
        btn.textContent = 'التسجيل / الدخول عبر Google';
        if (status) status.textContent = '';
        if (err && !['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(err.code)) {
          console.warn('Google login:', err.message || err);
        }
      }
    })();
  }

  document.addEventListener('click', startGoogleLogin, true);
})();
