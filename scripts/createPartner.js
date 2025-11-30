/**
 * Script to create a partner user directly in Firestore
 * 
 * USAGE:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Configure Firebase Admin SDK credentials
 * 3. Run: node scripts/createPartner.js <email>
 */

const admin = require('firebase-admin');

async function createPartner(email) {
  const db = admin.firestore();
  
  // Search for user by email
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('❌ User not found. Make sure the user is registered in the app first.');
    return;
  }
  
  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  
  // Update user document to make them partner
  await usersRef.doc(userId).update({
    isAdmin: false,
    isPartner: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Create or update partner profile
  const partnerRef = db.collection('partners').doc(userId);
  const partnerDoc = await partnerRef.get();
  
  if (!partnerDoc.exists) {
    await partnerRef.set({
      id: userId,
      uid: userId,
      email: email,
      name: userData.name || '',
      businessName: '',
      address: '',
      location: {
        lat: 0,
        lng: 0
      },
      rating: 0,
      picture: '',
      googleMapsLink: '',
      phone: '',
      website: '',
      description: '',
      categories: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  console.log(`✅ User ${email} is now a partner!`);
  console.log(`UID: ${userId}`);
}

// Run: createPartner('email@example.com')

