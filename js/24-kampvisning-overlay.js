/* ===== 24: kampvisning – beskeder og pause-stats som overlay i 2D-visningen (12. nov.) =====
   Tekstboksen under kortet bruges ikke. Beskederne (drab, plant, defuse …) vises i øverste højre hjørne af 2D-visningen
   og forsvinder efter 4 sekunder (rigtig tid) eller ved ny runde. Står kampen på pause, vises stats som et gennemsigtigt overlay. */
(function(){
  const FEED_MS=4000;
  const css=document.createElement('style');
  css.textContent=`#e2feed{position:absolute;top:6px;right:6px;max-width:60%;display:flex;flex-direction:column;align-items:flex-end;gap:1px;pointer-events:none;z-index:2}
#e2feed div{color:#fff;font-size:10px;font-weight:700;line-height:1.25;padding:0 2px;text-align:right;text-shadow:0 0 2px #000,0 0 2px #000,0 0 1px #000;transition:opacity .4s}
#e2feed div.ct b,#e2feed div.ct .k{color:#7cc0ff}#e2feed div.t b,#e2feed div.t .k{color:#ff6a5c}
#e2feed .ct{color:#7cc0ff}#e2feed .t{color:#ff6a5c}
#e2stats{position:absolute;inset:0;display:none;background:rgba(12,15,20,.72);color:#fff;font-size:12px;padding:10px;overflow:auto;z-index:3}
#e2stats h4{margin:0 0 8px;font-size:15px;text-align:center}
#e2stats table{width:100%;border-collapse:collapse;margin-bottom:10px}
#e2stats th,#e2stats td{padding:3px 4px;text-align:right;border-bottom:1px solid rgba(255,255,255,.15);white-space:nowrap}
#e2stats th:first-child,#e2stats td:first-child{text-align:left}
#e2stats .tn{font-weight:700;font-size:13px;text-align:left}
#e2stats .dead{opacity:.45}`;
  document.head.appendChild(css);
  const wrapEl=()=>document.getElementById('e2w');
  function els(){const w=wrapEl();if(!w)return null;let f=document.getElementById('e2feed'),s=document.getElementById('e2stats');
    if(!f){f=document.createElement('div');f.id='e2feed';w.appendChild(f)}
    if(!s){s=document.createElement('div');s.id='e2stats';w.appendChild(s)}
    return{f,s}}
  function clearFeed(){const f=document.getElementById('e2feed');if(f)f.innerHTML=''}
  function addFeed(c,h){const e=els();if(!e)return;const d=document.createElement('div');d.className=c||'';
    d.innerHTML=String(h).replace(/ \(\d+\/\d+\/\d+\)/g,'');e.f.appendChild(d);while(e.f.children.length>6)e.f.firstChild.remove();
    setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),420)},FEED_MS)}
  // log: beskeder, der kommer igennem feed-filteret, vises også i overlayet
  {const _lg=log;log=function(c,h){const r=_lg.apply(this,arguments);try{if(M&&!M.quiet&&typeof FEEDOK!=='undefined'&&FEEDOK.test(String(h)))addFeed(c,h)}catch(e){}return r}}
  // ny runde / ny kamp: teksten forsvinder
  {const _sr=startRound;startRound=function(){clearFeed();return _sr.apply(this,arguments)}}
  {const _nm=newMatch;newMatch=function(){clearFeed();return _nm.apply(this,arguments)}}
  // pause: stats som overlay
  let lastKey='';
  function statsHTML(){const pr=(R&&R.e2&&R.e2.P)||[],hp=p=>{const e=pr.find(q=>q.ref===p);return e?Math.max(0,Math.round(e.hp)):(p.alive?100:0)};
    const[a,b]=M.score;let h=`<h4>${M.teams[0].name} ${a} – ${b} ${M.teams[1].name}</h4>`;
    for(const t of M.teams){const col=t.side==='CT'?'#7cc0ff':'#ff6a5c';
      h+=`<table><tr><th class="tn" style="color:${col}">${t.name} · ${t.side}</th><th>K</th><th>D</th><th>A</th><th>HP</th><th>$</th></tr>`;
      for(const p of t.ps.slice().sort((x,y)=>y.k-x.k||x.d-y.d)){const v=hp(p);h+=`<tr class="${v>0?'':'dead'}"><td>${p.name}</td><td>${p.k}</td><td>${p.d}</td><td>${p.a}</td><td>${v}</td><td>${p.money}</td></tr>`}
      h+='</table>'}
    return h}
  setInterval(()=>{const e=els();if(!e)return;const on=typeof paused!=='undefined'&&paused&&M&&!M.quiet&&VIEW==='mv';
    if(!on){if(e.s.style.display!=='none')e.s.style.display='none';lastKey='';return}
    const h=statsHTML();if(h!==lastKey){e.s.innerHTML=h;lastKey=h}if(e.s.style.display!=='block')e.s.style.display='block'},250);
})();

/* ===== TRÅDE: AI-ligakampe i baggrundstråde (13. nov.) =====
 Hver liga spilles i en baggrundstråd fra samme udgangspunkt (spillets tilstand ved dagens start) med sin egen tilfældighed.
 Bagefter flettes resultatet ind i ligaens rækkefølge: holdene, ligaens statistik (gemt pr. liga), nye taktikker (får løbenumre i ligarækkefølge) og tællere.
 Ændrer en kamp noget andet end det, eller går noget galt, spilles dagen i stedet som før i hovedtråden. */
const PAR={max:4,ws:null,bad:false,why:'',id:0};
const parN=()=>Math.max(1,Math.min(PAR.max,(typeof navigator!=='undefined'&&navigator.hardwareConcurrency)||2));// én tråd pr. kerne, højst 4 (hovedtråden laver næsten intet imens)
const parTag=v=>Object.prototype.toString.call(v);
/* trådens kode: spillet selv. I én samlet fil (artefaktet) er det det indlejrede script; i den opdelte version (GitHub) hentes filerne med importScripts i samme rækkefølge */
function parSrc(){const t=[...document.scripts].map(s=>s.textContent).find(x=>x.includes('function simMatch(')&&x.includes('PAR={max'));
 const srcs=[...document.scripts].map(s=>s.src).filter(Boolean);if(!t&&!srcs.length)throw new Error('script ikke fundet');
 return parPrelude()+(t||'importScripts('+srcs.map(u=>JSON.stringify(u)).join(',')+');')}
function parPrelude(){return `self.__CSMW=1;var __rs=12345;Math.random=function(){__rs=(__rs+0x6D2B79F5)|0;let t=__rs;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
(function(){const H={get(t,k){if(k===Symbol.toPrimitive)return h=>h==='number'?0:'';if(k===Symbol.iterator)return function*(){};if(k==='length')return 0;if(k==='then')return undefined;return P},set(){return true},apply(){return P},construct(){return P},has(){return true},deleteProperty(){return true}};const P=new Proxy(function(){},H);
self.document=P;self.window=self;try{self.localStorage={getItem(){return null},setItem(){},removeItem(){},clear(){}}}catch(e){}self.requestAnimationFrame=f=>setTimeout(f,16);self.cancelAnimationFrame=clearTimeout;self.getComputedStyle=()=>P;self.matchMedia=()=>P;self.Image=function(){return P};self.alert=()=>{};self.innerWidth=400;self.innerHeight=800;self.devicePixelRatio=1;self.HTMLElement=self.HTMLElement||function(){};self.Node=self.Node||function(){};if(!self.addEventListener)self.addEventListener=()=>{};})();
`}
/* --- i tråden --- */
function parClean(){const isX=k=>/^x\d+$/.test(k);for(const m in MAPS){const T=MAPS[m]&&MAPS[m].tac;if(T)for(const id in T)if(isX(id))delete T[id]}
 const AL=self.__AISL||{};for(const O of [STYLE,TSITE,CHASE,CHASE_PRE,TXP,AL])for(const k of Object.keys(O))if(O===TXP||O===AL||isX(k))delete O[k];
 for(const k of [...TSTACK])if(isX(k))TSTACK.delete(k);TXFB.clear();TXRC.clear();TXSY.clear();TXLI=null;DKEY=new Map();
 /* motorens sigte-cache husker, hvilken retning et par først blev regnet i, så den nulstilles før hver liga (ellers afhænger resultatet af, hvad tråden spillede før) */
 const MD=self.__M2D||{};for(const id in MD){const mp=MD[id];if(mp&&mp.losK){mp.losK.fill(-1);if(mp.losF){mp.losF.fill(0);mp.losR.fill(0)}}if(mp&&mp.pathCache)mp.pathCache.clear()}}
function parDiff(S,SJ,W,li){const J=JSON.stringify,unk=[],per={},glob={};
 for(const k of new Set([...Object.keys(S),...Object.keys(W)])){if(k==='lg')continue;const a=S[k],b=W[k];if(J(a)===J(b))continue;
  if(k==='txn'){glob.txn=b;continue}if((typeof a==='number'||a==null)&&typeof b==='number'){(glob.num=glob.num||{})[k]=b-(a||0);continue}// tællere (gvV, txSkip …) lægges sammen
  if(k==='tx'){const A=a||{},B=b||{};for(const id in A)if(J(A[id])!==J(B[id]))unk.push('tx.'+id);const nw={};for(const id in B)if(!(id in A))nw[id]=B[id];glob.tx=nw;continue}
  if(b&&parTag(b)==='[object Object]'&&(a==null||parTag(a)==='[object Object]')){const A=a||{};let ok=true;for(const s of new Set([...Object.keys(A),...Object.keys(b)]))if(s!==String(li)&&J(A[s])!==J(b[s])){ok=false;unk.push(k+'.'+s)}
   if(ok){per[k]={v:b[String(li)]};continue}}else unk.push(k)}
 for(let j=0;j<W.lg.length;j++)if(j!==li&&SJ[j]!==J(W.lg[j]))unk.push('lg.'+j);
 if(li===W.me.li&&J(S.lg[li].teams[W.me.ti])!==J(W.lg[li].teams[W.me.ti]))unk.push('mit hold');
 return{lg:W.lg[li],per,glob,unk}}
function parJob(S,SJ,job,r){parClean();WD=structuredClone(S);txRegAll();__rs=job.seed|0;KC=true;CLM=false;
 const li=job.li,g=WD.lg[li],mine=li===WD.me.li,base=WD.txn||0;
 for(const [h,a] of g.fix[r-1]){if(mine&&(h===WD.me.ti||a===WD.me.ti))continue;const s=simMatch([g.teams[h].def,g.teams[a].def],false,lgMap(r));g.res.push({h,a,hs:s[0],as:s[1],rd:r})}
 return Object.assign({li,base},parDiff(S,SJ,WD,li))}
if(self.__CSMW){self.onmessage=e=>{const m=e.data;if(m.t!=='day')return;try{const SJ=m.snap.lg.map(x=>JSON.stringify(x)),out=[];
  for(const j of m.jobs){out.push(parJob(m.snap,SJ,j,m.r));self.postMessage({t:'p',id:m.id})}self.postMessage({t:'ok',id:m.id,out})}
 catch(err){self.postMessage({t:'err',id:m.id,msg:String(err&&err.stack||err)})}};self.postMessage({t:'ready'})}
/* --- i hovedtråden --- */
function parRen(v,map){const f=s=>s.indexOf('x')<0?s:s.split('|').map(p=>map[p]||p).join('|');
 const t=parTag(v);if(typeof v==='string')return f(v);if(t==='[object Array]')return v.map(x=>parRen(x,map));
 if(t==='[object Object]'){const o={};for(const k in v)o[f(k)]=parRen(v[k],map);return o}return v}
function parAsg(d,s){const t=parTag(s);if(d&&s&&typeof d==='object'&&parTag(d)===t&&(t==='[object Object]'||t==='[object Array]')){
  if(t==='[object Array]'){d.length=s.length;for(let i=0;i<s.length;i++)d[i]=parAsg(d[i],s[i])}
  else{for(const k of Object.keys(d))if(!(k in s))delete d[k];const ks=Object.keys(s),kd=Object.keys(d);let same=kd.length<=ks.length;for(let i=0;same&&i<kd.length;i++)same=kd[i]===ks[i];
   /* nøglernes rækkefølge skal være som i tråden: spillet gennemløber nøgler i rækkefølge, og en nøgle, der er slettet og skrevet igen, ligger bagerst */
   if(same)for(const k of ks)d[k]=parAsg(d[k],s[k]);else for(const k of ks){const v=parAsg(d[k],s[k]);delete d[k];d[k]=v}}return d}return s}
const parSig=()=>{const me=WD.lg[WD.me.li]&&WD.lg[WD.me.li].teams[WD.me.ti];return JSON.stringify([WD.lg,WD.txn||0],(k,v)=>v===me?0:v)};
function parMerge(outs,sig){if(sig!==parSig()){PAR.why='spillet blev ændret under simuleringen';return null}const bad=outs.flatMap(o=>o.unk.map(u=>o.li+':'+u));if(bad.length){PAR.why='ukendte ændringer: '+bad.slice(0,6).join(', ');return false}
 outs.sort((a,b)=>a.li-b.li);WD.tx=WD.tx||{};
 for(const o of outs){const map={},n0=o.base,n1=o.glob.txn!=null?o.glob.txn:n0;for(let k=n0+1;k<=n1;k++)map['x'+k]='x'+(++WD.txn);
  const rn=Object.keys(map).length?v=>parRen(v,map):v=>v,ids=[];
  for(const id in (o.glob.tx||{})){const nid=map[id];if(!nid){PAR.why='taktik-id uden nummer';return false}WD.tx[nid]=rn(o.glob.tx[id]);ids.push(nid)}
  ids.forEach(txReg);for(const k in o.glob.num||{})WD[k]=(WD[k]||0)+o.glob.num[k];
  for(const k in o.per){const v=rn(o.per[k].v);if(v===undefined){if(WD[k])delete WD[k][o.li]}else{WD[k]=WD[k]&&typeof WD[k]==='object'?WD[k]:{};WD[k][o.li]=v}}
  const g=WD.lg[o.li],ng=rn(o.lg),me=o.li===WD.me.li?WD.me.ti:-1;
  for(const k of Object.keys(ng))if(k!=='teams')g[k]=parAsg(g[k],ng[k]);
  ng.teams.forEach((t,ti)=>{if(ti!==me)parAsg(g.teams[ti],t)})}
 TXLI=null;DKEY=new Map();return true}
function parInit(cb){if(PAR.ws)return cb(true);let url;try{url=URL.createObjectURL(new Blob([parSrc()],{type:'text/javascript'}))}catch(e){PAR.bad=true;PAR.why='kan ikke lave tråd: '+e.message;return cb(false)}
 const n=parN(),ws=[];let ready=0,end=false;const fin=ok=>{if(end)return;end=true;clearTimeout(to);if(ok)PAR.ws=ws;else{ws.forEach(w=>{try{w.terminate()}catch(e){}});PAR.bad=true}cb(ok)};
 const to=setTimeout(()=>{PAR.why='trådene svarede ikke';fin(false)},60000);
 for(let i=0;i<n;i++){let w;try{w=new Worker(url)}catch(e){PAR.why='Worker: '+e.message;return fin(false)}
  w.onerror=e=>{PAR.why='fejl i tråd: '+(e.message||'ukendt');if(e.preventDefault)e.preventDefault();fin(false)};
  w.onmessage=e=>{if(e.data&&e.data.t==='ready'&&++ready===n)fin(true)};ws.push(w)}}
function parRun(r,show,cb){parInit(ok=>{if(!ok)return cb(null);if(PAR.kill)PAR.kill();const ws=PAR.ws,id=++PAR.id,sig=parSig(),jobs=WD.lg.map((g,li)=>({li,seed:(Math.random()*4294967296)>>>0})),outs=[],st=PAR.cur={done:0,show,n:ws.length};
  let left=ws.length,end=false;PAR.kill=()=>{if(end)return;end=true;clearTimeout(to);cb(null)};// en ny kørsel afløser en gammel (trådene gør den gamle færdig først, men svaret ignoreres)
  const fin=ok=>{if(end)return;end=true;PAR.kill=null;clearTimeout(to);PAR.cur=null;ws.forEach(w=>{w.onmessage=null;w.onerror=null});
   if(!ok){ws.forEach(w=>{try{w.terminate()}catch(e){}});PAR.ws=null;PAR.bad=true;return cb(null)}cb({outs,sig})};
  const to=setTimeout(()=>{PAR.why='tråd-timeout';fin(false)},15*60000);
  ws.forEach((w,i)=>{w.onerror=e=>{PAR.why='fejl i tråd: '+(e.message||'ukendt');if(e.preventDefault)e.preventDefault();fin(false)};
   w.onmessage=e=>{const m=e.data;if(!m||m.id!==id)return;if(m.t==='p'){st.done++;parProg()}
    else if(m.t==='ok'){outs.push(...m.out);if(--left===0)fin(true)}else if(m.t==='err'){PAR.why='fejl i tråd: '+m.msg.split('\n')[0];fin(false)}};
   const part=jobs.filter((j,k)=>k%ws.length===i);try{w.postMessage({t:'day',id,r,snap:WD,jobs:part})}catch(e){PAR.why='kan ikke sende spillet til tråd: '+e.message;fin(false)}})})}
function parProg(){const st=PAR.cur;if(!st||!st.show)return;try{$('nx').textContent=`Simulerer ${st.done}/24 · ${st.n} tråde`}catch(x){}}
function parDay(r,cb){parRun(r,true,res=>{if(!res)return cb(false);const ok2=parMerge(res.outs,res.sig);if(ok2===null){PAR.retry=true;return cb(false)}cb(ok2)})}
/* forudberegning: når en dag er slut (og når spillet indlæses), regner trådene næste ligadags AI-kampe i baggrunden.
 Ved "Næste dag" bruges resultatet, hvis intet i ligaerne er ændret siden (ellers regnes dagen om). Kører den stadig, ventes der på den. */
const parKey=r=>WD?WD.season+'|'+WD.day+'|'+r:'';
function parPre(){try{if(PAR.bad||PAR.cur||BUSY||typeof Worker==='undefined'||!WD||!WD.lg)return;const r=dayRound(WD.day);if(!r||PAR.pf&&PAR.pf.key===parKey(r))return;
 const pf=PAR.pf={key:parKey(r),st:'run',res:null,cbs:[]};parRun(r,false,res=>{pf.st=res?'done':'fail';pf.res=res;const c=pf.cbs;pf.cbs=[];c.forEach(f=>f());if(!c.length)setTimeout(parPre,100)})}catch(e){console.warn('Forudberegning:',e)}}
if(!self.__CSMW){const _sd=simDay;simDay=function(r,cl,done){if(!r||PAR.bad||typeof Worker==='undefined')return _sd(r,cl,done);
 const finish=()=>{KC=!!r;CLM=true;for(const x of cl){if(x.m.res||isMe(x.m.a)||isMe(x.m.b))continue;const s=simMatch([kdef(x.m.a),kdef(x.m.b)],x.m.nd!==false,x.m.map);x.m.res=[s[0],s[1]]}CLM=false;done()};
 const seq=()=>{if(PAR.why)console.warn('Tråde:',PAR.why);return _sd(r,cl,done)};
 const fresh=()=>{if(PAR.bad)return seq();try{$('nx').textContent='Simulerer i tråde…'}catch(x){}
  parDay(r,ok=>{if(!ok){if(PAR.retry)PAR.retry=false;else PAR.bad=true;return seq()}finish()})};
 const pf=PAR.pf;PAR.pf=null;
 if(pf&&pf.key===parKey(r)){const use=()=>{if(pf.st!=='done')return fresh();const ok=parMerge(pf.res.outs,pf.res.sig);
   if(ok===true)return finish();if(ok===false){PAR.bad=true;return seq()}PAR.why='';fresh()};// null: noget er ændret siden forudberegningen -> regn dagen igen
  if(pf.st==='run'){if(PAR.cur){PAR.cur.show=true;parProg()}pf.cbs.push(use)}else use();return}
 fresh()};
 {const _ed=endDay;endDay=function(){const r=_ed.apply(this,arguments);setTimeout(parPre,300);return r}}
 setTimeout(parPre,2500)}
/* status for trådene nederst i menuen, så man kan se, om de bruges, og hvorfor ikke (13. nov.) */
function parStat(){if(typeof Worker==='undefined')return'Tråde: ikke understøttet her';if(PAR.bad)return'Tråde slået fra: '+(PAR.why||'ukendt grund');
 if(PAR.cur)return`Tråde: ${PAR.cur.n} i gang`+(PAR.cur.show?'':' (forudberegner)');if(PAR.ws)return`Tråde: ${PAR.ws.length} klar`+(PAR.pf&&PAR.pf.st==='done'?' · næste dag er regnet':'');return'Tråde: ikke startet endnu'}
if(!self.__CSMW){setInterval(()=>{try{const n=$('nav');if(!n)return;let e=$('parst');if(!e){n.insertAdjacentHTML('beforeend','<div id="parst" style="font-size:10px;color:var(--mu);padding:6px 2px;text-align:center;line-height:1.25;overflow-wrap:anywhere"></div>');e=$('parst')}const t=parStat();if(e.textContent!==t)e.textContent=t}catch(x){}},1000)}
