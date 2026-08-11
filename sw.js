// ФинДиректор — service worker
// Кэшируем оболочку приложения И модули Firebase с gstatic.com.
// Без вторых приложение офлайн вообще не стартует: сам скрипт не загрузится.
// Данные при этом кэширует Firestore в IndexedDB, сюда его запросы не идут.

const CACHE = 'findir2-v23';
const VENDOR = 'findir2-vendor-v1';

const SHELL = [
  './',
  './index.html',
  './import.html',
  './app.js',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Библиотеки Firebase: адреса известны заранее, кладём их сразу при установке.
// Внутренние куски модулей подтянутся в кэш при первом онлайн-запуске.
const SDK = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
];

const isVendor = url =>
  url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/');

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    // addAll падает целиком, если хоть один файл недоступен — кладём по одному
    const shell = await caches.open(CACHE);
    await Promise.all(SHELL.map(u => shell.add(u).catch(() => {})));
    const vendor = await caches.open(VENDOR);
    await Promise.all(SDK.map(u => vendor.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE && k !== VENDOR).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  // --- библиотеки Firebase: сначала кэш ---
  // Версия зашита в адрес, поэтому содержимое не меняется и обновлять его незачем.
  if(isVendor(url)){
    e.respondWith((async () => {
      const hit = await caches.match(req, {ignoreSearch: true});
      if(hit) return hit;
      const res = await fetch(req);
      const cache = await caches.open(VENDOR);
      cache.put(req, res.clone()).catch(() => {});
      return res;
    })());
    return;
  }

  // --- всё прочее с чужих доменов (Firestore, Google-вход) — напрямую ---
  if(url.origin !== self.location.origin) return;

  // --- свои файлы: сеть в приоритете, кэш запасной ---
  // Так правки прилетают сразу, а офлайн приложение всё равно открывается.
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req, {ignoreSearch: true})
        .then(hit => hit || caches.match('./index.html')))
  );
});
