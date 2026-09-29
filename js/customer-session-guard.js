// Remon customer session guard
// Keeps Firebase LOCAL persistence authoritative and prevents accidental logout on navigation.
(function () {
  if (typeof auth === 'undefined' || !auth) return;

  function rememberCustomer(user) {
    if (!user) return;
    try {
      localStorage.setItem('souqi_customer_logged_in', '1');
      sessionStorage.setItem('souqi_customer', '1');
    } catch (e) {}

    // customer.html defines finishCustomerLogin later in the document.
    // The auth callback normally fires asynchronously; if the function is ready,
    // let the page render the account immediately.
    if (typeof window.finishCustomerLogin === 'function' && !window.__souqiCustomerGuardRendered) {
      window.__souqiCustomerGuardRendered = true;
      window.finishCustomerLogin(user).catch(function (e) {
        console.warn('Customer session restore:', e);
        window.__souqiCustomerGuardRendered = false;
      });
    }
  }

  auth.onAuthStateChanged(function (user) {
    if (user) rememberCustomer(user);
  });
})();
