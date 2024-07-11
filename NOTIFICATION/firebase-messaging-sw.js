// Initialize Firebase
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
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Request permission and get token
function getFCMToken() {
    messaging.requestPermission()
        .then(function() {
            console.log('Notification permission granted.');
            return messaging.getToken();
        })
        .then(function(token) {
            console.log('FCM Token:', token);
            // Send the token to your server and save it in the database if necessary
            saveTokenToDatabase(token);
        })
        .catch(function(err) {
            console.error('Unable to get permission to notify.', err);
        });
}

// Function to save the token to your database
function saveTokenToDatabase(token) {
    // Assuming you have a Firebase database reference
    var database = firebase.database();
    var tokensRef = database.ref('tokens'); // Adjust this path as needed
    tokensRef.push().set({ token: token });
}

// Handle incoming messages
messaging.onMessage(function(payload) {
    console.log('Message received. ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon
    };

    if (Notification.permission === 'granted') {
        var notification = new Notification(notificationTitle, notificationOptions);
    }
});

// Register the service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(function(error) {
        console.error('Service Worker registration failed:', error);
    });
}

// Call the function to get the token
getFCMToken();