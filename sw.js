const V='cb-v7',SHELL=['./','index.html','manifest.webmanifest','icon-192.png'];
const put=(r,q)=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(q,c)).catch(()=>{})}return r};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);if(q.method!=='GET'||u.origin!==location.origin||/(data|config|demo|test)\.json$/.test(u.pathname)||q.headers.has('range')||/\.(mp4|webm|m3u8|ts|m4s)$/.test(u.pathname))return;
if(q.mode==='navigate'){e.respondWith(fetch(q).then(r=>put(r,q)).catch(()=>caches.match(q).then(m=>m||caches.match('index.html'))));return}
e.respondWith(caches.match(q).then(m=>m||fetch(q).then(r=>put(r,q))))});

const idb=()=>new Promise((ok,no)=>{const r=indexedDB.open('cinebox',1);r.onupgradeneeded=()=>{r.result.createObjectStore('files',{keyPath:'url'});r.result.createObjectStore('meta',{keyPath:'eid'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const idbDo=async(st,mode,fn)=>{const d=await idb();return new Promise((ok,no)=>{const t=d.transaction(st,mode),q=fn(t.objectStore(st));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
const tell=async()=>(await clients.matchAll()).forEach(c=>c.postMessage('dl'));
self.addEventListener('backgroundfetchsuccess',e=>{const bf=e.registration;e.waitUntil((async()=>{try{for(const r of await bf.matchAll()){const blob=await (await r.responseReady).blob();await idbDo('files','readwrite',s=>s.put({url:r.request.url,blob,size:blob.size,ts:Date.now()}));const m=await idbDo('meta','readonly',s=>s.get(bf.id));if(m){m.state='done';m.size=blob.size;await idbDo('meta','readwrite',s=>s.put(m))}}await bf.updateUI({title:'Download complete'})}catch(_){await idbDo('meta','readwrite',s=>s.delete(bf.id)).catch(()=>{})}await tell()})())});
self.addEventListener('backgroundfetchfail',e=>e.waitUntil((async()=>{await idbDo('meta','readwrite',s=>s.delete(e.registration.id)).catch(()=>{});await tell()})()));
self.addEventListener('backgroundfetchabort',e=>e.waitUntil((async()=>{await idbDo('meta','readwrite',s=>s.delete(e.registration.id)).catch(()=>{});await tell()})()));

async function checkNotices(){try{const get=async k=>(await idbDo('meta','readonly',s=>s.get(k)))||{},pr=await get('~prefs'),last=(await get('~nlast')).ts||0;if(!pr.notif)return;const nc=pr.nc||{},ents=[];
 if(nc.ann!==false){try{const n=await (await fetch('notices.json',{cache:'no-store'})).json();(n.items||[]).forEach(x=>ents.push({ts:x.ts||0,title:x.title,body:x.body}))}catch(_){}}
 if(nc.up!==false){try{const d=await (await fetch('data.json',{cache:'no-store'})).json();(d.items||[]).forEach(x=>ents.push({ts:x.upd||x.added||0,title:'New on CineBox',body:x.title}))}catch(_){}}
 const fresh=ents.filter(x=>x.ts>last).sort((a,b)=>b.ts-a.ts);if(!fresh.length)return;await idbDo('meta','readwrite',s=>s.put({eid:'~nlast',ts:fresh[0].ts}));
 await self.registration.showNotification(fresh.length>1?fresh.length+' new updates':fresh[0].title,{body:fresh.length>1?fresh.slice(0,3).map(x=>x.body||x.title).join(', '):fresh[0].body,icon:'icon-192.png',badge:'icon-192.png',tag:'cb-news'})}catch(_){}}
self.addEventListener('periodicsync',e=>{if(e.tag==='cb-notices')e.waitUntil(checkNotices())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(cs=>cs.length?cs[0].focus():clients.openWindow('./')))});
