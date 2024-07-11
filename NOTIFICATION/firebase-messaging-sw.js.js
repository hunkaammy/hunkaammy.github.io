importScripts('https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.2/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyAMFjDnZaszneoR6nO8bmXUxwZJplLvNfU",
  authDomain: "notes-12519.firebaseapp.com",
  databaseURL: "https://notes-12519-default-rtdb.firebaseio.com",
  projectId: "notes-12519",
  storageBucket: "notes-12519.appspot.com",
  messagingSenderId: "1073774450189",
  appId: "1:1073774450189:web:0b6d4a9f95823abbf36744",
  measurementId: "G-GZXYCJ33TR"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});