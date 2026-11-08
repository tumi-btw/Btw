const V='cb-v5',SHELL=['./','index.html','manifest.webmanifest','icon-192.png'];
const put=(r,q)=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(q,c)).catch(()=>{})}return r};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);if(q.method!=='GET'||u.origin!==location.origin||/(data|config|demo|test)\.json$/.test(u.pathname)||q.headers.has('range')||/\.(mp4|webm|m3u8|ts|m4s)$/.test(u.pathname))return;
if(q.mode==='navigate'){e.respondWith(fetch(q).then(r=>put(r,q)).catch(()=>caches.match(q).then(m=>m||caches.match('index.html'))));return}
e.respondWith(caches.match(q).then(m=>m||fetch(q).then(r=>put(r,q))))});
