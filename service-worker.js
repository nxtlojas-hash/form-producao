// NXT Produção — service worker (cache simples do app shell)
const CACHE = 'nxt-prod-v2';
const ASSETS = ['./','./index.html','./style.css','./script.js','./manifest.json','./logo nxt.png','./dados/produtos.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // nunca cacheia o POST pro Make
  if (e.request.method !== 'GET' || url.includes('hook.')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
