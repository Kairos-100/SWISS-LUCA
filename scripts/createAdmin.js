/**
 * Script to create an admin user directly in Firestore
 * 
 * USAGE:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Configure Firebase Admin SDK credentials
 * 3. Run: node scripts/createAdmin.js <email>
 * 
 * Or run this code directly in Firebase Console (Firestore > Data > Scripts)
 */

// To use with Firebase Admin SDK (Node.js)
const admin = require('firebase-admin');

// Initialize Firebase Admin (you need to download service account credentials)
// admin.initializeApp({
//   credential: admin.credential.cert(require('./path/to/serviceAccountKey.json'))
// });

// Or to use directly in Firebase Console:
// Go to Firestore > Data > Scripts and paste this code:

async function createAdmin(email) {
  const db = admin.firestore();
  
  // Search for user by email in 'users' collection
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('❌ User not found. Make sure the user is registered in the app first.');
    return;
  }
  
  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;
  
  // Update user document to make them admin
  await usersRef.doc(userId).update({
    isAdmin: true,
    isPartner: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`✅ User ${email} is now an administrator!`);
  console.log(`UID: ${userId}`);
}

// Run: createAdmin('email@example.com')

