messaging.requestPermission()
    .then(function() {
        console.log('Notification permission granted.');
        return messaging.getToken();
    })
    .then(function(token) {
        console.log('FCM Token:', token);
        // Send the token to your server and save it in the database if necessary
    })
    .catch(function(err) {
        console.error('Unable to get permission to notify.', err);
    });

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