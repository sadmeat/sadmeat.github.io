var cacheName = 'sadmeat-cam-v2';
var filesToCache = [
  '/',
  '/index.html',
  '/gl.js',
  '/gl.matrix.js',
  '/mic.js',
  '/meat.bones.js',
  '/meat.verts.js',
  '/meat.fs.js',
  '/meat.vs.js',
  '/tex_ao.png',
  '/tex_fabric.png',
  '/tex_hat.png',
  '/tex_nor.png',
  '/cog.png',
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
