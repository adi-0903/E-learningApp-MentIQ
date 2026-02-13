import { initializeApp, getApp, getApps } from 'firebase/app';

// Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyCaNIGPrXP-6OwSxx0--spK60FV7vNeZ1w",
    authDomain: "mentiq-b4f42.firebaseapp.com",
    projectId: "mentiq-b4f42",
    storageBucket: "mentiq-b4f42.firebasestorage.app",
    messagingSenderId: "917542192032",
    appId: "1:917542192032:web:419f721fa914fe71375ac5",
    measurementId: "G-L86V5XCRRC"
};

// Initialize Firebase (only for FCM push notifications)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

console.log('Firebase initialized (FCM only)');

export { app };
export default app;
