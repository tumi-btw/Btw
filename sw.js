const V='cb-v8',SHELL=['./','index.html','manifest.webmanifest','icon-192.png'];
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

async function checkNotices(){try{const get=async k=>(await idbDo('meta','readonly',s=>s.get(k)))||{},pr=await get('~prefs'),last=(await get('~nlast')).ts||0;if(!pr.notif)return;const nc=pr.nc||{};
 const n=await (await fetch('notices.json',{cache:'no-store'})).json(),d=await (await fetch('data.json',{cache:'no-store'})).json().catch(()=>({items:[]})),by={};(d.items||[]).forEach(i=>by[i.id]=i);
 const cat={title:'up',episodes:'up',language:'up'},out=[];
 for(const x of (n.items||[])){if(!(x.ts>last))continue;if(nc[cat[x.type]||'ann']===false)continue;const it=x.item?by[x.item]:null;if(x.item&&!it)continue;
  if(x.type==='title')out.push({ts:x.ts,t:'New '+(x.kind||it.type),b:it.title});else if(x.type==='episodes')out.push({ts:x.ts,t:x.count>1?x.count+' new episodes':'New episode',b:it.title+' S'+x.s+' E'+x.from+(x.count>1?'-E'+x.to:'')});
  else if(x.type==='language')out.push({ts:x.ts,t:(x.lang||'')+' audio added',b:it.title});else out.push({ts:x.ts,t:x.title,b:x.body||''})}
 if(!out.length)return;out.sort((a,b)=>b.ts-a.ts);await idbDo('meta','readwrite',s=>s.put({eid:'~nlast',ts:out[0].ts}));
 await self.registration.showNotification(out.length>1?out.length+' new updates':out[0].t,{body:out.length>1?out.slice(0,3).map(x=>x.b||x.t).join(', '):out[0].b,icon:'icon-192.png',badge:'icon-192.png',tag:'cb-news'})}catch(_){}}
self.addEventListener('periodicsync',e=>{if(e.tag==='cb-notices')e.waitUntil(checkNotices())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(cs=>cs.length?cs[0].focus():clients.openWindow('./')))});
