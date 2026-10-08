const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.min.mjs';
const PDFJS_WORKER_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.worker.min.mjs';
const PDFLIB_URL='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js';
let pdfjsLib=null;
let PDFDocument=null;
async function loadPdfLibs(){
  if(pdfjsLib&&PDFDocument)return;
  log('libs.begin',{pdfjs:'6.4.299',pdf_lib:'1.17.1',local_processing:true});
  const [pjs,plib]=await Promise.all([import(PDFJS_URL),import(PDFLIB_URL)]);
  pdfjsLib=pjs;PDFDocument=plib.PDFDocument;
  pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER_URL;
  log('libs.ready',{pdfjs:pdfjsLib.version||'6.4.299',pdf_lib:'1.17.1'});
}

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const A4=[595.2755905511812,841.8897637795277];
const state={sourceBytes:null,sourceName:'',pdfjsDoc:null,analysis:null,components:[],resultBlob:null,resultUrl:null,bookmarklet:'',deferredInstall:null};
const logs=[];

function safeUrl(raw){try{const u=new URL(raw);let path=u.pathname.replace(/(\/spr\/returns\/label\/)[^/]+/i,'$1[ID]').replace(/([0-9a-f]{8})-[0-9a-f-]{27,}/ig,'[ID]');return `${u.protocol}//${u.host}${path}`}catch{return '[invalid-url]'}}
function redact(v){if(typeof v==='string'){if(/^https?:\/\//i.test(v))return safeUrl(v);return v.replace(/([?&](?:token|signature|sig|auth|key|secret|code)=)[^&\s]+/gi,'$1[REDACTED]')}if(Array.isArray(v))return v.map(redact);if(v&&typeof v==='object'){const o={};for(const[k,val]of Object.entries(v))o[k]=/(token|cookie|authorization|password|secret|signature)/i.test(k)?'[REDACTED]':redact(val);return o}return v}
function log(event,data={}){const row={n:logs.length+1,time:new Date().toISOString(),event,data:redact(data)};logs.push(row);renderDebug();return row}
function renderDebug(){$('#debugOutput').textContent='Amazon Return Print Fixer PWA - DEBUG TEMPORANEO\nIMPORTANTE: token e query sensibili vengono redatti.\n\n'+logs.map(x=>`#${String(x.n).padStart(3,'0')} ${x.time} [${x.event}]\n${JSON.stringify(x.data,null,2)}`).join('\n\n')}
function toast(msg,ms=2600){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),ms)}
function setBusy(btn,busy,label){if(busy){btn.dataset.old=btn.textContent;btn.textContent=label||'Attendi…';btn.classList.add('spinner');btn.disabled=true}else{btn.textContent=btn.dataset.old||btn.textContent;btn.classList.remove('spinner');btn.disabled=false}}

function bytesToHex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function sha256(blob){return bytesToHex(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))}
function blobFromCanvas(canvas,type='image/png',quality=.95){return new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(new Error('Impossibile creare immagine')),type,quality))}
function normalizeText(s){return (s||'').replace(/\s+/g,' ').trim()}
function classifyText(text){const t=normalizeText(text).toLowerCase();if(t.includes('istruzioni per la restituzione del pacco'))return'instructions';if(t.includes('descrizione articoli')&&t.includes('quantità'))return'product_info';if(t.includes('codice a barre')&&(t.includes('inser')||t.includes('pacco'))&&!t.includes('istruzioni per la restituzione'))return'internal_barcode';return'other'}
function a4Like(w,h){const r=w/h;return w>=1000&&h>=1000&&r>=.63&&r<=.76}

function waitPdfObject(page,id){return new Promise((resolve,reject)=>{try{if(page.objs?.has?.(id))return resolve(page.objs.get(id));if(page.commonObjs?.has?.(id))return resolve(page.commonObjs.get(id));let settled=false;const done=x=>{if(!settled){settled=true;resolve(x)}};try{page.objs.get(id,done)}catch(e1){try{page.commonObjs.get(id,done)}catch(e2){reject(e1)}}setTimeout(()=>{if(!settled)reject(new Error(`Oggetto immagine PDF non risolto: ${id}`))},5000)}catch(e){reject(e)}})}

async function imageObjectToBlob(obj){if(!obj)throw new Error('Oggetto immagine vuoto');const w=obj.width||obj.bitmap?.width||0,h=obj.height||obj.bitmap?.height||0;if(!w||!h)throw new Error('Dimensioni immagine PDF mancanti');const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
  if(obj.bitmap){ctx.drawImage(obj.bitmap,0,0,w,h);return blobFromCanvas(canvas)}
  if(typeof ImageBitmap!=='undefined'&&obj instanceof ImageBitmap){ctx.drawImage(obj,0,0,w,h);return blobFromCanvas(canvas)}
  const data=obj.data;if(!data)throw new Error('Dati immagine PDF non disponibili');const px=w*h;let rgba;
  if(data.length===px*4){rgba=new Uint8ClampedArray(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength))}
  else if(data.length===px*3){rgba=new Uint8ClampedArray(px*4);for(let i=0,j=0;i<data.length;i+=3,j+=4){rgba[j]=data[i];rgba[j+1]=data[i+1];rgba[j+2]=data[i+2];rgba[j+3]=255}}
  else if(data.length===px){rgba=new Uint8ClampedArray(px*4);for(let i=0,j=0;i<data.length;i++,j+=4){rgba[j]=rgba[j+1]=rgba[j+2]=data[i];rgba[j+3]=255}}
  else throw new Error(`Formato pixel non supportato (${data.length} byte per ${w}x${h})`);
  ctx.putImageData(new ImageData(rgba,w,h),0,0);return blobFromCanvas(canvas)
}

async function renderPageThumb(page,scale=.45){const vp=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;return canvas.toDataURL('image/jpeg',.8)}

async function analyzePdf(file){await loadPdfLibs();const bytes=new Uint8Array(await file.arrayBuffer());state.sourceBytes=bytes.slice();state.sourceName=file.name||'reso-amazon.pdf';log('pdf.begin',{name:state.sourceName,bytes:bytes.byteLength,type:file.type});const task=pdfjsLib.getDocument({data:bytes,verbosity:0});const pdf=await task.promise;state.pdfjsDoc=pdf;const pages=[];const labels=[];const seenHashes=new Set();
  for(let pno=1;pno<=pdf.numPages;pno++){
    const page=await pdf.getPage(pno);const tc=await page.getTextContent();const text=tc.items.map(x=>x.str||'').join(' ');const kind=classifyText(text);const thumb=await renderPageThumb(page);const ops=await page.getOperatorList();const imageHits=[];
    for(let i=0;i<ops.fnArray.length;i++){
      const fn=ops.fnArray[i];let obj=null,id=null;
      try{
        if(fn===pdfjsLib.OPS.paintInlineImageXObject){obj=ops.argsArray[i]?.[0];id=`inline:${pno}:${i}`}
        else if(fn===pdfjsLib.OPS.paintImageXObject||fn===pdfjsLib.OPS.paintJpegXObject){id=ops.argsArray[i]?.[0];obj=await waitPdfObject(page,id)}
        else continue;
        const w=obj?.width||obj?.bitmap?.width||0,h=obj?.height||obj?.bitmap?.height||0;if(!w||!h)continue;imageHits.push({id,w,h,a4:a4Like(w,h)});if(!a4Like(w,h))continue;
        const blob=await imageObjectToBlob(obj);const hash=await sha256(blob);if(seenHashes.has(hash))continue;seenHashes.add(hash);const url=URL.createObjectURL(blob);labels.push({id:`label:${hash.slice(0,16)}`,kind:'label',title:`Etichetta / foglio A4 ${labels.length+1}`,description:'Immagine A4 originale estratta dal PDF, ricostruita senza tagli o deformazioni.',defaultSelected:true,sourcePages:[pno],blob,url,width:w,height:h,hash,thumb:url})
      }catch(e){log('pdf.image.skip',{page:pno,id:String(id||''),error:e.message})}
    }
    pages.push({page:pno,kind,textChars:normalizeText(text).length,text,thumb,imageHits});
    log('pdf.page',{page:pno,classification:kind,text_chars:normalizeText(text).length,images:imageHits.map(x=>({w:x.w,h:x.h,a4:x.a4}))})
  }
  const components=[];
  for(const r of pages){if(r.kind==='instructions')components.push({id:`page:${r.page}:instructions`,kind:'instructions',title:`Istruzioni (pagina ${r.page})`,description:'Opzionali. Normalmente non vanno inserite nel pacco.',defaultSelected:false,sourcePages:[r.page],thumb:r.thumb})}
  components.push(...labels);
  const labelPages=new Set(labels.flatMap(x=>x.sourcePages));
  for(const r of pages){if(r.kind==='product_info')components.push({id:`page:${r.page}:product_info`,kind:'product_info',title:`Riepilogo articolo / pagina finale (pagina ${r.page})`,description:'Se Amazon indica di inserirla nel pacco, selezionala.',defaultSelected:false,sourcePages:[r.page],thumb:r.thumb});else if(r.kind==='internal_barcode')components.push({id:`page:${r.page}:internal_barcode`,kind:'internal_barcode',title:`Foglio da inserire nel pacco (pagina ${r.page})`,description:'Rilevato un foglio interno/codice a barre: selezionato per sicurezza.',defaultSelected:true,sourcePages:[r.page],thumb:r.thumb});else if(r.kind==='other'&&!labelPages.has(r.page)&&normalizeText(r.text).length>10)components.push({id:`page:${r.page}:other`,kind:'other',title:`Altra pagina ${r.page}`,description:'Contenuto non classificato: controlla l’anteprima.',defaultSelected:false,sourcePages:[r.page],thumb:r.thumb})}
  if(!labels.length){log('pdf.no_original_a4',{note:'Nessuna immagine A4 originale estraibile. Verranno mostrate le pagine per selezione manuale.'});for(const r of pages){if(!components.some(c=>c.sourcePages?.[0]===r.page))components.push({id:`page:${r.page}:other`,kind:'other',title:`Pagina ${r.page}`,description:'Pagina originale. Nessuna etichetta A4 incorporata rilevata automaticamente.',defaultSelected:true,sourcePages:[r.page],thumb:r.thumb})}}
  state.analysis={pageCount:pdf.numPages,pages,labelCount:labels.length};state.components=components;log('pdf.end',{pages:pdf.numPages,components:components.length,labels:labels.length});renderComponents();return state.analysis
}

function renderComponents(){const list=$('#componentList');list.innerHTML='';for(const c of state.components){const el=document.createElement('label');el.className='component'+(c.defaultSelected?' selected':'');el.dataset.id=c.id;el.innerHTML=`<div class="thumb"><img alt="Anteprima" src="${c.thumb||''}"></div><div class="component-body"><div class="checkrow"><input type="checkbox" ${c.defaultSelected?'checked':''}><div><div class="component-title">${escapeHtml(c.title)}</div><div class="component-desc">${escapeHtml(c.description||'')}</div><span class="badge">${escapeHtml(kindLabel(c.kind))}</span></div></div></div>`;const cb=el.querySelector('input');cb.addEventListener('change',()=>el.classList.toggle('selected',cb.checked));list.appendChild(el)}$('#analysisTitle').textContent=state.sourceName||'Contenuto trovato';$('#analysisSummary').textContent=state.analysis?.labelCount?`${state.analysis.pageCount} pagine sorgente · ${state.analysis.labelCount} fogli A4 originali recuperati.`:`${state.analysis?.pageCount||0} pagine · nessuna immagine A4 originale recuperata: controlla le selezioni.`;$('#analysisSection').classList.remove('hidden');$('#analysisSection').scrollIntoView({behavior:'smooth',block:'start'})}
function kindLabel(k){return({label:'A4 ricostruito',instructions:'Istruzioni',product_info:'Riepilogo',internal_barcode:'Foglio interno',other:'Pagina originale'})[k]||k}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function selectedComponents(){const ids=$$('.component input:checked').map(x=>x.closest('.component').dataset.id);return state.components.filter(c=>ids.includes(c.id))}
function selectMode(mode){for(const el of $$('.component')){const c=state.components.find(x=>x.id===el.dataset.id);const cb=el.querySelector('input');cb.checked=mode==='all'?true:mode==='labels'?c.kind==='label':c.defaultSelected;el.classList.toggle('selected',cb.checked)}}

async function generatePdf(){await loadPdfLibs();const selected=selectedComponents();if(!selected.length)throw new Error('Seleziona almeno un elemento');const marginMm=Number($('#marginSelect').value||5);log('export.begin',{selected:selected.map(x=>({id:x.id,kind:x.kind,sourcePages:x.sourcePages})),margin_mm:marginMm});const src=await PDFDocument.load(state.sourceBytes,{ignoreEncryption:true});const out=await PDFDocument.create();const pt=72/25.4,margin=marginMm*pt;
  for(const c of selected){if(c.kind==='label'){const bytes=new Uint8Array(await c.blob.arrayBuffer());const img=await out.embedPng(bytes);const page=out.addPage(A4);const maxW=A4[0]-2*margin,maxH=A4[1]-2*margin;const s=Math.min(maxW/c.width,maxH/c.height);const w=c.width*s,h=c.height*s;page.drawImage(img,{x:(A4[0]-w)/2,y:(A4[1]-h)/2,width:w,height:h})}else{const idx=(c.sourcePages?.[0]||1)-1;const[copied]=await out.copyPages(src,[idx]);out.addPage(copied)}}
  out.setTitle('Amazon return - A4 corretto');out.setAuthor('Amazon Return Print Fixer PWA');out.setSubject('Etichette di reso ricostruite localmente nel browser');const bytes=await out.save({useObjectStreams:true});const blob=new Blob([bytes],{type:'application/pdf'});if(state.resultUrl)URL.revokeObjectURL(state.resultUrl);state.resultBlob=blob;state.resultUrl=URL.createObjectURL(blob);const name=(state.sourceName||'reso-amazon.pdf').replace(/\.pdf$/i,'')+'_CORRETTO.pdf';$('#resultSummary').textContent=`${selected.length} elemento/i · ${(blob.size/1024).toFixed(0)} KB · ${name}`;$('#resultSection').classList.remove('hidden');$('#openPdfBtn').onclick=()=>window.open(state.resultUrl,'_blank','noopener');$('#downloadPdfBtn').onclick=()=>downloadBlob(blob,name);if(navigator.canShare){const f=new File([blob],name,{type:'application/pdf'});if(navigator.canShare({files:[f]})){$('#sharePdfBtn').classList.remove('hidden');$('#sharePdfBtn').onclick=()=>navigator.share({files:[f],title:'Reso Amazon corretto'}).catch(()=>{})}}log('export.end',{output_bytes:blob.size,output_pages:selected.length});$('#resultSection').scrollIntoView({behavior:'smooth',block:'start'})}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}

function parseAmazonLink(raw){let s=(raw||'').trim();if(!s)throw new Error('Incolla un link Amazon');let u=new URL(s);if(!/(^|\.)amazon\.(it|de|fr|es|co\.uk)$/i.test(u.hostname)&&!/(^|\.)amazon\.com$/i.test(u.hostname))throw new Error('Il link non sembra appartenere ad Amazon');const info={wrapper:false,rawPath:u.pathname,queryKeys:[...u.searchParams.keys()]};if(u.pathname==='/gp/r.html'&&u.searchParams.get('U')){info.wrapper=true;let embedded=u.searchParams.get('U');for(let i=0;i<2;i++){try{const d=decodeURIComponent(embedded);if(d===embedded)break;embedded=d}catch{break}}u=new URL(embedded,u.origin);info.embeddedPath=u.pathname;info.embeddedQueryKeys=[...u.searchParams.keys()]}
  log('link.normalize',{wrapper_gp_r:info.wrapper,raw_path:info.rawPath,raw_query_keys:info.queryKeys,embedded_path:info.embeddedPath||null,embedded_query_keys:info.embeddedQueryKeys||[],target:safeUrl(u.href)});return u.href}

async function loadBookmarklet(){try{const r=await fetch('./bookmarklet-source.js',{cache:'no-store'});const src=await r.text();state.bookmarklet='javascript:'+src.trim();$('#bookmarkletAnchor').href=state.bookmarklet;log('bookmarklet.ready',{chars:state.bookmarklet.length})}catch(e){log('bookmarklet.error',{error:e.message})}}
async function copyBookmarklet(){if(!state.bookmarklet)await loadBookmarklet();await navigator.clipboard.writeText(state.bookmarklet);toast('Bookmarklet copiato')}

async function handleFile(file){if(!file)return;if(!/pdf/i.test(file.type||'')&&!/\.pdf$/i.test(file.name||''))return toast('Seleziona un PDF');$('#resultSection').classList.add('hidden');$('#analysisSection').classList.add('hidden');try{toast('Analisi PDF…');await analyzePdf(file);toast('Analisi completata')}catch(e){log('pdf.failure',{error:e.message,stack:e.stack||''});$('#debugDetails').open=true;toast('Errore durante l’analisi',4000);throw e}}

async function consumeShared(){if(!('caches'in window))return;try{const c=await caches.open('arf-share-v1');const fr=await c.match('./__share/file');const mr=await c.match('./__share/meta');if(fr){const blob=await fr.blob();const fn=decodeURIComponent(fr.headers.get('x-filename')||'shared.pdf');await c.delete('./__share/file');if(mr)await c.delete('./__share/meta');log('share.pdf',{name:fn,bytes:blob.size});switchTab('pdf');await handleFile(new File([blob],fn,{type:blob.type||'application/pdf'}));return}if(mr){const meta=await mr.json();await c.delete('./__share/meta');const candidate=meta.url||extractUrl(meta.text)||extractUrl(meta.title);if(candidate){$('#amazonLink').value=candidate;switchTab('link');log('share.url',{url:candidate});prepareLink()}}}catch(e){log('share.error',{error:e.message})}}
function extractUrl(s){const m=String(s||'').match(/https?:\/\/[^\s]+/i);return m?m[0]:''}
function switchTab(name){$$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));$$('.tabpane').forEach(x=>x.classList.toggle('active',x.id===`tab-${name}`))}
function prepareLink(){try{const target=parseAmazonLink($('#amazonLink').value);$('#openAmazonBtn').href=target;$('#linkResult').classList.remove('hidden');toast('Link Amazon pronto')}catch(e){log('link.error',{error:e.message});toast(e.message,4000)}}

function initUi(){
  $$('.tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $('#pdfInput').onchange=e=>handleFile(e.target.files?.[0]);
  const dz=$('#dropZone');for(const ev of['dragenter','dragover'])dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')});for(const ev of['dragleave','drop'])dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')});dz.addEventListener('drop',e=>handleFile(e.dataTransfer.files?.[0]));
  $('#prepareLinkBtn').onclick=prepareLink;$('#copyBookmarkletBtn').onclick=copyBookmarklet;$('#copyBookmarkletBtnLink').onclick=copyBookmarklet;
  $('#selectRecommended').onclick=()=>selectMode('recommended');$('#selectLabels').onclick=()=>selectMode('labels');$('#selectAll').onclick=()=>selectMode('all');
  $('#generateBtn').onclick=async()=>{const b=$('#generateBtn');try{setBusy(b,true,'Creo PDF…');await generatePdf();toast('PDF corretto pronto')}catch(e){log('export.failure',{error:e.message,stack:e.stack||''});$('#debugDetails').open=true;toast(e.message,4000)}finally{setBusy(b,false)}};
  $('#copyDebugBtn').onclick=async()=>{await navigator.clipboard.writeText($('#debugOutput').textContent);toast('Debug copiato')};$('#clearDebugBtn').onclick=()=>{logs.length=0;log('debug.reset',{ua:navigator.userAgent})};
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredInstall=e;$('#installBtn').classList.remove('hidden')});$('#installBtn').onclick=async()=>{if(!state.deferredInstall)return;await state.deferredInstall.prompt();state.deferredInstall=null;$('#installBtn').classList.add('hidden')};
}

(async()=>{initUi();log('debug.start',{version:'0.4.0-github-pages-debug',ua:navigator.userAgent,secure_context:isSecureContext,service_worker:'serviceWorker'in navigator});if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('./sw.js');log('pwa.sw',{status:'registered'})}catch(e){log('pwa.sw.error',{error:e.message})}}await loadBookmarklet();if(new URL(location.href).searchParams.get('shared')==='1')await consumeShared()})().catch(e=>{log('startup.failure',{error:e.message,stack:e.stack||''});$('#debugDetails').open=true});
