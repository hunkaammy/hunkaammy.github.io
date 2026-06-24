self.addEventListener('install', function(e) {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    // Clear all old caches automatically
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        return caches.delete(name);
      }));
    })
    .then(function() {
      // Claim clients and force them to reload
      return self.clients.claim();
    })
    .then(function() {
      return self.clients.matchAll();
    })
    .then(function(clients) {
      clients.forEach(client => {
        // Force the client to reload to fetch the newest HTML
        if (client.navigate) {
          client.navigate(client.url);
        }
      });
    })
  );
});
