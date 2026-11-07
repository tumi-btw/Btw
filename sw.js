const V='cb-v1',SHELL=['./','index.html','manifest.webmanifest','icon-192.png'];
const put=(r,q)=>{const c=r.clone();caches.open(V).then(x=>x.put(q,c));return r};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);if(q.method!=='GET'||u.origin!==location.origin)return;
if(q.mode==='navigate'||u.pathname.endsWith('data.json')){e.respondWith(fetch(q).then(r=>put(r,q)).catch(()=>caches.match(q)));return}
e.respondWith(caches.match(q).then(m=>m||fetch(q).then(r=>put(r,q))))});
