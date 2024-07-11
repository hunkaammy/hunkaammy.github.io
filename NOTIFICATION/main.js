// main.js

// Initialize Firebase (make sure this is after including firebase-config.js)
firebase.initializeApp(firebaseConfig);
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

// Call the function to get the token
getFCMToken();
