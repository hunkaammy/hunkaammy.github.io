// firebase-config.js

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAMFjDnZaszneoR6nO8bmXUxwZJplLvNfU",
  authDomain: "notes-12519.firebaseapp.com",
  databaseURL: "https://notes-12519-default-rtdb.firebaseio.com",
  projectId: "notes-12519",
  storageBucket: "notes-12519.appspot.com",
  messagingSenderId: "1073774450189",
  appId: "1:1073774450189:web:0b6d4a9f95823abbf36744",
  measurementId: "G-GZXYCJ33TR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();
