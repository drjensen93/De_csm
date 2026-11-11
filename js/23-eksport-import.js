/* ===== EKSPORT OG IMPORT AF GEMTE SPIL ===== */
// Spillet gemmes i browserens localStorage, som hører til den adresse, spillet køres fra.
// Eksport giver det gemte spil som en tekstkode (eller en fil), der kan indlæses et andet sted, fx når spillet flyttes
// fra Claude-artefaktet til GitHub Pages, til en anden browser eller som sikkerhedskopi før en opdatering.
// Format: 'DECSM1:' + base64 af den gemte (komprimerede) tekst som UTF-16-kodeenheder, så alle tegn overlever kopiering.
const GS={pre:'DECSM1:',imp:null,arm:false};
function gsEnc(s){const u=new Uint8Array(s.length*2);for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);u[2*i]=c&255;u[2*i+1]=c>>8}
  let b='';for(let i=0;i<u.length;i+=0x8000)b+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return GS.pre+btoa(b)}
function gsDec(t){t=(t||'').trim().replace(/\s+/g,'');if(t.slice(0,GS.pre.length)!==GS.pre)throw new Error('Koden starter ikke med '+GS.pre);
  const b=atob(t.slice(GS.pre.length));if(b.length%2)throw new Error('Koden er ufuldstændig');let s='';const P=[];
  for(let i=0;i<b.length;i+=2)P.push(b.charCodeAt(i)|b.charCodeAt(i+1)<<8);for(let i=0;i<P.length;i+=0x8000)s+=String.fromCharCode.apply(null,P.slice(i,i+0x8000));return s}
// tjek at koden faktisk er et gemt spil: pak ud og læs sæson/dag
function gsCheck(s){const o=JSON.parse(svUnpack(s),typeof r2Rev==='function'?r2Rev:undefined);if(!o||!o.WD||!o.WD.lg)throw new Error('Koden indeholder ikke et gemt spil');
  const me=o.WD.lg[o.WD.me.li]&&o.WD.lg[o.WD.me.li].teams[o.WD.me.ti];return{season:o.WD.season,day:o.WD.day,team:me&&me.def&&me.def.name||me&&me.name||'?'}}
VT.gs='Gemte spil';
{const w=document.querySelector('.w');if(w&&!$('gs'))w.insertAdjacentHTML('beforeend','<div id="gs" style="display:none"></div>')}
{const _sh=show;show=function(v){_sh(v);const e=$('gs');if(e)e.style.display=v==='gs'?'':'none'}}
function showGS(){GS.imp=null;GS.arm=false;show('gs');renderGS()}
function renderGS(){const e=$('gs');if(!e)return;let cur=null;try{const z=localStorage.getItem(SAVE_KEY);if(z)cur=z.length}catch(x){}
  const imp=GS.imp;
  e.innerHTML=`<div class="tm"><h3>Eksport</h3><div class="mu">Gemmer spillet og laver en kode, du kan kopiere eller hente som fil. Brug den til at flytte spillet til en anden adresse eller browser, eller som sikkerhedskopi før en opdatering.${cur?` Det gemte spil fylder nu ${(cur/1e6).toLocaleString('da-DK',{maximumFractionDigits:2})} mio. tegn.`:''}</div>
   <div class="bar"><button data-gs="exp">Gem og lav eksport</button></div>
   <textarea id="gsOut" readonly style="width:100%;height:90px;font:11px monospace;display:none"></textarea>
   <div class="bar" id="gsOutB" style="display:none"><button data-gs="copy">Kopiér koden</button><button data-gs="file">Hent som fil</button></div>
   <div class="mu" id="gsMsg"></div></div>
  <div class="tm"><h3>Import</h3><div class="mu">Indsæt en eksportkode eller vælg en eksportfil. <b>Det spil, der er gemt her, bliver overskrevet.</b></div>
   <textarea id="gsIn" placeholder="${GS.pre}…" style="width:100%;height:90px;font:11px monospace;margin-top:6px"></textarea>
   <input type="file" id="gsFile" accept=".txt,.decsm,text/plain" style="margin:6px 0">
   <div class="bar"><button data-gs="check">Tjek koden</button>${imp?`<button data-gs="load" class="${GS.arm?'alert':''}">${GS.arm?'Sikker? Overskriv':'Indlæs spillet'}</button>`:''}</div>
   <div class="mu" id="gsImp">${imp?`Fundet: <b>${imp.info.team}</b>, sæson ${imp.info.season}, dag ${imp.info.day+1}.`:''}</div></div>`}
function gsMsg(id,t){const m=$(id);if(m)m.innerHTML=t}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-gs]');if(!b||!$('gs')||!$('gs').contains(b))return;const a=b.dataset.gs;
  if(a==='exp'){if(!saveGame())return gsMsg('gsMsg','Spillet kunne ikke gemmes.');let z=null;try{z=localStorage.getItem(SAVE_KEY)}catch(x){}if(!z)return gsMsg('gsMsg','Der er ikke noget gemt spil.');
    const t=gsEnc(z),o=$('gsOut');o.value=t;o.style.display='';$('gsOutB').style.display='';gsMsg('gsMsg',`Koden er ${(t.length/1e6).toLocaleString('da-DK',{maximumFractionDigits:2})} mio. tegn.`)}
  else if(a==='copy'){const o=$('gsOut');const done=()=>gsMsg('gsMsg','Koden er kopieret.');try{navigator.clipboard.writeText(o.value).then(done,()=>{o.select();gsMsg('gsMsg','Kopiering blev afvist – koden er markeret, så du selv kan kopiere den.')})}catch(x){o.select();gsMsg('gsMsg','Koden er markeret – kopiér den selv.')}}
  else if(a==='file'){try{const d=WD?`s${WD.season}-d${WD.day+1}`:'spil';const u=URL.createObjectURL(new Blob([$('gsOut').value],{type:'text/plain'}));const l=document.createElement('a');l.href=u;l.download=`de_csm-${d}.decsm`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);gsMsg('gsMsg','Filen hentes. Virker det ikke her (fx i et Claude-artefakt), så brug "Kopiér koden".')}catch(x){gsMsg('gsMsg','Filen kunne ikke hentes her – brug "Kopiér koden".')}}
  else if(a==='check'){try{const s=gsDec($('gsIn').value);GS.imp={s,info:gsCheck(s)};GS.arm=false;renderGS()}catch(x){GS.imp=null;renderGS();gsMsg('gsImp','Koden kan ikke læses: '+x.message)}}
  else if(a==='load'){if(!GS.imp)return;if(!GS.arm){GS.arm=true;renderGS();setTimeout(()=>{if(GS.arm){GS.arm=false;if(VIEW==='gs')renderGS()}},4000);return}
    try{localStorage.setItem(SAVE_KEY,GS.imp.s);location.reload()}catch(x){gsMsg('gsImp','Spillet kunne ikke gemmes i browseren: '+x.message)}}});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='gsFile'&&e.target.files&&e.target.files[0]){const r=new FileReader();r.onload=()=>{$('gsIn').value=String(r.result||'');$('gs').querySelector('[data-gs="check"]').click()};r.readAsText(e.target.files[0])}});
// knap i menuen ved siden af Gem
{const _rn=renderNav;renderNav=function(){_rn();const n=$('nav');if(!n||n.querySelector('[data-v="gs"]'))return;const g=n.querySelector('[data-x="gem"]');
  const h=`<button class="sv${VIEW==='gs'?' on':''}" data-v="gs">Eksport</button>`;if(g)g.insertAdjacentHTML('beforebegin',h);else n.insertAdjacentHTML('beforeend',h)}}
{const _nc=$('nav').onclick;$('nav').onclick=e=>{const b=e.target.closest('[data-v]');if(b&&b.dataset.v==='gs')return showGS();return _nc(e)}}
try{renderNav()}catch(e){}
