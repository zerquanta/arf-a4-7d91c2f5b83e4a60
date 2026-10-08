const CACHE='arf-pwa-v040';
const SHARE='arf-share-v1';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./bookmarklet-source.js','./privacy.html','./robots.txt'];
const EXTERNAL=new Set([
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.min.mjs',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.worker.min.mjs',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js'
]);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('arf-pwa-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      const fd=await e.request.formData();
      const c=await caches.open(SHARE);
      const title=String(fd.get('title')||'');const text=String(fd.get('text')||'');const url=String(fd.get('url')||'');
      await c.put(new Request(new URL('./__share/meta',self.registration.scope)),new Response(JSON.stringify({title,text,url}),{headers:{'content-type':'application/json'}}));
      const files=fd.getAll('files').filter(x=>x&&typeof x.arrayBuffer==='function');
      if(files[0]){const f=files[0];const h=new Headers({'content-type':f.type||'application/pdf','x-filename':encodeURIComponent(f.name||'shared.pdf')});await c.put(new Request(new URL('./__share/file',self.registration.scope)),new Response(f,{headers:h}))}
      return Response.redirect(new URL('./?shared=1',self.registration.scope),303)
    })());return;
  }
  if(e.request.method!=='GET')return;
  if(EXTERNAL.has(e.request.url)){
    e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(e.request);if(hit)return hit;const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r})());return;
  }
  if(u.origin===location.origin){
    e.respondWith((async()=>{try{const r=await fetch(e.request);if(r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone())}return r}catch{const hit=await caches.match(e.request);return hit||caches.match('./index.html')}})())
  }
});
