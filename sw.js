/* Service Worker：离线缓存。更新代码后把 CACHE +1 即可让所有用户刷新到新版本 */
const CACHE = 'slab-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css?v=12',
  './js/icons.js?v=12',
  './js/data.js?v=12',
  './js/db.js?v=12',
  './js/cloud.js?v=12',
  './js/ui.js?v=12',
  './js/app.js?v=12',
  './js/pages/home.js?v=12',
  './js/pages/convert.js?v=12',
  './js/pages/solution.js?v=12',
  './js/pages/notebook.js?v=12',
  './js/pages/export.js?v=12',
  './js/pages/plan.js?v=12',
  './js/pages/timers.js?v=12',
  './js/pages/tools.js?v=12',
  './js/pages/inventory.js?v=12',
  './js/pages/settings.js?v=12',
  './js/pages/more.js?v=12',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{
      const cp = r.clone(); caches.open(CACHE).then(c=>c.put('./index.html', cp)); return r;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r=>{
      if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); }
      return r;
    })));
  }
});
