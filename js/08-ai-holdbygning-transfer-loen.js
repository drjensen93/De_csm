/* ===== FASE 8: SMARTERE AI-HOLDBYGNING ===== */
// Skill-vægte målt i kampmotoren (+10 i én skill for hele holdet → rundedifference). Aim, Quickness og Awareness dominerer.
const SW=[1,.35,1.1,.7,1.4,.45,.55,.65,.3,.5];// Playing IQ og Awareness genmålt efter flanker (2.000 kampe pr. skill)// aim, handling, iq, quick, aware, det, calm, pat, pos, team (genmålt efter HE-splash, infospil og Teamplay)
const AIQ=[.4,1];// spænd for AI-managerens kvalitet (1 = bruger de målte vægte fuldt ud)
const mq=d=>d.mq!=null?d.mq:(d.mq=AIQ[0]+rnd()*(AIQ[1]-AIQ[0]));
const wts=d=>{const q=mq(d);return SW.map(w=>q*w+(1-q)*.45)};// svagere managere spreder fokus over alle skills
function wEff(d,p,w){const g=ig(d),gl=g?lvl(g[12],LT):0;let s=0;for(let k=0;k<NSK;k++)s+=w[k]*effStat(p,k,p[19]===1?0:gl);return s}
// forventet vægtet værdi efter H dages optimal træning minus forventet aldring
function proj(p,w,H){const v=SI.map(i=>p[i]),r=rateP(p,p[9]);let t=0;
 for(let day=0;day<H;day++){let b=-1,bg=0;for(let k=0;k<NSK;k++){const g=w[k]*Math.min(r,p[14][k]-v[k]);if(g>bg){bg=g;b=k}}if(b<0)break;v[b]+=Math.min(r,p[14][b]-v[b])}
 for(let k=0;k<NSK;k++)t+=w[k]*v[k];const wm=w.reduce((a,b)=>a+b,0)/NSK;return t-agingP(p,p[9]+(H>49?1:0))*H*wm}
const aiVal=(d,p,w)=>.35*wEff(d,p,w)+.65*proj(p,w,Math.round(49+mq(d)*49));
function autoRooms(d){const w=wts(d),cap=Array(NSK).fill(0),cand=[];
 d.pl.forEach(p=>{p[20]=-1;const r=rateP(p,p[9]);for(let k=0;k<NSK;k++)cand.push([w[k]*Math.min(r,p[14][k]-p[SI[k]]),p,k])});
 cand.sort((a,b)=>b[0]-a[0]);for(const[v,p,k]of cand){if(v<=0)break;if(p[20]<0&&cap[k]<3){p[20]=k;cap[k]++}}}
function aiLineup(d){
 const w=wts(d),e=new Map(d.pl.map(p=>[p,wEff(d,p,w)])),top=d.pl.slice().sort((a,b)=>e.get(b)-e.get(a)).slice(0,5);
 const G=d.pl.filter(p=>lvl(p[12],LT)>2).sort((a,b)=>lvl(b[12],LT)-lvl(a[12],LT)||b[12]-a[12])[0];
 if(G&&!top.includes(G)&&e.get(top[4])-e.get(G)<15)top[4]=G;
 const S=new Set(top);d.pl.forEach(p=>{if(p[15]>=0&&!S.has(p)){p[15]=-1;p[16]=-1;p[19]=0}});
 const L=line(d),uT=new Set(L.map(p=>p[15])),uC=new Set(L.map(p=>p[16]));
 top.forEach(p=>{if(p[15]<0){const t=[0,1,2,3,4].find(r=>!uT.has(r)),c=[0,1,2,3,4].find(r=>!uC.has(r));p[15]=t;p[16]=c;uT.add(t);uC.add(c)}});
 const lin=line(d).sort((a,b)=>lvl(b[12],LT)-lvl(a[12],LT)||b[12]-a[12]||b[19]-a[19]);d.pl.forEach(p=>p[19]=0);lin[0][19]=1}
// AI tager tryouten, hvis der er plads, ellers erstatter den den svageste spiller på hele holdet (også startere)
function aiTryout(d,n){if(d.pl.length<7){d.pl.push(n);return}
 const w=wts(d),v=new Map(d.pl.map(p=>[p,aiVal(d,p,w)])),worst=d.pl.slice().sort((a,b)=>v.get(a)-v.get(b))[0];
 if(aiVal(d,n,w)>v.get(worst)){d.pl.splice(d.pl.indexOf(worst),1);d.pl.push(n);fixTeam(d)}}

/* ===== FASE 9: TRANSFERMARKED ===== */
// days = dage pr. auktion · inc/minInc = mindste overbud (andel / csm) · scan = chance for at et AI-hold kigger på en udenlandsk auktion
// sellP = daglig chance for at et AI-hold overvejer salg · passes = budrunder pr. dag · maxSq = maks. trup · cash0 = AI-startkasse (× sponsorbase)
const TRF={days:3,inc:.05,minInc:100,scan:.4,sellP:.2,passes:3,maxSq:7,cash0:[.4,1.6],hist:300,news:30};
// købelyst: lo/hi = kasse målt i sæsonlønninger, hvor AI-holdet begynder / er fuldt villig til at bruge ekstra.
// pay = maks. tillæg til det beløb, holdet vil give · scan = ekstra chance for at kigge på udenlandske auktioner · up = lavere krav til forbedring
TRF.rich={lo:1,hi:3,pay:.5,scan:.5,up:.04};
// fee = transfergebyr: andel af salgsprisen, som trækkes fra sælgerens indtægt og forsvinder ud af økonomien
TRF.fee=.2;
const richF=d=>{const w=teamWage(d);return w>0?cl((cash(d)/w-TRF.rich.lo)/(TRF.rich.hi-TRF.rich.lo),0,1):0};
// udvikling: age = "ung" (højst) · yT = antal unge bænkspillere som mål (god/middel holdstyring; dårlig = tilfældigt 0-2 pr. sæson)
// hold = dage et ungt talent skal have før salg (god/middel/dårlig holdstyring) · old = alder hvor gode økonomer sælger bænkspillere
const DEV={age:21,yT:[2,1],hold:[49,21,7],old:29};
const XF={tab:'mk',flt:'all',sort:'end',open:null,n:30,msg:'',hf:'me',u21:false};
const TMD=()=>WD.tm||(WD.tm={t:0,nid:1,list:[],hist:[],news:[],alert:false});
const sameK=(a,b)=>!!(a&&b&&a.li===b.li&&a.ti===b.ti);
function hs(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
const nz=s=>hs(s)*2-1;// stabil "tilfældighed" pr. hold og spiller, så en manager altid fejlvurderer den samme spiller på samme måde
const cash=d=>d.cash!=null?d.cash:(d.cash=teamWage(d));// startkasse = én sæsons løn
const money=k=>isMe(k)?ECON.fortune:cash(kdef(k));
let AIL=[];const aiList=()=>AIL=WD.lg.flatMap((g,li)=>g.teams.map((t,ti)=>({d:t.def,t,k:{li,ti}}))).filter(x=>!isMe(x.k));
/* daglig cache for værdier */
let VC={t:-1,m:new Map(),v:new Map()};
function vcx(){const t=TMD().t;if(VC.t!==t)VC={t,m:new Map(),v:new Map()};return VC}
const pv=p=>{const c=vcx().v;let x=c.get(p[0]);if(x==null){x=pVal(p).tot;c.set(p[0],x)}return x};
// økonomi (ecq): managerens skøn over spillerens værdi. Fejl op til ±59 % ved 0,4 og ±5 % ved 1
const est=(d,p)=>pv(p)*Math.max(.05,1+nz('e'+d.name+'|'+p[0])*(.05+(1-ecq(d))*.9));
// holdstyring (mq): hvor nyttig spilleren er for netop dette hold. Dårlige managere ser limits skævt (op til ±15 ved 0,4)
// og ser kortere frem. Unge spillere fremskrives dobbelt så langt af gode managere.
function mVal(d,p){const c=vcx().m,k=d.name+'|'+p[0];let x=c.get(k);if(x!=null)return x;
 const q=mq(d),w=wts(d),c2=p.slice();c2[14]=p[14].map((l,i)=>cl(Math.round(l+nz('l'+d.name+'|'+p[0]+i)*(1-q)*25),40,100));
 x=.35*wEff(d,p,w)+.65*proj(c2,w,Math.round(49+q*49*(p[9]<=DEV.age?2:1)));c.set(k,x);return x}
function yT(d){if(d.yS!==WD.season){const q=mq(d);d.yS=WD.season;d.yT=q>=QG.good?DEV.yT[0]:q>=QG.mid?DEV.yT[1]:ri(0,2)}return d.yT}
const holdD=d=>{const q=mq(d);return q>=QG.good?DEV.hold[0]:q>=QG.mid?DEV.hold[1]:Math.round(DEV.hold[2]*hs('h'+d.name))};
/* auktioner */
const lsOf=n=>TMD().list.find(l=>l.n===n);
const plOf=l=>kdef(l.s).pl.find(p=>p[0]===l.n);
const topB=l=>l.b.length?l.b.reduce((a,b)=>b.a>a.a?b:a):null;
const nextMin=l=>{const t=topB(l);return t?t.a+Math.max(TRF.minInc,Math.round(t.a*TRF.inc)):l.min};
const leads=k=>TMD().list.filter(l=>{const t=topB(l);return t&&sameK(t.k,k)});
const reserved=k=>leads(k).reduce((a,l)=>a+topB(l).a,0);
const nListed=k=>TMD().list.filter(l=>sameK(l.s,k)).length;
const avail=()=>ECON.fortune-reserved(WD.me);
const dLeft=l=>l.left<=1?'sidste dag':l.left+' dage';
function news(txt,al){const T=TMD();T.news.unshift({s:WD.season,d:WD.day,txt});if(T.news.length>TRF.news)T.news.length=TRF.news;if(al)T.alert=true}
function listP(k,p,min){const T=TMD(),l={id:T.nid++,n:p[0],s:{li:k.li,ti:k.ti},min:Math.max(TRF.minInc,Math.round(min)),left:TRF.days,b:[],t0:T.t};T.list.push(l);return l}
function placeBid(l,k,a){l.b=l.b.filter(x=>!sameK(x.k,k));l.b.push({k:{li:k.li,ti:k.ti},a:Math.round(a)})}
function cleanup(){const T=TMD();T.list=T.list.filter(l=>{const p=plOf(l),t=topB(l);
 if(!p){if(isMe(l.s))news(`Salget af ${l.n} er annulleret, fordi han ikke længere er på holdet.`,true);else if(t&&isMe(t.k))news(`Auktionen om ${l.n} er annulleret.`,true);return false}
 if(isMe(l.s)&&p[15]>=0){news(`${l.n} er rykket ind i startfemmeren og er taget af transferlisten.`,true);return false}
 return true})}
function doTransfer(l,p,b){const T=TMD(),S=kdef(l.s),B=kdef(b.k),meB=isMe(b.k),meS=isMe(l.s);
 if(!meB&&ysFull(B,p)){// fuld AI-trup: frigiver sin svageste bænkspiller
  const r=B.pl.filter(q=>q[15]<0&&!lsOf(q[0])&&ysCut(B,q,p)).sort((x,y)=>mVal(B,x)-mVal(B,y))[0];if(!r)return false;B.pl.splice(B.pl.indexOf(r),1)}
 S.pl.splice(S.pl.indexOf(p),1);p[15]=-1;p[16]=-1;p[19]=0;p[20]=-1;p[26]=T.t;p[27]=null;B.pl.push(p);
 if(meB)ecoAdd('expense','Transfers',b.a);else B.cash=cash(B)-b.a;
 const fee=Math.round(b.a*TRF.fee);if(meS){ecoAdd('income','Transfers',b.a);ecoAdd('expense','Transfergebyr',fee)}else S.cash=cash(S)+b.a-fee;
 fixTeam(S);fixTeam(B);if(!meS)aiLineup(S);if(!meB)aiLineup(B);
 T.hist.unshift({n:p[0],age:p[9],a:b.a,fl:l.s.li,tl:b.k.li,fN:knm(l.s),tN:knm(b.k),s:WD.season,d:WD.day,me:meS||meB});if(T.hist.length>TRF.hist)T.hist.length=TRF.hist;
 if(meS)news(`<b>${p[0]} er solgt</b> til ${knm(b.k)} for ${kr(b.a)}. Efter transfergebyr (${Math.round(TRF.fee*100)} %) får du ${kr(b.a-fee)}.`,true);
 if(meB)news(`<b>Du har købt ${p[0]}</b> fra ${knm(l.s)} for ${kr(b.a)}. Han starter på bænken.`,true);
 return true}
function resolve(l){const T=TMD(),S=kdef(l.s),p=plOf(l);if(!p)return;
 for(const b of l.b.slice().sort((x,y)=>y.a-x.a)){const B=kdef(b.k);
  if(S.pl.length<=5)break;
  if(money(b.k)<b.a||(!isMe(b.k)&&aiRoom(B,b.k,wageOf(p))<b.a)){if(isMe(b.k))news(`Du havde ikke råd til dit bud på ${l.n}, så buddet bortfalder.`,true);continue}
  if(isMe(b.k)&&ysN(B.pl)>=TRF.maxSq){news(`Du vandt auktionen om ${l.n}, men truppen er fuld (7/7). Buddet bortfalder.`,true);continue}
  if(doTransfer(l,p,b))return}
 p[27]=T.t;if(isMe(l.s))news(`${l.n} blev ikke solgt og er tilbage på bænken.`,true)}
/* AI-bud. Holdstyring afgør, hvem der er interessant. Økonomi afgør pris og budget. */
function aiBidPass(){const T=TMD();if(!T.list.length)return;
 for(const {d,k} of shuffle(AIL)){if(leads(k).length)continue;
  const q=ecq(d),m=mq(d),rf=richF(d),res=(q>=QG.good?.3:q>=QG.mid?.15:0)*(1-rf),cap=cash(d)*(1-res);if(cap<TRF.minInc)continue;
  const cand=T.list.filter(l=>!sameK(l.s,k)&&nextMin(l)<=cap&&mkVis(d,k,l));if(!cand.length)continue;
  const sq=d.pl.map(p=>mVal(d,p)).sort((a,b)=>b-a),fifth=sq[4]||0,worst=sq[sq.length-1]||0,yc=d.pl.filter(p=>p[9]<=DEV.age).length,room=ysN(d.pl)-nListed(k)<TRF.maxSq;
  let best=null;
  for(const l of cand){const p=plOf(l);if(!p)continue;const need=nextMin(l),mv=mVal(d,p);let want=0;
   if(mv>fifth*(1.02-TRF.rich.up*rf))want=1;// forbedrer startfemmeren
   else if(p[9]<=DEV.age&&yc<yT(d)&&mv>worst)want=.9;// udfylder en udviklingsplads
   else if(m<QG.mid&&hs('r'+T.t+d.name+l.id)<(QG.mid-m)*.5&&mv>worst*.9)want=.8;// dårlig holdstyring: impulskøb
   if(!want||(!room&&mv<=worst))continue;
   const rm=aiRoom(d,k,wageOf(p));if(need>rm)continue;// budgetvagt: købet og lønnen skal kunne betales resten af sæsonen
   const lim=q>=QG.good&&p[9]>DEV.age?cap*.75:cap;// gode økonomer holder en del af kassen til unge
   const maxW=Math.min(lim,rm,est(d,p)*want*(q>=QG.good?.95:1+Math.max(0,QG.mid-q)*.5)*(1+TRF.rich.pay*rf));
   if(need>maxW)continue;const sc=(maxW-need)/maxW;if(!best||sc>best.sc)best={l,need,maxW,sc}}
  if(best){const a=q>=QG.mid?best.need:Math.min(best.maxW,best.need*(1+(QG.mid-q)*1.5));placeBid(best.l,k,a)}}}
/* AI-salg */
function aiSell(){const T=TMD();
 for(const {d,k} of AIL){if(d.pl.length<=5||hs('v'+T.t+d.name)>=TRF.sellP)continue;
  const own=nListed(k);if(own>=2||d.pl.length-own<=5)continue;
  const q=ecq(d),m=mq(d),yt=yT(d),hd=holdD(d);
  const bench=d.pl.filter(p=>p[15]<0&&!lsOf(p[0])&&!(p[27]!=null&&p[27]>T.t-3));if(!bench.length)continue;
  const youth=d.pl.filter(p=>p[9]<=DEV.age).sort((a,b)=>mVal(d,b)-mVal(d,a)).slice(0,yt);
  const prot=p=>youth.includes(p)||(p[9]<=DEV.age&&T.t-(p[26]||0)<hd);
  const cand=bench.filter(p=>!prot(p)).sort((a,b)=>mVal(d,a)-mVal(d,b));
  let pick=null;
  if(cand.length&&ysN(d.pl)-own>5+yt)pick=cand[0];// for mange spillere i forhold til planen: den mindst nyttige ryger
  else if(q>=QG.good)pick=cand.find(p=>p[9]>=DEV.old||p[14].every((l,i)=>p[SI[i]]>=l-1))||null;// sælg på toppen
  if(!pick&&m<QG.mid&&hs('x'+T.t+d.name)<(QG.mid-m)*.5)pick=pk(bench);// dårlig holdstyring: kan sælge et talent
  if(!pick)continue;
  const f=q>=QG.good?.95+rnd()*.1:q>=QG.mid?.8+rnd()*.3:.5+rnd()*.7;listP(k,pick,nice(est(d,pick)*f)||TRF.minInc)}}
function mktDay(){const T=TMD();vcx();aiList();cleanup();
 const before=new Map(T.list.map(l=>[l.id,topB(l)]));
 for(let i=0;i<TRF.passes;i++)aiBidPass();
 T.list.forEach(l=>{const a=before.get(l.id),b=topB(l);if(!b||(a&&a.a===b.a&&sameK(a.k,b.k)))return;
  if(isMe(l.s))news(`Nyt højeste bud på ${l.n}: ${kr(b.a)} fra ${knm(b.k)}.`,true);
  if(a&&isMe(a.k)&&!isMe(b.k))news(`Du er overbudt på ${l.n}: ${kr(b.a)} fra ${knm(b.k)}.`,true)});
 const due=T.list.filter(l=>--l.left<=0);T.list=T.list.filter(l=>l.left>0);due.forEach(resolve);
 aiSell();T.t++}
/* AI-indtægter: samme sponsorvilkår som dit hold (kamp, uge, sæson og underskrift) */
let DKEY=new Map();
function keyD(d){let k=DKEY.get(d);if(k)return k;DKEY=new Map();WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>DKEY.set(t.def,{li,ti,t})));return DKEY.get(d)}
function aiMatchPay(defs){if(!WD||!M)return;defs.forEach((d,i)=>{const k=keyD(d);if(!k||isMe(k))return;const s=k.t.sp;if(!s||!s.c)return;const my=M.score[i],op=M.score[1-i];
 const a=(s.c.round||0)*my+(my>op?s.c.match||0:0)+(s.c.youth||0)*line(d).filter(p=>p[9]<21).length;if(a>0)d.cash=cash(d)+Math.round(a)})}
function aiWeek(){aiList().forEach(({d,t})=>{const s=t.sp;if(!s||!s.c)return;d.cash=cash(d)+Math.round((s.c.week||0)+(s.c.natp||0)*line(d).filter(p=>p[11]===s.nat).length)})}
function aiSeasonPay(){const f=WD.po&&WD.po[4]&&WD.po[4][0],w=f&&f.res?winK(f):null;
 WD.lg.forEach((g,li)=>{const T=tbl(g);g.teams.forEach((t,ti)=>{if(isMe({li,ti}))return;const s=t.sp;if(!s||!s.c)return;const pos=T.findIndex(x=>x.i===ti)+1,clw=w&&w.li===li&&w.ti===ti;
  const a=plPay(s.c,pos,s.v3)+(s.c.title||0)*((pos===1?1:0)+(clw?2:0));if(a>0)t.def.cash=cash(t.def)+Math.round(a)})})}
{const _g=gain;gain=function(defs){_g(defs);aiMatchPay(defs)}}
{const _s=setSp;setSp=function(t,o,mine){_s(t,o,mine);if(!mine&&o&&o.c&&o.c.sign)t.def.cash=cash(t.def)+o.c.sign}}
{const _ed=endDay;endDay=function(){
 try{mktDay();if(WD.day+1>=NDAYS)aiSeasonPay()}catch(e){console.error(e);globalThis.onerror&&globalThis.onerror('Transfer: '+e.message,'',0)}
 _ed();if(WD.day%7===0)aiWeek();if(VIEW==='xf')renderTransfer();if(VIEW==='tv')renderTactics();renderNav();saveGame()}}
/* UI */
VT.xf='Transfer';
{const _sh=show;show=function(v){_sh(v);$('xf').style.display=v==='xf'?'':'none'}}
renderNav=function(){
 const it=[['lg','Liga'],['cl','CL'],['tv','Taktik'],['ov','Hold'],['tr','Træning'],['ty','Tryout'],['xf','Transfer'],['ec','Økonomi'],['sp','Sponsor'],['hf','HoF'],['fq','FAQ']];if(live()||VIEW==='mv')it.push(['mv','Kamp']);
 const al={tr:WD.maxNew,ty:WD.tryNew,xf:WD.tm&&WD.tm.alert};
 $('nav').innerHTML=it.map(([k,t])=>`<button class="${VIEW===k?'on':''}${al[k]&&VIEW!==k?' alert':''}" data-v="${k}">${t}</button>`).join('')+'<button data-x="gem" class="sv">Gem</button><button data-x="nyt" class="sv">Nyt spil</button>';
 $('nx').textContent=BUSY?'Simulerer…':WD.needName?'Navngiv hold':WD.needSp?'Vælg sponsor':live()?'Til kamp':(dayRound(WD.day)||myCL())?'Spil kamp':'Næste dag';$('nx').disabled=BUSY};
{const _nc=$('nav').onclick;$('nav').onclick=e=>{const b=e.target.closest('[data-v]');if(b&&b.dataset.v==='xf')return showTransfer();_nc(e)}}
function showTransfer(){show('xf');TMD().alert=false;renderTransfer();renderNav()}
const inp=(id,v,min)=>`<input id="${id}" type="number" inputmode="numeric" min="${min}" step="100" value="${v}" style="flex:1;min-width:0;padding:9px;font:inherit;border:1px solid #000;border-radius:0">`;
const pHead=p=>{const sp=p[23]?SPEC[p[23]]:null;return `<span class="nm">${flag(FLAGC[p[11]])} ${sp?`<span title="${sp[1]}">${sp[0]}</span> `:''}<b>${p[0]}</b> <span class="mu">${p[9]} år · ${fl(tot(p))}/1000</span></span>`};
function bidBox(l){const need=nextMin(l);return `<div class="bar" style="align-items:center;margin-bottom:2px">${inp('xb'+l.id,need,need)}<button data-xb="${l.id}" style="flex:0 0 auto">Byd</button></div><div class="mu">Mindst ${kr(need)} · disponibelt ${kr(avail())}</div>`}
function renderTransfer(){cleanup();const T=TMD(),seg=(v,l)=>`<button class="${XF.tab===v?'on':''}" data-xt="${v}">${l}</button>`,r=reserved(WD.me);
 let h=`<div class="hd"><b>Transfer</b><span class="mu">Formue ${kr(ECON.fortune)}${r?` · ${kr(r)} i bud`:''}</span></div>`;
 if(XF.msg){h+=`<div class="tm" style="border-color:#f28c1e;background:#fff7ec">${XF.msg}</div>`;XF.msg=''}
 h+=`<div class="bar sm">${seg('mk','Marked')}${seg('my','Mine')}${seg('hi','Historik')}</div>`;
 $('xf').innerHTML=h+(XF.tab==='mk'?mkHTML():XF.tab==='my'?myHTML():hiHTML())}
function mkHTML(){const T=TMD();let L=T.list.filter(l=>!isMe(l.s));
 if(XF.flt==='lg')L=L.filter(l=>l.s.li===WD.me.li);else if(XF.flt!=='all')L=L.filter(l=>l.s.li===+XF.flt);
 const P=new Map(L.map(l=>[l,plOf(l)]));L=L.filter(l=>P.get(l)&&(!XF.u21||P.get(l)[9]<=DEV.age));
 L.sort({end:(a,b)=>a.left-b.left||a.id-b.id,val:(a,b)=>pVal2(P.get(b))-pVal2(P.get(a)),age:(a,b)=>P.get(a)[9]-P.get(b)[9]||a.left-b.left,price:(a,b)=>nextMin(a)-nextMin(b)}[XF.sort]);
 const ord=WD.lg.map((x,i)=>i).sort((a,b)=>WD.lg[a].c.localeCompare(WD.lg[b].c,'da'));
 let h=`<div class="tm"><div class="cg2"><select data-xf="flt"><option value="all" ${XF.flt==='all'?'selected':''}>Alle lande</option>${ord.map(i=>`<option value="${i}" ${XF.flt===String(i)?'selected':''}>${WD.lg[i].c}</option>`).join('')}</select><select data-xf="sort">${[['end','Slutter først'],['val','Højeste værdi'],['age','Yngste'],['price','Billigste']].map(([v,t])=>`<option value="${v}" ${XF.sort===v?'selected':''}>${t}</option>`).join('')}</select></div><label class="mu" style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" data-xf="u21" ${XF.u21?'checked':''}> Kun spillere på højst ${DEV.age} år</label></div>`;
 h+=`<div class="tm"><h3>${L.length} spiller${L.length===1?'':'e'} til salg</h3>`+(L.length?L.slice(0,XF.n).map(l=>rowHTML(l,P.get(l))).join(''):`<div class="mu">Ingen spillere til salg her lige nu. AI-holdene sætter nye spillere til salg hver dag.</div>`)+(L.length>XF.n?`<button data-xm="1" style="width:100%;margin-top:6px">Vis flere</button>`:'')+'</div>';
 return h}
function rowHTML(l,p){const t=topB(l),meT=t&&isMe(t.k),o=XF.open===l.id;
 let h=`<div data-xo="${l.id}" style="border-top:1px solid var(--bd);padding:7px 0;cursor:pointer"><div class="sl" style="font-size:13px;gap:6px">${pHead(p)}<b style="white-space:nowrap">${kr(pVal2(p))}</b></div><div class="mu">${flag(FLAGC[l.s.li])} ${knm(l.s)} · løn ${kr(wageOf(p))} · ${t?`<span style="${meT?'color:#1e9e4a;font-weight:700':'color:var(--tx)'}">Bud ${kr(t.a)}${meT?' (dig)':''}</span>`:`Min. ${kr(l.min)}`} · ${dLeft(l)} ${o?'▴':'▾'}</div></div>`;
 return o?h+detailHTML(l,p):h}
function detailHTML(l,p){const t=topB(l),meT=t&&isMe(t.k),S=kdef(l.s),full=ysN(TEAMS[0].pl)+leads(WD.me).length>=TRF.maxSq;
 let h=`<div style="padding:0 0 10px"><div class="mu" style="margin-bottom:4px">Sælger: ${knm(l.s)}</div>${pCard(p)}`;
 h+=`<div class="mu" style="margin:8px 0 2px">${t?`Højeste bud: <b style="color:var(--tx)">${kr(t.a)}</b> fra ${meT?'dig':knm(t.k)} · ${l.b.length} byder${l.b.length===1?'':'e'}`:`Ingen bud endnu · mindstepris ${kr(l.min)}`}</div>`;
 if(meT)h+=`<div style="color:#1e9e4a;font-weight:700">Du fører auktionen. Den slutter om ${dLeft(l)}.</div>`;
 else if(full)h+=`<div class="mu">Din trup er fuld (7/7, inkl. auktioner du fører). Sæt en spiller til salg eller kick en, før du byder.</div>`;
 else h+=bidBox(l);
 return h+'</div>'}
function myHTML(){const T=TMD(),d=TEAMS[0],mine=T.list.filter(l=>isMe(l.s)),bids=T.list.filter(l=>!isMe(l.s)&&l.b.some(b=>isMe(b.k)));
 let h='';
 if(T.news.length)h+=`<div class="tm"><h3>Nyheder</h3>${T.news.slice(0,8).map(n=>`<div style="padding:3px 0;border-top:1px solid var(--bd)"><span class="mu">Sæson ${n.s}, uge ${Math.floor(n.d/7)+1} ${DAYS[n.d%7]}:</span> ${n.txt}</div>`).join('')}</div>`;
 h+=`<div class="tm"><h3>Til salg (${mine.length})</h3>`+(mine.length?mine.map(l=>{const p=plOf(l),t=topB(l);return `<div style="border-top:1px solid var(--bd);padding:7px 0"><div class="sl" style="font-size:13px;gap:6px">${pHead(p)}<span style="white-space:nowrap">${dLeft(l)}</span></div><div class="mu">Mindstepris ${kr(l.min)} · værdi ${kr(pVal2(p))}</div><div style="margin-top:2px">${t?`Højeste bud <b>${kr(t.a)}</b> fra ${knm(t.k)}`:'<span class="mu">Ingen bud endnu</span>'}</div><button data-xw="${l.id}" style="width:100%;margin-top:6px;padding:6px">Træk tilbage</button></div>`}).join(''):'<div class="mu">Ingen spillere til salg.</div>')+'</div>';
 const bench=d.pl.filter(p=>p[15]<0&&!lsOf(p[0]));
 h+=`<div class="tm"><h3>Sæt til salg</h3><div class="mu" style="margin-bottom:4px">Kun bænkspillere kan sættes til salg. Auktionen varer ${TRF.days} dage (forlænges ved nye bud på sidste dag), og spilleren kan ikke rykkes ind i startfemmeren imens. Holdet skal beholde mindst 5 spillere.</div>`;
 if(!bench.length)h+=`<div class="mu" style="padding:4px 0">${d.pl.some(p=>p[15]<0)?'Alle dine bænkspillere er allerede til salg.':'Du har ingen spillere på bænken. Sæt en spiller på bænken i Taktik-fanen først.'}</div>`;
 else h+=bench.map(p=>{const j=d.pl.indexOf(p),v=pv(p);return `<div style="border-top:1px solid var(--bd);padding:7px 0"><div class="sl" style="font-size:13px;gap:6px">${pHead(p)}<b style="white-space:nowrap">${kr(pVal2(p))}</b></div><div class="mu" style="margin-top:4px">Mindstepris</div><div class="bar" style="align-items:center;margin:2px 0 0">${inp('xs'+j,nice(v)||TRF.minInc,TRF.minInc)}<button data-xs="${j}" style="flex:0 0 auto">Sæt til salg</button></div></div>`}).join('');
 h+='</div>';
 h+=`<div class="tm"><h3>Mine bud (${bids.length})</h3>`+(bids.length?bids.map(l=>{const p=plOf(l),t=topB(l),my=l.b.find(b=>isMe(b.k)),lead=isMe(t.k);return `<div style="border-top:1px solid var(--bd);padding:7px 0"><div class="sl" style="font-size:13px;gap:6px">${pHead(p)}<span style="white-space:nowrap">${dLeft(l)}</span></div><div class="mu">${knm(l.s)} · dit bud ${kr(my.a)} · <span style="color:${lead?'#1e9e4a':'#d4352b'};font-weight:700">${lead?'Du fører':`Overbudt: ${kr(t.a)}`}</span></div>${lead?'':bidBox(l)}</div>`}).join(''):'<div class="mu">Du har ingen aktive bud.</div>')+'</div>';
 return h}
function hiHTML(){const T=TMD(),f=XF.hf;let H=T.hist;
 if(f==='me')H=H.filter(x=>x.me);else if(f==='lg')H=H.filter(x=>x.fl===WD.me.li||x.tl===WD.me.li);
 const seg=(v,l)=>`<button class="${f===v?'on':''}" data-xh="${v}">${l}</button>`;
 return `<div class="bar sm">${seg('me','Mine')}${seg('all','Alle')}</div><div class="tm"><h3>Seneste handler</h3>`+(H.length?H.slice(0,60).map(x=>`<div style="border-top:1px solid var(--bd);padding:6px 0"><div class="sl" style="font-size:13px;gap:6px"><span class="nm"><b>${x.n}</b> <span class="mu">${x.age} år</span></span><b style="white-space:nowrap">${kr(x.a)}</b></div><div class="mu">${flag(FLAGC[x.fl])} ${x.fN} → ${flag(FLAGC[x.tl])} ${x.tN} · sæson ${x.s}, uge ${Math.floor(x.d/7)+1}</div></div>`).join(''):'<div class="mu">Ingen handler endnu.</div>')+'</div>'}
function userBid(id){const T=TMD(),l=T.list.find(x=>x.id===id);if(!l){XF.msg='Auktionen er slut.';return}
 const a=Math.round(+(($('xb'+id)||{}).value)||0),need=nextMin(l),t=topB(l);
 if(t&&isMe(t.k)){XF.msg='Du fører allerede auktionen.';return}
 if(!(a>=need)){XF.msg=`Buddet skal være mindst ${kr(need)}.`;return}
 if(a>avail()){XF.msg=`Du har kun ${kr(avail())} disponibelt (formue minus bud, du fører).`;return}
 if(ysN(TEAMS[0].pl)+leads(WD.me).length>=TRF.maxSq){XF.msg='Din trup er fuld.';return}
 placeBid(l,WD.me,a);XF.msg=`Du byder ${kr(a)} på ${l.n}. Auktionen slutter om ${dLeft(l)}.`}
function userList(j){const d=TEAMS[0],p=d.pl[j];if(!p||p[15]>=0||lsOf(p[0]))return;
 const a=Math.round(+(($('xs'+j)||{}).value)||0);if(!(a>=TRF.minInc)){XF.msg=`Mindsteprisen skal være mindst ${kr(TRF.minInc)}.`;return}
 if(d.pl.length-nListed(WD.me)<=5){XF.msg='Holdet skal beholde mindst 5 spillere.';return}
 listP(WD.me,p,a);XF.msg=`${p[0]} er sat til salg i ${TRF.days} dage med mindstepris ${kr(a)}.`}
$('xf').addEventListener('click',e=>{const b=e.target.closest('[data-xt],[data-xo],[data-xb],[data-xs],[data-xw],[data-xm],[data-xh]');if(!b)return;const D=b.dataset,T=TMD();
 if(D.xt){XF.tab=D.xt;XF.open=null}else if(D.xo){const id=+D.xo;XF.open=XF.open===id?null:id}else if(D.xm)XF.n+=30;else if(D.xh)XF.hf=D.xh;
 else if(D.xb)userBid(+D.xb);else if(D.xs)userList(+D.xs);
 else if(D.xw){const l=T.list.find(x=>x.id===+D.xw);if(l){T.list=T.list.filter(x=>x!==l);XF.msg=`${l.n} er taget af transferlisten.`}}
 renderTransfer();if(D.xb||D.xs||D.xw)saveGame()});
$('xf').addEventListener('change',e=>{const k=e.target.dataset.xf;if(!k)return;if(k==='u21')XF.u21=e.target.checked;else XF[k]=e.target.value;XF.n=30;XF.open=null;renderTransfer()});
/* til salg-spillere kan ikke rykkes ind i startfemmeren */
{const _tc=$('tv').onclick;$('tv').onclick=e=>{const b=e.target.closest('[data-a]');if(b){const[a,v]=b.dataset.a.split('|');if(a==='lu'&&TU.swapIn==null){const p=TEAMS[0].pl[+v];if(p&&p[15]<0&&lsOf(p[0])){TU.note=`${p[0]} er til salg og kan ikke rykkes ind i startfemmeren. Træk ham tilbage i Transfer-fanen først.`;return renderTactics()}}}_tc(e)}}
/* (flyttet hertil ved opdelingen i filer: skal være defineret, før den pakkes ind nedenfor) */
function renderTactics(){
 const d=TEAMS[0];syncRoles(d);const sd=TU.side,l=MGR[TU.map][sd][TU.bt],sg=(a,v,t,on)=>`<button class="${on?'on':''}" data-a="${a}|${v}">${t}</button>`;
 const sel=s=>`<select data-r="${s[0]}|${s[1]}">${ROLES[s[0]].map((r,k)=>`<option value="${k}" ${d.roles[s[0]][s[1]]===k?'selected':''}>${r}</option>`).join('')}</select>`;
 const ds=n=>TU.open!==n?'':`<div class="dsc">${sd==='T'?ROLES.T.map((r,k)=>`<div><b>${r} (${d.pl[d.roles.T.indexOf(k)][0]})</b>: ${tDesc('T',n,k)}</div>`).join(''):ROLES.CT.map((r,k)=>`<div><b>${r} (${d.pl[d.roles.CT.indexOf(k)][0]})</b>: ${tDesc('CT',n,k)}</div>`).join('')+`<div style="margin-top:4px">Dør en CT på et site før plant, eller ser en CT mindst 2 T på vej mod et site, kan IGL'en kalde rotation dertil. Jo højere lederskab, jo oftere og hurtigere. Ankeret på det andet site bliver. En CT uden for sitene, der er i undertal, trækker sig tilbage til sitet.</div>`}</div>`;
 let h=`<div class="hd"><b>Taktik – ${d.name}</b><button style="flex:0 0 auto;padding:6px 12px" data-a="back|">Tilbage</button></div>`;
 h+=`<div class="tm rl"><h3>Spillere ${d.pl.length}/7 · lineup (■) og positioner</h3>${TU.swapIn!=null?'<div class="mu">Vælg den lineup-spiller (■), der skal ud</div>':''}<div class="r eq"><div>Spiller</div><div>Position</div><div></div><div></div></div>${d.pl.map((p,j)=>`<div class="r"><div class="nm" data-a="lu|${j}" style="cursor:pointer">${p[15]>=0?'■':'□'} ${p[0]}${j===d.igl?' <small>IGL</small>':''}</div>${p[15]>=0?sel(['T',j]):'<div class="mu">Bænk</div>'}<div></div><div></div></div>`).join('')}<div class="eq" style="padding-top:6px">Pos 1 er IGL. Positionerne bruges på både T- og CT-siden og gælder på alle maps. I taktikkerne følger hver spiller ruten for sin position.</div></div>`;
 h+=`<div class="tm"><h3>Taktikker på ${mapN(TU.map)} (${l.length}/${MAXSEL}) <span style="font-weight:400;color:var(--mu)">${['A','M','P'].map(s=>l.filter(n=>STYLE[n]===s).length+' '+SL[s].toLowerCase()).join(' · ')}</span></h3><div class="bar sm">${MAPIDS.map(m=>sg('map',m,mapN(m)+(seasonMaps().includes(m)?' ●':''),TU.map===m)).join('')}</div><div class="eq" style="padding-bottom:6px">● = i rotation denne sæson (${seasonMaps().map(mapN).join(' og ')}). Næste sæson roterer ${mapN(rotOut())} ud, og ${mapN(rotIn())} kommer ind.</div><div class="bar">${sg('side','T','T-side',sd==='T')}${sg('side','CT','CT-side',sd==='CT')}</div><div class="bar">${['pistol','standard','eco'].map(b=>sg('bt',b,b[0].toUpperCase()+b.slice(1),TU.bt===b)).join('')}</div>`;
 h+=l.map((n,i)=>`<div class="r tr"><span>${i+1}</span><div class="nm" data-a="open|${n}" style="cursor:pointer">${n} <small>· ${SL[STYLE[n]]} ▾</small></div><button data-a="up|${i}">▲</button><button data-a="dn|${i}">▼</button><button data-a="rm|${i}">✕</button></div>${ds(n)}`).join('');
 h+=tnOf(TU.map,sd).filter(n=>!l.includes(n)).map(n=>`<div class="r tr off"><span></span><div class="nm" data-a="open|${n}" style="cursor:pointer">${n} <small>· ${SL[STYLE[n]]} ▾</small></div><button data-a="add|${n}" ${l.length>=MAXSEL?'disabled':''}>+</button><span></span><span></span></div>${ds(n)}`).join('');
 h+=`<div class="eq" style="padding-top:6px">Hvert map har sin egen rækkefølge. Tryk på en taktik for at se, hvad rollerne gør på ${mapN(TU.map)}. Rækkefølgen er den, taktikkerne spilles i. Den starter forfra, når listen er løbet igennem.</div></div>`;
 $('tv').innerHTML=h}
{const _rt=renderTactics;renderTactics=function(){_rt();TEAMS[0].pl.forEach((p,j)=>{if(p[15]<0&&lsOf(p[0])){const el=$('tv').querySelector(`[data-a="lu|${j}"]`);if(el)el.insertAdjacentHTML('beforeend',' <small style="color:#b4560a">Til salg</small>')}});
 if(TU.note){const c=$('tv').querySelector('.tm.rl h3');if(c)c.insertAdjacentHTML('afterend',`<div style="color:#d4352b;font-size:12px;padding:2px 0 4px">${TU.note}</div>`);TU.note=null}}}
{const _ro=renderOverview;renderOverview=function(){_ro();const cs=$('ov').querySelectorAll('.tm');TEAMS[0].pl.forEach((p,j)=>{if(lsOf(p[0])&&cs[j]){const h=cs[j].querySelector('h3');if(h)h.insertAdjacentHTML('beforeend',' <small style="color:#b4560a">Til salg</small>')}})}}
{const _rf=renderFaq;renderFaq=function(){_rf();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Transfers</h3>${li([`<b>Salg:</b> kun bænkspillere kan sættes til salg. Du sætter en mindstepris, og auktionen varer ${TRF.days} dage. Imens kan spilleren ikke rykkes ind i startfemmeren. Holdet skal beholde mindst 5 spillere.`,`<b>Bud:</b> et overbud skal være mindst ${Math.round(TRF.inc*100)} % over det højeste bud (mindst ${kr(TRF.minInc)}). AI-holdene byder ved hvert dagsskift. Det højeste bud vinder, når auktionen slutter. Kommer der et nyt højeste bud på sidste dag, forlænges auktionen en dag – og igen, indtil en dag går uden nyt bud. Har byderen ikke råd eller plads, går spilleren til næsthøjeste bud.`,'<b>Usolgt:</b> spilleren vender tilbage til bænken, og du kan sætte ham til salg igen.',`<b>Transfergebyr:</b> sælgeren betaler ${Math.round(TRF.fee*100)} % af salgsprisen i gebyr. Køberen betaler den fulde pris. Gebyret gælder for alle handler, også mellem AI-hold.`,'<b>Køb:</b> du kan byde på alle AI-holds spillere i alle lande. Dine bud, du fører, er reserveret i din formue. Truppen må højst have 7 spillere, inkl. auktioner du fører.',`<b>AI-holdstyring:</b> afgør, hvem et AI-hold vil købe og sælge. Gode managere ser spillernes limits korrekt, fremskriver unge spillere op til to sæsoner og holder 2 unge (højst ${DEV.age} år) på bænken til udvikling. Unge talenter sælges ikke, før de har haft ${DEV.hold[0]} dage. Middel managere holder 1 ung og venter ${DEV.hold[1]} dage. Dårlige managere ser limits skævt, ser kortere frem, holder 0-2 unge tilfældigt, impulskøber og kan sælge et talent alt for tidligt.`,`<b>AI-økonomi:</b> afgør pris og budget. Gode økonomer vurderer værdien næsten præcist, byder aldrig over 95 % af deres skøn, holder 30 % af kassen i reserve og en del til unge spillere og sælger bænkspillere fra ${DEV.old} år, før aldringen trækker værdien ned. Dårlige økonomer kan skyde op til ca. 60 % forkert, hopper i bud, bruger hele kassen og sætter mindstepriser for lavt.`,'<b>AI-kasser:</b> AI-holdene tjener penge på samme sponsorvilkår som dig: ugebeløb, kampbonusser, underskrift og sæsonbonus. Er en AI-trup fuld, når den køber, frigiver den sin svageste bænkspiller.',`<b>AI-marked:</b> hvert AI-hold ser hver dag ${Math.round(TRF.scan*100)} % af spillerne til salg uden for sin egen liga – en tilfældig del, som er forskellig fra hold til hold – og alle spillere i egen liga. De bedste spillere (på niveau med de ${Math.round((1-MKV.starPct)*100)} % bedste AI-startere) ser alle hold.`,`<b>AI-strategi:</b> hver AI-manager er enten <i>løbende udskifter</i> eller <i>dynastibygger</i>. Jo bedre økonomi, jo oftere løbende udskifter (${Math.round(STR.pC[0]*100)}–${Math.round(STR.pC[1]*100)} %). Løbende udskiftere skifter ældre startere ud i god tid, men sælger kun, når en bænkspiller er næsten lige så god. Dynastibyggere holder fast i holdet, indtil det falder i ligaen (gode managere opdager det efter ${STR.dDrop[0]} placeringer, middel efter ${STR.dDrop[1]}, dårlige efter ${STR.dDrop[2]}), og genopbygger så med yngre spillere og sælger startere fra ${STR.rbSell} år.`,`<b>Ungdomsplads:</b> alle hold – også dit – har én ekstra plads til en egen tryout under ${YS.age} år. Han får halv løn, og pladsen tæller ikke med i de 7. Har en anden egen tryout under ${YS.age} allerede pladsen, overtager en ny kun pladsen, hvis hans limits samlet er mindst ${YS.swap} højere. Når indehaveren fylder ${YS.age}, bliver han en almindelig spiller. Bliver truppen så for stor, får du besked en uge før. Er der stadig for mange spillere på fødselsdagen, ryger den mindst værdifulde bænkspiller. AI-hold sætter selv en bænkspiller til salg en uge før.`])}</div>`)}}

/* ===== FASE 10: LØN, KAMPINDTÆGTER, PRÆMIER OG BUDGETVAGT ===== */
// Løn: wage = andel af spillerværdien pr. sæson. Fastsættes ved sæsonstart og når en spiller kommer til (tryout). Ved salg følger lønnen med.
// Alle andre beløb er andele af B = gennemsnitlig sæsonlønsum pr. hold i alle 24 ligaer, fastsat ved sæsonstart (så indtægterne følger lønniveauet).
// lg = ligaindtægt pr. hjemmekamp · fHi/fLo = landefaktor for nr. 1 og nr. 24 på koefficientlisten (gælder liga og ligapræmier)
// cl = CL-indtægt pr. hjemmekamp pr. fase (bronzekamp og finale er på neutral bane og deles ligeligt)
// prize = ligapræmie for nr. 1 før landefaktor · share = andel for nr. 1-3 · r16 = bonus for at nå 1/8-finalerne · sale = AI-mindstepris ved budgetsalg (× skøn)
// clP = CL-præmie for vinder, sølv og bronze (× B)
const ECO={clP:[1.5,.75,.5],wage:.1,lg:.06,fHi:1.6,fLo:.8,cl:{kq:.1,kf:.15,g:.15,r16:.3,qf:.45,sf:.6,br:.6,fin:1.2},prize:1,share:[1,.6,.35],r16:.4,sale:.6};
const CLST={5:'kq',6:'kf',33:'r16',34:'qf',40:'sf',41:'sf',46:'br',47:'fin'};
const CLN={kq:'kval-semifinale',kf:'kval-finale',g:'gruppekamp',r16:'1/8-finale',qf:'kvartfinale',sf:'semifinale',br:'bronzekamp',fin:'finale'};
// løn = andel af værdien af nuværende skills + erfaring + lederskab (potentiale, aldring og pensionsrisiko tæller ikke)
// Relativ løn: alle lønninger ganges med WD.wK, som sættes ved sæsonstart, så den gennemsnitlige spillerløn pr. hold er WD.B0 (START_WAGE).
// En spiller, der er bedre end gennemsnittet, får stadig mere i løn, men lønniveauet stiger ikke, når spillerne generelt bliver bedre.
function calcWage(p){const v=pVal(p);return Math.max(10,Math.round((v.sk+v.ex+v.ld)*ECO.wage*(WD&&WD.wK||1)*(p[23]==='greedy'?1.25:p[23]==='gear'?1.05:1)/10)*10)}
function wageOf(p){return p[28]!=null?p[28]:(p[28]=calcWage(p))}
function plWage(d){let s=0;for(const p of d.pl)s+=wageOf(p);return s}
function teamWage(d){return plWage(d)+(d.scout?d.scout.w:0)}
function setWages(){const all=()=>{WD.lg.forEach(g=>g.teams.forEach(t=>t.def.pl.forEach(p=>{p[28]=calcWage(p)})));let s=0,n=0;WD.lg.forEach(g=>g.teams.forEach(t=>{s+=plWage(t.def);n++}));return s/Math.max(1,n)};
 WD.wK=1;const raw=all();if(WD.B0==null)WD.B0=Math.round(raw);WD.wK=WD.B0/Math.max(1,raw);const s=all();if(WD.offer)WD.offer[28]=null;WD.ecoB=Math.max(1,Math.round(s))}
const ecoB=()=>{if(WD.ecoB==null)setWages();return WD.ecoB};
const lgFac=li=>{const r=Math.max(0,WD.rank.indexOf(li));return ECO.fHi-(ECO.fHi-ECO.fLo)*r/23};
const lgAmt=li=>Math.round(ecoB()*ECO.lg*lgFac(li));
const clAmt=st=>Math.round(ecoB()*ECO.cl[st]);
const prizeAmt=(li,pos)=>Math.round(ecoB()*ECO.prize*lgFac(li)*ECO.share[pos]);
/* bogføring */
function elog(t,a){(WD.elog=WD.elog||[]).unshift({s:WD.season,d:WD.day,t,a:Math.round(a)});if(WD.elog.length>40)WD.elog.length=40}
{const _ea=ecoAdd;ecoAdd=function(kind,cat,amt){_ea(kind,cat,amt);if(!WD)return;const L=WD.led=WD.led||{income:{},expense:{}};L[kind][cat]=(L[kind][cat]||0)+amt}}
function earn(k,cat,a,txt){a=Math.round(a);if(a<=0)return;if(isMe(k)){ecoAdd('income',cat,a);elog(txt,a)}else{const d=kdef(k);d.cash=cash(d)+a}}
/* kampindtægter (kun hjemmeholdet) */
function payMatches(D){
 const r=dayRound(D);
 if(r)WD.lg.forEach((g,li)=>{const a=lgAmt(li);g.fix[r-1].forEach(([h,aw])=>earn({li,ti:h},'Liga',a,`Ligakamp hjemme mod ${g.teams[aw].name}`))});
 const st=GDAYS[D]?'g':CLST[D];
 if(st)clList(D).forEach(({m})=>{if(!m.res)return;const a=clAmt(st);
  if(st==='br'||st==='fin'){earn(m.a,'Champions League',a/2,`CL-${CLN[st]} (delt indtægt)`);earn(m.b,'Champions League',a/2,`CL-${CLN[st]} (delt indtægt)`)}
  else earn(m.a,'Champions League',a,`CL-${CLN[st]} hjemme mod ${knm(m.b)}`)});
 WD.paidDay=D}
function payPrizes(){WD.lg.forEach((g,li)=>tbl(g).slice(0,3).forEach((s,i)=>earn({li,ti:s.i},'Præmiepenge',prizeAmt(li,i),`Ligapræmie: nr. ${i+1} i ${g.c}`)))}
function payCLP(D){if(!WD.po)return;const P=WD.po,a=x=>Math.round(ecoB()*ECO.clP[x]);
 if(D===47&&P[4]&&P[4][0]&&P[4][0].res){const m=P[4][0],w=winK(m),l=w===m.a?m.b:m.a;earn(w,'Præmiepenge',a(0),'CL-præmie: vinder');earn(l,'Præmiepenge',a(1),'CL-præmie: sølv')}
 if(D===46&&P[5]&&P[5][0]&&P[5][0].res)earn(winK(P[5][0]),'Præmiepenge',a(2),'CL-præmie: bronze')}
function payR16(){if(!WD.seeds||WD.r16s===WD.season)return;WD.r16s=WD.season;WD.seeds.forEach(k=>earn(k,'Præmiepenge',ecoB()*ECO.r16,'Bonus: kvalificeret til CL-playoff (1/8-finale)'))}
/* fremskrivning resten af sæsonen med kun sikre indtægter: sponsorens ugebeløb og ligahjemmekampe. Løn trækkes før ugens sponsorbeløb. */
function outlook(d,k,xw,me){const g=WD.lg[k.li],t=g.teams[k.ti],c=(t.sp&&t.sp.c)||{},sw=(c.week||0)+(me&&c.natp?c.natp*line(d).filter(p=>p[11]===t.sp.nat).length:0),wk=(teamWage(d)+(xw||0))/7,la=lgAmt(k.li);
 let b=me?ECON.fortune:cash(d),mn=b;const pd=WD.paidDay??-1,wd=WD.wageDay??-1;
 for(let D=WD.day;D<NDAYS;D++){if(D>pd){const r=dayRound(D);if(r&&g.fix[r-1].some(m=>m[0]===k.ti))b+=la}
  if((D+1)%7===0&&D>wd){b-=wk;if(b<mn)mn=b;b+=sw}}
 return{min:mn,end:b}}
// hvor meget et AI-hold kan bruge nu (med xw ekstra sæsonløn), uden at kassen kan gå i minus resten af sæsonen
const aiRoom=(d,k,xw)=>outlook(d,k,xw,false).min;
/* budgetvagt for AI */
function aiCut(d,k){
 const bench=d.pl.filter(p=>p[15]<0);let p;
 if(bench.length&&d.pl.length>5)p=bench.sort((a,b)=>mVal(d,a)/wageOf(a)-mVal(d,b)/wageOf(b))[0];// mindst nytte pr. lønkrone
 else{p=d.pl.slice().sort((a,b)=>wageOf(b)-wageOf(a))[0];if(!p||wageOf(p)<=10)return false}// sidste udvej: dyreste starter erstattes af en ung spiller
 d.pl.splice(d.pl.indexOf(p),1);fixTeam(d);aiLineup(d);
 if(k.li===WD.me.li)news(`${knm(k)} har sat ${p[0]} fri af økonomiske årsager.`,false);return true}
function aiGuard(d,k){let n=0;while(aiRoom(d,k,0)<0&&n++<12)if(!aiCut(d,k))break}
// ved sæsonstart sættes bænkspillere til salg, hvis sæsonen ikke kan betales. Er de ikke solgt inden første lønudbetaling, sættes de fri.
function aiSeasonGuard(){WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const k={li,ti},d=t.def;if(isMe(k))return;let need=-aiRoom(d,k,0);if(need<=0)return;
 const bench=d.pl.filter(p=>p[15]<0&&!lsOf(p[0])).sort((a,b)=>mVal(d,a)/wageOf(a)-mVal(d,b)/wageOf(b));
 for(const p of bench){if(need<=0||d.pl.length-nListed(k)<=5)break;listP(k,p,nice(est(d,p)*ECO.sale)||TRF.minInc);need-=wageOf(p)}}))}
function payWages(){WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const k={li,ti},d=t.def;
 if(isMe(k)){const w=Math.round(teamWage(d)/7);if(w>0){ecoAdd('expense','Løn',w);elog('Løn for ugen',-w)}return}
 aiGuard(d,k);d.cash=cash(d)-Math.round(teamWage(d)/7)}))}
/* AI-tryout: kun hvis lønnen kan betales */
aiTryout=function(d,n){const k=keyD(d);if(!k)return;
 if(d.pl.length<7){if(aiRoom(d,k,wageOf(n))>=0)d.pl.push(n);return}
 const w=wts(d),v=new Map(d.pl.map(p=>[p,aiVal(d,p,w)])),worst=d.pl.slice().sort((a,b)=>v.get(a)-v.get(b))[0];
 if(aiVal(d,n,w)>v.get(worst)&&aiRoom(d,k,wageOf(n)-wageOf(worst))>=0){d.pl.splice(d.pl.indexOf(worst),1);d.pl.push(n);fixTeam(d)}};
/* dit tryout: lønnen fastsættes, når spilleren skrives på */
$('ty').addEventListener('click',e=>{if(e.target.id==='tk1'&&WD.offer)WD.offer[28]=calcWage(WD.offer)},true);
/* dagsskift */
{const _e3=endDay;endDay=function(){
 if(WD.over)return showEcon();
 const D=WD.day;
 try{payMatches(D);payCLP(D);if((D+1)%7===0){payWages();WD.wageDay=D}if(D===NDAYS-1)payPrizes()}catch(e){console.error(e);globalThis.onerror&&globalThis.onerror('Økonomi: '+e.message,'',0)}
 _e3();
 try{
  if(WD.day===0){WD.paidDay=-1;WD.wageDay=-1;
   if(ECON.fortune<0)WD.over={s:WD.season-1,f:ECON.fortune};
   WD.ledPrev=WD.led;WD.led={income:{},expense:{}};setWages();if(!WD.over)aiSeasonGuard()}
  if(WD.day===28)payR16();
 }catch(e){console.error(e);globalThis.onerror&&globalThis.onerror('Økonomi: '+e.message,'',0)}
 saveGame();if(WD.over)showEcon();else if(VIEW==='ec')renderEcon()}}
{const _nd=nextDay;nextDay=function(s){if(WD.over)return showEcon();_nd(s)}}
{const _pn=playNext;playNext=function(){if(WD.over)return showEcon();_pn()}}
{const _rn=renderNav;renderNav=function(){_rn();if(WD&&WD.over){$('nx').textContent='Spillet er slut';$('nx').disabled=false}}}
/* nyt spil: startformue = START_CASH for alle hold (AI-hold får også underskriftsbonus fra deres første sponsor, ligesom du gør) */
const START_CASH=10000;
{const _nl=newLeague;newLeague=function(){
 ECON.fortune=0;Object.keys(ECON.income).forEach(c=>ECON.income[c]=0);Object.keys(ECON.expense).forEach(c=>ECON.expense[c]=0);
 _nl();setWages();WD.wageV=3;WD.paidDay=-1;WD.wageDay=-1;WD.led={income:{},expense:{}};WD.ledPrev=null;WD.elog=[];WD.over=null;
 const w=START_CASH;ECON.fortune+=w;elog('Startformue',w);
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{if(!isMe({li,ti}))t.def.cash=START_CASH+((t.sp&&t.sp.c&&t.sp.c.sign)||0)}))}}
/* gamle gemte spil */
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok){['Liga','Champions League','Præmiepenge'].forEach(c=>{if(ECON.income[c]==null)ECON.income[c]=0});if(ECON.expense['Løn']==null)ECON.expense['Løn']=0;
 if(WD.B0==null)WD.B0=START_WAGE;if(WD.ecoB==null){setWages();WD.paidDay=WD.day-1;WD.wageDay=WD.day-1}if(WD.wageV!==3){setWages();WD.wageV=3}if(WD.season===1&&WD.day===0)allocate();WD.led=WD.led||{income:{},expense:{}}}return ok}}
/* økonomi-fanen */
renderEcon=function(){
 const d=TEAMS[0],W=teamWage(d),o=outlook(d,WD.me,0,true),neg=ECON.fortune<0,B=ecoB(),f=lgFac(WD.me.li);
 const row=(a,b,c)=>`<div class="sl" style="padding:3px 0;gap:8px"><span>${a}</span><b style="white-space:nowrap${c?';color:'+c:''}">${b}</b></div>`;
 const led=(t,L)=>{if(!L)return'';const inc=Object.entries(L.income).filter(x=>x[1]),exp=Object.entries(L.expense).filter(x=>x[1]),ti=inc.reduce((a,x)=>a+x[1],0),te=exp.reduce((a,x)=>a+x[1],0);
  return `<div class="tm"><h3>${t}</h3>${inc.map(([k,v])=>row(k,kr(v))).join('')}${exp.map(([k,v])=>row(k,'−'+kr(v),'#d4352b')).join('')}${inc.length||exp.length?row('<b>Resultat</b>',kr(ti-te),ti-te<0?'#d4352b':'#1e9e4a'):'<div class="mu">Ingen posteringer endnu.</div>'}</div>`};
 const all=(t,O)=>`<div class="tm"><h3>${t}</h3>${Object.keys(O).filter(k=>O[k]||!['Personale','Træningsrum','Transfergebyr'].includes(k)).map(k=>row(k,kr(O[k]))).join('')}</div>`;
 let h=`<div class="hd"><b>Økonomi</b><span class="mu">Sæson ${WD.season} · uge ${Math.floor(WD.day/7)+1}</span></div>`;
 if(WD.over)h+=`<div class="tm" style="border-color:#d4352b;background:#fdecea"><h3 style="color:#d4352b">Spillet er slut</h3><div>${d.name} sluttede sæson ${WD.over.s} med en formue på <b>${kr(WD.over.f)}</b>. Formuen skal være positiv ved sæsonslut.</div><button data-eco="new" style="width:100%;margin-top:8px">Start nyt spil</button></div>`;
 h+=`<div class="tm"><h3>Samlet formue</h3><div style="font-size:26px;font-weight:700;color:${neg?'#d4352b':'#1e9e4a'}">${kr(ECON.fortune)}</div></div>`;
 h+=led(`Sæson ${WD.season} indtil nu`,WD.led)+(WD.ledPrev?led('Sidste sæson',WD.ledPrev):'');
 const E=WD.elog||[];if(E.length)h+=`<div class="tm"><h3>Seneste posteringer</h3>${E.slice(0,15).map(x=>row(`<span class="mu">S${x.s} u${Math.floor(x.d/7)+1} ${DAYS[x.d%7]}</span> ${x.t}`,(x.a<0?'−':'')+kr(Math.abs(x.a)),x.a<0?'#d4352b':null)).join('')}</div>`;
 h+=all('Indtægter i alt',ECON.income)+all('Udgifter i alt',ECON.expense);
 $('ec').innerHTML=h};
$('ec').addEventListener('click',e=>{if(!e.target.closest('[data-eco="new"]'))return;try{localStorage.removeItem(SAVE_KEY)}catch(x){}PN=100;NU.clear();newLeague()});
/* advarsel i liga-fanen */
/* (flyttet hertil ved opdelingen i filer: skal være defineret, før den pakkes ind nedenfor) */
function renderLeague(){
 const d=WD.day,wk=Math.floor(d/7)+1,di=d%7,r=dayRound(d),g=WD.lg[WD.view],me=WD.lg[WD.me.li],nm=i=>g.teams[i].name,mineM=m=>WD.view===WD.me.li&&(m[0]===WD.me.ti||m[1]===WD.me.ti);
 const cm=myCL();let today=r?`Ligakamp ${r} i dag · ${mapN(lgMap(r))}`:cm?`${cm.m.st||'CL-kvalifikation'} i dag · ${mapN(cm.m.map)}`:'Ingen kamp i dag';
 const line=(c,cls)=>`<div class="r ${cls||''}">${c.map((x,k)=>`<div class="${k===1?'nm':''}">${x}</div>`).join('')}</div>`;
 let h=`<div class="hd"><b>Sæson ${WD.season}</b><span class="mu">Uge ${wk} · ${DAYS[di]}${r?' · Ligakamp '+r+'/30':''}</span></div>`;
 h+=`<div class="tm"><h3>${today}</h3>${(r||myCL())&&!live()&&!BUSY&&!WD.needSp?'<button id="sim" style="width:100%;margin-top:6px">Simuler min kamp</button>':''}<div class="mu" style="margin-top:6px">Maps denne sæson: <b>${seasonMaps().map(mapN).join(' og ')}</b>. Næste sæson: ${seasonMaps(1).map(mapN).join(' og ')} (${mapN(rotOut())} roterer ud).</div></div>`;
 const ord=WD.lg.map((x,i)=>i).sort((a,b)=>WD.lg[a].c.localeCompare(WD.lg[b].c,'da'));
 h+=`<div class="tm"><select id="csel">${ord.map(i=>`<option value="${i}" ${i===WD.view?'selected':''}>${WD.lg[i].c}</option>`).join('')}</select><button id="frb" style="width:100%;margin-top:6px">${WD.frags?'Vis stilling':'Top 10 frags'}</button></div>`;
 if(WD.frags){const L=g.teams.flatMap(t=>t.def.pl.map(p=>({p,t}))).sort((a,b)=>(b.p[24]||0)-(a.p[24]||0)).slice(0,10);
  h+=`<div class="tm lt"><h3>Top 10 frags – ${g.c}</h3>`+`<div class="r fr eq"><div>#</div><div>Spiller</div><div class="kda">Frags</div></div>`+L.map((x,k)=>`<div class="r fr"><div>${k+1}</div><div class="fn">${flag(FLAGC[x.p[11]])} <b>${x.p[0]}</b><span class="mu">${x.t.name}</span></div><div class="kda">${x.p[24]||0}</div></div>`).join('')+'</div>'}
 else{const pl=placesOf(WD.rank.indexOf(WD.view));
  h+=`<div class="tm lt"><h3>Stilling – ${g.c}</h3><div class="sx"><div class="lg2">`+line(['#','Hold','K','S-U-T','Runder','P'],'eq')+tbl(g).map((s,k)=>line([k+1,tl(WD.view,s.i,nm(s.i)),s.p,`${s.w}-${s.d}-${s.l}`,`${s.rf}-${s.ra}`,s.pts],(WD.view===WD.me.li&&s.i===WD.me.ti?'me ':'')+(pl.d>0&&k===pl.d-1?'solid ':'')+(k===pl.d+pl.q-1?'dash':''))).join('')+`</div></div></div>`}
 const nr=LDAYS.findIndex(x=>x>=d)+1,nd=nr?LDAYS[nr-1]:0;
 const td=nr?g.fix[nr-1].map(m=>{const x=g.res.find(y=>y.rd===nr&&y.h===m[0]&&y.a===m[1]);return `<div class="fx ${mineM(m)?'n':''}"><span class="tb" title="${nm(m[0])}">${tl(WD.view,m[0],nm(m[0]))}</span><span class="rs">${x?x.hs+'–'+x.as:'–'}</span><span class="tb" title="${nm(m[1])}">${tl(WD.view,m[1],nm(m[1]))}</span></div>`}):[];
 h+=`<div class="tm"><h3>${nr?`Kommende ligakampe – ligakamp ${nr} på ${mapN(lgMap(nr))}${nd===d?' (i dag)':` (uge ${Math.floor(nd/7)+1}, ${DAYS[nd%7]})`}`:'Ingen flere ligakampe i sæsonen'}</h3>${td.join('')}</div>`;
 $('lg').innerHTML=h;if($('sim'))$('sim').onclick=()=>nextDay(true)}
{const _rl=renderLeague;renderLeague=function(){_rl();if(WD.over||ECON.fortune<0)$('lg').insertAdjacentHTML('afterbegin',`<div class="tm" style="border-color:#d4352b;color:#d4352b;font-weight:700">${WD.over?'Spillet er slut. Se Økonomi.':`Formuen er ${kr(ECON.fortune)}. Er den negativ ved sæsonslut, slutter spillet.`}</div>`)}}
/* lønsum i hold-fanen */
{const _ro2=renderOverview;renderOverview=function(){_ro2();const h=$('ov').querySelector('.hd .mu');if(h)h.insertAdjacentHTML('afterbegin',`Løn ${kr(teamWage(TEAMS[0]))}/sæson · `)}}
/* FAQ */
{const _rf2=renderFaq;renderFaq=function(){_rf2();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Økonomi</h3>${li([`<b>Løn:</b> lønnen følger værdien af spillerens nuværende skills, erfaring og lederskab i forhold til alle andre spillere. Ved hver sæsonstart skaleres alle lønninger, så den gennemsnitlige spillerløn pr. hold er ${kr(WD&&WD.B0||START_WAGE)}. En spiller, der er bedre end de fleste, er derfor stadig dyr, også når han er gammel, men lønniveauet stiger ikke, selvom spillerne generelt bliver bedre. Potentiale tæller ikke med, så unge talenter har lav løn, selv om deres spillerværdi er høj. Lønnen udbetales hver uge (7 gange). Lønnen fastsættes ved sæsonstart og ligger fast hele sæsonen. En tryout-spiller får sin løn, når han skrives på. Ved et salg følger lønnen med spilleren.`,`<b>Startformue:</b> alle hold starter med en samlet løn på ${kr(START_WAGE)} pr. sæson og en formue på ${kr(START_CASH)}. Spillernes alder og skills er tilfældige, men holdets samlede niveau passer til den løn.`,'<b>Kampindtægter og præmier:</b> se afsnittet "Indtægter fra kampe og præmier" for alle beløb.','Alle beløb (ligakampe, præmier, CL og sponsorer) regnes ud fra den gennemsnitlige lønsum pr. hold. Da lønningerne er relative, ligger den fast, og beløbene gør det også.','<b>Game over:</b> din formue må gerne være negativ undervejs, men er den negativ ved sæsonslut, slutter spillet.','<b>AI-hold går aldrig i minus:</b> de byder kun på spillere og tager kun tryouts, hvis købet og lønnen kan betales resten af sæsonen med sikre indtægter (sponsorens ugebeløb og ligahjemmekampe). Kan næste sæson ikke betales, sætter de bænkspillere til salg, og er de ikke solgt før første lønudbetaling, sættes de fri.'])}</div>`)}}
/* ===== HOLDVISNING: tryk på et andet hold for at se spillerne ===== */
// Viser kun navn, flag, alder, værdi, personlighed og yndlingsvåben. Dit eget hold er ikke klikbart.
VT.hv='Hold';let HV=null;
const hfl=x=>{if(!x.id)return x.n;const[li,ti]=x.id.split('-').map(Number);return tl(li,ti,x.n)};// Hall of Fame: viser holdets nuværende trup
function tl(li,ti,label){return isMe({li,ti})?label:`<span class="tl" data-tm="${li}-${ti}">${label}</span>`}
{const _sh=show;show=function(v){_sh(v);$('hv').style.display=v==='hv'?'':'none'}}
function showTeam(li,ti){if(isMe({li,ti}))return;HV={li,ti,from:VIEW==='hv'&&HV?HV.from:VIEW};show('hv');renderHV();window.scrollTo(0,0)}
function renderHV(){if(!HV)return;const t=WD.lg[HV.li].teams[HV.ti];
 $('hv').innerHTML=`<div class="hd"><b class="nm" style="min-width:0">${t.name}</b><button data-hb="1" style="flex:0 0 auto;padding:6px 12px">Tilbage</button></div><div class="tm">${t.def.pl.map(p=>`<div class="hvr"><div class="sl" style="font-size:13px;gap:8px"><span class="nm">${flag(FLAGC[p[11]])} <b>${p[0]}</b></span><b style="white-space:nowrap">${kr(pVal2(p))}</b></div><div class="mu">${p[9]} år · Personlighed: ${persN(p)} · Yndlingsvåben: ${WN[p[17]]}</div></div>`).join('')}</div>`}
$('hv').addEventListener('click',e=>{if(!e.target.closest('[data-hb]'))return;const f=HV&&HV.from;f==='cl'?showCL():f==='hf'?showHof():showLeague()});
document.addEventListener('click',e=>{const a=e.target.closest('[data-tm]');if(!a)return;const[li,ti]=a.dataset.tm.split('-').map(Number);showTeam(li,ti)});
{const _e4=endDay;endDay=function(){_e4();if(VIEW==='hv')renderHV()}}
/* ===== FASE 11: SALGSVURDERING – AI kicker spillere, der ikke kan sælges ===== */
// Før et AI-hold sætter en spiller til salg, vurderer manageren chancen for at få ham solgt ud fra
// (1) handelshistorik: hvor ofte lignende auktioner (samme aldersgruppe, mindstepris tæt på samme andel af værdien) er endt med salg
// (2) efterspørgsel nu: hvor mange hold der har brug for spilleren og råd til mindsteprisen og lønnen.
// Gode økonomer vurderer præcist. Dårlige er for optimistiske og skønner skævt. Er chancen for lav, kickes spilleren i stedet.
// Bliver en spiller ikke solgt, vurderer manageren igen med det samme. Hver mislykket auktion sænker chancen.
// hist = dage historikken rækker tilbage · bin = maks. forskel i mindstepris/værdi for "lignende" · prior = vægt på efterspørgsel, når der er lidt historik
// dem = efterspørgselsskala (n interesserede → 1-e^(-n/dem)) · foreign = vægt for interesserede hold i andre ligaer (de ser kun en del af auktionerne)
// min = laveste vurderede chance for at sætte til salg · opt/noise = optimisme og skønsfejl ved økonomisk evne 0 · fail = faktor pr. mislykket auktion · keep = antal gemte auktionsudfald
const SELL={hist:98,bin:.3,prior:5,dem:3,foreign:.66,min:.35,opt:.5,noise:.4,fail:.5,keep:800};
const ageB=a=>a<=17?0:a<=21?1:a<=27?2:a<=32?3:4;
function outcome(l,p,sold){const T=TMD();(T.oc=T.oc||[]).push({t:T.t,ab:ageB(p[9]),r:l.min/Math.max(1,pv(p)),s:sold?1:0});if(T.oc.length>SELL.keep)T.oc.splice(0,T.oc.length-SELL.keep)}
function sqStats(d){const c=vcx().m,key=d.name+'|sq';let x=c.get(key);if(x)return x;const sq=d.pl.map(p=>mVal(d,p)).sort((a,b)=>b-a);
 x={fifth:sq[4]||0,worst:sq[sq.length-1]||0,yc:d.pl.filter(p=>p[9]<=DEV.age).length,full:ysN(d.pl)>=TRF.maxSq};c.set(key,x);return x}
// antal hold (vægtet), der lige nu ville byde mindsteprisen
function demand(k,p,min){let n=0;const w=wageOf(p);
 for(const {d,k:k2} of AIL){if(sameK(k2,k)||cash(d)<min)continue;const s=sqStats(d),mv=mVal(d,p);
  if(!(mv>s.fifth*1.02||(p[9]<=DEV.age&&s.yc<yT(d)&&mv>s.worst)))continue;if(s.full&&mv<=s.worst)continue;
  if(est(d,p)*1.05<min||aiRoom(d,k2,w)<min)continue;n+=k2.li===k.li?1:SELL.foreign}
 return n}
function saleChance(d,k,p,min){const T=TMD(),ab=ageB(p[9]),r=min/Math.max(1,pv(p));
 const H=(T.oc||[]).filter(x=>x.ab===ab&&T.t-x.t<=SELL.hist&&Math.abs(x.r-r)<=SELL.bin);
 const pD=1-Math.exp(-demand(k,p,min)/SELL.dem),pH=(H.reduce((a,x)=>a+x.s,0)+1)/(H.length+2),w=H.length/(H.length+SELL.prior);
 let c=w*(pD+pH)/2+(1-w)*pD;c*=Math.pow(SELL.fail,p[29]||0);
 const q=ecq(d);c+=(1-q)*SELL.opt*(1-c)+nz('sv'+d.name+'|'+p[0]+'|'+T.t)*(1-q)*SELL.noise;// dårlige økonomer: optimisme og skønsfejl
 return cl(c,0,1)}
function aiKick(d,k,p,why){if(d.pl.length<=5||!d.pl.includes(p))return false;const T=TMD();
 d.pl.splice(d.pl.indexOf(p),1);fixTeam(d);aiLineup(d);(T.kick=T.kick||[]).push({s:WD.season,age:p[9],why});if(T.kick.length>2000)T.kick.shift();
 if(k.li===WD.me.li)news(`${knm(k)} har kicket ${p[0]} (${p[9]} år), fordi han ikke vurderes at kunne sælges.`,false);return true}
// AI sætter kun til salg, hvis manageren tror på et salg. Ellers kickes spilleren.
const LP0=listP;
listP=function(k,p,min){if(isMe(k))return LP0(k,p,min);const d=kdef(k);aiList();
 if(saleChance(d,k,p,Math.max(TRF.minInc,Math.round(min)))>=SELL.min)return LP0(k,p,min);aiKick(d,k,p,'vurdering');return null};
// efter auktionen: udfaldet gemmes i historikken, og en usolgt spiller vurderes igen
{const _rs=resolve;resolve=function(l){const S=kdef(l.s),p=plOf(l);_rs(l);if(!p)return;const sold=!S.pl.includes(p);outcome(l,p,sold);
 if(sold){p[29]=0;return}
 p[29]=(p[29]||0)+1;if(isMe(l.s)||S.pl.length<=5||p[15]>=0)return;
 aiList();if(saleChance(S,l.s,p,l.min)>=SELL.min)LP0(l.s,p,l.min);else aiKick(S,l.s,p,'usolgt')}}
/* FAQ */
{const _rf3=renderFaq;renderFaq=function(){_rf3();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>AI-salg og kick</h3>${li(['Før et AI-hold sætter en spiller til salg, vurderer manageren, om han kan sælges. Vurderingen bygger på handelshistorikken for lignende spillere (alder og mindstepris i forhold til værdien) og på, hvor mange hold der lige nu har brug for spilleren og råd til ham.','Tror manageren ikke på et salg, kickes spilleren i stedet, så holdet slipper for lønnen.','Bliver en spiller ikke solgt, vurderer manageren igen. Den mislykkede auktion tæller med, så spilleren oftest bliver kicket.','Gode økonomer vurderer præcist. Dårlige økonomer er for optimistiske og forsøger tit at sælge spillere, ingen vil have.'])}</div>`)}}
