/* ოფლაინ რეჟიმი: აპლიკაციის გარსი და ბილეთების ბაზა ქეშირდება, API მოთხოვნები პირდაპირ ქსელში მიდის */
'use strict';

var CACHE = 'spot-v3';
var CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/data-bank.js',
  './js/data-patterns.js',
  './js/icons.js',
  './js/store.js',
  './js/anim.js',
  './js/ai.js',
  './js/cloud.js',
  './js/learn.js',
  './js/exam.js',
  './js/tricks.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return cache.addAll(CORE.map(function (path) {
          return new Request(path, { cache: 'reload' });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          return key === CACHE ? null : caches.delete(key);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function isDynamic(url) {
  return url.pathname.indexOf('/functions/') !== -1 ||
    url.pathname.indexOf('/__qoder_auth/') !== -1;
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  if (isDynamic(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(new Request('./index.html'), copy);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(new Request('./index.html'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.ok && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
