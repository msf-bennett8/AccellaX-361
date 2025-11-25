// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXUvlKBO7_-EQKuFw9rLW8UpsqWDkoM9E",
  authDomain: "accellax-361.firebaseapp.com",
  projectId: "accellax-361",
  storageBucket: "accellax-361.firebasestorage.app",
  messagingSenderId: "354831496530",
  appId: "1:354831496530:web:f2d7c7ab5f74b9b9fbb68b",
  measurementId: "G-53YMY2QP9J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);