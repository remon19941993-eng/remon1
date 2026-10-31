# Security activation for Souqi

The application code now checks the Firebase Authentication custom claim `admin: true`.
A Firebase project administrator must complete these steps before deploying the new application to production.

## 1. Assign the admin claim
Use a trusted environment with Firebase Admin SDK credentials for project `sham-market-1686f` (for example, Google Cloud Shell with an authorized project-admin identity). Do not put service-account keys in this repository or in browser code.

Install the Admin SDK in that trusted environment, then run:

```js
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'sham-market-1686f' });

(async () => {
  const user = await admin.auth().getUserByEmail('YOUR_ADMIN_EMAIL');
  await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
  console.log('Admin claim assigned to UID:', user.uid);
})();
```

Replace `YOUR_ADMIN_EMAIL` with the existing administrator account email. This does not create, delete, or change any user account or password. The administrator must sign out and sign back in after the claim is assigned.

## 2. Deploy Firestore rules
Review `firestore.rules`, then from a trusted environment with Firebase CLI access run:

```sh
firebase use sham-market-1686f
firebase deploy --only firestore:rules
```

These rules allow public reads only for approved products, let a merchant read and manage only their own products, limit customer records to their owner/admin, and reserve vendor/customer administration for the admin claim. Test against a staging Firebase project first if available.

## 3. Release order
1. Assign the admin claim.
2. Deploy and verify Firestore rules.
3. Deploy the Vercel production release.
4. Test admin login, merchant logout, pending products, and public approved-product listing.

Do not release the new admin page before steps 1 and 2; without the claim the admin page intentionally denies access, and without the rules the database is not protected by this client-side change.
