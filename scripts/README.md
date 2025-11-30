# User Management Scripts

These scripts allow you to create administrators and partners directly from the command line or from the Firebase console.

## Method 1: From Firebase Console (Easiest)

### To create an Admin:

1. Go to Firebase Console > Firestore Database > Data
2. Find the `users` collection
3. Find the user document (by email or UID)
4. Edit the document and add/modify these fields:
   - `isAdmin: true`
   - `isPartner: false`
5. Save changes

### To create a Partner:

1. Go to Firebase Console > Firestore Database > Data
2. Find the `users` collection
3. Find the user document
4. Edit the document and add/modify these fields:
   - `isAdmin: false`
   - `isPartner: true`
5. Go to the `partners` collection
6. Create a new document with the same user UID
7. Add these fields:
   ```json
   {
     "id": "USER_UID",
     "uid": "USER_UID",
     "email": "email@example.com",
     "name": "User name",
     "businessName": "",
     "address": "",
     "location": { "lat": 0, "lng": 0 },
     "rating": 0,
     "picture": "",
     "googleMapsLink": "",
     "phone": "",
     "website": "",
     "description": "",
     "categories": [],
     "isActive": true,
     "createdAt": "current timestamp",
     "updatedAt": "current timestamp"
   }
   ```

## Method 2: From Web Application (Recommended)

1. Open the application: `t4learningluca.web.app`
2. Log in as administrator
3. Go to your profile
4. Click on "Gérer les Utilisateurs"
5. Enter the user email
6. Select the role (Administrateur or Partenaire)
7. Confirm

## Method 3: Using Node.js Scripts

If you prefer to use Node.js scripts:

1. Install dependencies:
   ```bash
   npm install firebase-admin
   ```

2. Download Firebase service account credentials:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click on "Generate new private key"
   - Save the JSON file

3. Run the script:
   ```bash
   node scripts/createAdmin.js email@example.com
   # or
   node scripts/createPartner.js email@example.com
   ```

## Important Notes

- The user **must be registered** in Firebase Authentication first
- You can see user emails in Firebase Console > Authentication > Users
- UIDs can be found in the same Authentication section

