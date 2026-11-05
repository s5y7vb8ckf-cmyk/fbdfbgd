/* Offline shell: pending unconfirmed invoices are stored in IndexedDB by app code; never cache authenticated API responses. */
const VERSION='milo-static-browser-3.6.3';
const STATIC=['./','./index.html','./sale.html','./products.html','./invoices.html','./reports.html','./inventory.html','./shifts.html','./settings.html','./customers.html','./purchases.html','./style.css','./app.js','./offline-sync.js','./icons.js','./pwa.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('milo-static-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => {
 const r=event.request;
 // Never intercept remote Apps Script, authenticated requests or non-GET operations.
 if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
 const path=new URL(r.url).pathname;
 if(!STATIC.some(x=>path.endsWith(x.slice(1))&&x!=='./'))return;
 event.respondWith(fetch(r).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(r,copy));}return response;}).catch(()=>caches.match(r)));
});
