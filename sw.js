// ФинДиректор — service worker
// Кэшируем только оболочку приложения. Данные кэширует сам Firestore (IndexedDB),
// поэтому сюда запросы к googleapis намеренно НЕ попадают.

const CACHE = 'findir2-v13';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  // addAll падает целиком, если хоть один файл недоступен — кладём по одному
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Firestore и всё сетевое отдаём напрямую, без вмешательства
  if (url.origin !== self.location.origin) return;

  // Сеть в приоритете, кэш — запасной вариант.
  // Так обновления кода прилетают сразу, а офлайн приложение всё равно открывается.
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
