(()=>{
  const VERSION='0.5.0-bookmarklet-debug';
  if(window.__arfBookmarkletOpen){return;}
  window.__arfBookmarkletOpen=true;
  const Z='2147483647';
  const logs=[];
  const now=()=>new Date().toISOString();
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safeUrl=raw=>{try{const u=new URL(raw,location.href);let p=u.pathname.replace(/(\/spr\/returns\/label\/)[^/]+/i,'$1[ID]').replace(/([0-9a-f]{8})-[0-9a-f-]{27,}/ig,'[ID]');return `${u.protocol}//${u.host}${p}`;}catch{return '[invalid-url]';}};
  const log=(event,data={})=>{logs.push({n:logs.length+1,time:now(),event,data});refreshDebug();};
  const debugText=()=>`Amazon Return Print Fixer BOOKMARKLET - DEBUG TEMPORANEO\nIMPORTANTE: URL/query/token e contenuti delle etichette non vengono inclusi.\n\n${logs.map(x=>`#${String(x.n).padStart(3,'0')} ${x.time} [${x.event}]\n${JSON.stringify(x.data,null,2)}`).join('\n\n')}`;
  let debugPre=null;
  function refreshDebug(){if(debugPre)debugPre.textContent=debugText();}
  async function copyText(t){try{await navigator.clipboard.writeText(t);return true;}catch{const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy');}catch{}a.remove();return ok;}}
  function isA4(w,h){const area=w*h,r=w/h;const portrait=area>=700000&&w>=650&&h>=850&&r>=.62&&r<=.79;const landscape=area>=700000&&w>=850&&h>=650&&r>=1.27&&r<=1.62;return portrait||landscape?{ok:true,orientation:portrait?'portrait':'landscape',ratio:r}: {ok:false,orientation:null,ratio:r};}
  function smallest(test,min=30,max=9000){const nodes=[...document.querySelectorAll('h1,h2,h3,h4,section,article,table,div,p')];const hits=nodes.filter(e=>{const t=norm(e.innerText);return t.length>=min&&t.length<=max&&test(t.toLowerCase());});hits.sort((a,b)=>norm(a.innerText).length-norm(b.innerText).length);return hits[0]||null;}
  function textBlock(el,max=16000){if(!el)return'';return norm(el.innerText).slice(0,max);}
  async function getImages(){
    const srcs=[];
    for(const i of document.images){const s=i.currentSrc||i.src;if(s)srcs.push(s);}
    const html=document.documentElement.innerHTML;
    let regexCount=0;
    for(const m of html.matchAll(/data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+/g)){srcs.push(m[0]);regexCount++;}
    const uniq=[...new Set(srcs)];
    log('scan.begin',{page:safeUrl(location.href),title:document.title,dom_images:document.images.length,data_images_in_html:regexCount,unique_sources:uniq.length,ua:navigator.userAgent});
    const out=[];
    for(let n=0;n<uniq.length;n++){
      const src=uniq[n];
      try{
        const im=new Image();im.decoding='async';im.src=src;
        await new Promise((resolve,reject)=>{if(im.complete&&im.naturalWidth)return resolve();const to=setTimeout(()=>reject(new Error('timeout')),5000);im.onload=()=>{clearTimeout(to);resolve();};im.onerror=()=>{clearTimeout(to);reject(new Error('load-error'));};});
        const w=im.naturalWidth,h=im.naturalHeight,a=isA4(w,h);
        log('scan.image',{index:n+1,source:src.startsWith('data:')?'data:image':safeUrl(src),width:w,height:h,a4_like:a.ok,orientation:a.orientation});
        if(a.ok)out.push({src,w,h,orientation:a.orientation});
      }catch(e){log('scan.image.error',{index:n+1,source:src.startsWith('data:')?'data:image':safeUrl(src),error:e.message});}
    }
    const dedup=[];const seen=new Set();
    for(const x of out){const key=x.src.startsWith('data:')?`${x.src.length}:${x.src.slice(-48)}`:x.src;if(seen.has(key))continue;seen.add(key);dedup.push(x);}
    log('scan.end',{accepted:dedup.length,accepted_dimensions:dedup.map(x=>[x.w,x.h])});
    return dedup;
  }
  function cleanTextHtml(title,text){const body=esc(text).replace(/\n/g,'<br>');return `<div class="textpage"><h1>${esc(title)}</h1><div>${body}</div></div>`;}
  function printDocument(chosen,marginMm,title){
    const parts=chosen.map(c=>c.kind==='img'?`<section class="sheet"><img src="${esc(c.data)}" alt="Etichetta"></section>`:`<section class="sheet text-sheet">${c.data}</section>`).join('');
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#ddd;font-family:Arial,sans-serif}.sheet{width:210mm;height:297mm;padding:${marginMm}mm;background:#fff;display:flex;align-items:center;justify-content:center;break-after:page;page-break-after:always;overflow:hidden}.sheet:last-child{break-after:auto;page-break-after:auto}.sheet img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}.text-sheet{display:block;padding:${Math.max(marginMm,10)}mm}.textpage h1{font-size:18pt;margin:0 0 8mm}.textpage div{font-size:11pt;line-height:1.45;white-space:normal}@media screen{.sheet{margin:10px auto;box-shadow:0 2px 12px #0003}}@media print{html,body{background:#fff}.sheet{margin:0;box-shadow:none}}</style></head><body>${parts}</body></html>`;
  }
  function openClean(chosen,marginMm,autoPrint){
    const win=window.open('','_blank');
    if(!win){log('output.popup_blocked',{});alert('Il browser ha bloccato la nuova scheda. Consenti i popup per Amazon e riprova.');return;}
    try{win.document.open();win.document.write(printDocument(chosen,marginMm,'Reso Amazon A4'));win.document.close();log('output.open',{items:chosen.length,margin_mm:marginMm,auto_print:autoPrint});if(autoPrint){const trigger=()=>setTimeout(()=>{try{win.focus();win.print();log('output.print.called',{items:chosen.length});}catch(e){log('output.print.error',{error:e.message});}},350);if(win.document.readyState==='complete')trigger();else win.addEventListener('load',trigger,{once:true});}}
    catch(e){log('output.error',{error:e.message});try{win.close();}catch{}alert('Return Fixer: '+e.message);}
  }
  function overlay(items,inst,internal,prod){
    const bg=document.createElement('div');
    Object.assign(bg.style,{position:'fixed',inset:'0',zIndex:Z,background:'#000b',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px',fontFamily:'system-ui,-apple-system,Segoe UI,sans-serif'});
    const box=document.createElement('div');
    Object.assign(box.style,{background:'#fff',color:'#111',width:'min(820px,100%)',maxHeight:'94vh',overflow:'auto',borderRadius:'16px',padding:'16px',boxShadow:'0 20px 60px #0007'});
    box.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><b style="font-size:19px">Amazon Return Fixer</b><div style="font-size:12px;color:#666">${VERSION} · stampa A4 pulita direttamente da Amazon</div></div><button data-close aria-label="Chiudi">✕</button></div><div data-status style="margin:12px 0;padding:9px 11px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:9px;font-size:13px"></div><div data-list style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:12px 0"></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0"><button data-rec>Consigliati</button><button data-labels>Solo etichette</button><button data-all>Tutto</button><label style="font-size:12px;font-weight:600">Margine <select data-margin style="padding:7px;border:1px solid #ccc;border-radius:7px"><option value="3">3 mm</option><option value="5" selected>5 mm</option><option value="7">7 mm</option><option value="10">10 mm</option></select></label></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button data-preview style="background:#e5e7eb;color:#111">Vista pulita</button><button data-print style="background:#2563eb;color:#fff">Stampa / Salva PDF</button><button data-debug style="background:#e5e7eb;color:#111">Debug</button></div><div data-debugbox style="display:none;margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>Debug bookmarklet</b><button data-copydebug>Copia debug</button></div><pre data-debugpre style="white-space:pre-wrap;word-break:break-word;background:#111827;color:#d1fae5;padding:10px;border-radius:9px;max-height:300px;overflow:auto;font-size:10px"></pre></div>`;
    box.querySelectorAll('button').forEach(b=>Object.assign(b.style,{border:'0',borderRadius:'9px',padding:'9px 11px',fontWeight:'650',cursor:'pointer'}));
    const list=box.querySelector('[data-list]');const cards=[];
    function card(id,title,desc,checked,preview,kind,data){const d=document.createElement('label');Object.assign(d.style,{border:'1px solid #ddd',borderRadius:'11px',padding:'9px',display:'block',background:checked?'#eff6ff':'#fff'});d.innerHTML=`${preview||''}<div style="display:flex;gap:7px;margin-top:7px"><input type="checkbox" ${checked?'checked':''} style="width:18px;height:18px"><div><b>${esc(title)}</b><div style="font-size:11px;color:#666">${esc(desc)}</div></div></div>`;const cb=d.querySelector('input');cb.onchange=()=>d.style.background=cb.checked?'#eff6ff':'#fff';list.appendChild(d);cards.push({id,kind,data,el:d,cb});}
    if(inst){const txt=textBlock(inst);card('instructions','Istruzioni','Opzionali. Normalmente non vanno nel pacco.',false,'<div style="height:95px;background:#f3f4f6;display:grid;place-items:center;border-radius:7px;font-size:34px">📄</div>','instructions',cleanTextHtml('Istruzioni per la restituzione',txt));}
    items.forEach((x,i)=>card('img'+i,items.length===2?`Etichetta Poste ${i+1}`:`Foglio A4 ${i+1}`,`${x.w}×${x.h}px · originale Amazon`,true,`<img src="${esc(x.src)}" style="width:100%;height:150px;object-fit:contain;background:#f3f4f6;border-radius:7px">`,'img',x.src));
    if(internal){const txt=textBlock(internal);card('internal','Foglio da inserire nel pacco','Rilevato riferimento a codice a barre/foglio interno: selezionato per sicurezza.',true,'<div style="height:95px;background:#fff7ed;display:grid;place-items:center;border-radius:7px;font-size:34px">📥</div>','internal',cleanTextHtml('Foglio da inserire nel pacco',txt));}
    if(prod){const txt=textBlock(prod);card('product','Riepilogo articolo / pagina finale','Opzionale; includilo solo se Amazon lo richiede.',false,'<div style="height:95px;background:#f3f4f6;display:grid;place-items:center;border-radius:7px;font-size:34px">📦</div>','product',cleanTextHtml('Riepilogo articolo',txt));}
    box.querySelector('[data-status]').textContent=`Trovati ${items.length} fogli A4 originali${internal?' · foglio interno rilevato':''}. Le etichette sono selezionate automaticamente.`;
    box.querySelector('[data-close]').onclick=()=>{bg.remove();window.__arfBookmarkletOpen=false;log('overlay.close',{});};
    box.querySelector('[data-rec]').onclick=()=>cards.forEach(c=>{c.cb.checked=c.kind==='img'||c.kind==='internal';c.cb.onchange();});
    box.querySelector('[data-labels]').onclick=()=>cards.forEach(c=>{c.cb.checked=c.kind==='img';c.cb.onchange();});
    box.querySelector('[data-all]').onclick=()=>cards.forEach(c=>{c.cb.checked=true;c.cb.onchange();});
    const chosen=()=>cards.filter(c=>c.cb.checked);
    const margin=()=>Number(box.querySelector('[data-margin]').value||5);
    box.querySelector('[data-preview]').onclick=()=>{const c=chosen();if(!c.length)return alert('Seleziona almeno un elemento.');openClean(c,margin(),false);};
    box.querySelector('[data-print]').onclick=()=>{const c=chosen();if(!c.length)return alert('Seleziona almeno un elemento.');log('print.request',{items:c.map(x=>x.kind),margin_mm:margin()});openClean(c,margin(),true);};
    const dbg=box.querySelector('[data-debugbox]');debugPre=box.querySelector('[data-debugpre]');refreshDebug();
    box.querySelector('[data-debug]').onclick=()=>{dbg.style.display=dbg.style.display==='none'?'block':'none';refreshDebug();};
    box.querySelector('[data-copydebug]').onclick=async()=>{const ok=await copyText(debugText());alert(ok?'Debug copiato.':'Non sono riuscito a copiare automaticamente: seleziona il testo del debug.');};
    bg.appendChild(box);document.documentElement.appendChild(bg);log('overlay.ready',{cards:cards.map(c=>c.kind)});
  }
  (async()=>{
    try{
      log('bookmarklet.start',{version:VERSION,page:safeUrl(location.href),title:document.title,secure_context:isSecureContext});
      const imgs=await getImages();
      const inst=smallest(t=>t.includes('istruzioni per la restituzione'),100,9000);
      const internal=smallest(t=>t.includes('codice a barre')&&t.includes('pacco')&&!t.includes('istruzioni per la restituzione'),20,6500);
      const prod=smallest(t=>t.includes('descrizione articoli')&&(t.includes('quantità')||t.includes('quantita')),20,6500);
      log('text.classify',{instructions:!!inst,internal_barcode:!!internal,product_info:!!prod});
      if(!imgs.length&&!inst&&!internal&&!prod){window.__arfBookmarkletOpen=false;log('bookmarklet.no_content',{});alert('Non trovo fogli A4 o sezioni di reso in questa pagina. Apri prima la pagina etichetta / “Centro resi” e riprova.');return;}
      overlay(imgs,inst,internal,prod);
    }catch(e){window.__arfBookmarkletOpen=false;log('bookmarklet.failure',{error:e.message,stack:e.stack||''});alert('Return Fixer: '+e.message+'\n\nRiprova e, se compare il pannello, copia il debug.');}
  })();
})();
