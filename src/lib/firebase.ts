import { initializeApp, getApps, type FirebaseApp } from "firebase/app";

// Public Firebase web config. These values are not secret — access is enforced
// by Firestore security rules (see firestore.rules), not by hiding the key.
const config = {
  apiKey: "AIzaSyDozYS8DxUCbu_MSZPZuF7qI2MdhSPN9PM",
  authDomain: "wheeler-works.firebaseapp.com",
  projectId: "wheeler-works",
  storageBucket: "wheeler-works.firebasestorage.app",
  messagingSenderId: "612400902994",
  appId: "1:612400902994:web:03ed98b0d3eabe3f6b408b",
};

export function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(config);
}
