/* ===== SPILLERVÆRDI ===== */
// Alle 10 skills vægtes ens (ingen impact-vægtning). Værdien af en skill fordobles for hver VAL.dbl point,
// så 98→99 er 2^(88/VAL.dbl) gange mere værd end 10→11 (2048× ved dbl=8).
// top = råværdi for én skill på 100 · exp = +andel af skillværdien pr. erfaringsniveau · lead = grundbeløb for lederskab (fordobles pr. niveau; ×10/9 ved 10. skill, så lederskab vejer det samme som før)
// Alt skaleres til sidst, så den højest mulige værdi er VAL.max csm (alle skills 100, max erfaring og lederskab)
// peak = alder, potentialet regnes frem til · disc = rabat pr. år på fremtidig fremgang (usikkerhed) · days = dage pr. sæson
const VAL={top:1e6,dbl:8,exp:.08,lead:2e5*10/9,peak:27,disc:.92,days:49,max:1e6};
const VSC=()=>VAL.max/(NSK*VAL.top*(1+5*VAL.exp)+VAL.lead*31);
// niveau med decimaler, så værdien stiger lidt for hver kamp mellem tærsklerne
const flvl=(n,T)=>{n=n||0;for(let i=0;i<T.length;i++)if(n<T[i]){const a=i?T[i-1]:0;return i+(n-a)/(T[i]-a)}return T.length};
const skVal=s=>VAL.top*Math.pow(2,(Math.min(100,Math.max(0,s||0))-100)/VAL.dbl);
// fremskrivning: optimal træning (op til limits, aldersrate) og aldring frem til peak-alder, dog mindst 1 sæson
function vProj(p){const v=SI.map(i=>p[i]||0),lim=p[14]||Array(NSK).fill(100);let a=p[9]||20;const yrs=Math.max(1,VAL.peak-a);
 for(let y=0;y<yrs;y++,a++){const r=rateP(p,a),l=agingP(p,a)/NSK;
  for(let d=0;d<VAL.days;d++){if(r>0){let b=-1,bg=0;for(let k=0;k<NSK;k++){const g=skVal(Math.min(lim[k],v[k]+r))-skVal(v[k]);if(g>bg){bg=g;b=k}}if(b>=0)v[b]=Math.min(lim[b],v[b]+r)}
   if(l>0)for(let k=0;k<NSK;k++)v[k]=Math.max(0,v[k]-l)}}
 return{v,yrs}}
const penRisk=(a,p)=>{const e=p&&p[23]==='dream'?2:0;return a>=38-e?Math.min(1,(a-37+e)*.2):0};
function pVal(p){let sk=0;for(const i of SI)sk+=skVal(p[i]);
 const P=vProj(p);let pv=0;P.v.forEach(x=>pv+=skVal(x));const df=pv-sk,pot=df>0?df*Math.pow(VAL.disc,P.yrs):df;
 const e=flvl(p[13],ET),l=flvl(p[12],LT),ex=sk*VAL.exp*e,ld=VAL.lead*(Math.pow(2,l)-1),pr=penRisk(p[9]||0,p),sub=Math.max(0,sk+pot+ex+ld);
 const c=VSC();return{sk:sk*c,pot:pot*c,ex:ex*c,ld:ld*c,pr,tot:sub*(1-pr)*c,e,l}}
const krV=n=>kr(n);
const valHTML=(p,short)=>{const v=pVal(p);return `<div class="sl" style="margin-top:6px"><b>Værdi</b><b>${krV(pVal2(p))}</b></div><div class="sl"><b>Løn</b><b>${kr(wageOf(p))} pr. sæson</b></div>`+(short?'':`<div class="mu">Skills ${krV(VAL2.sk*wskSum(p))} · Erfaring +${krV(VAL2.ex*flvl(p[13],ET))} · Lederskab +${krV(VAL2.ld*flvl(p[12],LT))}</div>`)};
function gain(defs){
 if(KC&&M&&M.players)M.players.forEach(p=>{if(p.src)p.src[24]=(p.src[24]||0)+p.k});
 defs.forEach(d=>line(d).forEach(p=>{p[13]++;if(p[19]===1){const m=p[23]==='born'?3:p[23]==='nat'?2:1;if(p[23]!=='bad'||p[13]%2===0)p[12]+=m;p[10]=lvl(p[12],LT)}const k=ri(0,NSK-1);p[SI[k]]=Math.min(p[14][k],p[SI[k]]+.5);specAge(p)}))}
function mkTry(h){
 const age=ri(13,18),t=TT0[age-13]*(1+(rnd()*2-1)*.02),lim=Array.from({length:NSK},()=>ri(70+(SCK||0),100)),w=Array.from({length:NSK},()=>.6+rnd()*.8),sw=w.reduce((a,b)=>a+b,0),nat=h!=null&&rnd()<.85?h:ri(0,23),v=w.map((x,i)=>Math.min(lim[i],t*x/sw));
 const SL0=['nat','nat','born','gren','gren','ice','ice','bad','bad','pist','pist','hot','hot','eagle','eagle','gamer','gamer','rock','rock','big','big','nerd','nerd','team','team','stage','stage','lazy','lazy','worn','worn','greedy','greedy','young','young','dream','dream','gear','gear'];if(age<=17)SL0.push('green','green');
 const spec=rnd()<.25?SL0[ri(0,SL0.length-1)]:'';
 const r=[pickName(nat),...v.slice(0,8),age,0,nat,0,0,lim,-1,-1,rFav(),ri(0,48),0,-1,v[8],ri(1,10),spec,0];r[30]=v[9];return r}
/* ===== PERSONLIGHEDER (ændrer limits ved spawn) ===== */
// skill-rækkefølge: aim,handling,iq,quick,aware,det,calm,pat,pos. [navn, vægt, {skill:ændring} eller tal = alle]
const PERS={det:['Determined',6,{det:5}],shrp:['Sharpshooter',6,{aim:5}],cool:['Cool-headed',6,{calm:5}],pat:['Patient',6,{pat:5}],vig:['Vigilant',6,{aware:5}],snap:['Snappy',6,{quick:5}],tac:['Tactician',6,{iq:5}],disc:['Disciplined',6,{handling:5}],map:['Map-savvy',6,{pos:5}],
 pro:['Professional',2,2],grnd:['Grinder',4,{aim:3,handling:3,quick:3}],stud:['Student of the game',4,{iq:3,aware:3,pos:3}],res:['Resilient',4,{det:3,calm:3,pat:3}],allr:['All-rounder',4,1],
 aggr:['Aggressive',4,{det:7,quick:4,calm:-5,pat:-4}],caut:['Cautious',4,{pat:6,pos:4,det:-4}],flsh:['Flashy',4,{aim:6,quick:4,iq:-4}],lone:['Lone wolf',4,{aware:5,aim:4,iq:-3}],perf:['Perfectionist',4,{aim:4,handling:4,calm:-3}],
 over:['Overthinker',4,{iq:7,pat:3,quick:-4}],adr:['Adrenaline junkie',4,{quick:6,det:4,pat:-3}],stoic:['Stoic',4,{calm:6,pat:3,quick:-2}],
 lazy:['Lazy',2,-1],nerv:['Nervous',3,{calm:-6,aware:3}],arro:['Arrogant',3,{aim:4,iq:-5,pat:-3}]};
const PERS_MIN=65;
function pickPers(){const ks=Object.keys(PERS);let r=rnd()*ks.reduce((a,k)=>a+PERS[k][1],0);for(const k of ks){r-=PERS[k][1];if(r<0)return k}return 'allr'}
function applyPers(p,k){const e=PERS[k][2];p[14]=p[14].map((l,i)=>cl(l+(typeof e==='number'?e:(e[KS[i]]||0)),PERS_MIN,100));SI.forEach((si,i)=>{p[si]=Math.min(p[si],p[14][i])});p[25]=k;return p}
const persN=p=>p&&p[25]&&PERS[p[25]]?PERS[p[25]][0]:'';
{const _mk=mkTry;mkTry=function(h){return applyPers(_mk(h),pickPers())}}
function eff(d,p){const g=ig(d),gl=g?lvl(g[12],LT):0;let s=0;for(let k=0;k<NSK;k++)s+=effStat(p,k,p[19]===1?0:gl);return s}


/* sponsorer */
// share = forventet sæsonværdi for et gennemsnitshold ved rating 1, som andel af den gennemsnitlige lønsum pr. hold (ecoB) og ganget med landefaktoren (lgFac, samme som ligaindtægter) · step = tillæg pr. ratingtrin · loyal = forlængelse med samme sponsor
// gW/nW = trækningsvægt pr. rating (globale/nationale) · gTop/gBot = andel globale tilbud for nr. 1 og nr. 24 på koefficientlisten
// fix = spænd for den faste ugeandel · R/W/nat/youth = forventet antal vundne runder, vundne kampe, landsmænd og U21-kampe pr. sæson
const SPC={share:.6,step:.025,loyal:.03,gW:[0,0,0,3,2,1],nW:[0,2,1],gTop:.6,gBot:.1,fix:[.3,.7],R:360,W:14,nat:4,youth:33};
const spMult=r=>1+(r-1)*SPC.step;
const spPool=li=>[...GSP.map(n=>({n,r:GSPR[n],nat:-1})),...SPN[li].map((n,i)=>({n,r:i%2?1:2,nat:li}))];
const nice=x=>{if(x<=0)return 0;const m=Math.pow(10,Math.floor(Math.log10(x))-1);return Math.max(m,Math.round(x/m)*m)};
// forventet antal "enheder" pr. sæson for et gennemsnitshold (placering: 1/16 + ½·2/16 + 0,2·5/16 · titel: liga 1/16 + CL 2/200)
const EVU={week:()=>7,round:()=>SPC.R,match:()=>SPC.W,sign:o=>1/o.y,place:o=>o&&o.v3?1/16+.5*2/16:3/16,placeL:()=>8/16+.4*4/16,title:()=>1/16+2/200,natp:()=>7*SPC.nat,youth:()=>SPC.youth};
function mkOffer(s,loyal,li){const y=ri(1,3),B=ecoB()*SPC.share*lgFac(li!=null?li:s.nat>=0?s.nat:WD.me.li)*spMult(s.r)*(loyal?1+SPC.loyal:1),o={n:s.n,r:s.r,nat:s.nat,y,loyal:!!loyal,ev:B,c:{}};
 const f=Math.round((SPC.fix[0]+rnd()*(SPC.fix[1]-SPC.fix[0]))*20)/20,vars=['round','match','sign','place','title','youth'];if(s.nat>=0)vars.push('natp','natp');
 const k=rnd()<.5?1:2,pick=[];while(pick.length<k){const v=pk(vars);if(!pick.includes(v))pick.push(v)}
 const a=(1-f)*(.4+rnd()*.2),sh=k===1?[1-f]:[a,1-f-a];
 // engangsbeløb (underskrift, placering, titel) er loftet til en andel af B; den forventede værdi, de ikke kan bære, lægges over i ugebeløbet
 let rest=B*f;pick.forEach((v,i)=>{let x=B*sh[i]/EVU[v](o);if(SPCAP[v]!=null)x=Math.min(x,SPCAP[v]*B*(.8+rnd()*.4));x=nice(x);o.c[v]=x;rest+=B*sh[i]-x*EVU[v](o)});
 o.c.week=nice(rest/7);if(rnd()<.3)o.exit=pk([4,8,12]);return o}
// lofter som andel af tilbuddets sæsonværdi B: sign = underskrift · place = placering nr. 1 · title = ligatitel (CL-titel = 2×)
const SPCAP={sign:.25,place:.5,placeL:.5,title:.5};
function spDraw(li,n,excl){const pos=Math.max(0,WD.rank.indexOf(li)),gs=SPC.gTop-(SPC.gTop-SPC.gBot)*pos/23,pool=spPool(li).filter(s=>!excl.includes(s.n)),out=[];
 while(out.length<n&&pool.length){const glob=rnd()<gs;let c=pool.filter(s=>(s.nat<0)===glob);if(!c.length)c=pool;
  const w=c.map(s=>s.nat<0?SPC.gW[s.r]:SPC.nW[s.r]);let x=rnd()*w.reduce((p,q)=>p+q,0),i=0;while(i<c.length-1&&x>=w[i]){x-=w[i];i++}
  out.push(c[i]);pool.splice(pool.indexOf(c[i]),1)}return out}
const myT=()=>WD.lg[WD.me.li].teams[WD.me.ti];
function spPay(t,a){a=Math.round(a);if(a>0){ecoAdd('income','Sponsor',a);t.sp.earned=(t.sp.earned||0)+a}}
function setSp(t,o,mine){t.sp={...o,name:o.n,left:o.y,earned:0};t.name=o.n+' - '+t.def.name;if(mine&&o.c&&o.c.sign)spPay(t,o.c.sign)}
function sponsorSetup(){ensureGood();if(WD.day===0)setWages();WD.needSp=false;WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{if(t.sp)return;const mine=li===WD.me.li&&ti===WD.me.ti;
 const L=mine&&WD.lastSp?spPool(li).find(s=>s.n===WD.lastSp):null,o=spDraw(li,L?4:5,L?[L.n]:[]).map(s=>mkOffer(s,false,li));if(L)o.unshift(mkOffer(L,true,li));
 if(mine){WD.offers=o;WD.needSp=true;WD.lastSp=null}else setSp(t,aiPickSp(g,t,o))}))}
/* AI: økonomisk evne (uafhængig af managerkvaliteten mq, som kun bruges til holdstyring) */
const EIQ=[.4,1];// spænd for AI-holdenes økonomiske evne (1 = vurderer tilbud præcist)
const ecq=d=>d.ecq!=null?d.ecq:(d.ecq=EIQ[0]+rnd()*(EIQ[1]-EIQ[0]));
// grænser for både holdstyring (mq) og økonomi (ecq): under 0,6 = dårlig · 0,6-0,8 = middel · fra 0,8 = god
const QG={mid:.6,good:.8},qLbl=q=>q>=QG.good?'god':q>=QG.mid?'middel':'dårlig';
// hvert land får mindst 0-3 (tilfældigt) AI-hold, der er gode til både holdstyring og økonomi. Køres én gang pr. spil.
function ensureGood(){if(WD.goodSet)return;WD.goodSet=true;WD.lg.forEach((g,li)=>{const ai=g.teams.filter((t,ti)=>!(li===WD.me.li&&ti===WD.me.ti));
 const good=ai.filter(t=>mq(t.def)>=QG.good&&ecq(t.def)>=QG.good).length,need=ri(0,3)-good;
 shuffle(ai.filter(t=>!(t.def.mq>=QG.good&&t.def.ecq>=QG.good))).slice(0,Math.max(0,need)).forEach(t=>{const up=q=>q>=QG.good?q:QG.good+rnd()*(1-QG.good);t.def.mq=up(t.def.mq);t.def.ecq=up(t.def.ecq)});goodTac(ai)});WD.tcqSet=true}
// holdets forventede sæson ud fra styrkerang k (0 = stærkest) i egen liga
function spOutlook(g,t){const d=t.def,str=x=>line(x.def).reduce((a,p)=>a+eff(x.def,p),0),me=str(t),k=g.teams.filter(x=>x!==t&&str(x)>me).length;
 const w=g.teams.map((_,i)=>Math.exp(-((i-k)**2)/(2*2.5*2.5))),W0=w.reduce((a,b)=>a+b,0),P=w.map(x=>x/W0),cum=n=>P.slice(0,n).reduce((a,b)=>a+b,0);
 const wr=.75-.5*k/15,L=line(d);
 return{p1:P[0],p3:cum(3),p8:cum(8),pTop:n=>cum(n),wins:30*wr*.93,rounds:720*(.5+(.5-k/15)*.25),cl:k<2?.03:k<4?.01:.002,yt:L.filter(p=>p[9]<21).length,nat:li=>L.filter(p=>p[11]===li).length}}
// sand værdi pr. sæson af hver del af tilbuddet for netop dette hold
function spParts(o,X){const c=o.c,v={};
 if(c.week)v.week=c.week*7;if(c.sign)v.sign=c.sign/o.y;if(c.round)v.round=c.round*X.rounds;if(c.match)v.match=c.match*X.wins;
 if(c.place)v.place=c.place*(X.p1+.5*(X.p3-X.p1)+(o.v3?0:.2*(X.p8-X.p3)));if(c.placeL)v.placeL=c.placeL*(X.p8+.4*(X.pTop(12)-X.p8));if(c.title)v.title=c.title*(X.p1+2*X.cl);
 if(c.natp)v.natp=c.natp*7*X.nat(o.nat);if(c.youth)v.youth=c.youth*SPC.youth*X.yt;return v}
// værn: AI-holdet vælger kun blandt tilbud, hvor det faste ugebeløb og ligahjemmekampene (15 pr. sæson) dækker lønnen. Dækker intet tilbud, tages det sikreste
function aiPickSp(g,t,offers){{const li=WD.lg.indexOf(g),w=teamWage(t.def),sure=o=>((o.c&&o.c.week)||0)*7+lgAmt(li)*15,ok=offers.filter(o=>sure(o)>=w);offers=ok.length?ok:[offers.slice().sort((a,b)=>sure(b)-sure(a))[0]]}
 const q=ecq(t.def),X=spOutlook(g,t);
 // 4: de svageste vælger en gang imellem efter rating eller navn
 if(rnd()<Math.max(0,.6-q)*.75)return rnd()<.5?offers.slice().sort((a,b)=>b.r-a.r)[0]:pk(offers);
 let best=null,bv=-1;for(const o of offers){const v=spParts(o,X);let s=0;
  for(const k in v){let x=v[k]*(1+(rnd()*2-1)*(1-q));// 2: skønsfejl op til ±60 % ved evne 0,4
   if(k==='title'||k==='sign')x*=1+(1-q);// 3: blændes af store enkeltbeløb
   s+=x}
  if(o.exit&&o.y>1)s*=1-(1-X.pTop(o.exit))*(o.y-1)/o.y*.3*q;// gode økonomer tager højde for exitklausulen
  if(s>bv){bv=s;best=o}}
 return best}
const myLine=()=>line(myT().def);
function spWeek(){const t=myT(),s=t.sp;if(!s||!s.c)return;spPay(t,(s.c.week||0)+(s.c.natp||0)*myLine().filter(p=>p[11]===s.nat).length)}
function spMatch(defs){const t=myT(),s=t.sp;if(!s||!s.c)return;const i=defs.indexOf(t.def);if(i<0)return;const my=M.score[i],op=M.score[1-i];
 spPay(t,(s.c.round||0)*my+(my>op?s.c.match||0:0)+(s.c.youth||0)*myLine().filter(p=>p[9]<21).length)}
const plPay=(c,pos,v3)=>(c.place||0)*(pos===1?1:pos<=3?.5:!v3&&pos<=8?.2:0)+(c.placeL||0)*(pos<=8?1:pos<=12?.4:0);
function spSeason(){const t=myT(),s=t.sp;if(!s||!s.c)return;const pos=tbl(WD.lg[WD.me.li]).findIndex(x=>x.i===WD.me.ti)+1,clw=!!(WD.winner&&isMe(WD.winner)),e0=s.earned||0;
 spPay(t,plPay(s.c,pos,s.v3)+(s.c.title||0)*((pos===1?1:0)+(clw?2:0)));
 if(s.earned>e0)WD.report.push(`${s.name} udbetaler sæsonbonus: ${kr(s.earned-e0)}`);
 if(s.exit&&pos>s.exit){s.exited=true;if(s.left>1){s.left=1;WD.report.push(`${s.name} opsiger aftalen, fordi I sluttede under nr. ${s.exit}`)}}}
function showSponsor(){show('sp');renderSponsor()}
const STAR=r=>`<span style="color:#e0a800">${'★'.repeat(r)}</span><span style="color:#c9c9c9">${'★'.repeat(5-r)}</span>`;
// sponsortilbud vises som celler: én boks pr. tilbud, én række pr. vilkår
function spTerms(o){const c=o.c||{},L=[];
 if(c.week)L.push(['Pr. uge',kr(c.week)]);if(c.sign)L.push(['Ved underskrift',kr(c.sign)]);
 if(c.round)L.push(['Pr. vunden runde',kr(c.round)]);if(c.match)L.push(['Pr. vundet kamp',kr(c.match)]);
 if(c.place){L.push(['Placering nr. 1',kr(c.place)],['Placering top 3',kr(c.place*.5)]);if(!o.v3)L.push(['Placering top 8',kr(c.place*.2)])}
 if(c.placeL)L.push(['Placering top 8',kr(c.placeL)],['Placering top 12',kr(Math.round(c.placeL*.4))]);
 if(c.title)L.push(['Ligatitel',kr(c.title)],['CL-titel',kr(c.title*2)]);
 if(c.natp)L.push([`Pr. uge pr. ${COUNTRIES[o.nat][1].toLowerCase()} spiller i startfemmeren`,kr(c.natp)]);
 if(c.youth)L.push(['Pr. kamp pr. U21-spiller i startfemmeren',kr(c.youth)]);
 let h=L.map(([a,b])=>`<div class="sr"><span>${a}</span><b>${b}</b></div>`).join('');
 if(o.exit)h+=`<div class="sr" style="color:#d4352b">Opsiges, hvis I slutter under nr. ${o.exit}</div>`;
 if(o.loyal)h+=`<div class="sr" style="color:#1e9e4a">Forlængelse: +3 % loyalitetsbonus</div>`;
 return h}
const spHead=(o,sub)=>`<div class="sh"><div class="sl" style="font-size:13px;gap:8px"><b class="nm">${o.n||o.name}</b><span style="white-space:nowrap">${o.r?STAR(o.r):''}</span></div><div class="mu">${o.nat>=0?'National · '+COUNTRIES[o.nat][0]:o.nat===-1?'Global':''}${sub?' · '+sub:''}</div></div>`;
function renderSponsor(){
 const t=myT();let h=`<div class="hd"><b>Sponsor</b><span class="mu">Sæson ${WD.season}</span></div>`;
 if(t.sp)h+=`<div class="tm"><h3>Nuværende sponsor</h3><div class="spc">${spHead(t.sp,`${t.sp.left} sæson${t.sp.left>1?'er':''} tilbage${t.sp.exited?' (opsagt)':''}`)}<div class="sr"><span>Indtjent</span><b>${kr(t.sp.earned||0)}</b></div>${t.sp.c?spTerms(t.sp):'<div class="sr mu">Gammel aftale uden indtægt.</div>'}</div></div>`;
 if(WD.needSp&&WD.offers)h+=`<div class="tm"><h3>Vælg sponsor</h3><div class="mu">Du kan ikke gå videre, før du har valgt.</div>${WD.offers.map((o,i)=>`<div class="spc">${spHead(o,`${o.y} sæson${o.y>1?'er':''}`)}${spTerms(o)}<button data-s="${i}">Vælg ${o.n}</button></div>`).join('')}</div>`;
 $('sp').innerHTML=h}
$('sp').onclick=e=>{const b=e.target.closest('[data-s]');if(!b||!WD.needSp)return;setSp(myT(),WD.offers[+b.dataset.s],true);WD.needSp=false;WD.offers=null;renderNav();renderSponsor();saveGame()};
function playNext(){if(WD.needName)return showName();if(WD.needSp)return showSponsor();nextDay(false)}
/* dag og uge */
const snapMap=()=>{const m=new Map();TEAMS[0].pl.forEach(p=>m.set(p,KS.map((_,k)=>fl(p[SI[k]]))));return m};
function dayStart(){WD.snap=snapMap();if(WD.day%7===0||!WD.wsnap)WD.wsnap=snapMap()}
function diffRows(sn){const rows=[];TEAMS[0].pl.forEach(p=>{const b=sn.get(p);if(!b)return;const c=[];for(let k=0;k<NSK;k++){const a=fl(p[SI[k]]);if(a!==b[k])c.push({sk:SK[k],b:b[k],a,d:a-b[k]})}if(c.length)rows.push({n:p[0],c})});return rows}
function dailyTick(){
 let mx=false;
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const d=t.def,mine=li===WD.me.li&&ti===WD.me.ti;if(!mine){autoRooms(d);aiLineup(d)}
  d.pl.forEach(p=>{const r=rateP(p,p[9]),k=p[20];if(k>=0&&r>0){const i=SI[k],b=p[i];p[i]=Math.min(p[14][k],b+r);if(mine&&b<p[14][k]-1e-9&&p[i]>=p[14][k]-1e-9)mx=true}const l=agingP(p,p[9]);if(l>0){const q=SI[ri(0,NSK-1)];p[q]=Math.max(0,p[q]-l)}})}));
 WD.maxNew=mx;WD.rep=diffRows(WD.snap);WD.report=[];WD.reportDay=`uge ${Math.floor(WD.day/7)+1}, ${DAYS[WD.day%7]}`}
function endDay(){
 dailyTick();WD.tryNew=false;WD.day++;if(WD.day%7===0)spWeek();
 if(WD.day>=NDAYS){WD.hist.push(seasonCoef());WD.winner=winK(WD.po[4][0]);spSeason();hofRecord();WD.prev=WD.lg.map(g=>tbl(g).map(s=>s.i));seasonEnd();
  WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{if(t.sp&&--t.sp.left<=0){if(li===WD.me.li&&ti===WD.me.ti&&!t.sp.exited)WD.lastSp=t.sp.name;t.sp=null;t.name=t.def.name}t.def.pl.forEach(p=>p[24]=0)}));WD.season++;WD.day=0;WD.lg.forEach(g=>g.res=[])}
 onEnter(WD.day);birthdays(WD.day);if(WD.day===0)scoutSeason();scoutDay();if(WD.day===0)sponsorSetup();dayStart();renderNav();
 if(VIEW==='lg')renderLeague();if(VIEW==='cl')renderCL();if(VIEW==='tr')renderTrain();if(VIEW==='ty')renderTryout();if(VIEW==='ov')renderOverview();
 if(WD.needSp)showSponsor();saveGame()}
function renderNav(){
 const it=[['lg','Liga'],['cl','CL'],['tv','Taktik'],['ov','Hold'],['tr','Træning'],['ty','Tryout'],['ec','Økonomi'],['sp','Sponsor'],['hf','HoF'],['fq','FAQ']];if(live()||VIEW==='mv')it.push(['mv','Kamp']);
 const al={tr:WD.maxNew,ty:WD.tryNew};
 $('nav').innerHTML=it.map(([k,t])=>`<button class="${VIEW===k?'on':''}${al[k]&&VIEW!==k?' alert':''}" data-v="${k}">${t}</button>`).join('')+'<button data-x="gem" class="sv">Gem</button><button data-x="nyt" class="sv">Nyt spil</button>';
 $('nx').textContent=BUSY?'Simulerer…':WD.needName?'Navngiv hold':WD.needSp?'Vælg sponsor':live()?'Til kamp':(dayRound(WD.day)||myCL())?'Spil kamp':'Næste dag';$('nx').disabled=BUSY}
/* træning */
// træningsrapport i celleformat: én række pr. ændring, spillerens navn fletter over sine rækker
const repHTML=rows=>rows.length?`<table class="rpt"><colgroup><col style="width:27%"><col style="width:33%"><col style="width:13%"><col style="width:14%"><col style="width:13%"></colgroup><thead><tr><th>Spiller</th><th>Skill</th><th class="n2">Før</th><th class="n2">Efter</th><th class="n2">±</th></tr></thead><tbody>${rows.map(r=>r.c.map((c,i)=>`<tr>${i?'':`<td class="rp" rowspan="${r.c.length}">${r.n}</td>`}<td>${c.sk}</td><td class="n2">${c.b}</td><td class="n2">${c.a}</td><td class="n2" style="color:${c.d>0?'#1e9e4a':'#d4352b'};font-weight:700">${c.d>0?'+':'−'}${Math.abs(c.d)}</td></tr>`).join('')).join('')}</tbody></table>`:'<div class="mu">Ingen hele point fået eller mistet.</div>';
function renderTrain(){
 const d=TEAMS[0],occ=SK.map((_,k)=>d.pl.filter(p=>p[20]===k).length),tab=WD.rtab||'day',seg=(v,l)=>`<button class="${tab===v?'on':''}" data-r="${v}">${l}</button>`;
 let h=`<div class="hd"><b>Træning</b><span class="mu">Dag ${WD.day+1}/49</span></div>`;
 h+=`<div class="tm"><h3>Træningsrum (maks 3 pr. rum)</h3><div class="sg">${SK.map((s,k)=>`<div><div class="sl"><span>${s}</span><b>${occ[k]}/3</b></div><div class="mu">${d.pl.filter(p=>p[20]===k).map(p=>p[0]).join(', ')||'–'}</div></div>`).join('')}</div></div>`;
 h+=`<div class="tm rl2"><h3>Fordeling</h3>${d.pl.map((p,j)=>{const k=p[20],mx=k>=0&&p[SI[k]]>=p[14][k]-1e-9;return `<div class="r"><div class="nm">${p[0]} <small>${p[9]} år${k>=0?` · ${fl(p[SI[k]])}/${p[14][k]}${mx?' MAX':''}`:''}</small></div><select data-t="${j}"><option value="-1">Ingen</option>${SK.map((s,x)=>`<option value="${x}" ${p[20]===x?'selected':''} ${occ[x]>=3&&p[20]!==x?'disabled':''}>${s}</option>`).join('')}</select></div>`}).join('')}</div>`;
 h+=`<div class="tm"><h3>Træningsrapport</h3><div class="bar sm">${seg('day','Dag')}${seg('week','Uge')}</div>`;
 if(tab==='day')h+=`<div class="mu">${WD.reportDay||''}</div>${repHTML(WD.rep||[])}${(WD.report||[]).map(x=>`<div style="padding:2px 0">${x}</div>`).join('')}`;
 else h+=`<div class="mu">Uge ${Math.floor(WD.day/7)+1} indtil nu</div>${repHTML(diffRows(WD.wsnap))}`;
 $('tr').innerHTML=h+'</div>'}
$('tr').onclick=e=>{const b=e.target.closest('[data-r]');if(b){WD.rtab=b.dataset.r;renderTrain()}};
/* hold og tryout */
const sbar=(b,x,l)=>x<0?`<div class="sb sb2"><i class="g" style="width:${l}%"></i><i class="r" style="width:${b}%"></i><i class="o" style="width:${Math.max(0,b+x)}%"></i></div>`:`<div class="sb sb2"><i class="g" style="width:${l}%"></i><i class="d" style="width:${Math.min(100,b+x)}%"></i><i class="o" style="width:${b}%"></i></div>`;
function renderOverview(){
 const d=TEAMS[0],gl=lvl(ig(d)[12],LT),bar=(v,m)=>`<div class="sb"><i style="width:${100*v/m}%"></i></div>`;
 $('ov').innerHTML=`<div class="hd"><b>${d.name}</b><span class="mu">${krV(d.pl.reduce((a,p)=>a+pVal2(p),0))} · ${ysN(d.pl)}/7 spillere${d.pl.some(ysEl)?' + ungdomsplads':''} <button data-rn="1" style="padding:3px 8px;margin-left:6px">Omdøb</button></span></div>`+d.pl.map((p,j)=>{const x=p[19]===1?0:gl,S=fl(tot(p)),sp=p[23]?SPEC[p[23]]:null;
  const rows=SK.map((s,k)=>{const b=fl(p[SI[k]]),rw=effStat(p,k,x)-p[SI[k]],db=rw<0?-Math.ceil(-rw-1e-6):Math.floor(rw+1e-6);return `<div><div class="sl"><span>${s}</span><b>${b}${db>=1?`<span style="color:#b4560a">+${db}</span>`:db<0?`<span style="color:#d4352b">−${-db}</span>`:''} <span class="mu">/${p[14][k]}</span></b></div>${sbar(b,db,p[14][k])}</div>`}).join('');
  return `<div class="tm"><h3>${flag(FLAGC[p[11]])} ${sp?`<span title="${sp[1]}">${sp[0]}</span> `:''}${p[0]}${p[19]===1?' <small>IGL</small>':''}${p[15]<0?' <small>Bænk</small>':''}${p[35]&&ysEl(p)?' <small style="color:#1e9e4a">Ungdomsplads</small>':''} <span class="mu">${p[9]} år · ${p[13]} kampe</span></h3><div class="mu" style="margin-bottom:4px">Personlighed: ${persN(p)} · Yndlingsvåben: ${WN[p[17]]} · Erfaring ${lvl(p[13],ET)}/5 · Ledelse ${lvl(p[12],LT)}/5 (${p[12]} IGL-kampe) · Boost +${lvl(p[13],ET)+x}%${p[31]>0?` <span style="color:#d4352b">−${Math.round((1-TPEN.f)*100)}% (transfer, ${p[31]} kamp${p[31]===1?'':'e'} tilbage)</span>`:''}</div><div class="sg">${rows}</div><div class="sl" style="margin-top:8px"><b>Samlet</b><b>${S} <span class="mu">/${p[14].reduce((a,b)=>a+b,0)}</span></b></div><div class="sb sb2"><i class="g" style="width:${p[14].reduce((a,b)=>a+b,0)/10}%"></i><i class="o" style="width:${S/10}%"></i></div>${valHTML(p,1)}<button data-k="${j}" ${d.pl.length<=5?'disabled':''} style="margin-top:8px;width:100%">${OVK===j?'Bekræft kick':'Kick spiller'}</button></div>`}).join('')}
function renderTryout(){
 const d=TEAMS[0],o=WD.offer,full=o?ysFull(d,o):ysN(d.pl)>=TRF.maxSq;
 let h=`<div class="hd"><b>Tryout</b><span class="mu">Hold ${ysN(d.pl)}/7${d.pl.some(ysEl)?' + ungdomsplads':''}</span></div>`;
 if(!o)h+=`<div class="tm"><div class="mu">Ingen spiller til prøve lige nu. ${scoutNext()}</div></div>`;
 else{const sp=o[23]?SPEC[o[23]]:null;h+=`<div class="tm"><h3>${flag(FLAGC[o[11]])} ${sp?`<span title="${sp[1]}">${sp[0]}</span> `:''}${o[0]} <span class="mu">${o[9]} år · ${WN[o[17]]}</span></h3><div class="mu">Personlighed: ${persN(o)}</div>${sp?`<div class="mu">${sp[0]} ${sp[1]}: ${sp[2]}</div>`:''}<div class="sg">${SK.map((s,k)=>`<div><div class="sl"><span>${s}</span><b>${fl(o[SI[k]])} <span class="mu">/${o[14][k]}</span></b></div>${sbar(fl(o[SI[k]]),0,o[14][k])}</div>`).join('')}</div><div class="sl" style="margin-top:8px"><b>Samlet</b><b>${fl(tot(o))}/1000</b></div><div class="sb"><i style="width:${tot(o)/10}%"></i></div>${valHTML(o)}<div class="bar"><button id="tk1" ${full?'disabled':''}>Tag på holdet</button><button id="tk2">Afvis</button></div>${full?'<div class="mu">Holdet er fuldt (7/7). Kick en spiller i Hold-fanen først.</div>':''}</div>`}
 $('ty').innerHTML=h}
/* liga */

$('lg').addEventListener('click',e=>{if(e.target.id==='frb'){WD.frags=!WD.frags;renderLeague()}});
/* CL */
const knS=k=>kdef(k).name;// holdnavn uden sponsor
const kfS=k=>`<span class="${isMe(k)?'me2':''}" title="${knm(k)}">${flag(FLAGC[k.li])} ${tl(k.li,k.ti,knS(k))}</span>`;
const bm=m=>{if(!m)return `<div class="bx"><div class="bt mu">TBD</div><div class="bt mu">TBD</div></div>`;const w=m.res?winK(m):null,row=(k,s)=>`<div class="bt ${w===k?'bw':''}"><span class="nm">${kfS(k)}</span><b>${s}</b></div>`;return `<div class="bx">${row(m.a,m.res?m.res[0]:'')}${row(m.b,m.res?m.res[1]:'')}</div>`};
const bracketHTML=(R,L)=>`<div class="br">${R.map((r,i)=>`<div class="bc"><div class="mu bl">${L[i]}</div>${r.map(bm).join('')}</div>`).join('')}</div>`;

function cgHTML(){
 if(!WD.cg)return `<div class="tm"><h3>Lodtrækning tirsdag i uge 2</h3><div class="mu">40 hold fordeles tilfældigt i 8 grupper à 5. De to bedste i hver gruppe går videre.</div></div>`;
 const ln=(c,cls)=>`<div class="r ${cls||''}">${c.map((x,k)=>`<div class="${k===1?'nm':''}">${x}</div>`).join('')}</div>`;
 return WD.cg.map((g,i)=>`<div class="tm lt"><h3>Gruppe ${'ABCDEFGH'[i]}</h3><div class="sx"><div class="lg2">`+ln(['#','Hold','K','S-U-T','Runder','P'],'eq')+gtab(g).map((s,k)=>ln([k+1,kf(s.k),s.p,`${s.w}-${s.d}-${s.l}`,`${s.rf}-${s.ra}`,s.pts],k===1?'solid':'')).join('')+'</div></div></div>').join('')}

function pladsHTML(){const cells=arr=>`<div class="cg2">${WD.rank.map(li=>{const x=arr.filter(k=>k.li===li);return x.length?`<div class="bx"><div class="bt bw"><span class="nm">${flag(FLAGC[li])} ${COUNTRIES[li][0]}</span></div>${x.map(k=>`<div class="bt"><span class="nm"><span class="${isMe(k)?'me2':''}">${tl(k.li,k.ti,knm(k))}</span></span></div>`).join('')}</div>`:''}).join('')}</div>`;
 return `<div class="tm"><h3>Direkte pladser (${WD.dir.length})</h3>${cells(WD.dir)}</div><div class="tm"><h3>Kvalifikation (${WD.qual.length})</h3>${cells(WD.qual)}</div>`}
function coefHTML(){const ln=(c,cls)=>`<div class="r ${cls||''}">${c.map((x,k)=>`<div class="${k===1?'nm':''}">${x}</div>`).join('')}</div>`;
 return `<div class="tm c5"><h3>Landekoefficienter</h3>`+ln(['#','Land','Koef.','Dir.','Kval.'],'eq')+WD.rank.map((li,k)=>{const p=placesOf(k);return ln([k+1,`${flag(FLAGC[li])} ${COUNTRIES[li][0]}`,WD.coefv[li].toFixed(2),p.d||'–',p.q],WD.me.li===li?'me':'')}).join('')+`<div class="eq" style="padding-top:6px">Sidste sæsons vinder har 1 direkte plads. Er vinderen allerede direkte kvalificeret, går pladsen til nr. 21 på listen.</div></div>`}
function renderCL(){
 // landekoefficienten vises nu under Ranking, men bruges stadig til CL-pladser, seedning, sponsorer og indtægter
 if(!['kval','grp','po','plads'].includes(WD.cltab))WD.cltab='kval';
 const t=WD.cltab,seg=(v,l)=>`<button class="${t===v?'on':''}" data-c="${v}">${l}</button>`;
 $('cl').innerHTML=`<div class="hd"><b>Champions League</b><span class="mu">Sæson ${WD.season}</span></div><div class="bar sm">${seg('kval','Kval')}${seg('grp','Grupper')}${seg('po','Playoff')}${seg('plads','Pladser')}</div>`+(t==='kval'?kvalHTML():t==='grp'?cgHTML():t==='po'?poHTML():pladsHTML())}

/* hall of fame */
// gemmer navn (som det hed i sæsonen), land og om det var managerens hold
function hofRecord(){if(!WD.po||!WD.po[4]||!WD.po[4][0].res)return;const fin=WD.po[4][0],w=winK(fin),s=w===fin.a?fin.b:fin.a,bz=WD.po[5]&&WD.po[5][0]&&WD.po[5][0].res?winK(WD.po[5][0]):null;
 const e=k=>k?{n:knm(k),id:k.li+'-'+k.ti,li:k.li,me:isMe(k)}:null;(WD.hof=WD.hof||[]).push({s:WD.season,t:[e(w),e(s),e(bz)]})}
function showHof(){show('hf');renderHof()}
function renderHof(){const H=(WD.hof||[]).slice().reverse(),M3=['🥇','🥈','🥉'];
 const row=(x,i)=>`<div class="sl" style="padding:3px 0"><span class="nm">${M3[i]} ${x?`<span class="${x.me?'me2':''}">${flag(FLAGC[x.li])} ${hfl(x)}</span>`:'<span class="mu">Ingen bronzekamp spillet</span>'}</span></div>`;
 const cnt={};(WD.hof||[]).forEach(e=>e.t.forEach((x,i)=>{if(!x)return;const id=x.id||x.n,c=cnt[id]=cnt[id]||{li:x.li,id:x.id,me:x.me,m:[0,0,0]};c.n=x.n;c.me=c.me||x.me;c.m[i]++}));
 const tab=Object.values(cnt).sort((a,b)=>b.m[0]-a.m[0]||b.m[1]-a.m[1]||b.m[2]-a.m[2]).slice(0,10);
 $('hf').innerHTML=`<div class="hd"><b>Hall of Fame</b><span class="mu">Champions League top 3</span></div>`+(H.length?
  (tab.length?`<div class="tm"><h3>Medaljetabel</h3>${tab.map(c=>`<div class="sl" style="padding:3px 0"><span class="nm"><span class="${c.me?'me2':''}">${flag(FLAGC[c.li])} ${hfl(c)}</span></span><b>${c.m[0]}🥇 ${c.m[1]}🥈 ${c.m[2]}🥉</b></div>`).join('')}</div>`:'')+
  H.map(e=>`<div class="tm"><h3>Sæson ${e.s}</h3>${e.t.map(row).join('')}</div>`).join('')
  :`<div class="tm"><div class="mu">Endnu ingen afsluttede sæsoner. Top 3 i Champions League skrives ind her ved hver sæsonslut.</div></div>`)}
/* gem og indlæs */
const SAVE_KEY='csm_save_v1';let NYT=false;
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({WD,PN,NU:[...NU],ECON,order:MGR},(k,v)=>k==='snap'||k==='wsnap'?undefined:v));return true}catch(e){return false}}
function loadGame(){try{const s=svUnpack(localStorage.getItem(SAVE_KEY));if(!s)return false;SVN=(localStorage.getItem(SAVE_KEY)||'').length;const o=JSON.parse(s,r2Rev);WD=o.WD;WD.lg.forEach(g=>g.teams.forEach(t=>t.def.pl.forEach(migTeam)));migTeam(WD.offer);WD.lg.forEach(g=>g.teams.forEach(t=>t.def.pl.forEach(p=>{if(!p[25])applyPers(p,'allr')})));if(WD.offer&&!WD.offer[25])applyPers(WD.offer,'allr');PN=o.PN;NU.clear();o.NU.forEach(n=>NU.add(n));Object.assign(ECON,o.ECON);if(o.order&&o.order.T){MGR.csm=o.order;MGR.dust2=JSON.parse(JSON.stringify(o.order))}else if(o.order){MGR.csm=o.order.csm||mgr0();MGR.dust2=o.order.dust2||mgr0()}MGR.aztec=(o.order&&o.order.aztec)||JSON.parse(JSON.stringify(MGR.csm));MGR.inferno=(o.order&&o.order.inferno)||JSON.parse(JSON.stringify(MGR.csm));migrateRot();assignMaps();TEAMS[0]=WD.lg[WD.me.li].teams[WD.me.ti].def;TEAMS[0].order=MGR;dayStart();return true}catch(e){return false}}
$('nav').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;
 if(b.dataset.x==='gem'){b.textContent=saveGame()?'Gemt \u2713':'Fejl';setTimeout(renderNav,1200)}
 else if(NYT){NYT=false;try{localStorage.removeItem(SAVE_KEY)}catch(x){}PN=100;NU.clear();newLeague()}
 else{NYT=true;b.textContent='Sikker?';setTimeout(()=>{NYT=false;renderNav()},3000)}});

/* ===== HOLDNAVNE OG NAVNE (fase 7) ===== */
const GEOO={'Danmark':`København,Aarhus,Odense,Aalborg,Esbjerg,Roskilde,Skagen,Silkeborg`,'Norge':`Oslo,Bergen,Trondheim,Tromsø,Stavanger,Lofoten`,'Sverige':`Stockholm,Göteborg,Malmö,Uppsala,Kiruna,Visby`,'Finland':`Helsinki,Tampere,Oulu,Rovaniemi,Turku,Lappi`,'Letland':`Rīga,Jūrmala,Liepāja,Cēsis,Sigulda,Daugavpils`,'Estland':`Tallinn,Tartu,Pärnu,Narva,Saaremaa,Haapsalu`,'Polen':`Warszawa,Kraków,Gdańsk,Wrocław,Poznań,Zakopane`,'Tyskland':`Berlin,München,Hamburg,Köln,Dresden,Leipzig,Frankfurt`,'Spanien':`Madrid,Barcelona,Sevilla,Valencia,Bilbao,Ibiza`,'Portugal':`Lisboa,Porto,Faro,Coimbra,Madeira,Sintra`,'Frankrig':`Paris,Lyon,Marseille,Bordeaux,Nice,Lille,Toulouse`,'Holland':`Amsterdam,Rotterdam,Utrecht,Eindhoven,Groningen,Haarlem`,'Belgien':`Brussel,Antwerpen,Gent,Brugge,Liège,Leuven`,'Schweiz':`Zürich,Genève,Basel,Bern,Luzern,Davos`,'Østrig':`Wien,Salzburg,Graz,Innsbruck,Linz,Kitzbühel`,'Grækenland':`Athen,Thessaloniki,Kreta,Rhodos,Patras,Delfi`,'USA':`Austin,Seattle,Chicago,Brooklyn,Nashville,Phoenix,Miami`,'Brasilien':`Rio,São Paulo,Salvador,Recife,Brasília,Manaus`,'Argentina':`Buenos Aires,Córdoba,Mendoza,Rosario,Ushuaia,Salta`,'Storbritannien':`London,Manchester,Glasgow,Liverpool,Leeds,Bristol,Cardiff`,'Rumænien':`București,Cluj,Brașov,Timișoara,Sibiu,Iași`,'Japan':`Tokyo,Osaka,Kyoto,Sapporo,Nagoya,Fukuoka`,'Korea':`Seoul,Busan,Incheon,Daegu,Jeju,Gwangju`,'Canada':`Toronto,Vancouver,Montréal,Calgary,Ottawa,Banff`};
const CULTO={'Danmark':`Tivoli Titans,H.C. Andersen Eventyr,Rugbrød Rebels,Kronborg Kongerne,Smørrebrød Squad`,'Norge':`Fjord Fighters,Peer Gynt Gamers,Nordlys Nomader,Vikingskip Veteraner,Brunost Brigade`,'Sverige':`Fika Frag Force,Waterloo Warriors,Pippi Pirates,Vasa Voyagers,Midsommar Mayhem`,'Finland':`Sibelius Symphony,Kalevala Kings,Sisu Squad,Moomin Mafia,Sauna Slayers`,'Letland':`Dziesmu Svētki,Līgo Legends,Baltic Amber,Rīga Rhythm`,'Estland':`Singing Revolution,Kalevipoeg Klan,Tallinn Tunes,Baltic Bears`,'Polen':`Chopin Champions,Witcher Warband,Pierogi Posse,Wawel Dragons,Solidarity Squad`,'Tyskland':`Beethoven Blitz,Kraftwerk Crew,Goethe Gang,Oktoberfest Orks,Faust Force`,'Spanien':`Flamenco Fury,Don Quixote Knights,Gaudí Gang,La Furia Roja,Siesta Squad`,'Portugal':`Fado Fighters,Camões Crew,Saudade Squad,Pastel de Nata Pack`,'Frankrig':`Les Misérables,Musketeers Unis,Daft Frags,Amélie Alliance,Versailles Vandals`,'Holland':`Van Gogh Vanguard,Rembrandt Raiders,Orange Army,Tulip Mania,Windmill Warriors`,'Belgien':`Tintin Troopers,Smurf Syndicate,Magritte Mafia,Waffle Warriors,Manneken Pis Pack`,'Schweiz':`Heidi Heroes,Tell Arrows,Swiss Watchmen,Alpine Horn Squad,Chocolat Clutch`,'Østrig':`Mozart Marauders,Sound of Frags,Schönbrunn Syndicate,Strauss Squad,Habsburg Hunters`,'Grækenland':`Odyssey Squad,Zorba Dance,Spartan 300,Olympus Order,Titan Tragedy`,'USA':`Elvis Lives,Route 66 Rebels,Wild West Wolves,Hollywood Heroes,Jazz Age Gang`,'Brasilien':`Samba Strikers,Carnaval Crew,Bossa Nova Boys,Amazon Anacondas,Redentor Crew`,'Argentina':`Tango Titans,Gaucho Gang,Evita Army,Asado Assassins,Hand of Gods`,'Storbritannien':`Beatles Brigade,Baker Street Squad,Camelot Crew,Britpop Battalion,Stonehenge Syndicate`,'Rumænien':`Dracula Dynasty,Carpathian Counts,Transylvanian Nights,Enescu Ensemble`,'Japan':`Samurai Sound,Anime Ascendants,Shinkansen Strikers,Sakura Syndicate,Ghibli Guild`,'Korea':`K-Pop Killers,Hallyu Heroes,Hanbok Hunters,Kimchi Commandos,Seoul Soul`,'Canada':`Maple Mayhem,Poutine Posse,Mountie Marauders,Northern Lights Legion,Hockey Night Hoodlums`};
const GEO=COUNTRIES.map(([c])=>GEOO[c].split(',')),CULTC=COUNTRIES.map(([c])=>CULTO[c].split(','));
const CULTG=`Purple Haze,Smells Like Clutch Spirit,Brick in the Wall,Stairway to Frag-Heaven,Bohemian Raiders,Born to Frag,Dancing Queens,Thunderstruck,Sweet Child O Clutch,Hotel Cali-Frag,Back in Black,Paint It Black,Whole Lotta Frags,Eye of the Tiger,Rhythm Nation,Moonwalkers,Ziggy Stardust,Jump Around,Highway to Mid,Take On Me,Blue Suede Clutch,The Last Dance,Winter Is Coming,Fellowship of the Frag,The Force Awakens,Galactic Empire,Jedi Council,Matrix Reloaded,Pulp Frictions,Reservoir Frags,Casablanca Club,Gladiator Guild,Ocean Eleven,Mad Max Fury,Jurassic Squad,Back to the Future,Blade Runners,Fight Club,Narnia Knights,Hogwarts Express,Mordor Marauders,Shire Folk,Sherlock Squad,Valhalla Rising,Olympus Has Fallen,Camelot,Excalibur,Atlantis Rising,Wonderland,Odyssey`.split(',');
/* ===== NAVNEMOTOR v2: grundformer + filtre ===== */
// Længdegrænser, så navne passer i de smalle mobilrækker (kampprogram og spillerlister)
const TMAX=16,PMAX=12;
const pk=a=>a[ri(0,a.length-1)];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const wpick=o=>{let r=rnd()*Object.values(o).reduce((a,b)=>a+b,0);for(const k in o){r-=o[k];if(r<0)return k}return Object.keys(o)[0]};
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ø/g,'o').replace(/Ø/g,'O').replace(/æ/g,'ae').replace(/Æ/g,'Ae').replace(/ł/g,'l').replace(/Ł/g,'L').replace(/ß/g,'ss');
/* --- holdenes egne ordlister (deles ikke med spillernavne) --- */
const TNOUN=`Storm,Wolves,Kings,Ravens,Phantoms,Rebels,Blaze,Titans,Legion,Syndicate,Hawks,Vipers,Knights,Giants,Raiders,Foxes,Dragons,Sharks,Eagles,Bears,Comets,Thunder,Tigers,Owls,Lynx,Crows,Hornets,Jackals,Bulls,Rhinos,Outlaws,Pirates,Nomads,Sentinels,Wardens,Monarchs,Saints,Sinners,Dynamos,Rockets,Riot,Pulse,Union,Order,Crew,Pack,Kollektiv,Mafia`.split(','),
TADJ=`Royal,Iron,Red,Black,Golden,Silent,Wild,Rapid,Northern,Southern,Lone,Frozen,Burning,Hidden,Electric,Velvet,Rusty,Lucky,Angry,Sleepy,Polar,Lunar,Solar,Feral,Rogue,Midnight,Sunday`.split(',');
const LWO={'Danmark':`Uvejr,Lynild,Stormflod,Ulveflokken,Hærværk,Tordenkile,Kragerne,Bersærkerne,Natteravnene,Tågen,Blæsten,Frostbid,Kaos & Kaffe,Sild & Snaps,Hyggeligt Kaos`,'Norge':`Uvær,Nordavind,Fjellulvene,Trollmenn,Ravnene,Lynet,Stormkast,Isbjørnene,Brunost FC,Fossegrimen`,'Sverige':`Ovädret,Vargflocken,Åskan,Korparna,Blixten,Stormfåglar,Björnligan,Snöstormen,Lagom Laget`,'Finland':`Ukkonen,Myrsky,Sudet,Karhut,Salama,Pakkanen,Revontulet,Korpit,Sisu Sakki`,'Letland':`Vētra,Vilki,Zibens,Pērkons,Lāči,Krauklis,Sals,Ziemeļi`,'Estland':`Torm,Hundid,Äike,Välk,Karud,Ronk,Pakane,Virmalised`,'Polen':`Burza,Wilki,Orły,Piorun,Smoki,Husaria,Żubry,Grom,Pierogi Mafia`,'Tyskland':`Unwetter,Wolfsrudel,Donnerkeil,Sturmflut,Eisbären,Raben,Blitzschlag,Nachtfalken,Wurst Case`,'Spanien':`Tormenta,Los Lobos,Relámpago,Toros Bravos,Los Halcones,Tempestad,Furia,La Manada`,'Portugal':`Tempestade,Os Lobos,Relâmpago,Tubarões,Trovão,Falcões,Furacão,A Matilha`,'Frankrig':`Tempête,Les Loups,Foudre,Orage,Les Corbeaux,Tonnerre,La Meute,Les Aigles,Ooh La Frag`,'Holland':`Onweer,De Wolven,Donder,Bliksem,De Raven,Stormvloed,Leeuwen,Gekke Kaas`,'Belgien':`Onweer,De Leeuwen,Les Diables,Donder,Brouillard,De Raven,Ardennenwolf,Bliksem,Frietkot FC`,'Schweiz':`Gewitter,Lawine,Föhnsturm,Steinböcke,Alpenwölfe,Bergadler,Gletscher,Murmeltiere`,'Østrig':`Gewitter,Lawine,Bergadler,Gämsen,Donauwölfe,Alpenblitz,Wildschütz,Krampus`,'Grækenland':`Kataigida,Lykoi,Keravnos,Aetoi,Thyella,Fotia,Drakos,Spartiates`,'USA':`Outlaws,Gunslingers,Bootleggers,Thunderbirds,Coyotes,Hustlers,Mustangs,Tailgaters`,'Storbritannien':`Lads,Hooligans,Dreadnought,Highlanders,Redcoats,Rascals,Tea Party,Soggy Chips`,'Canada':`Snowbirds,Lumberjacks,Blizzard,Wendigo,Huskies,Voyageurs,Loons,Sorry Not Sorry`,'Brasilien':`Tempestade,Onças,Os Lobos,Trovão,Tubarões,Jacarés,Furacão,Saci`,'Argentina':`Tormenta,Los Cóndores,Pampero,Los Gauchos,La Barra,Furia,Los Zorros,Tango Negro`,'Rumænien':`Furtuna,Lupii,Fulger,Vulturii,Zmeii,Vârcolaci,Haiducii,Strigoi`,'Japan':`Arashi,Kaminari,Ookami,Raijin,Tengu,Kitsune,Kaze,Ryuu`,'Korea':`Pokpung,Beonkae,Horangi,Neukdae,Yong,Cheondung,Dokkaebi,Bulkkot`};
const LW=COUNTRIES.map(([c])=>LWO[c].split(','));
const TLDO={'Danmark':'dk','Norge':'no','Sverige':'se','Finland':'fi','Letland':'lv','Estland':'ee','Polen':'pl','Tyskland':'de','Spanien':'es','Portugal':'pt','Frankrig':'fr','Holland':'nl','Belgien':'be','Schweiz':'ch','Østrig':'at','Grækenland':'gr','USA':'us','Storbritannien':'uk','Canada':'ca','Brasilien':'br','Argentina':'ar','Rumænien':'ro','Japan':'jp','Korea':'kr'};
const TLD=COUNTRIES.map(([c])=>TLDO[c]);
/* --- fornavne pr. land (til afledte kaldenavne) --- */
const FNO={'Danmark':`Kristoffer,Mads,Rasmus,Mikkel,Jonas,Frederik,Nikolaj,Emil,Magnus,Oliver,Søren,Anders,Kasper,Christian,Lasse,Jesper,Bjarke,Tobias`,'Norge':`Håkon,Sindre,Eirik,Magnus,Jørgen,Sigurd,Torbjørn,Even,Vegard,Øystein,Henrik,Lars`,'Sverige':`Oskar,Viktor,Linus,Hampus,Albin,Gustav,Erik,Simon,Ludvig,Axel,Pontus,Joel`,'Finland':`Juha,Mikko,Aleksi,Joni,Tuomas,Eetu,Ville,Jani,Sami,Onni,Lauri,Teemu`,'Letland':`Jānis,Kārlis,Roberts,Edgars,Mārtiņš,Artūrs,Raivis,Toms,Kristaps,Andris,Ēriks,Valdis`,'Estland':`Mart,Tõnis,Rasmus,Kristjan,Siim,Andres,Priit,Karl,Margus,Ott,Rein,Taavi`,'Polen':`Paweł,Kamil,Mateusz,Jakub,Wojciech,Piotr,Łukasz,Michał,Szymon,Tomasz,Grzegorz,Filip`,'Tyskland':`Lukas,Jonas,Felix,Maximilian,Tobias,Florian,Sebastian,Moritz,Niklas,Dominik,Kevin,Jannik`,'Spanien':`Alejandro,Pablo,Javier,Sergio,Daniel,Iker,Álvaro,Carlos,Rubén,Adrián,Hugo,Mario`,'Portugal':`João,Tiago,Rui,Diogo,Pedro,Gonçalo,Ricardo,Nuno,Bruno,Miguel,André,Rafael`,'Frankrig':`Mathieu,Kévin,Lucas,Théo,Nicolas,Julien,Antoine,Hugo,Maxime,Romain,Clément,Baptiste`,'Holland':`Daan,Bram,Sem,Jesse,Thijs,Ruben,Stijn,Joris,Lars,Niels,Wouter,Sven`,'Belgien':`Wout,Arne,Pieter,Jens,Thibault,Maarten,Seppe,Lennert,Kobe,Gilles,Jarne,Robbe`,'Schweiz':`Luca,Nico,Reto,Urs,Fabian,Dario,Silvan,Jannis,Beat,Remo,Gian,Matteo`,'Østrig':`Florian,Lukas,Stefan,Christoph,Markus,Alexander,Patrick,Matthias,Bernhard,Wolfgang,Manuel,Elias`,'Grækenland':`Giorgos,Nikos,Dimitris,Kostas,Giannis,Christos,Panagiotis,Vasilis,Stavros,Thanos,Alexis,Manolis`,'USA':`Tyler,Jake,Brandon,Austin,Hunter,Cody,Ethan,Mason,Logan,Ryan,Jordan,Chase`,'Storbritannien':`Oliver,Harry,Jack,George,Callum,Liam,Josh,Ewan,Rhys,Alfie,Connor,Owen`,'Canada':`Liam,Noah,Logan,Owen,Carter,Dylan,Mathis,Gabriel,Nolan,Tristan,Wyatt,Félix`,'Brasilien':`Gabriel,Lucas,Rafael,Matheus,Gustavo,Felipe,Thiago,Vinícius,Leonardo,Caio,Diego,Henrique`,'Argentina':`Santiago,Matías,Nicolás,Facundo,Joaquín,Agustín,Tomás,Lautaro,Ezequiel,Gonzalo,Franco,Ignacio`,'Rumænien':`Andrei,Mihai,Ionuț,Alexandru,Bogdan,Cristian,Vlad,Răzvan,Florin,Adrian,Sorin,Radu`,'Japan':`Haruto,Yuto,Sota,Ren,Takumi,Kenta,Daiki,Shota,Riku,Kaito,Hiroshi,Yuki`,'Korea':`Minjun,Seojun,Jiho,Hyun,Dohyun,Junwoo,Taeyang,Sungmin,Jaehyun,Woojin,Kyung,Hwan`};
const FN=COUNTRIES.map(([c])=>FNO[c].split(','));
/* --- lydmønstre pr. sproggruppe til opfundne ord: [forlyd, vokal, udlyd] --- */
const SYLG={
nord:['b,d,f,g,h,j,k,l,m,n,r,s,t,v,bj,fj,kr,sk,st,tr,sv,gr','a,e,i,o,u,y,æ,ø,å,ei','|,|,n,r,k,l,rn,nd,g,st,v'],
fin:['k,t,p,s,h,j,l,m,n,r,v','a,e,i,o,u,ä,ö,aa,ii,uo,ai','|,|,|,n,s,t,k,l'],
balt:['k,g,r,l,m,v,z,s,t,d,j,br,kr','a,e,i,u,ā,ē,ī,ū,ie,o','|,|,s,r,n,j,ks,ls'],
slav:['b,d,g,k,m,p,r,s,t,w,z,sz,cz,rz,kr,pr,zb','a,e,i,o,u,y,ó,ę','|,|,k,n,r,w,sz,cz,l,ł'],
germ:['b,d,f,g,h,k,l,m,n,r,s,t,w,z,sch,st,kr,br,pf','a,e,i,o,u,ei,au,ü,ö,ie','|,n,r,l,ck,rt,ng,nd,tz,ss,x'],
rom:['b,c,d,f,g,l,m,n,p,r,s,t,v,ch,br,tr,pl','a,e,i,o,u,ia,io,é','|,|,|,n,r,s,l,z,x'],
gr:['k,t,p,m,n,l,r,s,d,th,ph,kh,x,z','a,e,i,o,y,ou,ai','|,|,s,n,r,x'],
eng:['b,c,d,f,g,j,k,l,m,n,p,r,s,t,v,w,z,br,cr,dr,sh,th,tr,sl,qu','a,e,i,o,u,ay,ee,oo,y','|,|,n,r,x,ck,sh,ll,t,z'],
jp:['k,s,t,n,h,m,y,r,w,g,z,sh,ch,ts','a,i,u,e,o','|,|,|,|,n'],
kr:['g,k,d,t,b,p,s,j,ch,h,m,n,r,y','a,eo,o,u,eu,i,ae,ye,yu','|,|,n,ng,k,l,m']};
Object.keys(SYLG).forEach(k=>SYLG[k]=SYLG[k].map(s=>s.split(',').map(x=>x==='|'?'':x)));
const LGO={'Danmark':'nord','Norge':'nord','Sverige':'nord','Finland':'fin','Estland':'fin','Letland':'balt','Polen':'slav','Tyskland':'germ','Østrig':'germ','Schweiz':'germ','Holland':'germ','Belgien':'germ','Spanien':'rom','Portugal':'rom','Frankrig':'rom','Rumænien':'rom','Argentina':'rom','Brasilien':'rom','Grækenland':'gr','USA':'eng','Storbritannien':'eng','Canada':'eng','Japan':'jp','Korea':'kr'};
const LG=COUNTRIES.map(([c])=>LGO[c]);
function orgWord(li){for(let i=0;i<20;i++){const w=fold(invent(li,ri(2,3)));if(w.length>=4&&w.length<=10)return cap(w)}return cap(fold(invent(li,2)))}
function invent(li,n){const [O,V,C]=SYLG[LG[li]];let s='';for(let i=0;i<n;i++)s+=(i&&rnd()<.25?'':pk(O))+pk(V)+(i===n-1||rnd()<.3?pk(C):'');return s}
// kaldenavne-endelser: fælles + lidt lokal krydderi
const NSUF='y,i,o,z,zz,x,e,ie,s,ka,ster,boy'.split(','),NSUFL={rom:['inho','ito','o','i'],jp:['kun','chan'],slav:['ski','ek'],nord:['en','sen','ie'],eng:['y','ster','man'],germ:['i','le','er'],fin:['ppa','kka'],balt:['s'],gr:['os','is'],kr:['i']};
function fromFirst(li){let f=fold(pk(FN[li])).toLowerCase();const r=rnd(),cut=ri(3,Math.min(5,f.length));
 if(r<.3)return f.slice(0,cut)+(rnd()<.6&&NSUFL[LG[li]]?pk(NSUFL[LG[li]]):pk(NSUF));   // Kristoffer → krisz, kris_en
 if(r<.45)return f.slice(-ri(4,Math.min(6,f.length)));                                  // Kristoffer → toffer
 if(r<.55&&f.length<=6)return[...f].reverse().join('');                                 // Jonas → sanoj
 if(r<.65)return f[0]+f.slice(1).replace(/[aeiouy]/g,'');                               // Rasmus → rsms
 if(r<.75)return f.slice(0,cut).replace(/(.)$/,'$1$1');                                 // Mads → madss
 if(r<.85)return f[0]+'-'+pk(GN).toLowerCase();                                         // m-ghost
 return f}                                                                              // bare fornavnet
/* --- filtre --- */
const LM={a:'4',e:'3',i:'1',o:'0',s:'5',t:'7',g:'9',b:'8'};
function leetOne(s){const ix=[...s].map((c,i)=>LM[c.toLowerCase()]?i:-1).filter(i=>i>0);if(!ix.length)return s;const i=pk(ix);return s.slice(0,i)+LM[s[i].toLowerCase()]+s.slice(i+1)}
function leetAll(s){return[...s].map(c=>LM[c.toLowerCase()]&&rnd()<.7?LM[c.toLowerCase()]:c).join('')}
function caseStyle(s){const r=rnd();if(r<.42)return s.toLowerCase();if(r<.8)return cap(s);if(r<.86&&s.length<=6)return s.toUpperCase();if(r<.9)return s.charAt(0).toLowerCase()+s.slice(1,-1)+s.slice(-1).toUpperCase();return s}
function nickFilters(s){if(/\s/.test(s))return s;  // navne med mellemrum (håndskrevne sjove navne) beholdes som de er
 s=caseStyle(s);
 if(rnd()<.12)s=leetOne(s);else if(rnd()<.025)s=leetAll(s);
 if(rnd()<.07&&s.length>2){const i=ri(1,s.length-1);s=s.slice(0,i)+s[i]+s.slice(i)}
 if(rnd()<.06&&s.length>4)s=s.replace(/(?<=.)[aeiou](?=.)/i,'');
 if(rnd()<.06)s=s.replace(/ck$/,'kk').replace(/s$/,'z').replace(/c$/,'k');
 const r=rnd();if(r<.04)s='x'+s;else if(r<.07)s=s+'x';else if(r<.09)s='_'+s+'_';else if(r<.15)s+=pk(['93','94','97','99','00','01','02','04','07','11','13','69','77','88']);else if(r<.18)s+=ri(1,9);
 return s}
/* --- spillernavne --- */
const CULTP=`Ziggy,Maestro,Gandalf,Neo,Trinity,Morpheus,Skywalker,Kenobi,Goose,Iceman,Ripley,Sparrow,Wick,Sherlock,Aragorn,Legolas,Frodo,Katniss,Rocky,Elvis,Mozart,Beethoven,Picasso,Bowie,Marley,Hendrix,Lennon,Freddie,Prince,Zeppelin,Floyd,Nirvana,Ramones,Bjork,Vivaldi,Chopin,Hamlet,Gatsby,Aladdin,Simba,Yoda,Vader,Tarantino,Kubrick,Spielberg,Hitchcock`.split(',');
const CH=COUNTRIES.map((_,li)=>[...GEO[li],...CULTC[li].map(n=>n.split(' ')[0]).filter(w=>w.length>3)]);
const PSTY={land:20,first:22,syl:15,gn:10,cult:7,word:10,combo:6,city:3,fun:7};
const FUNP=`Noscope,Camper,Bot_Bob,Rusher,Teabag,Wallbang,Ninjadefuse,Silver4ever,Lagspike,Wifi Willy,Grandpa,Toaster,Potato,Couch,Banana,Nap,Uncle,Eco King,Ragequit,Afk Andy`.split(','),
FUNDK=`Noscope Nils,Bot_Bent,Kniven,eco_konge,Pingvin,Onkel,Bedstemor,Toastbrød,Kartoffel,Agurk,Sofa,Mormor,Bananen,Grisen,Rugbrød,Fadøl`.split(',');
function playerBase(li){switch(wpick(PSTY)){
 case 'land':return pk(CN[li]);
 case 'first':return fromFirst(li);
 case 'syl':return cap(fold(invent(li,rnd()<.6?2:1)));
 case 'gn':return pk(GN);
 case 'cult':return pk(CULTP);
 case 'word':return pk(NOUN);
 case 'combo':return pk(ADJ)+pk(NOUN);
 case 'city':return fold(pk(CH[li]));
 default:return pk(COUNTRIES[li][0]==='Danmark'&&rnd()<.7?FUNDK:FUNP)}}
function pickName(li){
 for(let t=0;t<400;t++){let n=playerBase(li);const raw=/\s/.test(n);n=nickFilters(n);
  if(t>=30&&!raw)n+=ri(2,99);
  if(n.length>PMAX||n.replace(/[^A-Za-z0-9\u00C0-\u024F]/g,'').length<3)continue;
  const k=n.toLowerCase();if(!NU.has(n)&&!NU.has(k)){NU.add(n);NU.add(k);return n}}
 return 'P'+(++PN)}
/* --- holdnavne --- */
const NT=new Set();
const TSTY={geo:20,cult:14,local:16,org:12,tag:8,domain:6,num:5,team:7,gen:8,leet:4};
function mkTag(){const A='ABCDEFGHJKLMNPRSTVXZ';const r=rnd();if(r<.2)return pk('xXkKzZ'.split(''))+ri(1,99);let s='';for(let i=ri(2,4);i--;)s+=pk(A.split(''));return s}
function teamName(li,st,peek){
 for(let t=0;t<120;t++){let n;const c=pk(GEO[li]);
  switch(st){
   case 'geo':{const r=rnd();n=r<.35?`${c} ${pk(TNOUN)}`:r<.55?`${c} ${pk(['Esports','Gaming','United','FC','Collective','Club'])}`:r<.7?`${pk(TADJ)} ${c}`:r<.85?`${c} ${pk(LW[li])}`:`${pk(['Team','Club','Real','Sporting','Dynamo'])} ${c}`;break}
   case 'cult':n=rnd()<.35?pk(CULTG):pk(CULTC[li]);break;
   case 'local':{const w=pk(LW[li]),r=rnd();n=r<.55?w:r<.75?`${w} ${pk(['Esports','Gaming','FC','Klan','Crew'])}`:r<.9?`Team ${w}`:w.toLowerCase();break}
   case 'org':{const w=orgWord(li);n=rnd()<.45?w:rnd()<.6?`${w} ${pk(['Esports','Gaming','Club','Collective','Sports'])}`:w.toLowerCase();break}
   case 'tag':{const g=mkTag(),r=rnd();n=r<.3?g:r<.7?`${g} ${pk(['Esports','Gaming','Clan'])}`:r<.85?`Team ${g}`:g.toLowerCase();break}
   case 'domain':{const w=rnd()<.5?orgWord(li):fold(pk([...TNOUN,...LW[li]])).replace(/[^A-Za-z]/g,'');n=w.toLowerCase()+'.'+pk(['gg','gg','io',TLD[li],TLD[li],'net','org']);break}
   case 'num':n=`${pk(['Sector','Unit','Squad','Division','Zone','Base','Cell','Block','District','Bunker','Area','Lab'])} ${pk(['7','9','13','21','42','51','69','88','99','404','1337',''+ri(1,99)])}`;break;
   case 'team':n=`Team ${rnd()<.5?orgWord(li):pk(TNOUN)}`;break;
   case 'leet':n=leetOne(leetOne(pk(TADJ)+pk(TNOUN)));if(rnd()<.5)n=n.toLowerCase();break;
   default:n=`${pk(TADJ)} ${pk(TNOUN)}`+(rnd()<.25?` ${pk(['Gaming','Esports'])}`:'')}
  if(n.length>TMAX)continue;
  if(peek||!NT.has(n.toLowerCase())){if(!peek)NT.add(n.toLowerCase());return n}}
 const n=`${mkTag()} ${ri(2,99)}`;if(!peek)NT.add(n);return n}
function genTeams(li){const ns=Array.from({length:16},()=>teamName(li,wpick(TSTY)));
 if(li===2)TEAMS[0].name=ns[0];
 return ns.map((n,i)=>({name:n,def:li===2&&i===0?TEAMS[0]:gen(n,li)}))}
/* eget holdnavn */
const esc=s=>s.replace(/[<>&"]/g,'');
function renameTeam(n){n=esc(n).trim().slice(0,28)||TEAMS[0].name;TEAMS[0].name=n;const t=WD.lg[WD.me.li].teams[WD.me.ti];t.name=t.sp?t.sp.name+' - '+n:n}
function showName(){show('tn');renderName()}
function renderName(){const first=WD.needName,sg=[0,1,2].map(()=>teamName(2,wpick(TSTY),true));
 $('tn').innerHTML=`<div class="hd"><b>Holdnavn</b></div><div class="tm"><h3>${first?'Navngiv dit hold':'Omdøb dit hold'}</h3><input id="tnin" maxlength="28" value="${TEAMS[0].name.replace(/"/g,'')}" style="width:100%;padding:10px;font:inherit;border:1px solid #000;border-radius:0"><div class="mu" style="margin:8px 0">Forslag (tryk for at bruge): ${sg.map(n=>`<a data-sg="${n}" style="text-decoration:underline;cursor:pointer">${n}</a>`).join(' · ')}</div><button id="tnok" style="width:100%">Bekræft</button></div>`}
$('tn').onclick=e=>{const a=e.target.closest('[data-sg]');if(a){$('tnin').value=a.dataset.sg;return}
 if(e.target.id==='tnok'){renameTeam($('tnin').value);const first=WD.needName;WD.needName=false;renderNav();saveGame();if(first&&WD.needSp)showSponsor();else if(first)showLeague();else showOverview()}};
$('ov').addEventListener('click',e=>{if(e.target.closest('[data-rn]'))showName()});
