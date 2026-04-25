// ============================================================
//  BAHA — Firebase Configuration
//  Firestore + Auth + Storage + Hosting
// ============================================================
//
//  SETUP STEPS:
//  1. Go to https://console.firebase.google.com
//  2. Click "Add project" → name it "baha-tm"
//  3. Click "Web" icon (</>), register your app
//  4. Copy the firebaseConfig object below and paste your values
//  5. In Firebase console, enable:
//       - Firestore Database (production mode)
//       - Authentication → Google sign-in provider
//       - Storage
//       - Hosting (optional, for deployment)
//  6. Set Firestore security rules (see bottom of this file)
// ============================================================

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }        from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth,
         GoogleAuthProvider }  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage }          from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ⬇ Replace these values with your own Firebase project config
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Initialize
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const auth    = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, storage, googleProvider };

// ============================================================
//  FIRESTORE DATABASE STRUCTURE
// ============================================================
//
//  Collection: products
//  Document fields:
//    name_ru      : string   "Оливковое масло Extra Virgin"
//    name_tm      : string   "Zeýtun ýagy Extra Virgin"
//    brand        : string   "Borges"
//    category     : string   "food"  (cars|phones|food|appliances|cosmetics|medicine|clothing|internet)
//    emoji        : string   "🫒"
//    avgRating    : number   4.2
//    reviewCount  : number   38
//    createdAt    : timestamp
//
//  Collection: reviews
//  Document fields:
//    productId    : string   (ref to products doc id)
//    userId       : string   (Firebase Auth uid)
//    userName     : string   "Aýnur G."
//    stars        : number   5
//    text         : string   "Сочный вкус, рекомендую!"
//    lang         : string   "ru" or "tm"
//    createdAt    : timestamp
//
//  Collection: users
//  Document fields:
//    displayName  : string
//    email        : string
//    reviewCount  : number
//    joinedAt     : timestamp
//
// ============================================================
//  FIRESTORE SECURITY RULES  (paste in Firebase Console)
// ============================================================
//
//  rules_version = '2';
//  service cloud.firestore {
//    match /databases/{database}/documents {
//
//      match /products/{productId} {
//        allow read: if true;
//        allow write: if request.auth != null;
//      }
//
//      match /reviews/{reviewId} {
//        allow read: if true;
//        allow create: if request.auth != null
//                      && request.resource.data.userId == request.auth.uid
//                      && request.resource.data.stars >= 1
//                      && request.resource.data.stars <= 5;
//        allow update, delete: if request.auth != null
//                              && resource.data.userId == request.auth.uid;
//      }
//
//      match /users/{userId} {
//        allow read: if true;
//        allow write: if request.auth != null && request.auth.uid == userId;
//      }
//    }
//  }
// ============================================================
