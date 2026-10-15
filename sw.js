const CACHE = 'basttle-v44';
const FILES = ['./', './index.html', './style.css', './yaml.js', './app.js', './manifest.webmanifest', './editor.html', './editor.css', './editor.js', './levels/tutorial-01.yaml', './levels/tutorial-02.yaml', './levels/tutorial-03.yaml', './levels/puzzle-01.yaml', './levels/puzzle-02.yaml', './levels/puzzle-03.yaml', './levels/puzzle-04.yaml', './levels/puzzle-05.yaml', './levels/puzzle-06.yaml', './levels/puzzle-07.yaml', './levels/puzzle-08.yaml', './levels/puzzle-09.yaml', './levels/puzzle-10.yaml'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
