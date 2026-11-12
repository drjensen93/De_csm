/* ===== INDBAKKE ===== */
// Samler alle notifikationer ét sted og erstatter de orange menuknapper og "Nyheder" i Transfer.
// Besked: c = kategori · t = tekst · s/d = sæson og dag (0-baseret, vises som dag d+1/NDAYS) · u = ulæst
// Beskeder fra "Næste dag" stemples med den dag, man lander på, når dagen er færdigsimuleret.
const IB={max:150,cats:['Transfer','Træning','Tryout','Hold','Sponsor']};
let IBPEND=null;
const IBD=()=>{if(!WD)return null;const b=WD.ib||(WD.ib={list:[],nr:{},lc:{},tp:{},f:'all'});b.nr=b.nr||{};b.lc=b.lc||{};b.tp=b.tp||{};b.mx=b.mx||{};b.list=b.list||[];return b};
function ibAdd(c,t){const B=IBD();if(!B)return;const e={c,t,u:1,s:WD.season,d:WD.day};if(IBPEND)IBPEND.push(e);B.list.unshift(e);if(B.list.length>IB.max)B.list.length=IB.max}
const ibMy=()=>(typeof TEAMS!=='undefined'&&TEAMS[0]&&TEAMS[0].pl)?TEAMS[0]:null;
const ibLcSk=(c,p,a)=>c.k.map(k=>`${SK[k]} ${fl(a[c.k.indexOf(k)])} → ${fl(p[SI[k]])}`).join(', ');

// Transfer: alle eksisterende transferbeskeder (bud, overbudt, solgt, ikke solgt, købt, bortfaldne bud)
{const _n=news;news=function(txt,al){const r=_n(txt,al);if(!KICKMSG.test(txt))ibAdd('Transfer',txt);return r}}

// Træning: én besked pr. spiller, der maxer en eller flere skills i dag
{const _dt=dailyTick;dailyTick=function(){const d=ibMy();
 const pre=d?d.pl.map(p=>[p,[...Array(NSK).keys()].filter(k=>p[SI[k]]<p[14][k]-1e-9)]):[];
 const r=_dt.apply(this,arguments);
 const B=IBD();
 // hver skill meldes kun én gang pr. spiller, så aldringstab, der trænes op igen, ikke giver en ny besked hver dag
 pre.forEach(([p,open])=>{if(!d.pl.includes(p))return;const done=B.mx[p[0]]||[],mx=open.filter(k=>p[SI[k]]>=p[14][k]-1e-9&&!done.includes(k));if(!mx.length)return;B.mx[p[0]]=done.concat(mx);
  const st=mx.includes(p[20])?` Han står stadig i ${SK[p[20]]}-rummet og får ikke mere ud af det.`:'';
  ibAdd('Træning',`<b>${p[0]}</b> har maxet ${mx.map(k=>`${SK[k]} (${fl(p[14][k])})`).join(', ')}.${st}`)});
 return r}}

// Træning: lancamp starter
{const _lb=lcBegin;lcBegin=function(d,p){const r=_lb(d,p);const my=ibMy();if(my&&d===my&&p[32]){const c=p[32],B=IBD(),w=Math.max(1,Math.round(c.left/7));
 B.lc[p[0]]={k:c.k.slice(),a:c.k.map(k=>p[SI[k]])};
 ibAdd('Træning',`<b>${p[0]}</b> starter på lancamp i ${w} uge${w===1?'':'r'}: ${c.k.map(k=>SK[k]).join(', ')}.`)}return r}}

// Træning: lancamp slutter (normalt eller før tid, fordi skills er maxet)
{const _lt=lcTrain;lcTrain=function(){const d=ibMy();const on=d?d.pl.filter(lcOn).map(p=>[p,p[32],p[32].left]):[];
 const r=_lt.apply(this,arguments);const B=IBD();
 on.forEach(([p,c,left])=>{if(p[32])return;const s=B&&B.lc[p[0]],gain=s?': '+ibLcSk(s,p,s.a):'';if(B)delete B.lc[p[0]];
  const early=left>1&&c.k.every(k=>lcMax(p,k));
  ibAdd('Træning',early?`<b>${p[0]}</b> har maxet alle sine lancamp-skills og stopper ${left-1} dag${left-1===1?'':'e'} før tid${gain}.`:`<b>${p[0]}</b> er færdig med lancamp${gain}.`)});
 return r}}

// Træning: spillere uden træningsrum (kun første dag) · Tryout: advarsel dagen før en ventende tryout udløber
function ibRooms(){const B=IBD(),d=ibMy();if(!B||!d)return;const seen={};
 d.pl.forEach(p=>{const n=p[0];seen[n]=1;const free=p[20]<0&&!lcOn(p);
  if(free&&!B.nr[n]){B.nr[n]=1;const ag=agingP(p,p[9])>0?' Han ældes og kan ikke hente tabte skillpoints igen uden træning.':'';ibAdd('Træning',`<b>${n}</b> er ikke tilknyttet et træningsrum.${ag}`)}
  else if(!free)delete B.nr[n]});
 Object.keys(B.nr).forEach(n=>{if(!seen[n])delete B.nr[n]});Object.keys(B.mx).forEach(n=>{if(!seen[n])delete B.mx[n]})}
function ibTryWarn(){const d=ibMy(),sc=d&&d.scout;if(!WD.offer||!sc)return;if(scoutDays(sc).includes(WD.day+1))ibAdd('Tryout',`Tag stilling til <b>${WD.offer[0]}</b> i dag. I morgen finder scouten en ny spiller, og så udløber tryouten.`)}

// Tryout: ny tryout, og en ventende tryout, der bliver erstattet
{const _sd=scoutDay;scoutDay=function(){const old=WD.offer;const r=_sd.apply(this,arguments);const p=WD.offer;
 if(p&&p!==old){if(old)ibAdd('Tryout',`Tryouten med <b>${old[0]}</b> er udløbet, fordi scouten har fundet en ny spiller.`);
  ibAdd('Tryout',`Ny tryout: ${flag(FLAGC[p[11]])} <b>${p[0]}</b> (${p[9]} år) er klar til prøvetræning.`)}
 return r}}

// Hold: pension og ungdomsspillere ved sæsonslut
{const _se=seasonEnd;seasonEnd=function(){const d=ibMy(),pre=d?d.pl.slice():[];const r=_se.apply(this,arguments);const d2=ibMy();
 if(d2){pre.filter(p=>!d2.pl.includes(p)).forEach(p=>ibAdd('Hold',`<b>${p[0]}</b> (${p[9]} år) er gået på pension.`));
  d2.pl.filter(p=>!pre.includes(p)).forEach(p=>ibAdd('Hold',`<b>${p[0]}</b> (${p[9]} år) er hentet op som ung spiller, så holdet har 5 spillere.`))}
 return r}}

// løbende tjek: afbrudt lancamp (holdet under 5 spillere) og spillere, der er fri af transferstraffen
function ibCheck(){const B=IBD(),d=ibMy();if(!B||!d)return;const has=n=>d.pl.find(p=>p[0]===n);
 Object.keys(B.lc).forEach(n=>{const p=has(n);if(!p){delete B.lc[n];return}if(lcOn(p))return;const s=B.lc[n];delete B.lc[n];
  ibAdd('Træning',`Lancampen for <b>${n}</b> er afbrudt, fordi holdet ellers ikke har 5 spillere, der kan spille. Brugte dage tæller stadig${s?': '+ibLcSk(s,p,s.a):''}.`)});
 d.pl.forEach(p=>{if(p[31]>0)B.tp[p[0]]=1;else if(B.tp[p[0]]){delete B.tp[p[0]];ibAdd('Hold',`<b>${p[0]}</b> har spillet sine ${TPEN.n} kampe og er fri af transferstraffen.`)}});
 Object.keys(B.tp).forEach(n=>{if(!has(n))delete B.tp[n]})}

// dagen: beskeder samles og stemples med den nye dag
{const _ed=endDay;endDay=function(){const own=!IBPEND;if(own)IBPEND=[];
 try{return _ed.apply(this,arguments)}
 finally{if(own){try{if(!WD.over){ibRooms();ibTryWarn()}ibCheck()}catch(e){console.error(e)}
  const P=IBPEND,B=IBD();IBPEND=null;P.forEach(e=>{e.s=WD.season;e.d=WD.day});
  // dagens beskeder står i den rækkefølge, de skete, øverst i listen
  if(B&&P.length){const set=new Set(P);B.list=P.filter(e=>B.list.includes(e)).concat(B.list.filter(e=>!set.has(e)))}renderNav();if(VIEW==='ib')renderInbox();try{saveGame()}catch(e){}}}}}

/* UI */
VT.ib='Indbakke';
document.head.insertAdjacentHTML('beforeend',`<style>
.ibr{display:grid;grid-template-columns:minmax(0,1fr) 12px;gap:6px;align-items:center;padding:7px 0;border-top:1px solid var(--bd);cursor:pointer}
.ibl .ibr:first-of-type{border-top:0}.ibr .ibg{color:var(--mu);font-size:16px;text-align:right}
.ibh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:2px}.ibh b{font-size:13px}
.ibt{font-size:12.5px;line-height:1.35;overflow-wrap:anywhere}
.ibu{background:#fff4e8;margin:0 -10px;padding:7px 10px}
.nav .ibn{display:block;font-size:11px;font-weight:700;margin-top:2px}
</style>`);
$('xf').insertAdjacentHTML('afterend','<div id="ib" style="display:none"></div>');
{const _sh=show;show=function(v){_sh(v);$('ib').style.display=v==='ib'?'':'none'}}
const IBV={Transfer:()=>showTransfer(),Træning:()=>showTrain(),Tryout:()=>showTryout(),Hold:()=>showOverview(),Sponsor:()=>showSponsor()};
function showInbox(){show('ib');renderInbox();renderNav()}
function renderInbox(){const B=IBD();if(!B)return;const L=B.list,present=IB.cats.filter(c=>L.some(e=>e.c===c));
 if(B.f!=='all'&&!present.includes(B.f))B.f='all';const f=B.f,seg=(v,l)=>`<button class="${f===v?'on':''}" data-ibf="${v}">${l}</button>`;
 const ur=L.filter(e=>e.u).length,rows=L.filter(e=>f==='all'||e.c===f);
 let h=`<div class="hd"><b>Indbakke</b><span class="mu">${ur?ur+' ulæst'+(ur===1?'':'e')+' · ':''}${L.length} besked${L.length===1?'':'er'}</span></div>`;
 if(present.length>1)h+=`<div class="bar sm">${seg('all','Alle')}${present.map(c=>seg(c,c)).join('')}</div>`;
 h+=rows.length?`<div class="tm ibl">${rows.map(e=>`<div class="ibr${e.u?' ibu':''}" data-ibc="${e.c}"><div><div class="ibh"><b>${e.c}</b><span class="mu">Sæson ${e.s} · Dag ${e.d+1}/${NDAYS}</span></div><div class="ibt">${e.t}</div></div><div class="ibg">›</div></div>`).join('')}</div>`
  :`<div class="tm"><div class="mu" style="padding:4px 0">Ingen beskeder endnu. De kommer her, når du spiller videre.</div></div>`;
 $('ib').innerHTML=h;L.forEach(e=>e.u=0)}
$('ib').addEventListener('click',e=>{const B=IBD();if(!B)return;const f=e.target.closest('[data-ibf]');if(f){B.f=f.dataset.ibf;renderInbox();return}
 const r=e.target.closest('[data-ibc]');if(r&&IBV[r.dataset.ibc])IBV[r.dataset.ibc]()});
{const _nc=$('nav').onclick;$('nav').onclick=e=>{const b=e.target.closest('[data-v]');if(b&&b.dataset.v==='ib')return showInbox();_nc(e)}}
// menuen: de gamle orange markeringer fjernes, Indbakke øverst med antal ulæste
{const _rn=renderNav;renderNav=function(){_rn();if(!WD)return;try{ibCheck()}catch(e){console.error(e)}
 const n=$('nav');n.querySelectorAll('.alert').forEach(b=>b.classList.remove('alert'));
 const u=(IBD()||{list:[]}).list.filter(e=>e.u).length;
 n.insertAdjacentHTML('afterbegin',`<button class="${VIEW==='ib'?'on':''}${u&&VIEW!=='ib'?' alert':''}" data-v="ib">Indbakke${u?`<span class="ibn">${u>99?'99+':u}</span>`:''}</button>`)}}
// Transfer: "Nyheder"-boksen er erstattet af indbakken
{const _rt=renderTransfer;renderTransfer=function(){_rt();[...$('xf').querySelectorAll('.tm > h3')].filter(h=>h.textContent==='Nyheder').forEach(h=>h.parentElement.remove())}}
// FAQ
{const _rfI=renderFaq;renderFaq=function(){_rfI();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Indbakke</h3>${li(['Alle beskeder samles i Indbakke øverst i menuen. Tallet viser ulæste beskeder. Tryk på en besked for at gå til den fane, den handler om.',
  '<b>Transfer:</b> nye bud på dine spillere, salg, usolgte spillere, når du er overbudt, køb og bud, der bortfalder.',
  '<b>Træning:</b> skills, der er maxet (én besked pr. spiller), spillere uden træningsrum (kun første dag) samt start, slut og afbrydelse af lancamp.',
  '<b>Tryout:</b> nye tryouts, en advarsel dagen før en ventende tryout udløber, og når den udløber.',
  `<b>Hold:</b> pension, unge spillere, der hentes op, og spillere, der er fri af transferstraffen. Indbakken gemmer de seneste ${IB.max} beskeder.`])}</div>`)}}


/* ===== FASE 32: SPILLERMODEL – aldring, AI-aldersplanlægning, ungdomsplads, managerstrategier, agentniveau og transfermarked ===== */
// Aldring pr. dag: 30–33: 0,56 · 34–35: 1,11 · 36–37: 2,2 · 38–39: 3,3 · 40+: 4,4
const AG2=a=>a<30?0:a<34?.56:a<36?1.11:a<38?2.2:a<40?3.3:4.4;
agingP=function(p,a){const s=p&&p[23];if(s==='young')return a<33?0:AG2(a);if(s==='worn'&&a>=27&&a<30)return .56;return AG2(a)};
// AI-aldersplanlægning
// hor = sæsoner managerens planlægning ser frem (god / middel / dårlig holdstyring) · old = alderen, hvor en startspiller regnes for udløbet
// trig = antal startspillere, der rammer old inden for horisonten, før holdet går i generationsskifte
// want = købelyst-faktor for 19–26-årige under generationsskifte · prot = unge (op til denne alder) beskyttes mod kick/udskiftning under generationsskifte
// clu = maks. spillere i samme 3-årige aldersbånd, før et køb trækkes ned (×cluP) · gap = bonus for at fylde et tomt aldersbånd
// sellAge = alder, hvor gode managere sælger en startspiller under generationsskifte, hvis en bænkspiller er mindst repl × så nyttig
// tryM = en tryout skal være så meget bedre end den svageste ubeskyttede bænkspiller · cuts = prisniveauer ved salg af en ældre startspiller
// oldH = alder, fra hvilken gode managere regner én ekstra sæsons aldring med · oldBuy/oldW = købelyst-faktor for spillere ≥ oldBuy under generationsskifte
const APL={hor:[3,1,0],old:36,trig:2,want:1.25,wantLo:19,wantHi:26,prot:24,clu:3,cluP:.75,gap:1.1,sellAge:32,repl:.9,tryM:1.15,cuts:[1,.8,.65],oldH:30,oldBuy:32,oldW:.6};
const aHor=d=>{const q=mq(d);return q>=QG.good?APL.hor[0]:q>=QG.mid?APL.hor[1]:APL.hor[2]};
// managerstrategi: C = løbende udskifter, D = dynastibygger (genopbygger, når holdet falder)
// pC = chance for C ved økonomi 0,4 → 1 (lineært) · cOld = alder, en C-manager regner som "udløbet" · dRef = sæsoner bagud for dynastiets referenceplacering
// dDrop = placeringer under referencen, før et dynasti opdager faldet (god / middel / dårlig holdstyring) · dAge = gode dynastimanagere opdager også faldet, når ≥ 2 startere er ≥ denne alder
// rbEnd = genopbygningen slutter, når startfemmerens snitalder er ≤ dette, eller holdet er tilbage på referenceplaceringen
// rbSell/rbRepl = under genopbygning sælges startere fra denne alder, hvis en bænkspiller er mindst repl × så nyttig
const STR={pC:[.2,.8],cOld:33,dRef:4,dDrop:[2,3,5],dAge:34,rbEnd:28,rbSell:29,rbRepl:.8};
const strat=d=>d.st||(d.st=hs('strat'+d.name)<STR.pC[0]+(STR.pC[1]-STR.pC[0])*cl((ecq(d)-.4)/.6,0,1)?'C':'D');
const posOf=d=>{const k=keyD(d);if(!k||!WD.prev||!WD.prev[k.li])return 1;return WD.prev[k.li].indexOf(k.ti)+1};
function stUpd(d){
 if(d.stS===WD.season)return d;d.stS=WD.season;
 const pos=posOf(d);d.ph=(d.ph||[]).concat([pos]).slice(-STR.dRef);const ref=Math.min(...d.ph);d.ref=ref;
 const st=d.pl.filter(p=>p[15]>=0),avg=st.reduce((a,p)=>a+p[9],0)/Math.max(1,st.length),q=mq(d);
 if(!d.rb){const drop=q>=QG.good?STR.dDrop[0]:q>=QG.mid?STR.dDrop[1]:STR.dDrop[2];
  if(pos-ref>=drop||(q>=QG.good&&st.filter(p=>p[9]>=STR.dAge).length>=2)){d.rb=1;d.rbN=(d.rbN||0)+1}}
 else if(avg<=STR.rbEnd||(pos<=ref&&d.ph.length>=2&&pos<d.ph[d.ph.length-2]))d.rb=0;
 return d}
// generationsskifte: dynastier under genopbygning · løbende udskiftere, når en starter rammer cOld inden for horisonten
function genShift(d){if(strat(d)==='D')return !!stUpd(d).rb;const H=aHor(d);return d.pl.filter(p=>p[15]>=0&&p[9]+H>=STR.cOld).length>=1}
// løbende udskiftere sælger kun en ældre startspiller, når bænkspilleren næsten er lige så god: 85 % ved holdstyring 0,8 → 95 % ved 1,0
const replOf=d=>strat(d)==='C'?.85+.1*cl((mq(d)-QG.good)/(1-QG.good),0,1):APL.repl;
const youthTop=d=>d.pl.filter(p=>p[9]<=DEV.age).sort((a,b)=>mVal(d,b)-mVal(d,a)).slice(0,yT(d));
const protY=(d,p)=>p[15]<0&&((genShift(d)&&p[9]<=APL.prot)||youthTop(d).includes(p));
const plan=d=>5+yT(d)+(genShift(d)?1:0);
function ageFit(d,p){
 if(mq(d)<QG.mid)return 1;
 const ages=d.pl.map(x=>x[9]);if(ages.length>=TRF.maxSq){const w=d.pl.slice().sort((a,b)=>mVal(d,a)-mVal(d,b))[0];ages.splice(d.pl.indexOf(w),1)}
 ages.push(p[9]);let f=1;
 const a=p[9],inBand=ages.filter(x=>Math.abs(x-a)<=1).length;
 if(inBand>APL.clu)f*=APL.cluP;else if(inBand===1)f*=APL.gap;
 if(genShift(d)&&a>=APL.wantLo&&a<=APL.wantHi)f*=APL.want;
 if(genShift(d)&&a>=APL.oldBuy)f*=APL.oldW;
 return f}
// gode managere regner én ekstra sæsons aldring med for spillere fra oldH år
{const _mv=mVal;mVal=function(d,p){const x=_mv(d,p);if(mq(d)<QG.good||p[9]<APL.oldH)return x;
 const w=wts(d),wm=w.reduce((a,b)=>a+b,0)/NSK;return x-.65*agingP(p,p[9]+1)*49*wm}}
// bud: aldersfaktor på købelysten · under generationsskifte køber holdet også 19–26-årige, der ikke straks forbedrer startfemmeren
{const _bp=aiBidPass;aiBidPass=function(){
 const M0=mVal;mVal=(d,p)=>d.pl.includes(p)?M0(d,p):M0(d,p)*ageFit(d,p);
 try{_bp()}finally{mVal=M0}
 const T=TMD();if(!T.list.length)return;
 for(const {d,k} of shuffle(AIL)){if(!genShift(d)||leads(k).length||mq(d)<QG.mid)continue;
  const rf=richF(d),cap=cash(d)*.8;if(cap<TRF.minInc||ysN(d.pl)-nListed(k)>=TRF.maxSq)continue;
  const worst=Math.min(...d.pl.map(p=>mVal(d,p)));
  let best=null;
  for(const l of T.list){if(sameK(l.s,k)||!mkVis(d,k,l))continue;const p=plOf(l);if(!p||p[9]<APL.wantLo||p[9]>APL.wantHi)continue;
   const need=nextMin(l);if(need>cap)continue;const mv=mVal(d,p);if(mv<=worst)continue;
   const rm=aiRoom(d,k,wageOf(p));if(need>rm)continue;
   const ref=est(d,p)*.9*ageFit(d,p);
   const maxW=Math.min(cap,rm,ref*(1+TRF.rich.pay*rf));if(need>maxW)continue;
   const sc=mv/need;if(!best||sc>best.sc)best={l,need,sc}}
  if(best)placeBid(best.l,k,best.need)}}}
// kick: startspillere og beskyttede unge kickes aldrig
{const _k=aiKick;aiKick=function(d,k,p,why){if(p[15]>=0||protY(d,p))return false;return _k(d,k,p,why)}}
// salg af ældre startspiller: prøv faldende priser, list kun hvis salgschancen holder – ellers beholdes han
{const _s=aiSell;aiSell=function(){_s();const T=TMD();
 for(const {d,k} of AIL){if(mq(d)<QG.good||!genShift(d)||nListed(k)>=1||d.pl.length<=5)continue;
  if(hs('g'+T.t+d.name)>=TRF.sellP)continue;
  const bench=d.pl.filter(p=>p[15]<0);if(!bench.length)continue;const bb=Math.max(...bench.map(p=>mVal(d,p)));
  const old=d.pl.filter(p=>p[15]>=0&&p[9]>=APL.sellAge&&!lsOf(p[0])&&bb>=replOf(d)*mVal(d,p)).sort((a,b)=>b[9]-a[9])[0];
  if(!old)continue;const e=est(d,old);
  for(const f of APL.cuts){const pr=nice(e*f)||TRF.minInc;if(saleChance(d,k,old,pr)>=SELL.min){LP0(k,old,pr);break}}}
 // dynastier under genopbygning: sælg ældre startere tidligere og billigere (dårlige managere vælger tilfældigt)
 for(const {d,k} of AIL){if(strat(d)!=='D'||!stUpd(d).rb||nListed(k)>=1||d.pl.length<=5)continue;
  if(hs('rb'+T.t+d.name)>=TRF.sellP)continue;
  const bench=d.pl.filter(p=>p[15]<0);if(!bench.length)continue;const bb=Math.max(...bench.map(p=>mVal(d,p)));
  const c=d.pl.filter(p=>p[15]>=0&&p[9]>=STR.rbSell&&!lsOf(p[0])&&bb>=STR.rbRepl*mVal(d,p));
  if(!c.length)continue;const old=mq(d)>=QG.mid?c.sort((a,b)=>b[9]-a[9])[0]:pk(c);const e=est(d,old);
  for(const f of APL.cuts){const pr=nice(e*f)||TRF.minInc;if(saleChance(d,k,old,pr)>=SELL.min){LP0(k,old,pr);break}}}}}

// Ungdomsplads (AI-hold): én ekstra plads til en egen tryout under 21 år. Halv løn, tæller ikke med i lønnormeringen.
// Varsel en uge før spilleren fylder 21; på fødselsdagen skal truppen være nede på 7 almindelige spillere.
// swap = en ny tryout overtager kun pladsen med mindst så meget højere limitsum. p[34] = egen tryout (hjemmeavlet), p[35] = har ungdomspladsen, p[36] = varslet i sæson
const YS={age:21,wage:.5,warn:7,swap:50};
let YSX=0;
function ysEl(p){return !!p&&p[34]===1&&p[9]<YS.age}
function ysN(arr){return arr.length-(arr.some(ysEl)?1:0)}
function ysFull(d,add){return ysN(add?d.pl.concat([add]):d.pl)>TRF.maxSq}
function ysCut(d,q,add){const a=add?d.pl.concat([add]):d.pl;return ysN(a.filter(x=>x!==q))<ysN(a)}
function ysUpd(d){const el=d.pl.filter(ysEl);let h=el.find(p=>p[35]);
 if(!h)h=el.sort((a,b)=>lsum(b)-lsum(a))[0];d.pl.forEach(p=>{if(p!==h)p[35]=0});if(h)h[35]=1}
{const _wo=wageOf;wageOf=function(p){const w=_wo(p);if(p&&p[35]&&ysEl(p))return YSX?0:Math.round(w*YS.wage);return w}}
{const _sw=setWages;setWages=function(){YSX=1;try{return _sw.apply(this,arguments)}finally{YSX=0}}}
function ysDrop(d){const hold=d.pl.find(p=>p[35]&&ysEl(p));
 const c=d.pl.filter(p=>p[15]<0&&p!==hold).sort((a,b)=>(lsOf(a[0])?1:0)-(lsOf(b[0])?1:0)||mVal(d,a)-mVal(d,b))[0];
 if(!c)return false;d.pl.splice(d.pl.indexOf(c),1);fixTeam(d);aiLineup(d);return true}
function ysDay(day){aiList();
 for(const {d,k} of AIL){ysUpd(d);
  let g=0;while(ysN(d.pl)>TRF.maxSq&&g++<3){if(!ysDrop(d))break;ysUpd(d)}
  const h=d.pl.find(p=>p[35]);if(!h||h[9]!==YS.age-1)continue;
  const dd=(h[18]-day+NDAYS)%NDAYS;if(dd<1||dd>YS.warn||h[36]===WD.season)continue;
  h[36]=WD.season;const rest=d.pl.filter(p=>p!==h),after=rest.length+1-(rest.some(ysEl)?1:0);
  if(after<=TRF.maxSq)continue;
  const nh=rest.filter(ysEl).sort((a,b)=>(b[28]||0)-(a[28]||0))[0];
  const c=d.pl.filter(p=>p[15]<0&&p!==nh&&!lsOf(p[0])).sort((a,b)=>mVal(d,a)-mVal(d,b))[0];
  if(c&&!(nListed(k)>=2))listP(k,c,nice(est(d,c)*.9)||TRF.minInc)}}
// dit hold: tag en tryout på holdet. Har en anden egen tryout pladsen, overtager den nye kun pladsen med mindst YS.swap højere limitsum
function ysTake(d,n){const h=d.pl.find(p=>p[35]&&ysEl(p))||null;
 if(ysEl(n)&&h&&lsum(n)>=lsum(h)+YS.swap){h[35]=0;n[35]=1}
 d.pl.push(n);ysUpd(d)}
const ysMsg=t=>{if(typeof ibAdd==='function')ibAdd('Hold',t);else news(t,true)};
const ysWorst=(d,h)=>d.pl.filter(p=>p[15]<0&&p!==h).sort((a,b)=>(lsOf(a[0])?1:0)-(lsOf(b[0])?1:0)||pVal2(a)-pVal2(b))[0];
function ysMine(day){const d=TEAMS[0];if(!d||!d.pl)return;ysUpd(d);
 let g=0;while(ysN(d.pl)>TRF.maxSq&&g++<3){const hold=d.pl.find(p=>p[35]&&ysEl(p)),c=ysWorst(d,hold);if(!c)break;
  d.pl.splice(d.pl.indexOf(c),1);fixTeam(d);ysUpd(d);
  ysMsg(`<b>${c[0]}</b> er sat fri, fordi truppen havde ${ysN(d.pl)+1} almindelige spillere, efter at ungdomspladsens spiller fyldte ${YS.age}. Der må højst være ${TRF.maxSq}.`)}
 const h=d.pl.find(p=>p[35]);if(!h||h[9]!==YS.age-1)return;
 const dd=(h[18]-day+NDAYS)%NDAYS;if(dd<1||dd>YS.warn||h[36]===WD.season)return;
 h[36]=WD.season;const rest=d.pl.filter(p=>p!==h),after=rest.length+1-(rest.some(ysEl)?1:0);
 if(after<=TRF.maxSq){ysMsg(`<b>${h[0]}</b> fylder ${YS.age} om ${dd} dag${dd===1?'':'e'} og mister ungdomspladsen. Han bliver en almindelig spiller med fuld løn (${kr(Math.round(wageOf(h)/YS.wage))} pr. sæson). Der er plads til ham i truppen.`);return}
 const nh=rest.filter(ysEl).sort((a,b)=>lsum(b)-lsum(a))[0],c=ysWorst(d,nh);
 ysMsg(`<b>${h[0]}</b> fylder ${YS.age} om ${dd} dag${dd===1?'':'e'} og mister ungdomspladsen. Så har holdet ${after} almindelige spillere, men der må højst være ${TRF.maxSq}. Sælg eller kick en spiller inden${c?`, ellers bliver <b>${c[0]}</b> (den mindst værdifulde bænkspiller) sat fri på fødselsdagen`:''}.`)}
{const _b=birthdays;birthdays=function(day){const r=_b.apply(this,arguments);ysDay(day);ysMine(day);return r}}
// tryout: ungdomspladsen først, ellers efter holdets plan, ellers kun hvis klart bedre end den svageste ubeskyttede bænkspiller
aiTryout=function(d,n){const k=keyD(d);if(!k)return;
 const h=d.pl.find(p=>p[35]&&ysEl(p))||null;
 if(ysEl(n)&&!h){if(aiRoom(d,k,Math.round(wageOf(n)*YS.wage))>=0){d.pl.push(n);ysUpd(d)}return}
 if(ysEl(n)&&h&&lsum(n)>=lsum(h)+YS.swap){
  const room=d.pl.length<=Math.min(TRF.maxSq,plan(d))||(h[15]>=0&&d.pl.length<=TRF.maxSq);
  const take=()=>{h[35]=0;d.pl.push(n);n[35]=1;ysUpd(d)};
  if(room){if(aiRoom(d,k,Math.round(wageOf(n)*YS.wage)+Math.round(wageOf(h)*(1-YS.wage)))>=0)take();return}
  if(h[15]>=0)return;
  d.pl.splice(d.pl.indexOf(h),1);take();fixTeam(d);return}
 if(ysN(d.pl.concat([n]))<=Math.min(TRF.maxSq,plan(d))){if(aiRoom(d,k,wageOf(n))>=0){d.pl.push(n);ysUpd(d)}return}
 const w=wts(d),pool=d.pl.filter(p=>p[15]<0&&!protY(d,p)&&p!==h);if(!pool.length)return;
 const v=new Map(pool.map(p=>[p,aiVal(d,p,w)])),worst=pool.slice().sort((a,b)=>v.get(a)-v.get(b))[0];
 if(aiVal(d,n,w)>v.get(worst)*APL.tryM&&aiRoom(d,k,wageOf(n)-wageOf(worst))>=0){d.pl.splice(d.pl.indexOf(worst),1);d.pl.push(n);fixTeam(d);ysUpd(d)}};
// egne tryouts markeres som hjemmeavlede · købte spillere mister markeringen
{const _mt=mkTry;mkTry=function(){const p=_mt.apply(this,arguments);p[34]=1;p[35]=0;return p}}
{const _dt=doTransfer;doTransfer=function(l,p,b){const r=_dt(l,p,b);if(r!==false){p[34]=0;p[35]=0;[kdef(l.s),kdef(b.k)].forEach(d=>d&&ysUpd(d))}return r}}
{const _at=agTransfer;agTransfer=function(l,p,b){const r=_at(l,p,b);const d=kdef(b.k);if(d)ysUpd(d);return r}}

// Agentniveau: bred spredning – ikke alle agentspillere er gode nok til at blive købt.
// 24+ år: skillsum = medianen for AI-startere på 26–31 år × 0,7–1,05. 19–23 år: medianen for startere på samme alder (±1) × 0,8–1,05. Under 19: som før.
const AGR={from:19,prime:[26,31],pf:[.7,1.05],yf:[.8,1.05],primeFrom:24,minN:8};
let AGC={k:'',m:null};
function agMed(){const key=WD.season+'|'+WD.day;if(AGC.k===key)return AGC.m;const by={};
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{if(isMe({li,ti}))return;t.def.pl.forEach(p=>{if(p[15]>=0)(by[p[9]]=by[p[9]]||[]).push(SI.reduce((a,i)=>a+p[i],0))})}));
 AGC={k:key,m:by};return by}
function agMedR(a0,a1){const by=agMed(),v=[];for(let a=a0;a<=a1;a++)if(by[a])v.push(...by[a]);if(v.length<AGR.minN)return null;v.sort((x,y)=>x-y);return v[v.length>>1]}
function agTarget(age){if(age>=AGR.primeFrom){const m=agMedR(AGR.prime[0],AGR.prime[1]);return m&&m*(AGR.pf[0]+rnd()*(AGR.pf[1]-AGR.pf[0]))}
 for(let b=1;b<=6;b++){const m=agMedR(age-b,age+b);if(m)return m*(AGR.yf[0]+rnd()*(AGR.yf[1]-AGR.yf[0]))}return null}
{const _ma=mkAgent;mkAgent=function(){const p=_ma.apply(this,arguments);p[34]=0;p[35]=0;if(p[9]<AGR.from)return p;
 const T=agTarget(p[9]);if(!T)return p;const s0=SI.reduce((a,i)=>a+p[i],0);if(s0<=0)return p;
 const f=T/s0;
 SI.forEach((si,k)=>{const v=Math.min(100,Math.round(p[si]*f*10)/10);p[si]=v;if(p[14][k]<v)p[14][k]=Math.min(100,Math.ceil(v))});
 return p}}

// Transfermarked: alle AI-hold ser lige store, men forskellige dele af spillerne til salg uden for egen liga (TRF.scan pr. dag).
// De bedste spillere (skillsum mindst som de 20 % bedste AI-startere) ser alle hold.
const MKV={starPct:.8};
let MKC={k:'',v:Infinity};
function mkStarLim(){const key=WD.season+'|'+WD.day;if(MKC.k===key)return MKC.v;const v=[];
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{if(isMe({li,ti}))return;t.def.pl.forEach(p=>{if(p[15]>=0)v.push(SI.reduce((a,i)=>a+p[i],0))})}));
 v.sort((a,b)=>a-b);MKC={k:key,v:v.length?v[Math.floor(MKV.starPct*(v.length-1))]:Infinity};return MKC.v}
function mkStar(l){const p=plOf(l);return !!p&&SI.reduce((a,i)=>a+p[i],0)>=mkStarLim()}
function mkVis(d,k,l){return l.s.li===k.li||mkStar(l)||hs('s'+TMD().t+d.name+l.id)<TRF.scan}
// Forlængelse: kommer der et nyt højeste bud på sidste dag, forlænges auktionen en dag – og igen, indtil en dag går uden nyt bud.
const MKX={max:30};
const mkSnap=l=>{const t=topB(l);return t?t.a+'|'+t.k.li+'-'+t.k.ti:''};
{const _md=mktDay;mktDay=function(){_md();TMD().list.forEach(l=>{l.sn=mkSnap(l)})}}
{const _r=resolve;resolve=function(l){const T=TMD();
 if(l.sn!==undefined&&mkSnap(l)!==l.sn&&(l.ext||0)<MKX.max){l.ext=(l.ext||0)+1;l.left=1;T.list.push(l);
  const t=topB(l),me=isMe(l.s)||l.b.some(b=>isMe(b.k));
  if(me)news(`Auktionen om ${l.n} er forlænget en dag, fordi der kom et nyt højeste bud på sidste dag (${kr(t.a)} fra ${knm(t.k)}).`,true);
  return}
 return _r(l)}}

// Hold-fanen: IGL øverst, så de øvrige startere (i rolle-rækkefølge), så bænken
{const _a=aiLineup;aiLineup=function(d){const r=_a.apply(this,arguments);posFix(d);return r}}
{const _f=fixTeam;fixTeam=function(d){const r=_f.apply(this,arguments);posFix(d);return r}}
function plOrder(d){if(!d||!d.pl)return;posFix(d);const rk=p=>p[19]===1&&p[15]>=0?-1:p[15]>=0?p[15]:99;
 const o=d.pl.map((p,i)=>[p,i]).sort((a,b)=>rk(a[0])-rk(b[0])||a[1]-b[1]).map(x=>x[0]);
 if(o.some((p,i)=>p!==d.pl[i])){d.pl.length=0;d.pl.push(...o)}}
{const _ro=renderOverview;renderOverview=function(){try{ysUpd(TEAMS[0]);plOrder(TEAMS[0])}catch(e){console.error(e)}return _ro.apply(this,arguments)}}


/* ===== FASE 42: KOMPRIMERET GEMNING OG ADVARSEL OM LAGERPLADS ===== */
// Gemningen pakkes med LZW. Format: 'Z1' + JSON-liste over tegnkoder i alfabetet + '\u0001' + koder (én UTF-16-enhed pr. kode).
// Koderne forskydes, så de aldrig rammer kontroltegn eller surrogat-området (D800–DFFF). Ordbogen nulstilles, når den er fuld.
// Gamle, ukomprimerede gemninger (begynder med '{') indlæses som før.
const SVZ={off:32,max:0xFFFF-32-0x800,lim:5e6,warn:[.8,.9]};
const svCh=c=>{c+=SVZ.off;return String.fromCharCode(c>=0xD800?c+0x800:c)},svCo=ch=>{let c=ch.charCodeAt(0);if(c>=0xE000)c-=0x800;return c-SVZ.off};
function svPack(s){const A=[],seen=new Map();for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(!seen.has(c)){seen.set(c,A.length);A.push(c)}}
 // ordbog som træ: node = {c: kode, k: Map(tegnkode -> node)}
 const n0=A.length,L=s.length;let root,nx;const reset=()=>{root=new Map();nx=n0};reset();
 const o=new Uint16Array(L+1);let on=0,i=0;
 while(i<L){const c=s.charCodeAt(i);let nd=root.get(c);if(!nd){nd={c:seen.get(c),k:null};root.set(c,nd)}i++;
  while(i<L&&nd.k){const nn=nd.k.get(s.charCodeAt(i));if(!nn)break;nd=nn;i++}
  {let v=nd.c+SVZ.off;if(v>=0xD800)v+=0x800;o[on++]=v}
  if(i<L){if(nx<SVZ.max){if(!nd.k)nd.k=new Map();nd.k.set(s.charCodeAt(i),{c:nx++,k:null})}else reset()}}
 let r='';for(let p=0;p<on;p+=8192)r+=String.fromCharCode.apply(null,o.subarray(p,Math.min(on,p+8192)));
 return 'Z1'+JSON.stringify(A)+'\u0001'+r}
function svUnpack(z){if(!z||z.slice(0,2)!=='Z1')return z;const k=z.indexOf('\u0001'),A=JSON.parse(z.slice(2,k)),n0=A.length;
 let D=[],nx=n0;const reset=()=>{D=[];nx=n0};const get=c=>c<n0?String.fromCharCode(A[c]):D[c-n0];
 const out=[];let prev=null;
 for(let i=k+1;i<z.length;i++){const c=svCo(z[i]);let e;
  if(prev===null){e=get(c);out.push(e);prev=e;continue}
  if(c<nx)e=get(c);else e=prev+prev[0];// koden er lige blevet oprettet (cScSc-tilfældet)
  out.push(e);
  if(nx<SVZ.max){D[nx-n0]=prev+e[0];nx++}else{reset();}
  prev=e}
 return out.join('')}
// lagerforbrug: antal tegn i gemningen i forhold til et forsigtigt skøn over browserens grænse (ca. 5 mio. tegn)
let SVN=0;
function svUse(){return SVN/SVZ.lim}
// advarsel i indbakken, når gemningen fylder 80 % og 90 % af skønnet over browserens grænse (én gang pr. trin)
function svWarn(){try{if(!WD||typeof ibAdd!=='function')return;const u=svUse(),lv=SVZ.warn.filter(x=>u>=x).length;if(lv<=(WD.svw||0))return;WD.svw=lv;
 if(typeof IB!=='undefined'&&!IB.cats.includes('Spil'))IB.cats.push('Spil');
 ibAdd('Spil',`Det gemte spil fylder nu ca. ${Math.round(u*100)} % af browserens lagerplads (${(SVN/1e6).toLocaleString('da-DK',{maximumFractionDigits:1})} af ca. ${(SVZ.lim/1e6).toLocaleString('da-DK',{maximumFractionDigits:1})} mio. tegn). Når pladsen er brugt, kan spillet ikke længere gemmes.`)}catch(e){}}
{const _rfS=renderFaq;renderFaq=function(){_rfS();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Gemning</h3>${li(['Spillet gemmes automatisk i browseren efter hver dag. Gemningen pakkes, så den fylder ca. en fjerdedel.',
  `Browseren giver ca. ${SVZ.lim/1e6} mio. tegn til spillet. ${SVN?`Dit spil fylder lige nu ${(SVN/1e6).toLocaleString('da-DK',{maximumFractionDigits:2})} mio. tegn (${Math.round(svUse()*100)} %).`:''} Du får besked i indbakken ved ${SVZ.warn.map(x=>Math.round(x*100)+' %').join(' og ')}.`,
  'Kan spillet ikke gemmes, vises en rød advarsel øverst. Den sidst gemte version bevares, men det, der er sket siden, går tabt, hvis siden lukkes.'])}</div>`)}}

globalThis.onerror=(m,s,l)=>{const d=document.createElement('div');d.style.cssText='color:#d4352b;padding:6px';d.textContent='Fejl: '+m+' (linje '+l+')';document.body.prepend(d)};
if(loadGame()){if(WD.needSp)showSponsor();else showLeague()}else newLeague();(function lp(){try{step()}finally{setTimeout(lp,TICK_MS)}})();
{const sb=()=>document.querySelectorAll('#spdb [data-spd]').forEach(b=>b.classList.toggle('on',+b.dataset.spd===TICK_MS));sb();
 $('spdb').onclick=e=>{const b=e.target.closest('[data-spd]');if(!b)return;TICK_MS=+b.dataset.spd;try{localStorage.setItem('csmSpd',TICK_MS)}catch(x){}sb()}}

/* ===== FASE 33: MENU MED UNDERMENUER ===== */
// Hovedmenu: Indbakke · Turneringer · Mit hold · Økonomi · HoF · FAQ (· Kamp). Undermenuen står som faner øverst på siden.
// Hver gruppe husker den sidst åbnede underside.
const NG=[['tu','Turne&shy;ringer',[['lg','Liga'],['cl','CL'],['rk','Rank']]],
 ['mh','Mit hold',[['ov','Hold'],['tr','Træning'],['tv','Taktik'],['ty','Tryout']]],
 ['ok','Økonomi',[['ec','Økonomi'],['xf','Transfer'],['sp','Sponsor']]]];
const NGL={};
const ngOf=v=>{if(v==='hv'&&typeof HV!=='undefined'&&HV)v=HV.from;const g=NG.find(x=>x[2].some(s=>s[0]===v));return g?g[0]:null};
document.head.insertAdjacentHTML('beforeend',`<style>
#sub{margin:0 0 8px;flex-wrap:wrap}#sub button{flex:1 1 0;min-width:0}
.nav button[data-g]{font-size:11.5px;hyphens:manual}
</style>`);
{const tp=$('ttl')&&$('ttl').parentElement;if(tp&&typeof tp.insertAdjacentHTML==='function')tp.insertAdjacentHTML('afterend','<div id="sub" class="bar sm" style="display:none"></div>')}
{const _rn=renderNav;renderNav=function(){_rn();const n=$('nav');if(!n||!WD)return;
 NG.forEach(([,,S])=>S.forEach(([v])=>{const b=n.querySelector(`[data-v="${v}"]`);if(b)b.remove()}));
 const g=ngOf(VIEW);if(g&&NG.find(x=>x[0]===g)[2].some(s=>s[0]===VIEW))NGL[g]=VIEW;
 const h=NG.map(([k,t])=>`<button class="${g===k?'on':''}" data-g="${k}">${t}</button>`).join('');
 const ib=n.querySelector('[data-v="ib"]');if(ib)ib.insertAdjacentHTML('afterend',h);else n.insertAdjacentHTML('afterbegin',h);
 const sb=$('sub');if(!sb)return;const G=g&&NG.find(x=>x[0]===g);
 if(!G){sb.style.display='none';sb.innerHTML='';return}
 sb.style.display='';sb.innerHTML=G[2].map(([v,t])=>`<button class="${VIEW===v?'on':''}" data-v="${v}">${t}</button>`).join('')}}
{const _nc=$('nav').onclick;$('nav').onclick=e=>{const b=e.target.closest('[data-g]');
 if(b){const G=NG.find(x=>x[0]===b.dataset.g);if(!G)return;const x=document.createElement('button');x.dataset.v=NGL[G[0]]||G[2][0][0];return _nc({target:x})}
 return _nc(e)}}
$('sub').onclick=e=>{const b=e.target.closest('[data-v]');if(b)$('nav').onclick({target:b})};
try{renderNav()}catch(e){}


/* ===== FASE 34: LANDSHOLD ===== */
// Ved sæsonstart udtages de 5 bedste spillere (samlet skill) fra hvert land blandt alle hold.
// Der skal altid være en IGL med ledelse mindst NTH.igl/5: er ingen af de 5 bedste kandidater, erstatter den bedste kandidat nr. 5.
// Har landet ingen kandidater, bliver den af de 5 med mest ledelse IGL.
const NTH={n:5,igl:3};
function ntPick(){const by={};
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>t.def.pl.forEach(p=>{(by[p[11]]=by[p[11]]||[]).push({p,li,ti})})));
 const c={};
 Object.keys(by).forEach(ci=>{const A=by[ci].sort((a,b)=>tot(b.p)-tot(a.p)),ld=x=>lvl(x.p[12],LT);
  let top=A.slice(0,NTH.n);const cand=A.filter(x=>ld(x)>=NTH.igl),ok=cand.length>0;
  if(ok&&!top.some(x=>ld(x)>=NTH.igl)){top[top.length===NTH.n?NTH.n-1:top.length]=cand[0];top.sort((a,b)=>tot(b.p)-tot(a.p))}
  const pool=ok?top.filter(x=>ld(x)>=NTH.igl):top,ig=pool.slice().sort((a,b)=>b.p[12]-a.p[12]||tot(b.p)-tot(a.p))[0];
  c[ci]={ok,pl:top.map(x=>({n:x.p[0],li:x.li,ti:x.ti,tn:WD.lg[x.li].teams[x.ti].name||x.p[0],age:x.p[9],s:Math.round(tot(x.p)*10)/10,ld:lvl(x.p[12],LT),igl:x===ig?1:0,sp:x.p[23]||''}))
   .sort((a,b)=>b.igl-a.igl||b.s-a.s)}});
 WD.nt={s:WD.season,d:WD.day,c}}
const ntDue=()=>WD&&WD.lg&&(!WD.nt||WD.nt.s!==WD.season);
{const _ed=endDay;endDay=function(){const r=_ed.apply(this,arguments);try{if(ntDue())ntPick()}catch(e){console.error(e)}return r}}
// UI
document.head.insertAdjacentHTML('beforeend',`<style>
.ntt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;font-variant-numeric:tabular-nums}
.ntt th,.ntt td{padding:6px 4px;border-top:1px solid var(--bd);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ntt th{color:var(--mu);font-weight:600;font-size:11.5px;border-top:0}.ntt .l{text-align:left}
.ntt tr.me td{background:#fff4e8}.ntt tr.sel td{background:var(--card)}.ntt .tn{display:block;font-size:11.5px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;cursor:pointer}
</style>`);
VT.nt='Landshold';
NG[0][2].splice(2,0,['nt','Landshold']);
$('lg').insertAdjacentHTML('afterend','<div id="nt" style="display:none"></div>');
{const _sh=show;show=function(v){_sh(v);$('nt').style.display=v==='nt'?'':'none'}}
function showNat(){if(ntDue())ntPick();show('nt');renderNat()}
{const _nc=$('nav').onclick;$('nav').onclick=e=>{const b=e.target.closest('[data-v]');if(b&&b.dataset.v==='nt')return showNat();return _nc(e)}}
const ntSum=c=>Math.round(c.pl.reduce((a,x)=>a+x.s,0));
function renderNat(){const N=WD.nt;if(!N)return;
 const v=WD.ntV!=null&&N.c[WD.ntV]?WD.ntV:N.c[WD.me.li]?WD.me.li:+Object.keys(N.c)[0],C=N.c[v];
 const ord=Object.keys(N.c).map(Number).sort((a,b)=>ntSum(N.c[b])-ntSum(N.c[a]));
 let h=`<div class="hd"><b>Landshold</b><span class="mu">Udtaget sæson ${N.s}${N.d?`, dag ${N.d+1}`:''}</span></div>`;
 const tab=['hold','rank','vm'].includes(WD.ntT)?WD.ntT:'hold';
 h+=`<div class="bar sm">${[['hold','Hold'],['rank','Powerranking'],['vm','VM']].map(([k,t])=>`<button class="${tab===k?'on':''}" data-ntt="${k}">${t}</button>`).join('')}</div>`;
 if(tab==='vm'){$('nt').innerHTML=h+'<div id="ntvm"></div>';return}
 if(tab==='hold'){h+=`<div class="tm"><select id="ntsel" style="width:100%">${ord.map(i=>`<option value="${i}" ${i===v?'selected':''}>${COUNTRIES[i][0]}</option>`).join('')}</select></div>`;
 h+=`<div class="tm"><h3>${flag(FLAGC[v])} ${COUNTRIES[v][0]}</h3>${C.pl.map(x=>`<div style="padding:7px 0;border-top:1px solid var(--bd)"${x.li===WD.me.li&&x.ti===WD.me.ti?' class="me"':''}><b>${x.n}</b></div>`).join('')}</div>`}
 else h+=`<div class="tm"><h3>Powerranking</h3><div class="mu" style="margin-bottom:4px">Landsholdene efter de fem udtagnes samlede skill. Tryk på et land for at se holdet.</div><table class="ntt"><colgroup><col style="width:30px"><col><col style="width:64px"></colgroup><tr><th>#</th><th class="l">Land</th><th>Samlet</th></tr>
 ${ord.map((i,j)=>{const c=N.c[i],g=c.pl.find(x=>x.igl);return `<tr data-ntc="${i}" style="cursor:pointer"${i===v?' class="sel"':''}><td>${j+1}</td><td class="l">${flag(FLAGC[i])} ${COUNTRIES[i][0]}</td><td>${ntSum(c).toLocaleString('da-DK')}</td></tr>`}).join('')}</table></div>`;
 $('nt').innerHTML=h}
$('nt').addEventListener('change',e=>{if(e.target.id==='ntsel'){WD.ntV=+e.target.value;renderNat()}});
$('nt').addEventListener('click',e=>{const r=e.target.closest('[data-ntc]');if(r){WD.ntV=+r.dataset.ntc;WD.ntT='hold';renderNat();window.scrollTo(0,0);return}const t=e.target.closest('[data-ntt]');if(t){WD.ntT=t.dataset.ntt;renderNat()}});
{const _rfN=renderFaq;renderFaq=function(){_rfN();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Landshold</h3>${li([`Ved sæsonstart udtages de ${NTH.n} bedste spillere (samlet skill) fra hvert land blandt alle hold, også dit. Landsholdet gælder hele sæsonen.`,
  `Der skal altid være en IGL med ledelse mindst ${NTH.igl}/5. Er ingen af de ${NTH.n} bedste kandidater, tager landets bedste kandidat den sidste plads. Har landet ingen kandidater, bliver den af de ${NTH.n} med mest ledelse IGL.`,'Du får besked i indbakken, når en af dine spillere bliver udtaget, og under VM efter hver kamp, dit land spiller. Spillerne på de tre medaljehold får en VM-medalje (🥇 🥈 🥉) ved navnet på spillerkortet. Hold musen over medaljen for at se sæsonen.'])}</div>`)}}


/* ===== FASE 35: SLUTRUNDE FOR LANDSHOLD ===== */
// Hver 4. sæson fra sæson 4: 4 puljer à 6 landshold (tilfældig lodtrækning), én kamp mod hvert hold i puljen. Én runde pr. dag, så finalen er på sæsonens sidste dag.
// De 4 bedste fra hver pulje går til 1/8-finaler, seedet som i CL. Ved lighed afgør landsholdsranglisten (samlet skill).
// Kampene spilles på sæsonens to maps. Landsholdene har maksimal taktisk evne (og maksimal holdstyring og økonomi i kampene).
// Spillerne er kopier taget ved lodtrækningen, så kampene påvirker ikke klubholdene.
// gd = dag (0-baseret) → grupperunde · pd = dag → slutspilsrunder i WD.ec.po (0 = 1/8, 1 = kvart, 2/3 = semi, 4 = finale, 5 = bronze)
const EC={every:4,from:4,gd:{40:0,41:1,42:2,43:3,44:4},pd:{45:[0],46:[1],47:[2,3],48:[5,4]}};
const ecSeason=s=>s>=EC.from&&(s-EC.from)%EC.every===0;
const ecNext=()=>{let s=WD.season;while(!ecSeason(s))s++;return s};
const ecSkill=ci=>WD.nt&&WD.nt.c[ci]?ntSum(WD.nt.c[ci]):0;
const ecW=m=>m.res[0]>m.res[1]?m.a:m.b,ecL=m=>m.res[0]>m.res[1]?m.b:m.a;
function ecDef(ci){const sel=WD.nt.c[ci];
 const pl=sel.pl.map((x,j)=>{const t=WD.lg[x.li]&&WD.lg[x.li].teams[x.ti],src=t&&t.def.pl.find(p=>p[0]===x.n);if(!src)return null;
  const p=JSON.parse(JSON.stringify(src));p[15]=j;p[16]=j;p[19]=x.igl?1:0;p[20]=-1;p[31]=0;p[32]=null;return p}).filter(Boolean);
 if(!pl.some(p=>p[19]===1)&&pl[0])pl[0][19]=1;
 return{name:COUNTRIES[ci][0],li:ci,pl,tcq:1,mq:1,ecq:1,nat:1}}
function ecDraw(){if(!WD.nt||WD.nt.s!==WD.season)ntPick();
 const ord=shuffle(Object.keys(WD.nt.c).map(Number)),G=[0,1,2,3].map(j=>ord.slice(j*6,j*6+6));
 const sm=seasonMaps(),sq={};ord.forEach(ci=>sq[ci]=ecDef(ci));
 WD.ec={s:WD.season,sq,po:[],seeds:null,g:G.map(t=>({t,rnd:t.map(()=>rnd()),rounds:fixtures(t.length).slice(0,t.length-1).map((r,i)=>r.map(([a,b])=>({a:t[a],b:t[b],ai:a,bi:b,res:null,nd:false,st:'Gruppespil',map:sm[i%2]})))}))}}
function etab(g){
 const S=g.t.map((ci,i)=>({i,k:ci,p:0,w:0,d:0,l:0,rf:0,ra:0,pts:0,h:0,r:g.rnd[i],rd:0})),all=g.rounds.flat();
 all.forEach(m=>{if(!m.res)return;const x=S[m.ai],y=S[m.bi],[a,b]=m.res;x.p++;y.p++;x.rf+=a;x.ra+=b;y.rf+=b;y.ra+=a;if(a>b){x.w++;y.l++;x.pts+=2}else if(a<b){y.w++;x.l++;y.pts+=2}else{x.d++;y.d++;x.pts++;y.pts++}});
 S.forEach(s=>s.rd=s.rf-s.ra);
 const by=S.slice().sort((a,b)=>b.pts-a.pts),out=[];
 for(let i=0;i<by.length;){let j=i;while(j<by.length&&by[j].pts===by[i].pts)j++;const gr=by.slice(i,j),ids=gr.map(x=>x.i);
  if(gr.length>1)all.forEach(m=>{if(m.res&&ids.includes(m.ai)&&ids.includes(m.bi)){const[a,b]=m.res;S[m.ai].h+=a>b?2:a===b?1:0;S[m.bi].h+=b>a?2:a===b?1:0}});
  gr.sort((a,b)=>b.h-a.h||b.rd-a.rd||ecSkill(b.k)-ecSkill(a.k)||b.r-a.r);out.push(...gr);i=j}
 return out}
function ecPlayoff(){const E=WD.ec,T=E.g.flatMap(g=>etab(g).slice(0,4));
 T.sort((a,b)=>b.pts-a.pts||b.rd-a.rd||ecSkill(b.k)-ecSkill(a.k)||b.r-a.r);E.seeds=T.map(x=>x.k);
 E.po=[[[0,15],[7,8],[3,12],[4,11],[1,14],[6,9],[2,13],[5,10]].map(([i,j])=>ecM(E.seeds[i],E.seeds[j],'1/8-finale'))]}
const ecM=(a,b,st)=>{const sm=seasonMaps();return{a,b,res:null,nd:true,st,map:sm[rnd()<.5?0:1]}};
function ecSim(m){const E=WD.ec;if(!m||m.res)return;const k0=KC,c0=CLM;KC=false;CLM=true;
 try{const s=simMatch([E.sq[m.a],E.sq[m.b]],m.nd,m.map);m.res=[s[0],s[1]]}finally{KC=k0;CLM=c0}}
function ecDay(d){const E=WD.ec;if(!E||E.s!==WD.season||E.done)return;
 if(d in EC.gd){E.g.forEach(g=>g.rounds[EC.gd[d]].forEach(ecSim));if(EC.gd[d]===E.g[0].rounds.length-1)ecPlayoff()}
 if(d in EC.pd&&E.po.length){EC.pd[d].forEach(i=>(E.po[i]||[]).forEach(ecSim));const P=E.po;
  if(d===45)P[1]=[0,2,4,6].map(i=>ecM(ecW(P[0][i]),ecW(P[0][i+1]),'Kvartfinale'));
  if(d===46){P[2]=[ecM(ecW(P[1][0]),ecW(P[1][1]),'Semifinale 1')];P[3]=[ecM(ecW(P[1][2]),ecW(P[1][3]),'Semifinale 2')]}
  if(d===47){P[5]=[ecM(ecL(P[2][0]),ecL(P[3][0]),'Bronzekamp')];P[4]=[ecM(ecW(P[2][0]),ecW(P[3][0]),'Finale')]}
  if(d===48){const f=P[4][0],w=ecW(f),sq=E.sq[w];E.done=true;
   (WD.ehof=WD.ehof||[]).push({s:E.s,t:[w,ecL(f),ecW(P[5][0])],sq:sq.pl.map(p=>p[0]),igl:(sq.pl.find(p=>p[19]===1)||[''])[0]})}}}
const ecDue=()=>WD&&ecSeason(WD.season)&&!(WD.ec&&WD.ec.s===WD.season)&&WD.day<=Math.min(...Object.keys(EC.gd).map(Number));
function ecNote(){const E=WD.ec;if(!E||E.s!==WD.season||E.note)return;E.note=1;const ci=WD.me.li,g=E.g.findIndex(x=>x.t.includes(ci)),m=g>=0&&E.g[g].rounds[0].find(x=>x.a===ci||x.b===ci);
 const t=`VM for landshold begynder i dag. ${g>=0?`${COUNTRIES[ci][0]} er i pulje ${'ABCD'[g]}${m?` og møder ${COUNTRIES[m.a===ci?m.b:m.a][0]} i første kamp`:''}. `:''}Finalen spilles dag ${NDAYS}.`;
 if(typeof ibAdd==='function')ibAdd('Landshold',t);else news(t,true)}
{const _ed=endDay;endDay=function(){try{ecDay(WD.day)}catch(e){console.error(e)}
 const r=_ed.apply(this,arguments);try{if(ecDue())ecDraw();if(WD.ec&&WD.ec.s===WD.season&&WD.day===Math.min(...Object.keys(EC.gd).map(Number)))ecNote()}catch(e){console.error(e)}
 try{renderNav();if(VIEW==='ib'&&typeof renderInbox==='function')renderInbox()}catch(e){}return r}}
if(typeof IB!=='undefined'&&!IB.cats.includes('Landshold')){IB.cats.push('Landshold');IBV.Landshold=()=>{WD.ntT='vm';showNat()}}
// UI: slutrunden på Landshold-siden
document.head.insertAdjacentHTML('beforeend',`<style>.ecg .lg2{grid-template-columns:22px minmax(max-content,1fr) 24px 56px 56px 30px}</style>`);
const ecN=ci=>`<span class="${ci===WD.me.li?'me2':''}">${flag(FLAGC[ci])} ${COUNTRIES[ci][0]}</span>`;
const ecBm=m=>{if(!m)return `<div class="bx"><div class="bt mu">TBD</div><div class="bt mu">TBD</div></div>`;const w=m.res?ecW(m):null,row=(k,s)=>`<div class="bt ${w===k?'bw':''}"><span class="nm">${ecN(k)}</span><b>${s}</b></div>`;
 return `<div class="bx">${row(m.a,m.res?m.res[0]:'')}${row(m.b,m.res?m.res[1]:'')}<div class="bt mu" style="font-size:10.5px">${m.map?mapN(m.map):''}</div></div>`};
const ecDays=()=>{const g=Object.keys(EC.gd).map(d=>+d+1),p=Object.keys(EC.pd).map(d=>+d+1);return `Puljekampe dag ${g.slice(0,-1).join(', ')} og ${g[g.length-1]} · 1/8-finaler dag ${p[0]} · kvartfinaler dag ${p[1]} · semifinaler dag ${p[2]} · bronzekamp og finale dag ${p[3]}`};
function ecHTML(){const E=WD.ec;
 if(!E)return `<div class="tm"><h3>VM</h3><div class="mu">Næste VM spilles i sæson ${ecNext()}. Der er VM hver ${EC.every}. sæson.</div></div>`;
 const cur=E.s===WD.season;let h=`<div class="tm"><h3>${cur?'VM':'Seneste VM'} · sæson ${E.s}</h3><div class="mu">${cur?ecDays():`Næste VM: sæson ${ecNext()}`}</div>`;
 if(E.done){const f=E.po[4][0],b=E.po[5][0];h+=`<div style="margin-top:6px">🥇 ${ecN(ecW(f))} · 🥈 ${ecN(ecL(f))} · 🥉 ${ecN(ecW(b))}</div>`}
 h+='</div>';
 const ln=(c,cls)=>`<div class="r ${cls||''}">${c.map((x,k)=>`<div class="${k===1?'nm':''}">${x}</div>`).join('')}</div>`;
 h+=E.g.map((g,i)=>`<div class="tm lt ecg"><h3>Pulje ${'ABCD'[i]}</h3><div class="sx"><div class="lg2">`+ln(['#','Land','K','S-U-T','Runder','P'],'eq')+etab(g).map((s,k)=>ln([k+1,ecN(s.k),s.p,`${s.w}-${s.d}-${s.l}`,`${s.rf}-${s.ra}`,s.pts],k===3?'solid':'')).join('')+'</div></div></div>').join('');
 const P=E.po,gm=(a,i)=>a&&a[i]?a[i]:null;
 if(P.length){h+=`<div class="tm"><div class="br">${[[P[0],'1/8-finaler'],[P[1]||Array(4).fill(null),'Kvartfinaler'],[[gm(P[2],0),gm(P[3],0)],'Semifinaler'],[[gm(P[4],0)],'Finale']].map(([r,l])=>`<div class="bc"><div class="mu bl">${l}</div>${r.map(ecBm).join('')}</div>`).join('')}</div></div><div class="tm"><h3>Bronzekamp</h3><div style="max-width:180px">${ecBm(gm(P[5],0))}</div></div>`}
 else h+=`<div class="tm"><div class="mu">De 4 bedste fra hver pulje går videre til 1/8-finalerne, seedet som i Champions League.</div></div>`;
 return h}
{const _rn=renderNat;renderNat=function(){if(ecDue())ecDraw();_rn();const el=$('ntvm');if(el)el.innerHTML=ecHTML()}}
// Hall of Fame: Champions League / Landshold
{const _rh=renderHof;renderHof=function(){const v=WD.hfV==='nt'?'nt':'cl';
 const bar=`<div class="bar sm"><button class="${v==='cl'?'on':''}" data-hfv="cl">Champions League</button><button class="${v==='nt'?'on':''}" data-hfv="nt">Landshold</button></div>`;
 if(v==='cl'){_rh();const hd=$('hf').querySelector('.hd');if(hd)hd.insertAdjacentHTML('afterend',bar);return}
 const H=(WD.ehof||[]).slice().reverse(),M3=['🥇','🥈','🥉'],cnt={};
 (WD.ehof||[]).forEach(e=>e.t.forEach((ci,i)=>{const c=cnt[ci]=cnt[ci]||{ci,m:[0,0,0]};c.m[i]++}));
 const tab=Object.values(cnt).sort((a,b)=>b.m[0]-a.m[0]||b.m[1]-a.m[1]||b.m[2]-a.m[2]),td=x=>`<td class="${x?'':'z'}">${x}</td>`;
 $('hf').innerHTML=`<div class="hd"><b>Hall of Fame</b><span class="mu">VM top 3</span></div>`+bar+(H.length?
  `<div class="tm"><h3>Medaljetabel</h3><table class="mdt"><colgroup><col><col class="m"><col class="m"><col class="m"></colgroup><thead><tr><th></th><th>🥇</th><th>🥈</th><th>🥉</th></tr></thead><tbody>${tab.map(c=>`<tr><td>${ecN(c.ci)}</td>${td(c.m[0])}${td(c.m[1])}${td(c.m[2])}</tr>`).join('')}</tbody></table></div>`+
  H.map(e=>`<div class="tm"><h3>VM · sæson ${e.s}</h3>${e.t.map((ci,i)=>`<div class="sl" style="padding:3px 0"><span class="nm">${M3[i]} ${ecN(ci)}</span></div>`).join('')}<div class="mu" style="margin-top:4px">Vinderholdet: ${e.sq.map(n=>n===e.igl?`${n} (IGL)`:n).join(', ')}</div></div>`).join('')
  :`<div class="tm"><div class="mu">Endnu intet VM. Det første spilles i sæson ${EC.from}, og top 3 skrives ind her.</div></div>`)}}
$('hf').addEventListener('click',e=>{const b=e.target.closest('[data-hfv]');if(!b)return;WD.hfV=b.dataset.hfv;renderHof()});
// FAQ
{const _rfE=renderFaq;renderFaq=function(){_rfE();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>VM for landshold</h3>${li([`Hver ${EC.every}. sæson fra sæson ${EC.from} spilles der VM mellem landsholdene. De 24 lande fordeles ved lodtrækning i 4 puljer à 6 ved sæsonstart. Hvert land møder de andre i puljen én gang.`,
  `Sejr giver 2 point og uafgjort 1. Ved pointlighed afgør indbyrdes kampe, derefter rundeforskel og til sidst landsholdsranglisten (samlet skill).`,
  `De 4 bedste fra hver pulje går til 1/8-finalerne, seedet som i Champions League: point, rundeforskel og landsholdsranglisten. Derefter kvartfinaler, semifinaler, bronzekamp og finale.`,
  `Der spilles én runde pr. dag: ${ecDays()}. Du får besked i indbakken den dag, VM begynder. Turneringen findes under Turneringer → Landshold → VM. Kampene spilles på sæsonens to maps.`,
  'Landsholdene har maksimal taktisk evne. Spillerne er de udtagne fra sæsonstart, og kampene påvirker ikke klubholdene.'])}</div>`)}}
// FAQ: sektioner tilføjet efter fold-ud-funktionen kan også foldes
{const _rfD=renderFaq;renderFaq=function(){_rfD();const f=$('fq');if(!f.querySelectorAll)return;
 f.querySelectorAll(':scope > .tm:not(details)').forEach(tm=>{const h=tm.querySelector(':scope > h3');if(!h)return;const d=document.createElement('details');d.className='tm fqd';const sm=document.createElement('summary');sm.innerHTML=h.innerHTML;h.remove();d.appendChild(sm);const b=document.createElement('div');while(tm.firstChild)b.appendChild(tm.firstChild);d.appendChild(b);tm.replaceWith(d)})}}


/* ===== FASE 36: KAMPPROGRAM I LIGAEN OG KAMPE I CL-GRUPPERNE ===== */
document.head.insertAdjacentHTML('beforeend',`<style>.fx{grid-template-columns:minmax(0,1fr) 50px minmax(0,1fr)}.fx .rs{white-space:nowrap}</style>`);
const bName=(li,ti)=>{const t=WD.lg[li]&&WD.lg[li].teams[ti];return t?(t.def.name||t.name):''};
const fxRow=(a,b,res,mine)=>`<div class="fx ${mine?'n':''}"><span class="tb" title="${a[2]}">${tl(a[0],a[1],a[2])}</span><span class="rs">${res}</span><span class="tb" title="${b[2]}">${tl(b[0],b[1],b[2])}</span></div>`;
// Liga: Stilling · Top 10 frags · Kampprogram
function lgSched(){const li=WD.view,g=WD.lg[li],d=WD.day;let h=`<div class="tm"><h3>Kampprogram – ${g.c}</h3><div class="mu">Alle 30 ligakampe med resultater. Hjemmeholdet står til venstre.</div></div>`;
 g.fix.forEach((F,i)=>{const r=i+1,day=LDAYS[i],res=g.res.filter(y=>y.rd===r);
  h+=`<div class="tm"${day===d?' style="border-color:#000"':''}><h3>Ligakamp ${r} <span class="mu">· uge ${Math.floor(day/7)+1}, ${DAYS[day%7]} · ${mapN(lgMap(r))}${day===d?' · i dag':''}</span></h3>`+
   F.map(m=>{const x=res.find(y=>y.h===m[0]&&y.a===m[1]);return fxRow([li,m[0],bName(li,m[0])],[li,m[1],bName(li,m[1])],x?x.hs+'–'+x.as:'–',li===WD.me.li&&(m[0]===WD.me.ti||m[1]===WD.me.ti))}).join('')+'</div>'});
 return h}
{const _rl=renderLeague;renderLeague=function(){const v=['st','fr','ks'].includes(WD.lgV)?WD.lgV:(WD.frags?'fr':'st');WD.lgV=v;WD.frags=v==='fr';_rl();
 const el=$('lg');if(!el||!el.querySelector)return;const fb=$('frb');
 if(fb)fb.outerHTML=`<div class="bar sm" style="margin:6px 0 0">${[['st','Stilling'],['fr','Top 10 frags'],['ks','Kampprogram']].map(([k,t])=>`<button class="${v===k?'on':''}" data-lgv="${k}">${t}</button>`).join('')}</div>`;
 if(v==='ks'){const st=el.querySelector('.tm.lt');if(st)st.outerHTML=lgSched();const nx=[...el.querySelectorAll(':scope > .tm')].pop();if(nx&&nx.querySelector('.fx')&&/Kommende|Ingen flere/.test(nx.textContent))nx.remove()}}}
$('lg').addEventListener('click',e=>{const b=e.target.closest('[data-lgv]');if(!b)return;e.stopPropagation();WD.lgV=b.dataset.lgv;renderLeague()},true);
// Kommende ligakampe: holdnavne uden sponsor
{const _rl2=renderLeague;renderLeague=function(){_rl2();if(WD.lgV==='ks')return;const el=$('lg');if(!el||!el.querySelectorAll)return;
 const nx=[...el.querySelectorAll(':scope > .tm')].pop();if(!nx||!/Kommende/.test(nx.textContent))return;
 const mt=WD.lg[WD.me.li].teams[WD.me.ti],mn=bName(WD.me.li,WD.me.ti);
 nx.querySelectorAll('.fx .tb').forEach(tb=>{const a=tb.querySelector('[data-tm]');if(!a){if(tb.textContent.trim()===mt.name){const t=[...tb.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(t)t.textContent=mn;else tb.textContent=mn;tb.title=mn}return}const[li,ti]=a.dataset.tm.split('-').map(Number),n=bName(li,ti);if(!n)return;a.textContent=n;tb.title=n})}}
// CL: tryk på en gruppe for at se dens kampe
const GRND={};Object.keys(GDAYS).forEach(d=>GDAYS[d].forEach(r=>GRND[r]=+d));
function cgMatches(i){const g=WD.cg[i];return `<div class="cgm" style="margin-top:8px;border-top:1px solid var(--bd);padding-top:6px">`+g.rounds.map((R,r)=>{const day=GRND[r];
 return `<div class="mu" style="margin:6px 0 2px">Runde ${r+1}${day!=null?` · uge ${Math.floor(day/7)+1}, ${DAYS[day%7]}`:''}${R[0]&&R[0].map?` · ${mapN(R[0].map)}`:''}</div>`+
  R.map(m=>fxRow([m.a.li,m.a.ti,bName(m.a.li,m.a.ti)],[m.b.li,m.b.ti,bName(m.b.li,m.b.ti)],m.res?m.res[0]+'–'+m.res[1]:'–',isMe(m.a)||isMe(m.b))).join('')}).join('')+'</div>'}
{const _rc=renderCL;renderCL=function(){_rc();if(WD.cltab!=='grp'||!WD.cg)return;const el=$('cl');if(!el||!el.querySelectorAll)return;
 [...el.querySelectorAll('.tm.lt')].forEach((c,i)=>{if(!WD.cg[i])return;const h=c.querySelector('h3');if(!h)return;const op=WD.clG===i;
  h.style.cursor='pointer';h.dataset.cgi=i;h.insertAdjacentHTML('beforeend',` <span class="mu" style="font-weight:400;font-size:12px">${op?'▴ skjul kampe':'▾ vis kampe'}</span>`);
  if(op)c.insertAdjacentHTML('beforeend',cgMatches(i))})}}
$('cl').addEventListener('click',e=>{const h=e.target.closest('[data-cgi]');if(!h)return;const i=+h.dataset.cgi;WD.clG=WD.clG===i?null:i;renderCL()});
