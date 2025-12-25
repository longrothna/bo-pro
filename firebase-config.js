import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBE4iy1F8SUjpKcv3tpIi3VE5pixvxIaTk",
  authDomain: "b0-pro.firebaseapp.com",
  projectId: "b0-pro",
  storageBucket: "b0-pro.firebasestorage.app",
  messagingSenderId: "365201811616",
  appId: "1:365201811616:web:564942962a802dac71c1c5",
  measurementId: "G-V3E11TYNKD",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
