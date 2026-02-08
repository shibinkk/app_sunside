import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore: getReactNativePersistence is only available in the react-native build
import { getReactNativePersistence } from '@firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace the following with your app's Firebase project configuration
// You can find this in your Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyCWLzk1Fjvz54ksftMK-_xtH9v3ZMZkoxc",
    authDomain: "sunside-7025c.firebaseapp.com",
    projectId: "sunside-7025c",
    storageBucket: "sunside-7025c.firebasestorage.app",
    messagingSenderId: "57734455581",
    appId: "1:57734455581:web:9b6ad166790ec5447001f4",
    measurementId: "G-RM0M05MWVD"
};

import { getFirestore } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Cloud Firestore
const db = getFirestore(app);

export { auth, storage, db };
