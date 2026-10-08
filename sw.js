const CACHE='arf-pwa-v050';
const RUNTIME='arf-runtime-v050';
const SHARE='arf-share-v2';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./bookmarklet-source.js','./bookmarklet.min.js','./privacy.html','./robots.txt','./VERSION'];
const EXTERNAL=new Set([
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.min.mjs',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.worker.min.mjs',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js'
]);
const MAX_SHARE_BYTES=80*1024*1024;

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if((key.startsWith('arf-pwa-')&&key!==CACHE)||(key.startsWith('arf-runtime-')&&key!==RUNTIME))await caches.delete(key)}await self.clients.claim()})())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});

function shareId(){try{return crypto.randomUUID()}catch{return `${Date.now()}-${Math.random().toString(16).slice(2)}`}}
async function handleShare(request){
  const fd=await request.formData();const id=shareId();const cache=await caches.open(SHARE);
  const title=String(fd.get('title')||'');const text=String(fd.get('text')||'');const url=String(fd.get('url')||'');
  const files=fd.getAll('files').filter(x=>x&&typeof x.arrayBuffer==='function');
  let error='';
  if(files[0]){
    const f=files[0];const isPdf=(f.type||'').toLowerCase()==='application/pdf'||/\.pdf$/i.test(f.name||'');
    if(!isPdf)error='Il file condiviso non è un PDF.';else if(f.size>MAX_SHARE_BYTES)error=`PDF troppo grande: massimo ${MAX_SHARE_BYTES/1024/1024} MB.`;else{const headers=new Headers({'content-type':f.type||'application/pdf','x-filename':encodeURIComponent(f.name||'shared.pdf'),'x-size':String(f.size)});await cache.put(new Request(new URL(`./__share/${id}/file`,self.registration.scope)),new Response(f,{headers}))}
  }
  await cache.put(new Request(new URL(`./__share/${id}/meta`,self.registration.scope)),new Response(JSON.stringify({title,text,url,error,created:Date.now()}),{headers:{'content-type':'application/json','cache-control':'no-store'}}));
  return Response.redirect(new URL(`./?shared=${encodeURIComponent(id)}`,self.registration.scope),303)
}
async function networkFirst(request,fallback){const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response.ok)cache.put(request,response.clone());return response}catch{const hit=await cache.match(request);if(hit)return hit;if(fallback)return cache.match(fallback);throw new Error('offline')}}
async function cacheFirst(request){const cache=await caches.open(CACHE);const hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok)cache.put(request,response.clone());return response}
async function runtimeExternal(request){const cache=await caches.open(RUNTIME);const hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method==='POST'&&url.pathname.endsWith('/share-target')){event.respondWith(handleShare(event.request));return}
  if(event.request.method!=='GET')return;
  if(EXTERNAL.has(event.request.url)){event.respondWith(runtimeExternal(event.request));return}
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){event.respondWith(networkFirst(event.request,'./index.html'));return}
  const fresh=/\/(?:index\.html|app\.js|bookmarklet-source\.js|bookmarklet\.min\.js|manifest\.webmanifest|VERSION)$/.test(url.pathname);
  event.respondWith(fresh?networkFirst(event.request):cacheFirst(event.request));
});
