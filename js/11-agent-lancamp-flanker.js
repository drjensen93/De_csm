/* ===== SPILLERAGENT OG TRANSFERSTRAF ===== */
// n = spillere pr. sæson · age = aldersinterval (trekantfordeling, flest i midten) · exp/lead = andel af sæsonens ligakampe spillet / som IGL
// leadP = andel af agentspillere med lederskab · var = skillfaktor pr. spiller (−7 % til +2 %) · min = mindstepris · spec = chance for specialistikon
const AGT={n:100,age:[13,33],exp:.6,lead:.45,leadP:.15,var:[-.07,.02],min:100,spec:.25};
const AGM=()=>LDAYS.length;// ligakampe pr. sæson uden CL
const AGK={li:-1,ti:0};
function agEnsure(){if(!WD)return;if(!WD.ag)WD.ag={name:'Spilleragent',li:-1,pl:[],cash:0};WD.lg[-1]={c:'Spilleragent',fix:[],res:[],teams:[{name:'Spilleragent',def:WD.ag}]}}
const agSL=(age,m)=>{const a=['nat','nat','born','gren','gren','ice','ice','bad','bad','pist','pist','hot','hot','eagle','eagle','rock','rock','big','big','nerd','nerd','team','team','stage','stage','lazy','lazy','worn','worn','greedy','greedy','young','young','dream','dream','gear','gear'];
 if(age<=21)a.push('gamer','gamer');if(age<=17&&m<50)a.push('green','green');return a};
function mkAgent(){
 const p=mkTry(),age=AGT.age[0]+Math.round((rnd()+rnd())/2*(AGT.age[1]-AGT.age[0])),S=age-13+WD.day/NDAYS,M=AGM();
 p[9]=age;p[13]=Math.round(AGT.exp*M*S);
 const sl=agSL(age,p[13]);p[23]=rnd()<AGT.spec?sl[ri(0,sl.length-1)]:'';
 p[12]=0;if(rnd()<AGT.leadP){const g=AGT.lead*M*S;p[12]=Math.round(p[23]==='born'?g*3:p[23]==='nat'?g*2:p[23]==='bad'?g/2:g)}p[10]=lvl(p[12],LT);
 // optimal træning fra tryout som 13-årig: træner skillen med mest plads til limit, +0,5 i en tilfældig skill pr. spillet kamp, aldring efter ikonreglerne
 const lim=p[14],w=lim.map(()=>.6+rnd()*.8),sw=w.reduce((a,b)=>a+b,0),v=w.map((x,i)=>Math.min(lim[i],TT0[0]*x/sw));
 for(let a=13;a<=age;a++){const fr=a<age?1:WD.day/NDAYS,days=Math.round(NDAYS*fr),r=rateP(p,a),l=agingP(p,a);
  for(let d=0;d<days;d++){let b=-1,g=0;for(let k=0;k<NSK;k++){const rm=lim[k]-v[k];if(rm>g){g=rm;b=k}}if(b>=0&&r>0)v[b]=Math.min(lim[b],v[b]+r);if(l>0){const q=ri(0,NSK-1);v[q]=Math.max(0,v[q]-l)}}
  const ms=Math.round(AGT.exp*M*fr);for(let m=0;m<ms;m++){const k=ri(0,NSK-1);v[k]=Math.min(lim[k],v[k]+.5)}}
 const f=1+AGT.var[0]+rnd()*(AGT.var[1]-AGT.var[0]);SI.forEach((si,i)=>p[si]=Math.round(Math.min(lim[i],v[i]*f)*10)/10);
 p[15]=-1;p[16]=-1;p[19]=0;p[20]=-1;p[28]=null;p[29]=0;p[31]=0;specAge(p);return p}
// antal nye agentspillere på en given dag, så det giver præcis AGT.n pr. sæson
const agCount=d=>Math.floor(AGT.n*(d+1)/NDAYS)-Math.floor(AGT.n*d/NDAYS);
function agSpawn(){agEnsure();for(let i=0;i<agCount(WD.day);i++){const p=mkAgent();WD.ag.pl.push(p);LP0(AGK,p,AGT.min)}}
function agRemove(p){const A=WD.ag,j=A.pl.indexOf(p);if(j>=0)A.pl.splice(j,1);NU.delete(p[0])}
function agTransfer(l,p,b){const T=TMD(),B=kdef(b.k),meB=isMe(b.k);
 if(!meB&&ysFull(B,p)){const r=B.pl.filter(q=>q[15]<0&&!lsOf(q[0])&&ysCut(B,q,p)).sort((x,y)=>mVal(B,x)-mVal(B,y))[0];if(!r)return false;B.pl.splice(B.pl.indexOf(r),1)}
 agRemove(p);NU.add(p[0]);p[15]=-1;p[16]=-1;p[19]=0;p[20]=-1;p[26]=T.t;p[27]=null;p[31]=TPEN.n;B.pl.push(p);
 if(meB)ecoAdd('expense','Transfers',b.a);else B.cash=cash(B)-b.a;
 fixTeam(B);if(!meB)aiLineup(B);
 T.hist.unshift({n:p[0],age:p[9],a:b.a,fl:-1,tl:b.k.li,fN:'Spilleragent',tN:knm(b.k),s:WD.season,d:WD.day,me:meB});if(T.hist.length>TRF.hist)T.hist.length=TRF.hist;
 if(meB)news(`<b>Du har købt ${p[0]}</b> fra en spilleragent for ${kr(b.a)}. Han starter på bænken.`,true);
 return true}
function agResolve(l){const p=plOf(l);if(!p)return;
 for(const b of l.b.slice().sort((x,y)=>y.a-x.a)){const B=kdef(b.k);
  if(money(b.k)<b.a||(!isMe(b.k)&&aiRoom(B,b.k,wageOf(p))<b.a)){if(isMe(b.k))news(`Du havde ikke råd til dit bud på ${l.n}, så buddet bortfalder.`,true);continue}
  if(isMe(b.k)&&ysN(B.pl)>=TRF.maxSq){news(`Du vandt auktionen om ${l.n}, men truppen er fuld (7/7). Buddet bortfalder.`,true);continue}
  if(agTransfer(l,p,b))return}
 agRemove(p)}// usolgt: spilleren forsvinder fra spillet
{const _r=resolve;resolve=function(l){if(l.s.li===-1)return agResolve(l);_r(l)}}
// køb fra et andet hold giver også transferstraf
{const _dt=doTransfer;doTransfer=function(l,p,b){const ok=_dt(l,p,b);if(ok)p[31]=TPEN.n;return ok}}
// straffen tæller ned for hver kamp, spilleren spiller (også CL)
{const _g=gain;gain=function(defs){_g(defs);defs.forEach(d=>line(d).forEach(p=>{if(p[31]>0)p[31]--}))}}
// AI regner straffen med, når en spiller vurderes til køb og salg (en spiller fra et andet hold vurderes, som om han allerede har straffen)
{const _mv=mVal;mVal=function(d,p){if(d.pl.includes(p)||p[31]>0)return _mv(d,p);p[31]=TPEN.n;try{return _mv(d,p)}finally{p[31]=0}}}
// men bruger spilleren i startfemmeren, som om der ingen straf var
{const _al=aiLineup;aiLineup=function(d){NOPEN=true;try{return _al(d)}finally{NOPEN=false}}}
{const _md=mktDay;mktDay=function(){agEnsure();_md();agSpawn()}}
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok)agEnsure();return ok}}
{const _nl=newLeague;newLeague=function(){const r=_nl.apply(this,arguments);agEnsure();return r}}
{const _rt=renderTransfer;renderTransfer=function(){agEnsure();_rt()}}
{const _mk=mkHTML;mkHTML=function(){return _mk().replace(/(<option value="all"[^>]*>Alle lande<\/option>)/,`$1<option value="-1" ${XF.flt==='-1'?'selected':''}>Spilleragent</option>`)}}
{const _rfA=renderFaq;renderFaq=function(){_rfA();const h=[...$('fq').querySelectorAll('.tm > h3')].find(x=>x.textContent==='Transfers');if(!h)return;
 const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 h.parentElement.insertAdjacentHTML('beforeend',li([`<b>Spilleragent:</b> ${AGT.n} gange i løbet af en sæson sætter en spilleragent en ny spiller på transferlisten med mindstepris ${kr(AGT.min)}. Spillerne er ${AGT.age[0]}-${AGT.age[1]} år (flest omkring ${(AGT.age[0]+AGT.age[1])/2} år) og fra alle lande. Find dem under "Spilleragent" i landefilteret.`,
  `<b>Agentspillernes niveau:</b> spredningen er bred, så ikke alle er gode nok til at blive købt. Fra ${AGR.primeFrom} år svarer skills samlet til ${Math.round(AGR.pf[0]*100)}–${Math.round(AGR.pf[1]*100)} % af en typisk AI-starter på ${AGR.prime[0]}–${AGR.prime[1]} år. ${AGR.from}–${AGR.primeFrom-1}-årige svarer til ${Math.round(AGR.yf[0]*100)}–${Math.round(AGR.yf[1]*100)} % af en typisk AI-starter på samme alder. Yngre spillere er trænet optimalt siden tryout som 13-årig, med ${Math.round(AGT.var[0]*100)} % til +${Math.round(AGT.var[1]*100)} % variation. Erfaringen svarer til at have spillet ${Math.round(AGT.exp*100)} % af ligakampene (${AGM()} pr. sæson, CL ikke medregnet) hver sæson. ${Math.round(AGT.leadP*100)} % af spillerne har desuden været IGL i ${Math.round(AGT.lead*100)} % af ligakampene. Limits, personlighed og specialistikoner følger de normale regler.`,
  '<b>Usolgt agentspiller:</b> forsvinder fra spillet. Hele købsprisen går til agenten, og der er intet transfergebyr.',
  `<b>Transferstraf:</b> en spiller, der købes på transferlisten (fra agenten eller fra et andet hold), har −${Math.round((1-TPEN.f)*100)} % på alle skills i sine første ${TPEN.n} kampe, også CL-kampe. Kampe på bænken tæller ikke. Straffen vises med rødt i Hold-fanen. AI-hold regner straffen med, når de vurderer, om en spiller er værd at købe eller sælge, men de sætter startfemmeren, som om der ingen straf var.`]))}}


/* ===== LANCAMP ===== */
// En spiller træner 1-3 valgte skills med dobbelt træningsrate (mindst min pr. dag) i hele uger fra mandag. Han kan ikke spille kampe imens.
// price = pris pr. uge (fast) · maxD = maks. lancamp-dage pr. sæson · min = mindste rate pr. dag · maxK = maks. antal skills · aiMax = maks. nye AI-lejre pr. hold pr. uge
// aiStar = ekstra krav for at sende en starter (gode managere): gevinsten skal være så mange gange prisen
const LC={price:10000,maxD:14,min:.6,mult:2,maxK:3,aiMax:2,aiStar:1.5};
const CLDAYS=[5,6,12,13,19,20,26,27,33,34,40,41,46,47];
// p[32] = aktiv eller planlagt lejr {st: startdag, left: dage tilbage, k: [skills], paid: betalte uger, s: sæson} · p[33] = [sæson, brugte dage]
const lcOf=p=>{const c=p[32];return c&&c.s===WD.season&&c.left>0?c:null};
const lcOn=p=>{const c=lcOf(p);return!!(c&&c.st<=WD.day)};// i gang i dag
const lcUsed=p=>p[33]&&p[33][0]===WD.season?p[33][1]:0;
const lcRes=p=>{const c=lcOf(p);return c?c.left:0};// reserverede dage (planlagt eller i gang)
const lcRate=p=>Math.max(LC.min,LC.mult*rateP(p,p[9]));
const lcMax=(p,k)=>p[SI[k]]>=p[14][k]-1e-9;
const lcAvail=d=>d.pl.filter(p=>!lcOn(p));
// fjerner spilleren fra lineup og træningsrum, når lejren starter
function lcBegin(d,p){p[15]=-1;p[16]=-1;p[19]=0;p[20]=-1;fixTeam(d)}
function lcPay(d,p,mine){if(mine){ecoAdd('expense','Lancamp',LC.price);if(typeof elog==='function')elog(`Lancamp: ${p[0]} (1 uge)`,-LC.price)}else d.cash=cash(d)-LC.price}
// forventet skillfremgang ved én uges lancamp vs. en uge i træningsrummet (lige fordeling på de valgte skills)
function lcSim(p,ks,days,lim){const L=lim||p[14],c=p.slice(),r=lcRate(p);let left=days*r;
 for(let n=0;n<2000&&left>1e-9;n++){const open=ks.filter(k=>L[k]-c[SI[k]]>1e-9);if(!open.length)break;const a=Math.min(left/open.length,.05);open.forEach(k=>{const x=Math.min(a,L[k]-c[SI[k]]);c[SI[k]]+=x;left-=x})}
 return c}
function lcNorm(p,days,w){const n=p.slice(),r=rateP(p,p[9]);if(r<=0)return n;let b=-1,g=0;for(let k=0;k<NSK;k++){const x=(w?w[k]:1)*Math.min(r*days,p[14][k]-p[SI[k]]);if(x>g){g=x;b=k}}if(b>=0)n[SI[b]]=Math.min(p[14][b],n[SI[b]]+r*days);return n}
// værdistigning (kr.) af én uge på lancamp frem for normal træning
function lcGain(p,ks,lim,w){const days=7,c=lcSim(p,ks,days,lim),n=lcNorm(p,days,w),sw=a=>{const o=p.slice();SI.forEach(i=>o[i]=a[i]);return pVal(o).tot};return sw(c)-sw(n)}
const lcWeeksLeft=p=>Math.floor((LC.maxD-lcUsed(p)-lcRes(p))/7);
const lcStartDay=()=>WD.day%7===0?WD.day:WD.day+7-WD.day%7;
// booking: returnerer fejltekst eller null
function lcCheck(d,p,ks,wk,mine){
 if(!p)return'Vælg en spiller.';if(lcOf(p))return`${p[0]} er allerede på lancamp.`;
 if(!ks.length)return'Vælg mindst én skill.';if(ks.every(k=>lcMax(p,k)))return'De valgte skills er allerede maxet.';
 if(wk>lcWeeksLeft(p))return`${p[0]} har kun ${lcWeeksLeft(p)} uge${lcWeeksLeft(p)===1?'':'r'} lancamp tilbage i denne sæson.`;
 const st=lcStartDay();if(st+7*wk>NDAYS)return'Lancampen skal kunne nå at slutte inden sæsonslut.';
 const busy=d.pl.filter(q=>q!==p&&lcOf(q)).length;if(d.pl.length-busy-1<5)return'Holdet skal have mindst 5 spillere, der kan spille.';
 if(mine&&ECON.fortune<LC.price*wk)return`Du har ikke råd (${kr(LC.price*wk)}).`;
 return null}
function lcBook(d,p,ks,wk,mine){const st=lcStartDay();p[32]={st,left:7*wk,k:ks.slice(0,LC.maxK),paid:0,s:WD.season};if(!p[33]||p[33][0]!==WD.season)p[33]=[WD.season,0];
 if(st===WD.day){lcPay(d,p,mine);p[32].paid=1;lcBegin(d,p)}}
// ved dagens start: lejre, der starter i dag, og nye uger betales
function lcDayStart(){const D=WD.day;WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const d=t.def,mine=li===WD.me.li&&ti===WD.me.ti;
 d.pl.forEach(p=>{const c=lcOf(p);if(!c)return;if(c.st===D){if(!c.paid){lcPay(d,p,mine);c.paid=1}lcBegin(d,p)}else if(c.st<D&&(D-c.st)%7===0){lcPay(d,p,mine);c.paid++}})}))}
// daglig træning på lancamp: dagens point går til en tilfældig af de valgte skills, der ikke er maxet
function lcTrain(){let msg=[];WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const d=t.def,mine=li===WD.me.li&&ti===WD.me.ti;
 d.pl.forEach(p=>{if(!lcOn(p))return;const c=p[32],open=c.k.filter(k=>!lcMax(p,k));
  if(open.length){const k=open[ri(0,open.length-1)];p[SI[k]]=Math.min(p[14][k],p[SI[k]]+lcRate(p))}
  c.left--;p[33][1]++;const done=c.k.every(k=>lcMax(p,k));
  if(done||c.left<=0){if(mine)msg.push(done&&c.left>0?`${p[0]} har maxet ${c.k.map(k=>SK[k]).join(', ')} og stopper lancampen før tid.`:`${p[0]} er færdig med lancamp.`);c.left=0;p[32]=null}})}));
 if(msg.length&&WD.report)WD.report.push(...msg)}
{const _dt=dailyTick;dailyTick=function(){_dt();lcTrain()}}
// lancamp-spillere deltager ikke i lineup og træningsrum
const lcHide=(d,f)=>{const C=d.pl.filter(lcOn);if(!C.length)return f();const keep=d.pl.slice();d.pl=d.pl.filter(p=>!C.includes(p));try{return f()}finally{const out=d.pl;d.pl=keep.filter(p=>out.includes(p)||C.includes(p));out.forEach(p=>{if(!d.pl.includes(p))d.pl.push(p)});C.forEach(p=>{p[15]=-1;p[16]=-1;p[19]=0;p[20]=-1})}};
{const _fx=fixTeam;fixTeam=function(d){if(!WD||!d.pl)return _fx(d);
 // under 5 ledige (fx efter et salg): de seneste lejre stoppes, så holdet kan stille hold
 let av=lcAvail(d);while(av.length<5){const p=d.pl.find(lcOn);if(!p)break;p[32]=null;av=lcAvail(d)}
 return lcHide(d,()=>_fx(d))}}
{const _al=aiLineup;aiLineup=function(d){return lcHide(d,()=>_al(d))}}
{const _ar=autoRooms;autoRooms=function(d){return lcHide(d,()=>_ar(d))}}
// salg: lejren stopper (brugte dage tæller stadig)
{const _dt2=doTransfer;doTransfer=function(l,p,b){const ok=_dt2(l,p,b);if(ok)p[32]=null;return ok}}
{const _ed=endDay;endDay=function(){_ed();if(WD.over)return;try{lcDayStart();lcAI()}catch(e){console.error(e);globalThis.onerror&&globalThis.onerror('Lancamp: '+e.message,'',0)}saveGame()}}
/* AI: holdstyring (mq) vælger spiller, skills og tidspunkt · økonomi (ecq) vurderer, om det er pengene værd, og om der er råd */
const lcCLweek=(k,D)=>{const inCL=(WD.dir||[]).some(x=>x.li===k.li&&x.ti===k.ti)||(WD.qual||[]).some(x=>x.li===k.li&&x.ti===k.ti);return inCL&&CLDAYS.some(x=>x>=D&&x<D+7)};
function lcAI(){const D=WD.day;if(D%7!==0||D+7>NDAYS)return;
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const k={li,ti};if(isMe(k))return;const d=t.def,q=ecq(d),m=mq(d),w=wts(d);
  let room=aiRoom(d,k,0)-teamWage(d)*(q>=QG.good?.3:q>=QG.mid?.15:0),n=0;if(room<LC.price)return;
  const cw=lcCLweek(k,D),cand=[];
  d.pl.forEach(p=>{if(lcOf(p)||lcWeeksLeft(p)<1)return;const starter=p[15]>=0;if(starter&&cw&&m>=QG.good)return;// gode managere sender ikke startere i en CL-uge
   // holdstyring: dårlige managere ser limits skævt (op til ±15 ved 0,4) og vælger skills efter forkerte vægte
   const lim=p[14].map((l,i)=>cl(Math.round(l+nz('lc'+d.name+'|'+p[0]+i)*(1-m)*25),40,100));
   const ks=[...Array(NSK).keys()].map(k=>[k,p[9]>=30?w[k]*(lim[k]>p[SI[k]]?1:0):w[k]*Math.max(0,lim[k]-p[SI[k]])]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,LC.maxK).map(x=>x[0]);
   if(!ks.length)return;
   // økonomi: skønnet værdistigning med fejl op til ±59 % ved 0,4
   const est=lcGain(p,ks,lim,w)*Math.max(.05,1+(rnd()*2-1)*(.05+(1-q)*.9)),need=LC.price*(starter&&m>=QG.good?LC.aiStar:1);
   if(est>=need)cand.push({p,ks,v:est-need})});
  cand.sort((a,b)=>b.v-a.v);
  for(const c of cand){if(n>=LC.aiMax||room<LC.price)break;if(lcCheck(d,c.p,c.ks,1,false))continue;lcBook(d,c.p,c.ks,1,false);room-=LC.price;n++}}))}
/* UI: lancamp i Træning-fanen */
const lcF=()=>WD.lcF||(WD.lcF={p:-1,k:[-1,-1,-1],w:1});
function lcHTML(){const d=TEAMS[0],F=lcF(),p=F.p>=0?d.pl[F.p]:null,ks=[...new Set(F.k.filter(k=>k>=0))],st=lcStartDay();
 let h=`<div class="tm"><h3>Lancamp</h3><div class="mu">Dobbelt træningsrate (mindst ${String(LC.min).replace('.',',')} pr. dag) på 1-${LC.maxK} skills. Spilleren kan ikke spille kampe imens. ${kr(LC.price)} pr. uge, højst ${LC.maxD/7} uger pr. spiller pr. sæson. Starter ${st===WD.day?'i dag':`mandag (dag ${st+1})`}.</div>`;
 const cur=d.pl.filter(lcOf);
 if(cur.length)h+=`<div class="spc">${cur.map(q=>{const c=q[32],on=c.st<=WD.day;return `<div class="sr"><span><b>${q[0]}</b> · ${c.k.map(k=>`${SK[k]} ${fl(q[SI[k]])}/${q[14][k]}`).join(', ')}</span><b>${on?`${c.left} dage tilbage`:`starter dag ${c.st+1}`}</b></div>${on?'':`<button data-lc="cancel|${d.pl.indexOf(q)}">Aflys ${q[0]}s lancamp</button>`}`}).join('')}</div>`;
 const opt=(v,t,on,dis)=>`<option value="${v}" ${on?'selected':''} ${dis?'disabled':''}>${t}</option>`;
 h+=`<div class="rl2"><div class="r"><div class="nm">Spiller</div><select data-lcf="p">${opt(-1,'Vælg',F.p<0)}${d.pl.map((q,j)=>opt(j,`${q[0]} (${q[9]} år · ${lcWeeksLeft(q)} uge${lcWeeksLeft(q)===1?'':'r'} tilbage)`,F.p===j,!!lcOf(q)||lcWeeksLeft(q)<1)).join('')}</select></div>`;
 for(let i=0;i<LC.maxK;i++)h+=`<div class="r"><div class="nm">Skill ${i+1}${i?' <small>(valgfri)</small>':''}</div><select data-lcf="k${i}">${opt(-1,i?'Ingen':'Vælg',F.k[i]<0)}${SK.map((s,k)=>opt(k,p?`${s} ${fl(p[SI[k]])}/${p[14][k]}${lcMax(p,k)?' MAX':''}`:s,F.k[i]===k,p&&lcMax(p,k))).join('')}</select></div>`;
 h+=`<div class="r"><div class="nm">Varighed</div><select data-lcf="w">${opt(1,'1 uge',F.w===1)}${opt(2,'2 uger',F.w===2)}</select></div></div>`;
 if(p&&ks.length){const g=lcGain(p,ks),r=lcRate(p),tr=rateP(p,p[9]),ag=agingP(p,p[9]);
  h+=`<div class="mu" style="margin-top:6px">${p[0]}: ${String(+r.toFixed(2)).replace('.',',')} pr. dag på lancamp mod ${String(+tr.toFixed(2)).replace('.',',')} i træningsrummet${ag>0?` · aldring −${String(+ag.toFixed(2)).replace('.',',')} pr. dag`:''}. Forventet værdistigning pr. uge i forhold til normal træning: ca. ${kr(Math.round(g))}.</div>`}
 const err=p&&ks.length?lcCheck(d,p,ks,F.w,true):null;
 h+=`<button data-lc="book" style="width:100%;margin-top:6px" ${!p||!ks.length||err?'disabled':''}>Send på lancamp${p&&ks.length?` (${kr(LC.price*F.w)})`:''}</button>${err?`<div class="mu" style="color:#d4352b;margin-top:4px">${err}</div>`:''}</div>`;
 return h}
{const _rt=renderTrain;renderTrain=function(){_rt();const el=$('tr');if(!el||typeof el.innerHTML!=='string')return;const d=TEAMS[0];let s=el.innerHTML;
 d.pl.forEach((p,j)=>{if(lcOn(p))s=s.replace(`<select data-t="${j}">`,`<select data-t="${j}" disabled>`)});
 const i=s.indexOf('<div class="tm"><h3>Træningsrapport');el.innerHTML=i>=0?s.slice(0,i)+lcHTML()+s.slice(i):s+lcHTML()}}
$('tr').addEventListener('change',e=>{const s=e.target;if(!s.dataset||s.dataset.lcf==null)return;const F=lcF(),f=s.dataset.lcf,v=+s.value;
 if(f==='p'){F.p=v;F.k=[-1,-1,-1]}else if(f==='w')F.w=v;else F.k[+f.slice(1)]=v;renderTrain()});
$('tr').addEventListener('click',e=>{const b=e.target.closest('[data-lc]');if(!b)return;const[a,v]=b.dataset.lc.split('|'),d=TEAMS[0],F=lcF();
 if(a==='cancel'){const p=d.pl[+v];if(p&&lcOf(p)&&p[32].st>WD.day)p[32]=null}
 else if(a==='book'){const p=d.pl[F.p],ks=[...new Set(F.k.filter(k=>k>=0))];if(lcCheck(d,p,ks,F.w,true))return;lcBook(d,p,ks,F.w,true);WD.lcF=null}
 renderTrain();renderNav();saveGame()});
// Taktik: en spiller på lancamp kan ikke sættes i lineup
{const _o=$('tv').onclick;$('tv').onclick=e=>{const b=e.target.closest&&e.target.closest('[data-a]');if(b){const[a,v]=b.dataset.a.split('|');if(a==='lu'&&TU.swapIn==null){const p=TEAMS[0].pl[+v];if(p&&lcOn(p))return}}return _o(e)}}
{const _rtv=renderTactics;renderTactics=function(){_rtv();const el=$('tv');if(!el||typeof el.innerHTML!=='string')return;let s=el.innerHTML;TEAMS[0].pl.forEach(p=>{if(lcOn(p))s=s.replace(`□ ${p[0]}`,`⛺ ${p[0]} <small>lancamp</small>`)});el.innerHTML=s}}
{const _rf=renderFaq;renderFaq=function(){_rf();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Lancamp</h3>${li([`En spiller kan sendes på lancamp i hele uger fra mandag. Han træner 1-${LC.maxK} valgte skills med dobbelt træningsrate, mindst ${String(LC.min).replace('.',',')} pr. dag. Hver dag går træningen til en tilfældig af de valgte skills, der ikke er maxet, så de i gennemsnit får lige meget.`,`Spilleren kan ikke spille kampe og er ikke i et træningsrum imens. Han ældes som normalt.`,`<b>Pris:</b> ${kr(LC.price)} pr. uge, betalt ved starten af hver uge. Højst ${LC.maxD/7} uger pr. spiller pr. sæson, og lancampen skal slutte inden sæsonslut. Holdet skal have mindst 5 spillere, der kan spille.`,'Når alle valgte skills er maxet, stopper lancampen. Pengene for den påbegyndte uge kommer ikke tilbage, men de ubrugte dage tæller ikke med i de 2 uger.','<b>Unge spillere</b> får mest ud af den dobbelte rate. <b>Ældre spillere</b> får minimumsraten, som omtrent holder en 30-33-årig oppe og bremser faldet for de ældste.','<b>AI-hold</b> bruger også lancamp. Holdstyringen afgør hvem, hvilke skills og hvornår (gode managere sender ikke startere af sted i en CL-uge). Økonomien afgør, om den forventede værdistigning er prisen værd, og om der er råd.'])}</div>`)}}

/* ===== FASE 16: ZONEKONTROL (DÆKNING) PÅ de_dust2 =====
 En zone kan have cv = liste af nabozoner, som en spiller i zonen dækker (sigtelinjer på tværs, fx Mid doors → Lower mid og CT-spawn).
 Krydser en fjende ind i en dækket zone, mens dækkeren ikke selv er i kamp:
  · krydseren forsinkes CV.d sek. pr. dækker (højst CV.max dækkere)
  · hver dækker får ét skud på tværs: chance CV.hit × Aim/100 (+ CV.snip med sniper). Rammer med våbnets normale skade
  · krydser T ind i en zone dækket af CT, tæller det som info. Når mindst ROT.cMin T er set krydse samme zone, kan CT læse T's plan:
    chance CV.rd + CV.rdA × bedste dækkers Awareness/100, derefter IGL'ens normale info-kald (contactCall) mod T's rigtige site.
 Kun zoner med cv har effekten, så de andre maps spiller som før. Effekten blev målt i 100.000 fuldt købte runder (alle 100 taktikpar),
 hvorefter PM.dust2 blev målt forfra sammen med transit (tv). */
const CV={d:1.5,max:2,hit:.12,snip:.15,rd:.25,rdA:.5};
function zcv(p,h,al){
 const cs=al.filter(q=>q.side!==p.side&&q.zone&&q.zone!==h&&!q.act&&(ZN[q.zone].cv||[]).includes(h)&&!al.some(e=>e.side===p.side&&e.zone===q.zone)).slice(0,CV.max);
 if(!cs.length)return;
 p.travel+=Math.round(cs.length*CV.d*TPS);
 R.cx=R.cx||[];
 for(const q of cs){const g=q.gun&&q.gun.mag>0?q.gun:q.pis;if(!g||g.mag<=0)continue;g.mag--;
  const ch=CV.hit*attr(q,'aim')/100+(g.type==='sniper'?CV.snip:0);
  if(rnd()<ch){const head=rnd()<.03+SKC.hsA*attr(q,'aim')/100;R.cx.push({s:q,t:p,dmg:head?hsD(W[g.type],p,W[g.type].dmg):W[g.type].dmg,w:g.type,head,cz:h})}}
 if(p.side==='T'&&!R.planted&&R.site&&!R.cvRead){R.cvn=R.cvn||{};R.cvn[h]=(R.cvn[h]||0)+1;
  if(R.cvn[h]>=ROT.cMin){R.cvRead=true;const aw=Math.max(...cs.map(q=>attr(q,'aware')));
   if(rnd()<CV.rd+CV.rdA*aw/100){const c=cs[0];log('ct',`${c.name} ser T krydse ${ZNAME[h]} og læser ${R.site}-site`);R.contact=R.site;contactCall(R.site)}}}
}
// dust2: Mid doors dækker Lower mid og CT-spawn · Short dækker Lower mid · Lower mid dækker Mid doors · Top mid dækker Mid doors
Object.assign(MAPS.dust2.zn.MD,{cv:['LM','CT']});Object.assign(MAPS.dust2.zn.SH,{cv:['LM']});
Object.assign(MAPS.dust2.zn.LM,{cv:['MD']});Object.assign(MAPS.dust2.zn.MID,{cv:['MD']});
// rollebeskrivelser, der bruger dækningen
Object.assign(MAPS.dust2.cdesc,{
 '2A-1C-2B':['Holder A.','Holder B.','Holder Mid doors, dækker Lower mid og CT-spawn og melder, hvor T går. Kan nå begge sites.','Holder A sammen med A-ankeret.','Holder B sammen med B-ankeret.'],
 '3C-1A-1B':['Holder A alene.','Holder B alene.','Holder Mid doors og dækker Lower mid.','Holder Mid doors og dækker Lower mid.','Holder Mid doors og dækker Lower mid.']});
/* FAQ */
{const _rfZ=renderFaq;renderFaq=function(){_rfZ();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Zonekontrol (de_dust2)</h3>${li(['På de_dust2 har midterzonerne sigtelinjer ind i nabozonerne: <b>Mid doors</b> dækker Lower mid og CT-spawn, <b>Short</b> dækker Lower mid, <b>Lower mid</b> dækker Mid doors, <b>Mid</b> dækker Mid doors, og <b>T-spawn</b> dækker Tunnels.',`Krydser en modstander ind i en zone, du dækker (og du ikke selv er i kamp), bliver han forsinket ${String(CV.d).replace('.',',')} sek. pr. dækker (højst ${CV.max}), og hver dækker får ét skud på tværs. Træfchancen afhænger af Aim, og en AWP rammer oftere.`,'<b>Info:</b> ser en CT mindst 2 T krydse en zone, han dækker, kan han læse, hvilket site T går mod. Chancen stiger med Awareness. Derefter afgør IGL\'ens lederskab som altid, om og hvor hurtigt holdet roterer. Det gør en spiller i Mid doors (fx i 2A-1C-2B og 3C-1A-1B) stærk mod fakes og angreb, der går gennem Lower mid.','<b>For T:</b> en T i Mid doors forsinker og beskyder CT\'er, der roterer gennem CT-spawn, og en T i Lower mid dækker Mid doors, fx Lurkeren i Connector-cut til B. En T, der står i T-spawn, forsinker og beskyder CT\'er, der presser ind i Tunnels.'])}</div>`)}}

/* FAQ: zonernes karakter */
{const _rfZ=renderFaq;renderFaq=function(){_rfZ();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Zonernes karakter</h3>${MAPIDS.map(m=>`<div style="margin-top:6px"><b>${mapN(m)}</b></div>`+li(Object.keys(ZDESC[m]).map(z=>`<b>${MAPS[m].zname[z]}:</b> ${ZDESC[m][z]}`))).join('')}</div>`)}}
/* ===== FASE 17: FLANKER ===== */
// Når en spiller kommer ind i en zone, hvor modstandere allerede står, afgøres for hver af dem, om de kiggede mod den indgang, han kom fra.
// En spiller i kamp kigger mod de indgange, hans modstandere i zonen kom fra. Ellers er retningen en sandsynlighed: forventet aktivitet (exp) vægtet med Playing IQ, resten fordelt jævnt på zonens indgange.
//   P(kigger mod indgang N) = a × exp[N] + (1 − a) / antal indgange, hvor a = FL.a0 + FL.a1 × Playing IQ/100
// Forventet aktivitet: en holder kigger mod de indgange, modstanderens taktikruter på mappet bruger ind i zonen (CT's rotation mellem sites tæller med).
// En spiller på vej et sted hen kigger frem (næste zone på ruten). Efter plant kigger T mod de veje, de levende CT'er vil tage til bomben.
// Kiggede han væk, har han en chance for alligevel at have tjekket bagud: FL.aw × Awareness/100. Lykkes den, er der ingen flanke.
// Ellers er han flanket: reaktionen forsinkes FL.r sek., og flankeren får træfbonus FL.b mod ham i FL.w ticks. Lægges oven i transit.
const FL={a0:.7,a1:.3,aw:.8,r:1.5,b:.12,w:12,rot:2};
// forventede indgange pr. map: exp[watcher-side][zone][indgang] = vægt
function flBuild(id){const mp=MAPS[id],ex={T:{},CT:{}},add=(S,z,n,w)=>{const o=ex[S][z]=ex[S][z]||{};o[n]=(o[n]||0)+w};
 const walk=(S,from,to,w)=>{let c=from,g=0;if(!adj[c]||!adj[to])return;while(c!==to&&g++<40){const n=hop(c,to,S==='T'?'CT':'T');add(S,n,c,w);c=n}};
 ['T','CT'].forEach(E=>{const S=E==='T'?'CT':'T',al=mp.alias[E]||{},start=E==='T'?'TS':'CT';
  tnOf(id,E).forEach(name=>{const f=mp.tac[name]||(E==='T'?TT:CC)[name];if(!f)return;
   f().forEach(path=>{let c=start;path.forEach(([z])=>{z=z[0]==='='?z.slice(1):al[z]||z;walk(S,c,z,1);c=adj[z]?z:c})})})});
 walk('T','A','B',FL.rot);walk('T','B','A',FL.rot);return ex}
{const _um=useMap;useMap=function(id){_um(id);const m=MAPS[CUR];if(m&&!m.flx)m.flx=flBuild(CUR)}}
function flExp(e){
 // i kamp: kigger mod de indgange, de modstandere, han allerede kæmper mod, kom fra
 if(e.engZ===e.zone){const o={};let n=0;for(const q of M.players)if(q.alive&&q.side!==e.side&&q.zone===e.zone&&q.arr<R.tick&&q.from){o[q.from]=(o[q.from]||0)+1;n++}if(n)return o}
 if(!e.act&&e.zone&&target(e)!==e.zone)return{[hop(e.zone,target(e),e.side)]:1};
 if(R.planted&&e.side==='T'&&R.site){const o={};let n=0;
  for(const q of M.players){if(!q.alive||q.side!=='CT')continue;if(!q.zone&&q.next===e.zone&&q.from){o[q.from]=(o[q.from]||0)+1;n++;continue}let c=q.zone||q.next,g=0;if(!c||c===e.zone)continue;
   while(c!==R.site&&g++<40){const nx=hop(c,R.site,'CT');if(nx===e.zone){o[c]=(o[c]||0)+1;n++;break}c=nx}}
  if(n)return o}
 const m=MAPS[CUR];return(m&&m.flx&&m.flx[e.side][e.zone])||{}}
function flFace(e,N){const nb=Object.keys(adj[e.zone]||{}),k=nb.length||1,x=flExp(e),s=Object.values(x).reduce((a,b)=>a+b,0);
 const a=cl(FL.a0+FL.a1*attr(e,'iq')/100,0,1);return a*(s?(x[N]||0)/s:1/k)+(1-a)/k}
function flArr(p,al){const Z=p.zone,N=p.from;if(!N||!adj[Z]||adj[Z][N]==null)return;const fl=[];
 for(const e of al){if(e.side===p.side||e.zone!==Z||!(e.arr<R.tick))continue;
  if(rnd()<flFace(e,N))continue;// kiggede mod indgangen
  if(rnd()<FL.aw*attr(e,'aware')/100)continue;// tjekkede bagud i tide
  const live=e.flk&&R.tick<=e.flk.until;e.flk={ids:live?e.flk.ids.concat(p.id):[p.id],until:R.tick+FL.w};e.flP=(e.flP||0)+Math.round(FL.r*TPS);fl.push(e)}
 if(fl.length)log(p.side==='CT'?'ct':'t',`${p.name} kommer bag om ${fl.map(e=>e.name).join(' og ')} fra ${ZNAME[N]}`)}
/* FAQ */
{const _rfF2=renderFaq;renderFaq=function(){_rfF2();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Flanker</h3>${li(['Når du kommer ind i en zone, hvor modstanderen allerede står, afgøres for hver modstander, om han kiggede mod den indgang, du kom fra. Gjorde han ikke, og opdager han dig ikke i tide, er han <b>flanket</b>: han reagerer '+String(FL.r).replace('.',',')+' sek. langsommere, og du rammer lettere i duellens første sekunder. Det gælder begge sider på alle maps.','<b>Hvor kigger spillerne?</b> En spiller, der holder en zone, kigger mod de indgange, hvor modstanderen normalt kommer fra på mappet. En spiller på vej et sted hen kigger frem. Efter plant kigger T mod de veje, CT\'erne vil tage til bomben. Høj <b>Playing IQ</b> betyder, at spilleren oftere kigger det rigtige sted. Lav Playing IQ fordeler blikket mere tilfældigt.','<b>Awareness er modtrækket:</b> en spiller, der kiggede den forkerte vej, har en chance for alligevel at have tjekket bagud. Lykkes det, er der ingen flanke. Chancen stiger med Awareness.','Zoner med mange indgange er sværest at dække. Flanker lægges oven i transit: en spiller, der bliver taget bagfra midt i en rotation, får begge straffe.'])}</div>`)}}
