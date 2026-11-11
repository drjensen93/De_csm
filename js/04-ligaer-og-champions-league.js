/* ===== FASE 1: 24 LIGAER OG KALENDER ===== */
const COUNTRIES=[['Tyskland','Tysk'],['Frankrig','Fransk'],['Danmark','Dansk'],['Spanien','Spansk'],['Portugal','Portugisisk'],['Polen','Polsk'],['Sverige','Svensk'],['Norge','Norsk'],['Finland','Finsk'],['Japan','Japansk'],['Storbritannien','Britisk'],['Belgien','Belgisk'],['Holland','Hollandsk'],['Østrig','Østrigsk'],['Schweiz','Schweizisk'],['Estland','Estisk'],['Argentina','Argentinsk'],['Korea','Koreansk'],['Letland','Lettisk'],['Brasilien','Brasiliansk'],['USA','Amerikansk'],['Rumænien','Rumænsk'],['Grækenland','Græsk'],['Canada','Canadisk']];
const DAYS=['Man','Tir','Ons','Tor','Fre','Lør','Søn'],NDAYS=49;
const LDAYS=[3,4];for(let w=1;w<=5;w++)for(let i=0;i<5;i++)LDAYS.push(w*7+i);for(let i=0;i<3;i++)LDAYS.push(42+i);
const dayRound=d=>LDAYS.indexOf(d)+1;
const NOTES={'1-0':'Landekoefficienter opdateres','1-1':'CL-kvalgrupper genereres','1-5':'CL-kval 1','1-6':'CL-kval 2','2-1':'CL-grupper genereres','2-5':'CL gruppekamp 1+2','2-6':'CL gruppekamp 3+4','3-5':'CL gruppekamp 5+6','3-6':'CL gruppekamp 7+8','4-5':'CL gruppekamp 9','4-6':'CL gruppekamp 10','5-0':'CL-playoff genereres','5-5':'CL 1/8-finaler','5-6':'CL 1/4-finaler','6-5':'CL 1/2-finale 1','6-6':'CL 1/2-finale 2','7-4':'CL-bronzekamp','7-5':'CL-finale','7-6':'Sæson slut'};
let WD,BUSY=false;
const gen=(name,li)=>fitWage({name,li,igl:0,lead:0,pl:[1,2,3,4,5].map(j=>{const p=[pickName(li),50,50,50,50,50,50,50,50,ri(18,32),0,li,0,0,Array.from({length:NSK},()=>ri(70,100)),j-1,j-1,rFav(),ri(0,48),j===1?1:0,-1,50,5,'',0];p[30]=50;return p}).map(p=>seedSkills(applyPers(p,'allr')))});
// startspillere: simulerer en karriere fra tryout som 13-årig til nuværende alder med optimal træning (op til limits),
// +0,5 i en tilfældig skill pr. kamp (30 pr. sæson) og aldring fra 30 år. Resultatet går 0-15 % ned (én faktor pr. spiller).
const SEED={matches:30,var:.15};
function seedSkills(p){const lim=p[14],age=p[9],w=lim.map(()=>.6+rnd()*.8),sw=w.reduce((a,b)=>a+b,0);let v=w.map((x,i)=>Math.min(lim[i],TT0[0]*x/sw));
 for(let a=13;a<age;a++){const r=rate(a),l=aging(a);
  for(let d=0;d<NDAYS;d++){let b=-1,g=0;for(let k=0;k<NSK;k++){const rm=lim[k]-v[k];if(rm>g){g=rm;b=k}}if(b>=0&&r>0)v[b]=Math.min(lim[b],v[b]+r);if(l>0){const q=ri(0,NSK-1);v[q]=Math.max(0,v[q]-l)}}
  for(let m=0;m<SEED.matches;m++){const k=ri(0,NSK-1);v[k]=Math.min(lim[k],v[k]+.5)}}
 const f=1-rnd()*SEED.var;SI.forEach((si,i)=>p[si]=Math.round(v[i]*f*10)/10);return p}
// alle hold starter med samme samlede løn: alle skills på holdet flyttes lige meget op eller ned (inden for 0 og limits),
// til lønsummen rammer START_WAGE. Afrundingsrest rettes på den bedst betalte spillers stærkeste skill.
const START_WAGE=10000;
function fitWage(d){const ps=d.pl,c=ECO.wage*VSC(),B=ps.map(p=>SI.map(i=>p[i])),tw=START_WAGE;
 const put=dl=>ps.forEach((p,j)=>SI.forEach((si,i)=>p[si]=cl(B[j][i]+dl,0,p[14][i])));
 const raw=p=>SI.reduce((a,si)=>a+skVal(p[si]),0)*c,sum=()=>ps.reduce((a,p)=>a+raw(p),0);
 let lo=-100,hi=100;for(let n=0;n<50;n++){const m=(lo+hi)/2;put(m);if(sum()<tw)lo=m;else hi=m}put(lo);
 const rw=p=>Math.max(10,Math.round(raw(p)/10)*10);let diff=tw-ps.reduce((a,p)=>a+rw(p),0);
 if(diff){const p=ps.slice().sort((a,b)=>raw(b)-raw(a))[0],dv=(rw(p)+diff-raw(p))/c;
  const ks=SI.map((si,i)=>i).filter(i=>{const nv=skVal(p[SI[i]])+dv;return nv>skVal(0)&&100+VAL.dbl*Math.log2(nv/VAL.top)<=p[14][i]});
  if(ks.length){const i=ks.sort((a,b)=>p[SI[b]]-p[SI[a]])[0];p[SI[i]]=100+VAL.dbl*Math.log2((skVal(p[SI[i]])+dv)/VAL.top)}}
 ps.forEach(p=>p[28]=null);return d}
function newLeague(){
 Object.assign(TEAMS[0],{name:'Dansk hold 1',li:2,pl:gen('',2).pl});
 WD={season:1,day:0,view:2,me:{li:2,ti:0},lg:COUNTRIES.map(([c,a],li)=>({c,fix:fixtures(16),res:[],teams:genTeams(li)}))};
 WD.hist=[];WD.rank=[...Array(24).keys()];WD.winner=null;WD.prev=WD.lg.map(()=>shuffle([...Array(16).keys()]));onEnter(0);sponsorSetup();dayStart();WD.needName=true;showName()}
function tbl(g){const S=g.teams.map((t,i)=>({i,p:0,w:0,d:0,l:0,rf:0,ra:0,pts:0,h:0}));
 g.res.forEach(r=>{const x=S[r.h],y=S[r.a];x.p++;y.p++;x.rf+=r.hs;x.ra+=r.as;y.rf+=r.as;y.ra+=r.hs;if(r.hs>r.as){x.w++;y.l++;x.pts+=2}else if(r.hs<r.as){y.w++;x.l++;y.pts+=2}else{x.d++;y.d++;x.pts++;y.pts++}});
 const by=S.slice().sort((a,b)=>b.pts-a.pts),out=[];
 for(let i=0;i<by.length;){let j=i;while(j<by.length&&by[j].pts===by[i].pts)j++;const gr=by.slice(i,j),ids=gr.map(x=>x.i);
  if(gr.length>1)g.res.forEach(r=>{if(ids.includes(r.h)&&ids.includes(r.a)){const pt=r.hs>r.as?[2,0]:r.hs<r.as?[0,2]:[1,1];S[r.h].h+=pt[0];S[r.a].h+=pt[1]}});
  gr.sort((a,b)=>b.h-a.h||(b.rf-b.ra)-(a.rf-a.ra)||b.rf-a.rf);out.push(...gr);i=j}
 return out}


$('lg').onchange=e=>{if(e.target.id==='csel'){WD.view=+e.target.value;renderLeague()}};





/* ===== FASE 2: KOEFFICIENTER, PLADSER, KVALIFIKATION ===== */
const WT=[1,.8,.75,.5,.25];
const isMe=k=>k.li===WD.me.li&&k.ti===WD.me.ti,kdef=k=>WD.lg[k.li].teams[k.ti].def,knm=k=>WD.lg[k.li].teams[k.ti].name,winK=m=>m.res[0]>m.res[1]?m.a:m.b;
// CL-pladser pr. land efter koefficientplacering k (0 = nr. 1): d = direkte, q = kvalifikation. I alt 27 direkte (+ vinderens) og 48 kval-pladser (12 grupper à 4)
function placesOf(k){return{d:k<7?2:k<20?1:0,q:k<3?3:k<7?2:k<12?3:k<15?2:k<20?1:k<21?2:1}}
function computeRank(){
 const H=WD.hist,cv=COUNTRIES.map((_,li)=>WT.reduce((s,w,i)=>s+(H.length>i?w*H[H.length-1-i][li]:0),0)),old=WD.rank.slice();
 WD.coefv=cv;WD.rank=old.slice().sort((a,b)=>cv[b]-cv[a]||old.indexOf(a)-old.indexOf(b))}
// dit hold starter aldrig i CL: i sæson 1 springes det over ved både direkte pladser og kvalifikation
const noCL=k=>WD.season===1&&isMe(k);
function allocate(){
 const dir=[],qual=[],has=(arr,k)=>arr.some(x=>x.li===k.li&&x.ti===k.ti);
 WD.rank.forEach((li,k)=>WD.prev[li].filter(ti=>!noCL({li,ti})).slice(0,placesOf(k).d).forEach(ti=>dir.push({li,ti})));
 const w=WD.winner;let over=!w;if(w){if(has(dir,w))over=true;else dir.push(w)}
 if(over){const li=WD.rank[20],ti=WD.prev[li].find(t=>!has(dir,{li,ti:t})&&!noCL({li,ti:t}));dir.push({li,ti})}
 WD.rank.forEach((li,k)=>{let n=placesOf(k).q;for(const ti of WD.prev[li]){if(n<=0)break;const key={li,ti};if(has(dir,key)||has(qual,key)||noCL(key))continue;qual.push(key);n--}});
 WD.dir=dir;WD.qual=qual}
function drawQual(){const q=shuffle(WD.qual);WD.qg=Array.from({length:12},(_,i)=>{const t=q.slice(i*4,i*4+4);return{t,sf:[{a:t[0],b:t[1],res:null},{a:t[2],b:t[3],res:null}],fin:null,win:null}})}






function nextDay(simMine){
 if(BUSY||WD.needSp||WD.needName)return;const r=dayRound(WD.day),cl=clList(WD.day);if(!r&&!cl.length)return endDay();
 BUSY=true;renderNav();simDay(r,cl,()=>{BUSY=false;playMine(r,!simMine)})}


$('cl').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;WD.cltab=b.dataset.c;renderCL()};
function showCL(){show('cl');renderCL()}

/* ===== FASE 3: GRUPPESPIL OG SLUTSPIL ===== */
const GDAYS={12:[0,1],13:[2,3],19:[4,5],20:[6,7],26:[8],27:[9]},PDAYS={33:0,34:1,40:2,41:3,46:5,47:4};
function clList(d){
 if(d===5&&WD.qg)return WD.qg.flatMap(g=>g.sf.map(m=>({m})));
 if(d===6&&WD.qg)return WD.qg.map(g=>({m:g.fin}));
 if(GDAYS[d]&&WD.cg)return WD.cg.flatMap(g=>GDAYS[d].flatMap(r=>g.rounds[r].map(m=>({m}))));
 if(d in PDAYS&&WD.po&&WD.po[PDAYS[d]])return WD.po[PDAYS[d]].map(m=>({m}));
 return[]}
function myCL(){for(const x of clList(WD.day))if(x.m.res===null&&(isMe(x.m.a)||isMe(x.m.b)))return x;return null}

function after(r){if(!r&&myCL()){renderNav();if(VIEW==='lg')renderLeague();if(VIEW==='cl')renderCL()}else endDay()}
function drawGroups(){const q=shuffle(WD.clTeams);
 WD.cg=Array.from({length:8},(_,i)=>{const t=q.slice(i*5,i*5+5);
  return{t,rnd:t.map(()=>rnd()),rounds:fixtures(6).map(r=>r.filter(([a,b])=>a<5&&b<5).map(([a,b])=>({a:t[a],b:t[b],ai:a,bi:b,res:null,nd:false,st:'Gruppespil'})))}})}
function gtab(g){
 const S=g.t.map((k,i)=>({i,k,p:0,w:0,d:0,l:0,rf:0,ra:0,pts:0,h:0,r:g.rnd[i],rd:0})),all=g.rounds.flat();
 all.forEach(m=>{if(!m.res)return;const x=S[m.ai],y=S[m.bi],[a,b]=m.res;x.p++;y.p++;x.rf+=a;x.ra+=b;y.rf+=b;y.ra+=a;if(a>b){x.w++;y.l++;x.pts+=2}else if(a<b){y.w++;x.l++;y.pts+=2}else{x.d++;y.d++;x.pts++;y.pts++}});
 S.forEach(s=>s.rd=s.rf-s.ra);
 const by=S.slice().sort((a,b)=>b.pts-a.pts),out=[];
 for(let i=0;i<by.length;){let j=i;while(j<by.length&&by[j].pts===by[i].pts)j++;const gr=by.slice(i,j),ids=gr.map(x=>x.i);
  if(gr.length>1)all.forEach(m=>{if(m.res&&ids.includes(m.ai)&&ids.includes(m.bi)){const[a,b]=m.res;S[m.ai].h+=a>b?2:a===b?1:0;S[m.bi].h+=b>a?2:a===b?1:0}});
  gr.sort((a,b)=>b.h-a.h||b.rd-a.rd||WD.coefv[b.k.li]-WD.coefv[a.k.li]||b.r-a.r);out.push(...gr);i=j}
 return out}
function drawPlayoff(){
 const T=WD.cg.flatMap(g=>gtab(g).slice(0,2));
 T.sort((a,b)=>b.pts-a.pts||b.rd-a.rd||WD.coefv[b.k.li]-WD.coefv[a.k.li]||b.r-a.r);
 WD.seeds=T.map(x=>x.k);
 WD.po=[[[0,15],[7,8],[3,12],[4,11],[1,14],[6,9],[2,13],[5,10]].map(([i,j])=>({a:WD.seeds[i],b:WD.seeds[j],res:null,nd:true,st:'1/8-finale'}))]}
const mkM=(a,b,st)=>({a,b,res:null,nd:true,st});
function onEnter(d){
 if(d===0){computeRank();allocate();WD.qg=WD.cg=WD.po=WD.seeds=null}
 else if(d===1)drawQual();
 else if(d===6)WD.qg.forEach(g=>g.fin={a:winK(g.sf[0]),b:winK(g.sf[1]),res:null});
 else if(d===7){WD.qg.forEach(g=>g.win=winK(g.fin));WD.clTeams=[...WD.dir,...WD.qg.map(g=>g.win)]}
 else if(d===8)drawGroups();
 else if(d===28)drawPlayoff();
 else if(d===34){const p=WD.po[0];WD.po[1]=[0,2,4,6].map(i=>mkM(winK(p[i]),winK(p[i+1]),'Kvartfinale'))}
 else if(d===40){const q=WD.po[1];WD.po[2]=[mkM(winK(q[0]),winK(q[1]),'Semifinale 1')];WD.po[3]=[mkM(winK(q[2]),winK(q[3]),'Semifinale 2')]}
 else if(d===46){const los=m=>winK(m)===m.a?m.b:m.a;WD.po[5]=[mkM(los(WD.po[2][0]),los(WD.po[3][0]),'Bronzekamp')]}
 else if(d===47)WD.po[4]=[mkM(winK(WD.po[2][0]),winK(WD.po[3][0]),'Finale')]}
function seasonCoef(){const c=COUNTRIES.map(()=>0);
 WD.cg.forEach(g=>g.rounds.flat().forEach(m=>{if(!m.res)return;const[x,y]=m.res;if(x>y)c[m.a.li]+=.5;else if(x<y)c[m.b.li]+=.5;else{c[m.a.li]+=.25;c[m.b.li]+=.25}}));
 WD.seeds.forEach(k=>c[k.li]+=2);
 WD.po.slice(0,5).flat().forEach(m=>{if(!m||!m.res)return;const w=winK(m),l=w===m.a?m.b:m.a;c[w.li]+=1;c[l.li]+=.5});
 return c}
