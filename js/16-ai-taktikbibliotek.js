/* ===== FASE 51: AI-TAKTIKBIBLIOTEKER OG EN META, DER UDVIKLER SIG ===== */
// Hvert AI-hold har pr. map et bibliotek på 8 taktikker pr. side (starter med 8 tilfældige standardtaktikker) og én kandidat pr. side,
// som afprøves i rigtige kampe (5. plads i kampens udvalg). Efter TXC.evalN runder med kandidaten sammenlignes den med biblioteket:
// er den bedre, erstatter den den dårligste (eller tilføjes, hvis der er plads), ellers droppes den. Så laves en ny kandidat:
// mutation af en god taktik, en helt ny fra byggeklodser, et modsvar mod det, holdet har tabt mest til, eller en kopi fra et hold, man har mødt.
// Antal kandidater, holdet overvejer, og hvor præcist det dømmer, afhænger af holdets taktiske evne (tcq).
// Viden er pr. liga (WD.tk): resultater for taktik mod taktik i ligaens kampe (CL-kampe tæller i begge holds ligaer).
// Egne taktikker gemmes i WD.tx og ryddes op ved sæsonskiftet, når intet hold bruger dem længere.
const TXC={own:.04,lib:8,sel:6,ex:1,exKO:.4,evalN:30,pMut:.4,pNew:.25,pCounter:.15,decay:.5,kMax:900,kMin:1.5,stdW:30};
let TXON=true;
const txStdL=(map,sd)=>{const m=MAPS[map];return(m&&m.tn?m.tn:TN)[sd]};// mappets standardtaktikker (uafhængigt af Taktik-fanens visning)
const txR=()=>rnd(),txPick=a=>a[Math.floor(txR()*a.length)],txG=()=>{let s=0;for(let i=0;i<6;i++)s+=txR();return(s-3)/1.4};
const txLast=w=>w[w.length-1][0];
// ---------- map-hjælpere ----------
const TXM={};
function txMap(map){if(TXM[map])return TXM[map];const m=MAPS[map],Z=Object.keys(m.zn),NB={};Z.forEach(z=>NB[z]=[]);m.edges.forEach(([a,b])=>{NB[a].push(b);NB[b].push(a)});
 const SITES=Object.keys(m.rsite).filter(z=>m.rsite[z]===z);
 const std={};for(const sd of ['T','CT']){std[sd]={};txStdL(map,sd).forEach((n,i)=>{const defs=((m.tac[n])||(sd==='T'?TT:CC)[n])();
  const r=defs.map(w=>w.map(([z,at])=>[z[0]==='='?z.slice(1):(m.alias[sd][z]||z),at||0]));let st=TSITE[n];if(sd==='T'&&!st)st=SITES.includes(txLast(r[1]))?txLast(r[1]):SITES[0];
  std[sd][n]={i,r,st,sy:STYLE[n],sk:TSTACK.has(n),ch:CHASE[n],cp:CHASE_PRE[n],fb:n==='Spredt info'}})}
 return TXM[map]={m,Z,NB,SITES,MIDZ:Z.filter(z=>!SITES.includes(z)&&z!=='TS'&&z!=='CT'&&!m.rsite[z]),std}}
// ---------- register ----------
// ruter gemmes kompakt som tekst: 'LA,A@110;MID,A@112;…' (zone[@tidspunkt], roller adskilt af ;)
const txEnc=r=>r.map(w=>w.map(([z,at])=>at?z+'@'+at:z).join(',')).join(';'),txDec=s=>typeof s!=='string'?s:s.split(';').map(w=>w.split(',').map(x=>{const[z,a]=x.split('@');return[z,+a||0]}));
const TXRC=new Map(),txR_=id=>{let r=TXRC.get(id);if(!r){r=txDec(WD.tx[id].r);TXRC.set(id,r)}return r};
const TXFB=new Set();
function txReg(id){const t=WD.tx[id];if(!t||!MAPS[t.m])return;const m=MAPS[t.m];
 m.tac[id]=()=>txR_(id).map(w=>w.map(([z,at])=>at?['='+z,at]:['='+z]));STYLE[id]=t.sy||'M';if(t.s==='T')TSITE[id]=t.st;if(t.sk)TSTACK.add(id);
 if(t.ch){CHASE[id]=t.ch;if(t.cp)CHASE_PRE[id]=t.cp}if(t.fb)TXFB.add(id)}
function txRegAll(){if(!WD)return;WD.tx=WD.tx||{};WD.tk=WD.tk||{};WD.txn=WD.txn||0;for(const id in WD.tx)txReg(id)}
const txInfo=(map,sd,n)=>{const S=txMap(map).std[sd][n];if(S)return S;const t=WD.tx&&WD.tx[n];return t?{r:txR_(n),st:t.st,sy:t.sy,sk:t.sk,ch:t.ch,cp:t.cp,fb:t.fb,p:t.p}:null};
// Spredt info-tilbagefald for egne taktikker med fb
{const _trX=tickRound;tickRound=function(){_trX();if(!M||!R||R.over||R.siFbX)return;const tm=teamOf('CT');if(!tm||!TXFB.has(tm.tac))return;
 const ct=M.players.filter(p=>p.alive&&p.side==='CT');
 if(R.tick<SIF.t*TPS&&!ct.some(p=>p.zone&&M.players.some(q=>q.alive&&q.side==='T'&&q.zone===p.zone)))return;
 R.siFbX=true;const S=txMap(CUR).SITES;ct.forEach(p=>{if(p.rc<2||p.act)return;const here=p.zone||p.next;if(!here)return;p.ov=S.slice().sort((a,b)=>dist(here,a)-dist(here,b))[0]})}}
// ---------- hvem er hvem ----------
let TXLI=null,TXLW=null;
function txLiOf(d){if(TXLW!==WD||!TXLI){TXLI=new Map();TXLW=WD;WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>TXLI.set(t.def,[li,ti])))}return TXLI.get(d)}
const txOk=d=>TXON&&WD&&d&&d!==TEAMS[0]&&!!txLiOf(d)&&!(WD.me&&WD.lg[WD.me.li]&&WD.lg[WD.me.li].teams[WD.me.ti]&&WD.lg[WD.me.li].teams[WD.me.ti].def===d);
// ---------- viden ----------
const TXP={};
function txPrior(map,t,c,dep,li){const k=map+'|'+t+'|'+c;if(TXP[k])return TXP[k];let inh=false;const S=txMap(map).std,a=S.T[t],b=S.CT[c];let r;
 if(a&&b)r=[.5,4];// ingen matrix: holdene lærer kun af deres egne erfaringer
 else if((dep||0)>12)r=[.5,4];
 else{const ta=a?null:WD.tx[t],tb=b?null:WD.tx[c];
  if(ta&&ta.p){const q=txEst(li,map,ta.p,c,(dep||0)+1);r=[q[0],Math.min(15,q[1]/2)];inh=true}
  else if(tb&&tb.p){const q=txEst(li,map,t,tb.p,(dep||0)+1);r=[q[0],Math.min(15,q[1]/2)];inh=true}
  else r=[.5,4]}
 if(inh)return r;return TXP[k]=r}
function txEst(li,map,t,c,dep){const p=txPrior(map,t,c,dep,li);const K=li!=null&&WD.tk[li]&&WD.tk[li][map];const e=K?K[t+'|'+c]:null;const w=e?e[1]:0,s=e?e[0]:0;return[(s+p[0]*p[1])/(w+p[1]),w+p[1]]}
const txVal=(li,map,sd,n,opp)=>opp.reduce((s,o)=>s+(sd==='T'?1-txEst(li,map,n,o)[0]:txEst(li,map,o,n)[0]),0)/Math.max(1,opp.length);
function txMeta(li,map,sd){const U=WD.tu&&WD.tu[li]&&WD.tu[li][map]&&WD.tu[li][map][sd];const L=U?Object.entries(U).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]):[];return L.length?L:txStdL(map,sd)}
// ---------- holdets bibliotek ----------
/* AI-hold: standardtaktikkerne tæller ikke med i biblioteket (6. nov.) – de er der altid, og TXC.lib gælder kun holdets egne */
const txIsStd=(map,sd,n)=>txStdL(map,sd).includes(n),txOwnN=(map,sd,L)=>L.filter(n=>!txIsStd(map,sd,n)).length;
function txEnsure(d,map){d.tl=d.tl||{};if(d.tl[map]){if(['T','CT'].some(sd=>txStdL(map,sd).some(n=>!d.tl[map][sd].includes(n))))txFill(d,map);return}const li=txLiOf(d)[0],q=tcq(d);d.tl[map]={};d.tc=d.tc||{};d.tc[map]={};d.tch=d.tch||{};d.tch[map]={};
 for(const sd of ['T','CT'])d.tl[map][sd]=[];txFill(d,map);
 for(const sd of ['T','CT'])txNewCand(d,map,sd)}
// fyld biblioteket op til TXC.lib med de bedste standardtaktikker, holdet ikke allerede har
function txFill(d,map){const li=txLiOf(d)[0],q=tcq(d);for(const sd of ['T','CT']){const os=sd==='T'?'CT':'T',L=d.tl[map][sd];
  txStdL(map,sd).filter(n=>!L.includes(n)).forEach(n=>L.push(n))}}// alle standardtaktikker (tæller ikke med)
/* (11. nov.) modsvar bedømmes også mod metaen; adgang kræver at slå standardernes median med margin; egen-bonus kun for beviste taktikker */
const TXQ={wTg:.4,wMeta:.6,margK:.5,ownN:30};
const txBl=(li,map,sd,n,tg)=>{const O=txMeta(li,map,sd==='T'?'CT':'T');return TXQ.wTg*txVal(li,map,sd,n,[tg])+TXQ.wMeta*txVal(li,map,sd,n,O)};
function txStdMed(d,map,sd,O){const v=txStdL(map,sd).filter(n=>txInfo(map,sd,n)).map(n=>txScore(d,map,sd,n,O)).sort((a,b)=>a-b);return v.length?v[Math.floor((v.length-1)/2)]:0}
const txMarg=(d,map,c)=>{const s=(d.tst&&d.tst[map]&&d.tst[map][c])||[0,0];return TXQ.margK/Math.sqrt(s[1]+20)};
function txProven(d,map,sd,n){const S=d.tst&&d.tst[map]||{},s=S[n];if(!s||s[1]<TXQ.ownN)return false;let w=0,k=0;txStdL(map,sd).forEach(x=>{const t=S[x];if(t){w+=t[0];k+=t[1]}});const base=k>=20?w/k:.5;return s[0]/s[1]>=base}
function txChoose(d,map,sd,opp){const li=txLiOf(d)[0],q=tcq(d),os=sd==='T'?'CT':'T',O=opp&&opp.length?opp:txMeta(li,map,os);let L=d.tl[map][sd].filter(n=>txInfo(map,sd,n));
 if(!L.length)L=txStdL(map,sd).slice(0,TXC.sel);
 /* egne taktikker foretrækkes (7. nov.): +TXC.own i vurderingen; svage hold trækker egne først. Standarderne er reserve. */
 const own=n=>!txIsStd(map,sd,n);
 L=q<QG.mid?L.map(n=>[n,txR()+(own(n)?.6:0)]).sort((a,b)=>b[1]-a[1]).slice(0,TXC.sel).map(x=>x[0]):L.map(n=>[n,txVal(li,map,sd,n,O)+(own(n)&&txProven(d,map,sd,n)?TXC.own:0)+txFit(d,map,sd,n)+txG()*.04*(1.5-q)]).sort((a,b)=>b[1]-a[1]).slice(0,TXC.sel).map(x=>x[0]);
 const c=d.tc&&d.tc[map]&&d.tc[map][sd];if(c&&txInfo(map,sd,c)&&txR()<(M&&M.noDraw?TXC.exKO:TXC.ex)){if(L.length>=TXC.sel)L[L.length-1]=c;else L.push(c)}
 return L}
{const _aiO=aiOrder;aiOrder=function(d,map,opp){try{if(txOk(d)&&MAPS[map]&&MAPS[map].zn){txEnsure(d,map);const o={};
  for(const sd of ['T','CT']){const os=sd==='T'?'CT':'T',L=txChoose(d,map,sd,opp&&opp[os]?opp[os].standard:null);o[sd]={pistol:L,standard:L,eco:L}}return o}}catch(e){console.error(e)}
 return _aiO(d,map,opp)}}
// ---------- byggeklodser og mutationer ----------
function txBuildT(X){const site=txPick(X.SITES),o=X.SITES.find(s=>s!==site),ent=X.NB[site].filter(z=>z!=='TS'),n=txPick([3,4,5]),tempo=txPick(['rush','standard','sen']);
 const at=tempo==='rush'?0:tempo==='standard'?50+Math.floor(txR()*25):110+Math.floor(txR()*40);const r=[],ch=[];let pe=txPick(ent);
 [1,0,2,3,4].forEach((ri,k)=>{if(k<n){const e=txR()<.6?pe:txPick(ent);pe=e;r[ri]=[[e,0],[site,at]]}
  else{const kind=txPick(['lurk','fake','mid']);
   if(kind==='lurk'){const Xz=txPick(X.Z.filter(z=>!X.SITES.includes(z)&&z!=='TS'&&z!=='CT'));r[ri]=[[Xz,0],[site,Math.min(170,at+30+Math.floor(txR()*40))]];if(txR()<.5)ch.push(ri)}
   else if(kind==='fake'){const fe=txPick(X.NB[o].filter(z=>z!=='TS'));r[ri]=[[fe,0],[site,Math.max(at,30)]]}
   else r[ri]=[[txPick(X.MIDZ.length?X.MIDZ:[ent[0]]),0],[site,Math.max(at,20)]]}});
 return{r,st:site,sk:n===5,ch:ch.length?ch:null,sy:tempo==='rush'?'A':tempo==='standard'?'M':'P'}}
function txBuildC(X){const m=X.m,fA=X.Z.filter(z=>m.rsite[z]==='A'&&z!=='A'),fB=X.Z.filter(z=>m.rsite[z]===X.SITES[1]&&z!==X.SITES[1]),mids=X.Z.filter(z=>!m.rsite[z]&&z!=='TS');
 const A=X.SITES[0],B=X.SITES[1];let nA=Math.floor(txR()*4),nB=Math.min(Math.floor(txR()*4),5-nA);const nM=5-nA-nB,pos=[];
 for(let i=0;i<nA;i++)pos.push(txR()<.3&&fA.length?txPick(fA):A);for(let i=0;i<nB;i++)pos.push(txR()<.3&&fB.length?txPick(fB):B);for(let i=0;i<nM;i++)pos.push(txPick(mids));
 const r=pos.map(z=>[[z,0]]),fwd=pos.some(z=>!X.SITES.includes(z)&&z!=='CT');
 if(txR()<.3){const g=[0,1,2,3,4].sort(()=>txR()-.5).slice(0,2+Math.floor(txR()*4)),t=20+Math.floor(txR()*80);let z=txPick(g.map(i=>pos[i]));const path=[];
  for(let s=0;s<1+Math.floor(txR()*3);s++){z=txPick(X.NB[z]);path.push(z)}g.forEach(i=>{r[i]=[[pos[i],0]].concat(path.map((p,k)=>[p,k===0?t:0]))})}
 const ends=r.map(txLast);return{r,sk:ends.every(z=>z===ends[0]),fb:fwd&&txR()<.5,sy:'M'}}
function txMutT(X,p){const r=JSON.parse(JSON.stringify(p.r));let site=p.st||X.SITES[0],ch=p.ch?p.ch.slice():null;const op=txPick(['rute','rute','timing','timing','lurk','site','rolle']),nonC=[0,2,3,4];
 if(op==='rute'){const i=txPick([0,1,2,3,4]),w=r[i],j=Math.floor(txR()*w.length),nz=txPick(X.NB[w[j][0]]);if(i===1&&j===w.length-1)w.splice(j,0,[nz,0]);else w[j][0]=nz}
 else if(op==='timing'){const all=txR()<.5,dl=txPick([-25,-12,12,25]);(all?[0,1,2,3,4]:[txPick([0,1,2,3,4])]).forEach(i=>{const w=r[i];let any=false;w.forEach(x=>{if(x[1]){x[1]=Math.max(0,Math.min(170,x[1]+dl));any=true}});
   if(!any&&dl>0){if(w.length>1)w[w.length-1][1]=40+dl*2;else{const pre=X.NB[w[0][0]].filter(z=>!X.SITES.includes(z));w.unshift([pre.length?txPick(pre):w[0][0],0]);w[1][1]=40+dl*2}}})}
 else if(op==='lurk'){const i=txPick(nonC),Xz=txPick(X.Z.filter(z=>!X.SITES.includes(z)&&z!=='TS'&&z!=='CT'));r[i]=[[Xz,0],[site,60+Math.floor(txR()*60)]];if(ch)ch=ch.filter(x=>x!==i)}
 else if(op==='site'){const o=X.SITES.find(s=>s!==site);r.forEach(w=>{if(txLast(w)===site)w[w.length-1][0]=o});site=o}
 else{const i=txPick(nonC);if(txR()<.5)r[i]=JSON.parse(JSON.stringify(r[1]));else{const j=txPick(nonC.filter(x=>x!==i));r[i]=JSON.parse(JSON.stringify(r[j]))}}
 if(txLast(r[1])!==site)r[1].push([site,0]);
 return{r,st:site,ch:ch&&ch.length?ch:null,cp:ch&&ch.length?p.cp:null,sk:r.every(w=>txLast(w)===site),sy:p.sy||'M'}}
function txMutC(X,p){const r=JSON.parse(JSON.stringify(p.r));const op=txPick(['pos','pos','push','timing','rolle']);
 if(op==='pos'){const w=txPick(r);w[w.length-1][0]=txPick(X.NB[txLast(w)])}
 else if(op==='push'){const w=txPick(r);w.push([txPick(X.NB[txLast(w)]),0]);w[w.length-2][1]=w[w.length-2][1]||(20+Math.floor(txR()*80))}
 else if(op==='timing'){const dl=txPick([-25,-12,12,25]);let any=false;r.forEach(w=>w.forEach(x=>{if(x[1]){x[1]=Math.max(0,Math.min(170,x[1]+dl));any=true}}));if(!any){const w=txPick(r);if(w.length>1)w[w.length-1][1]=40}}
 else{const i=txPick([0,1,2,3,4]),j=txPick([0,1,2,3,4].filter(x=>x!==i));r[i]=JSON.parse(JSON.stringify(r[j]))}
 const ends=r.map(txLast);return{r,sk:ends.every(z=>z===ends[0]),fb:!!p.fb,sy:p.sy||'M'}}
function txMk(map,sd,b,org,parent,d){WD.tx=WD.tx||{};WD.txn=WD.txn||0;const id='x'+(++WD.txn),w=txLiOf(d);
 WD.tx[id]={m:map,s:sd,r:txEnc(b.r),st:sd==='T'?b.st:undefined,ch:b.ch||undefined,cp:b.cp||undefined,fb:b.fb||undefined,sk:b.sk||undefined,sy:b.sy,p:parent||undefined,o:org,b:WD.season,by:w?w.join('-'):undefined};
 txReg(id);return id}
// ---------- kandidater ----------
function txPool(d,map,sd){const s=new Set(txStdL(map,sd));(d.tmt||[]).forEach(k=>{const[li,ti]=k.split('-').map(Number),t=WD.lg[li]&&WD.lg[li].teams[ti];const L=t&&t.def.tl&&t.def.tl[map]&&t.def.tl[map][sd];if(L)L.forEach(n=>s.add(n))});
 d.tl[map][sd].forEach(n=>s.delete(n));const c=d.tc[map][sd];if(c)s.delete(c);return[...s].filter(n=>txInfo(map,sd,n))}
function txScore(d,map,sd,n,O){const li=txLiOf(d)[0],s=(d.tst&&d.tst[map]&&d.tst[map][n])||[0,0],e=txVal(li,map,sd,n,O),k=20;return(s[0]+e*k)/(s[1]+k)}

function txEval(d,map,sd){const c=d.tc&&d.tc[map]&&d.tc[map][sd];if(!c)return txNewCand(d,map,sd);const s=(d.tst[map]||{})[c]||[0,0];if(s[1]<TXC.evalN)return;
 const li=txLiOf(d)[0],q=tcq(d),os=sd==='T'?'CT':'T',O=txMeta(li,map,os),L=d.tl[map][sd];
 const cs=txScore(d,map,sd,c,O)+txG()*.04*(1.2-q),ls=L.map(n=>[n,txScore(d,map,sd,n,O)]).sort((a,b)=>a[1]-b[1]);
 if(!L.includes(c)&&cs>Math.max(ls.length?ls[0][1]:0,txStdMed(d,map,sd,O))+txMarg(d,map,c)){const own=ls.filter(x=>!txIsStd(map,sd,x[0]));if(own.length<TXC.lib)L.push(c);else if(cs>own[0][1]+.01)L[L.indexOf(own[0][0])]=c}
 txNewCand(d,map,sd)}
// ---------- registrering af runder og kampe ----------
{const _frX=finishRound;finishRound=function(side,why){try{if(TXON&&WD&&M&&!M.done&&R&&!R.over&&M.defs){const map=M.map||CUR,tT=teamOf('T'),tC=teamOf('CT');
  if(tT&&tC&&tT.tac&&tC.tac){const ct=side==='CT'?1:0,dT=M.defs[tT.i],dC=M.defs[tC.i],a=txLiOf(dT),b=txLiOf(dC),key=tT.tac+'|'+tC.tac;
   WD.tk=WD.tk||{};WD.tu=WD.tu||{};
   for(const li of new Set([a&&a[0],b&&b[0]].filter(x=>x!=null))){const K=(WD.tk[li]=WD.tk[li]||{})[map]=WD.tk[li][map]||{},e=K[key]=K[key]||[0,0];e[0]+=ct;e[1]++;
    const U=(WD.tu[li]=WD.tu[li]||{})[map]=WD.tu[li][map]||{T:{},CT:{}};U.T[tT.tac]=(U.T[tT.tac]||0)+1;U.CT[tC.tac]=(U.CT[tC.tac]||0)+1}
   for(const [d,sd,tac,won,opp] of [[dT,'T',tT.tac,1-ct,tC.tac],[dC,'CT',tC.tac,ct,tT.tac]]){if(!txOk(d)||!d.tl||!d.tl[map])continue;
    const S=(d.tst=d.tst||{})[map]=d.tst[map]||{},e=S[tac]=S[tac]||[0,0];e[0]+=won;e[1]++;
    if(!won){const Lo=((d.tls=d.tls||{})[map]=d.tls[map]||{T:{},CT:{}})[sd];Lo[opp]=(Lo[opp]||0)+1}}}}}catch(e){console.error(e)}
 return _frX(side,why)}}
{const _gX=gain;gain=function(defs){const r=_gX(defs);try{if(TXON&&WD&&M&&defs&&defs.length===2){const map=M.map||CUR;
  defs.forEach((d,i)=>{if(!txOk(d)||!d.tl||!d.tl[map])return;const o=txLiOf(defs[1-i]);if(o){const k=o.join('-');d.tmt=d.tmt||[];if(!d.tmt.includes(k)){d.tmt.push(k);if(d.tmt.length>60)d.tmt.shift()}}
   for(const sd of ['T','CT'])txEval(d,map,sd)})}}catch(e){console.error(e)}return r}}
// ---------- sæsonskifte: udtynd viden, ryd op ----------
function txSeason(){if(!WD||!WD.tk)return;
 for(const li in WD.tk)for(const map in WD.tk[li]){const K=WD.tk[li][map];let ent=Object.entries(K).map(([k,v])=>[k,[Math.round(v[0]*TXC.decay*10)/10,Math.round(v[1]*TXC.decay*10)/10]]).filter(x=>x[1][1]>=TXC.kMin);
  ent.sort((a,b)=>b[1][1]-a[1][1]);WD.tk[li][map]=Object.fromEntries(ent.slice(0,TXC.kMax))}
 WD.tu={};
 const live=new Set();
 WD.lg.forEach(g=>g.teams.forEach(t=>{const d=t.def;
  if(d.tst)for(const map in d.tst){const S=d.tst[map];for(const n in S){S[n]=[Math.round(S[n][0]*.5*10)/10,Math.round(S[n][1]*.5*10)/10];if(S[n][1]<1&&!(d.tc&&d.tc[map]&&Object.values(d.tc[map]).includes(n)))delete S[n]}}
  d.tls={};if(d.tmt)d.tmt=d.tmt.slice(-20);
  if(d.tl)for(const map in d.tl)for(const sd in d.tl[map])d.tl[map][sd].forEach(n=>{if(WD.tx[n])live.add(n)});
  if(d.tc)for(const map in d.tc)for(const sd in d.tc[map]){const n=d.tc[map][sd];if(n&&WD.tx[n])live.add(n)}}));
 if(WD.txKeep)WD.txKeep.forEach(n=>{if(WD.tx[n])live.add(n)});
 for(const id of live){let p=WD.tx[id].p;while(p&&WD.tx[p]&&!live.has(p))p=WD.tx[p].p;WD.tx[id].p=p&&(WD.tx[p]||txMap(WD.tx[id].m).std[WD.tx[id].s][p])?p:undefined}
 for(const id in WD.tx)if(!live.has(id)){const t=WD.tx[id],m=MAPS[t.m];if(m)delete m.tac[id];delete WD.tx[id];TXFB.delete(id);TXRC.delete(id)}
 for(const k in TXP)delete TXP[k]}
{const _seX=seasonEnd;seasonEnd=function(){const r=_seX.apply(this,arguments);try{txSeason()}catch(e){console.error(e)}return r}}
// ---------- gem/indlæs ----------
{const _lgX=loadGame;loadGame=function(){const ok=_lgX();if(ok)try{TXLI=null;TXRC.clear();for(const k in TXP)delete TXP[k];txRegAll()}catch(e){console.error(e)}return ok}}
try{txRegAll()}catch(e){console.error(e)}
// FAQ
{const _rfX=renderFaq;renderFaq=function(){_rfX();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 f.insertAdjacentHTML('beforeend',`<div class="tm"><h3>En meta, der udvikler sig</h3>${li([
  'Hvert AI-hold har sit eget taktikbibliotek pr. map: alle standardtaktikker plus højst '+TXC.lib+' egne taktikker pr. side (standardtaktikkerne tæller ikke med for AI-hold – for dig gør de). Til en kamp vælger holdet '+TXC.sel+' af dem.',
  'Holdene afprøver hele tiden én ny taktik pr. side i deres kampe: en variant af en af deres gode taktikker, en helt ny, et modsvar mod det, de oftest taber til, eller en kopi af en taktik fra et hold, de har mødt. Når den har været brugt i ca. '+TXC.evalN+' runder, sammenlignes den med biblioteket. Er den bedre end den svageste, kommer den ind – ellers droppes den. I vigtige knockoutkampe eksperimenterer holdene mindre.',
  'Holdets taktiske evne afgør, hvor mange idéer det overvejer, og hvor præcist det bedømmer dem. Svage taktikere lader sig oftere snyde af tilfældige resultater.',
  'Hver liga lærer af sine egne kampe. CL-kampe tæller i begge holds ligaer, så taktikker spredes via CL. Derfor kan metaen se forskellig ud fra liga til liga – og den ændrer sig langsomt over sæsonerne, efterhånden som maps roterer ind og ud.'])}</div>`)}}


/* ===== FASE 52: MØDTE TAKTIKKER – NAVNE, KAMPRAPPORT, KOPIERING OG SPEJDERRAPPORT ===== */
// WD.seen[taktik] = [navn, runder mødt, runder modstanderen vandt med den, sæson, dag, map, side] – alle taktikker, dit hold har spillet imod.
// Egne AI-taktikker får et beskrivende navn, første gang du møder dem (gemmes i WD.tx[id].nm). Er navnet allerede brugt, tilføjes holdets forkortelse og evt. #2.
// Kamprapporten viser modstanderens taktikker: NY = aldrig mødt før (afgøres ud fra taktikkens ID, ikke navnet), "variant af …" = en ændret udgave af en taktik, du kender.
// En modstanders egen taktik kan kopieres ind i "Mine taktikker" (WD.myx[map][side]) – først da kan du se ruterne. Spejderrapporten viser kun mødte taktikker.
const txIsX=n=>!!(WD&&WD.tx&&WD.tx[n]);
// ---------- navne og beskrivelser ----------
function txPath(map,a,b){if(a===b)return[a];const X=txMap(map),P={[a]:null},Q=[a];while(Q.length){const z=Q.shift();if(z===b)break;for(const n of X.NB[z])if(!(n in P)){P[n]=z;Q.push(n)}}
 if(!(b in P))return[a,b];const r=[];let z=b;while(z!=null){r.unshift(z);z=P[z]}return r}
const txZn=(map,z)=>(MAPS[map].zname&&MAPS[map].zname[z])||z;
function txFullPath(map,sd,w){let cur=sd==='T'?'TS':'CT';const out=[];w.forEach(([z,at])=>{const p=txPath(map,cur,z);out.push({p:p.slice(1),z,at});cur=z});return out}
function txBaseName(id){const t=WD.tx[id],map=t.m,r=txR_(id);
 if(t.s==='T'){const site=t.st,on=r.filter(w=>txLast(w)===site);const ats=on.map(w=>Math.max(...w.map(x=>x[1]))).sort((a,b)=>a-b),at=(ats[Math.floor(ats.length/2)]||0)*.4;
  const tempo=at<12?'Rush ':at<35?'':'Sent ';
  const ent=[...new Set(on.map(w=>{const fp=txFullPath(map,'T',w),all=fp.flatMap(x=>x.p.length?x.p:[x.z]);const i=all.lastIndexOf(site);return i>0?all[i-1]:(all.length>1?all[all.length-2]:site)}).filter(z=>z!==site&&z!=='TS'))].slice(0,2).map(z=>txZn(map,z));
  const oth=[...new Set(r.filter(w=>txLast(w)!==site).map(txLast))].map(z=>'lurk i '+txZn(map,z));
  let nm=`${tempo}${site}-${on.length===5?'stak':'hit'}${ent.length?' via '+ent.join(' og '):''}${oth.length?' + '+oth.join(' + '):''}`;return nm[0].toUpperCase()+nm.slice(1)}
 const m=MAPS[map],c={A:0,B:0,M:0,R:0};r.forEach(w=>{const z=w[0][0];c[z==='CT'?'R':m.rsite[z]||'M']++});
 if(c.R===5)return'Retake-opstilling';
 const parts=[c.A&&c.A+'A',c.M&&c.M+' Mid',c.B&&c.B+'B'].filter(Boolean).join('-')+(c.R?' + '+c.R+' i CT-spawn':'');
 const pw=r.find(w=>w.length>1);return `Opstilling ${parts}${pw?' + push mod '+txZn(map,txLast(pw)):''}`}
const txAbbr=k=>{if(!k)return'';const[li,ti]=String(k).split('-').map(Number),t=WD.lg[li]&&WD.lg[li].teams[ti];if(!t)return'';const n=(t.def&&t.def.name)||t.name||'';return n.split(/\s+/).filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,4)};
function txName(n){if(!txIsX(n))return n;const t=WD.tx[n];if(t.nm)return t.nm;
 const used=new Set();for(const k in WD.seen||{}){const s=WD.seen[k];if(s[5]===t.m&&s[6]===t.s)used.add(s[0])}
 const my=(WD.myx&&WD.myx[t.m]&&WD.myx[t.m][t.s])||[];my.forEach(k=>{if(WD.tx[k]&&WD.tx[k].nm)used.add(WD.tx[k].nm)});txStdL(t.m,t.s).forEach(k=>used.add(k));
 let nm=txBaseName(n);if(used.has(nm)){const a=txAbbr(t.by);if(a&&!used.has(nm+' ('+a+')'))nm+=' ('+a+')';else{let i=2;while(used.has(nm+' #'+i))i++;nm+=' #'+i}}
 return t.nm=nm}
function txDescs(id){const t=WD.tx[id],map=t.m,r=txR_(id),sec=at=>Math.round(at*.4);
 return r.map((w,k)=>{const fp=txFullPath(map,t.s,w);let s='';
  fp.forEach((x,i)=>{const via=x.p.slice(0,-1).map(z=>txZn(map,z));const to=txZn(map,x.z);
   s+=(i?' ':'')+(x.at?`Venter til ca. ${sec(x.at)} sek. og går så `:i?'Går så ':'Går ')+(via.length?`via ${via.join(', ')} `:'')+`til ${to}.`});
  if(t.s==='T'){if(k===1)s+=` Bærer bomben og planter på ${t.st}.`;if(t.ch&&t.ch.includes(k))s+=' Venter, til bomben er plantet, og tager CT i ryggen.'}
  else if(t.fb&&k>=2)s+=' Falder tilbage til nærmeste site efter ca. 20 sek., eller så snart der er kontakt et sted.';
  return s.replace(/^Går til CT-spawn\.$/,'Bliver i CT-spawn.')})}
function txDescSet(id){const t=WD.tx[id];if(!t)return;const m=MAPS[t.m],D=t.s==='T'?m.tdesc:m.cdesc;if(!D[id])D[id]=txDescs(id)}
// ---------- mødte taktikker ----------
function txAnc(n){const t=WD.tx[n];if(!t)return null;let p=t.p,g=0;while(p&&g++<50){if(txMap(t.m).std[t.s][p])return p;if(WD.seen&&WD.seen[p])return WD.seen[p][0];p=WD.tx[p]?WD.tx[p].p:null}
 const v=t.va;return v?(txMap(t.m).std[t.s][v]?v:(WD.seen&&WD.seen[v]?WD.seen[v][0]:null)):null}
{const _frS=finishRound;finishRound=function(side,why){try{if(WD&&M&&!M.done&&R&&!R.over){const i=myIdx();if(i>=0){const op=M.teams[1-i],sd=op.side,tac=op.tac,map=M.map||CUR;
  if(tac){WD.seen=WD.seen||{};M.opx=M.opx||{T:{},CT:{}};M.nw=M.nw||{};const won=side===sd?1:0;
   if(!WD.seen[tac]){if(txIsX(tac))M.nw[tac]=1;WD.seen[tac]=[txIsX(tac)?txName(tac):tac,0,0,WD.season,WD.day,map,sd]}
   const s=WD.seen[tac];s[1]++;s[2]+=won;s[3]=WD.season;s[4]=WD.day;const e=M.opx[sd][tac]=M.opx[sd][tac]||[0,0];e[0]+=won;e[1]++}}}}catch(e){console.error(e)}
 return _frS(side,why)}}
{const _nmS=newMatch;newMatch=function(...a){const r=_nmS(...a);if(M){M.opx={T:{},CT:{}};M.nw={}}return r}}
// ---------- kopiering ----------
function txCopy(id){const t=WD.tx[id];if(!t)return false;WD.myx=WD.myx||{};const L=((WD.myx[t.m]=WD.myx[t.m]||{T:[],CT:[]})[t.s]);if(L.includes(id))return false;L.push(id);txName(id);txDescSet(id);try{saveGame()}catch(e){}return true}
let txMine=(map,sd)=>((WD&&WD.myx&&WD.myx[map]&&WD.myx[map][sd])||[]).filter(txIsX);
// ---------- kamprapport ----------
const txBadge='background:#d4352b;color:#fff;font-size:10px;padding:1px 4px;font-weight:700;margin-left:4px;vertical-align:1px';
function txOppHTML(){const O=M.opx||{T:{},CT:{}},map=M.map||CUR,i=myIdx();if(i<0)return'';const op=M.teams[1-i];
 const rows=sd=>Object.entries(O[sd]).sort((a,b)=>b[1][1]-a[1][1]).map(([n,[w,c]])=>{const x=txIsX(n),nw=M.nw&&M.nw[n],an=x?txAnc(n):null,mine=x&&txMine(map,sd).includes(n);
  return `<tr><td style="white-space:normal;overflow-wrap:anywhere">${x?txName(n):n}${nw?`<span style="${txBadge}">NY</span>`:''}${an?`<br><span class="mu" style="font-size:11px">variant af ${an}</span>`:''}</td><td class="n2">${w}/${c}</td><td class="n2" style="white-space:normal">${x?(mine?'<span class="mu">Kopieret</span>':`<button data-txc="${n}" style="padding:3px 6px;font-size:11px">Kopiér</button>`):'<span class="mu">standard</span>'}</td></tr>`}).join('');
 const tb=(sd,t)=>Object.keys(O[sd]).length?`<div style="margin-top:6px"><b>${t}</b></div><table class="rpt"><colgroup><col style="width:56%"><col><col></colgroup><thead><tr><th>Taktik</th><th class="n2">Vundet</th><th class="n2"></th></tr></thead><tbody>${rows(sd)}</tbody></table>`:'';
 return `<div style="margin-top:10px"><b>Modstanderens taktikker</b> <span class="mu">(${op.name})</span></div>${tb('T','På T-siden')}${tb('CT','På CT-siden')}<div class="mu" style="margin-top:4px">Vundet = runder, modstanderen vandt med taktikken, ud af dem den blev brugt. NY = en taktik, du aldrig har mødt før. Kopiér lægger taktikken i "Mine taktikker" under Taktik, hvor du også kan se ruterne.</div>`}
{const _rmS=repHTMLm;repHTMLm=function(){const h=_rmS();if(!h)return h;const k=h.indexOf('<div style="margin-top:10px"><b>Dine taktikker på T-siden');return k<0?h:h.slice(0,k)+txOppHTML()+h.slice(k)}}
// (kopiér-knappen håndteres i FASE 53, hvor biblioteket kan være fuldt)
// navne i taktiktabeller (match-rapport og statistik)
{const _ttS=tacTable;tacTable=function(...a){return _ttS(...a).replace(/(title=")(x\d+)(")/g,(m0,a1,id,a3)=>a1+(txIsX(id)?txName(id):id)+a3).replace(/>(x\d+)</g,(m0,id)=>'>'+(txIsX(id)?txName(id):id)+'<')}}
// ---------- Taktik-fanen: Mine taktikker kan vælges ----------
let TXUI=false;
{const _tnS=tnOf;tnOf=function(map,sd){const L=_tnS(map,sd);if(TXUI&&typeof TU!=='undefined'&&map===TU.map){const my=txMine(map,sd);return my.length?L.concat(my.filter(n=>!L.includes(n))):L}return L}}
// næste kamp for dit hold: liga eller CL
function txNext(){if(!WD||!WD.lg)return null;const g=WD.lg[WD.me.li];
 for(let d=WD.day;d<NDAYS;d++){const nr=LDAYS.indexOf(d)+1;
  if(nr&&g.fix[nr-1]){const m=g.fix[nr-1].find(x=>x[0]===WD.me.ti||x[1]===WD.me.ti);if(m&&!g.res.some(y=>y.rd===nr&&y.h===m[0]&&y.a===m[1])){const oi=m[0]===WD.me.ti?m[1]:m[0];return{d,def:g.teams[oi].def,name:g.teams[oi].def.name||g.teams[oi].name,map:lgMap(nr),what:'Ligakamp '+nr}}}
  try{for(const x of clList(d)){const m=x.m;if(m&&!m.res&&m.a&&m.b&&(isMe(m.a)||isMe(m.b))){const o=isMe(m.a)?m.b:m.a;return{d,def:kdef(o),name:knm(o),map:m.map||null,what:m.st||'CL'}}}}catch(e){}}
 return null}
function txScoutHTML(){const nx=txNext();if(!nx)return'';const maps=nx.map?[nx.map]:seasonMaps(),S=WD.seen||{};
 const when=nx.d===WD.day?'i dag':`uge ${Math.floor(nx.d/7)+1}, ${DAYS[nx.d%7]}`;
 const blk=map=>{const tl=nx.def.tl&&nx.def.tl[map];const out=[];
  for(const sd of ['T','CT']){const L=tl?tl[sd]:[];const k=L.filter(n=>S[n]&&S[n][5]===map);
   out.push(`<div style="margin-top:4px"><b>${sd}-side</b></div>`+(k.length?k.map(n=>{const s=S[n];return `<div class="r" style="grid-template-columns:minmax(0,1fr) auto;font-size:12.5px"><div style="overflow-wrap:anywhere">${s[0]} <span class="mu">· ${SL[STYLE[n]]||''}</span></div><div class="mu" style="white-space:nowrap">${s[2]}/${s[1]} rd. · sæson ${s[3]}, uge ${Math.floor(s[4]/7)+1}</div></div>`}).join(''):'<div class="mu">Ingen taktikker, du har mødt.</div>'))}
  return `<div style="margin-top:6px"><b>${mapN(map)}</b></div>`+out.join('')};
 return `<div class="tm" id="txsc"><h3>Spejderrapport – ${nx.name} <span class="mu">(${nx.what}, ${when}${nx.map?' på '+mapN(nx.map):''})</span></h3><div class="mu">Taktikker i modstanderens udvalg, som du har mødt før. x/y rd. = runder, de vandt med den, ud af dem du mødte den.</div>${maps.map(blk).join('')}</div>`}
{const _rtS=renderTactics;renderTactics=function(){TXUI=true;try{_rtS()}finally{TXUI=false}try{if(typeof TSV!=='undefined'&&TSV.on)return;const el=$('tv');if(!el||!el.querySelectorAll)return;
  el.querySelectorAll('[data-a^="open|x"]').forEach(a=>{const id=a.dataset.a.slice(5);if(!txIsX(id))return;txDescSet(id);const f=a.firstChild;if(f&&f.nodeType===3)f.textContent=txName(id)+' ';a.insertAdjacentHTML('afterbegin','<span class="mu" style="font-size:10px;margin-right:4px">EGEN</span>')});
  const hd=el.querySelector('.hd');const sc=txScoutHTML();if(hd&&sc)hd.insertAdjacentHTML('afterend',sc)}catch(e){console.error(e)}}}
// ---------- oprydning: behold dine kopier og valgte taktikker; husk nærmeste kendte forfader ----------
{const _tsS=txSeason;txSeason=function(){try{const keep=new Set();if(WD.myx)for(const m in WD.myx)for(const sd in WD.myx[m])WD.myx[m][sd].forEach(n=>keep.add(n));
  for(const m in MGR)for(const sd of ['T','CT'])for(const b in (MGR[m]&&MGR[m][sd])||{})(MGR[m][sd][b]||[]).forEach(n=>{if(txIsX(n))keep.add(n)});WD.txKeep=[...keep];
  for(const id in WD.tx){const t=WD.tx[id];let p=t.p,g=0;while(p&&g++<50){if(txMap(t.m).std[t.s][p]||(WD.seen&&WD.seen[p])){t.va=p;break}p=WD.tx[p]?WD.tx[p].p:null}}}catch(e){console.error(e)}
 return _tsS()}}
{const _lgS=loadGame;loadGame=function(){const ok=_lgS();if(ok)try{if(WD.myx)for(const m in WD.myx)for(const sd in WD.myx[m])WD.myx[m][sd].forEach(n=>{if(txIsX(n))txDescSet(n)})}catch(e){}return ok}}


/* ===== FASE 53: DIT TAKTIKBIBLIOTEK OG TAKTIK-BYGGEREN ===== */
// Dit hold har pr. map et bibliotek på højst UL.max taktikker pr. side (standardtaktikkerne tæller med). Kampens udvalg (5 pr. købstype) vælges fra biblioteket.
// WD.ulib[map][side] = liste af taktikker. Ved første brug dannes biblioteket af de taktikker, du allerede har valgt, + dine kopier (højst UL.max).
// Taktik-byggeren: vælg rolle og tryk zoner på kortet i rækkefølge (mellemzoner fyldes ud), sæt "vent til X sek." på stop, og gem som din egen taktik.
const UL={max:8};
// ---------- bibliotek ----------
const ulAll=(map,sd)=>{const o=MGR[map]&&MGR[map][sd];return o?[...new Set([...(o.standard||[]),...(o.pistol||[]),...(o.eco||[])])]:[]};
const ulOk=(map,sd,n)=>!!txInfo(map,sd,n);
function ulGet(map,sd){WD.ulib=WD.ulib||{};const U=WD.ulib[map]=WD.ulib[map]||{};
 if(!U[sd]){let L=ulAll(map,sd).filter(n=>ulOk(map,sd,n));const my=((WD.myx&&WD.myx[map]&&WD.myx[map][sd])||[]).filter(n=>txIsX(n)&&!L.includes(n));L=L.concat(my).slice(0,UL.max);
  if(!L.length)L=ulStd(map,sd);U[sd]=L;ulClean(map,sd)}
 U[sd]=U[sd].filter(n=>ulOk(map,sd,n));if(!U[sd].length){U[sd]=ulStd(map,sd);ulClean(map,sd)}return U[sd]}
// mappets standarder uden om bibliotekets tnOf-indpakning (ellers kalder ulGet og tnOf hinanden i ring, når biblioteket er tomt)
function ulStd(map,sd){ulGet._in=true;try{return tnOf(map,sd).filter(n=>ulOk(map,sd,n)).slice(0,5)}finally{ulGet._in=false}}
// fjern taktikker uden for biblioteket fra kampens udvalg (og sørg for, at ingen liste er tom)
function ulClean(map,sd){const L=WD.ulib[map][sd],o=MGR[map]&&MGR[map][sd];if(!o)return;for(const b of ['pistol','standard','eco']){o[b]=(o[b]||[]).filter(n=>L.includes(n));if(!o[b].length&&L.length)o[b]=L.slice(0,Math.min(MAXSEL,L.length))}
 WD.myx=WD.myx||{};(WD.myx[map]=WD.myx[map]||{T:[],CT:[]})[sd]=L.filter(txIsX)}
function ulAdd(map,sd,n){const L=ulGet(map,sd);if(L.includes(n))return true;if(L.length>=UL.max)return false;L.push(n);ulClean(map,sd);return true}
function ulRm(map,sd,n){const L=ulGet(map,sd);if(L.length<=1)return;const i=L.indexOf(n);if(i<0)return;L.splice(i,1);ulClean(map,sd)}
// kopiering fra kamprapporten lægger taktikken i biblioteket – kun hvis der er plads
txCopy=function(id){const t=WD.tx[id];if(!t)return false;txName(id);txDescSet(id);if(ulGet(t.m,t.s).includes(id))return true;if(!ulAdd(t.m,t.s,id))return'full';try{saveGame()}catch(e){}return true};
txMine=(map,sd)=>WD&&WD.ulib&&WD.ulib[map]&&WD.ulib[map][sd]?WD.ulib[map][sd].filter(txIsX):((WD&&WD.myx&&WD.myx[map]&&WD.myx[map][sd])||[]).filter(txIsX);
// i Taktik-fanen er de tilgængelige taktikker = biblioteket
{const _tnU=tnOf;tnOf=function(map,sd){if(TXUI&&typeof TU!=='undefined'&&map===TU.map&&WD&&!ulGet._in)return ulGet(map,sd).slice();return _tnU(map,sd)}}
// ---------- kort ----------
const ZPOS={dust2:{CT:[470,80],A:[650,130],B:[130,130],MD:[340,200],SH:[540,260],LM:[290,340],LA:[670,340],TB:[130,400],MID:[440,420],LD:[620,470],TS:[440,555]},
 inferno:{B:[150,95],CH:[300,120],CT:[450,95],LB:[580,150],AR:[520,240],LO:[640,280],A:[710,340],PIT:[740,450],CAP:[690,555],SH:[590,400],TM:[460,320],MID:[360,400],MX:[440,460],M2:[520,490],TAP:[560,575],TB:[190,420],BN:[160,270],TS:[310,560]},
 aztec:{A:[110,110],TP:[260,80],CT:[430,80],B:[660,130],CBH:[660,290],BC:[530,220],BR:[560,370],TBH:[450,440],MID:[330,290],CA:[110,320],TC:[220,450],WA:[360,520],TS:[230,575]}};
const RCOL=['#d4352b','#1b64d6','#22b35a','#f28c1e','#8e44ad'];
// gangtid (sek.) og korteste vej på tværs af zoner; T kan ikke gå gennem CT-spawn og omvendt

const TBC={};function tbSP(map,sd,a){const k=map+sd+a;return TBC[k]||(TBC[k]=tbDij(map,sd,a))}
function tbLeg(map,sd,a,b){if(a===b)return{p:[a],t:0};const S=tbSP(map,sd,a);if(S.D[b]==null)return{p:[a,b],t:99};const p=[b];let z=b;while(z!==a){z=S.P[z];p.unshift(z)}return{p,t:S.D[b]}}
// tidslinje for én rolle: [{a,b,t0,t1}] – venter ved forrige stop, til "vent til" er nået
function tbTimeline(map,sd,w){let cur=sd==='T'?'TS':'CT',t=0;const seg=[];for(const[z,at]of w){const dep=Math.max(t,(at||0)*.4);const L=tbLeg(map,sd,cur,z);let tt=dep;
  for(let i=1;i<L.p.length;i++){const d=tbLeg(map,sd,L.p[i-1],L.p[i]).t;seg.push({a:L.p[i-1],b:L.p[i],t0:tt,t1:tt+d});tt+=d}cur=z;t=tt}return{seg,end:t,last:cur}}
// ---------- bygger-tilstand ----------
let TB=null;
function tbOpen(map,sd,src){const I=src?txInfo(map,sd,src):null,own=src&&txIsX(src)&&WD.tx[src].o==='egen';
 TB={map,sd,src:src||null,own,r:I?JSON.parse(JSON.stringify(I.r)):[[],[],[],[],[]],st:I&&sd==='T'?(I.st||'A'):'A',ch:I&&I.ch?I.ch.slice():[],fb:!!(I&&I.fb),role:sd==='T'?1:0,nm:own?txName(src):'',rep:null,play:null,msg:''};
 if(TB.r.length<5)while(TB.r.length<5)TB.r.push([]);TB.r=TB.r.map(w=>w.map(([z,at])=>[z,at||0]));renderTactics()}
function tbClose(){if(TB&&TB.play&&TB.play.iv)clearInterval(TB.play.iv);TB=null;renderTactics()}
const tbRoleName=k=>{const d=TEAMS[0],sd=TB.sd,j=d.roles&&d.roles[sd]?d.roles[sd].indexOf(k):-1;return ROLES[sd][k]+(j>=0&&d.pl[j]?' ('+d.pl[j][0]+')':'')};
function tbCheck(){const B=TB,out=[];let ok=true;const tl=B.r.map(w=>tbTimeline(B.map,B.sd,w));
 B.r.forEach((w,k)=>{if(!w.length){ok=false;out.push(['x',`${ROLES[B.sd][k]} har ingen rute.`])}});
 if(B.sd==='T'){const c=B.r[1];if(c.length&&txLast(c)!==B.st){ok=false;out.push(['x',`Bombebæreren (${ROLES.T[1]}) skal slutte på ${B.st}-site.`])}
  else if(c.length){const a=tl[1].end;if(a>75){ok=false;out.push(['x',`Bomben når først ${B.st} efter ca. ${Math.round(a)} sek. – højst 75 sek.`])}else out.push(['ok',`Bomben når ${B.st}-site efter ca. ${Math.round(a)} sek.`])}
  const on=B.r.filter(w=>w.length&&txLast(w)===B.st).length;out.push(['i',`${on} spillere ender på ${B.st}-site.`]);
  const ar=B.r.map((w,k)=>w.length&&txLast(w)===B.st?tl[k].end:null).filter(x=>x!=null);if(ar.length>1){const sp=Math.max(...ar)-Math.min(...ar);if(sp>6)out.push(['i',`Spillerne på sitet ankommer med op til ${Math.round(sp)} sek. imellem – brug "Synkronisér" for et samlet angreb.`])}}
 else{const m=MAPS[B.map],c={A:0,B:0,M:0};B.r.forEach(w=>{if(!w.length)return;const z=txLast(w);c[z==='CT'?'M':m.rsite[z]||'M']++});out.push(['i',`A-side: ${c.A} · B-side: ${c.B} · Mid/CT: ${c.M}`])}
 return{ok,out,tl}}
// synkronisér: alle, der ender på sitet, ankommer samtidig med den sidste
function tbSync(){const B=TB;if(B.sd!=='T')return;const idx=B.r.map((w,k)=>w.length&&txLast(w)===B.st?k:-1).filter(k=>k>=0);if(idx.length<2)return;
 idx.forEach(k=>{const w=B.r[k];if(w.length===1){const L=tbLeg(B.map,'T','TS',w[0][0]);if(L.p.length>2)w.unshift([L.p[L.p.length-2],0])}w[w.length-1][1]=0});
 const nat=k=>tbTimeline(B.map,'T',B.r[k]).end,T=Math.max(...idx.map(nat));
 idx.forEach(k=>{const w=B.r[k];if(w.length<2)return;const pre=tbTimeline(B.map,'T',w.slice(0,-1)).end,leg=tbLeg(B.map,'T',txLast(w.slice(0,-1)),txLast(w)).t,dep=T-leg;w[w.length-1][1]=dep>pre+.3?Math.round(dep/.4):0})}
// ---------- tegning ----------
function tbSVG(){const B=TB,m=MAPS[B.map],P=ZPOS[B.map];if(!P)return'<div class="mu">Kortet mangler.</div>';const C=tbCheck(),H=620;
 let s=`<svg viewBox="0 25 800 ${H-10}" style="width:100%;height:auto;background:#f7f8fa;border:1px solid var(--bd);touch-action:manipulation" xmlns="http://www.w3.org/2000/svg">`;
 m.edges.forEach(([a,b])=>{if(P[a]&&P[b])s+=`<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="#c3c8d0" stroke-width="10" stroke-linecap="round"/>`});
 // ruter
 B.r.forEach((w,k)=>{if(!w.length)return;const tl=C.tl[k],off=(k-2)*7,pts=[];let first=true;tl.seg.forEach(g=>{if(first){pts.push(P[g.a]);first=false}pts.push(P[g.b])});if(!pts.length)return;
  s+=`<polyline points="${pts.map(p=>(p[0]+off)+','+(p[1]+off)).join(' ')}" fill="none" stroke="${RCOL[k]}" stroke-width="${k===B.role?11:6}" stroke-opacity="${k===B.role?1:.6}" stroke-linejoin="round" stroke-linecap="round"/>`});
 const site=z=>m.rsite[z]===z;
 Object.keys(m.zn).forEach(z=>{const[x,y]=P[z]||[0,0];const big=site(z)||z==='TS'||z==='CT';const fill=site(z)?'#fff0b3':z==='TS'?'#fde2e0':z==='CT'?'#dde8fb':'#fff';
  s+=`<g data-tbz="${z}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="${big?50:40}" fill="${fill}" stroke="#15181d" stroke-width="3"/><text x="${x}" y="${y+9}" text-anchor="middle" font-size="${big?28:24}" font-weight="700" fill="#15181d" style="pointer-events:none">${z}</text></g>`});
 // stop for valgt rolle
 B.r[B.role].forEach(([z],i)=>{const p=P[z];if(!p)return;s+=`<circle cx="${p[0]+36}" cy="${p[1]-36}" r="19" fill="${RCOL[B.role]}" stroke="#fff" stroke-width="2" style="pointer-events:none"/><text x="${p[0]+36}" y="${p[1]-29}" text-anchor="middle" font-size="21" font-weight="700" fill="#fff" style="pointer-events:none">${i+1}</text>`});
 s+=`<g id="tbdots"></g></svg><div class="mu" style="font-size:11px;line-height:1.5;margin-top:4px">${Object.keys(m.zn).map(z=>`<b>${z}</b> ${txZn(B.map,z)}`).join(' · ')}</div>`;return s}
function tbDots(t){const B=TB,P=ZPOS[B.map],C=tbCheck();let s='';C.tl.forEach((tl,k)=>{if(!B.r[k].length)return;let pos=P[B.sd==='T'?'TS':'CT'];
  for(const g of tl.seg){if(t>=g.t1){pos=P[g.b];continue}if(t>=g.t0){const f=(t-g.t0)/Math.max(.01,g.t1-g.t0);pos=[P[g.a][0]+(P[g.b][0]-P[g.a][0])*f,P[g.a][1]+(P[g.b][1]-P[g.a][1])*f]}else pos=P[g.a];break}
  const off=(k-2)*9;s+=`<circle cx="${pos[0]+off}" cy="${pos[1]+off}" r="17" fill="${RCOL[k]}" stroke="#fff" stroke-width="3"/>`});return s}
// ---------- skærm ----------
function tbHTML(){const B=TB,C=tbCheck(),sd=B.sd,w=B.r[B.role],secOpt=v=>[0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90].map(x=>`<option value="${x}" ${Math.round(v*.4)===x?'selected':''}>${x?'vent til '+x+' sek.':'ingen ventetid'}</option>`).join('');
 const L=ulGet(B.map,sd),full=L.length>=UL.max&&!B.own;
 let h=`<div class="hd"><b>Taktik-bygger – ${mapN(B.map)} · ${sd}-side</b><button style="flex:0 0 auto;padding:6px 12px" data-tb="close|">Annullér</button></div>`;
 h+=`<div class="tm"><div class="mu">${B.own?'Du redigerer din egen taktik.':B.src?`Kopi af <b>${txIsX(B.src)?txName(B.src):B.src}</b> – gemmes som en ny taktik.`:'Ny taktik.'} Vælg en rolle og tryk på zonerne i den rækkefølge, rollen skal gå. Mellemzonerne fyldes ud af sig selv.</div>`;
 h+=`<div style="display:flex;gap:8px;margin:8px 0;align-items:center"><input data-tbn="1" value="${(B.nm||'').replace(/"/g,'&quot;')}" placeholder="Navn (laves automatisk, hvis tomt)" style="flex:1;font:inherit;padding:6px;border:1px solid var(--bd)">${sd==='T'?`<select data-tbsite="1" style="width:auto">${txMap(B.map).SITES.map(s=>`<option value="${s}" ${B.st===s?'selected':''}>Mål: ${s}-site</option>`).join('')}</select>`:''}</div>`;
 h+=`<div class="bar sm" style="flex-wrap:wrap">${ROLES[sd].map((r,k)=>`<button data-tb="role|${k}" style="flex:1 1 30%;border-left:6px solid ${RCOL[k]};${k===B.role?'background:var(--tx);color:var(--bg)':''}">${r}${sd==='T'&&k===1?' 💣':''}</button>`).join('')}</div>`;
 h+=tbSVG();
 h+=`<div class="bar sm"><button data-tb="play|">${B.play?'⏸ Stop':'▶ Afspil'}</button>${sd==='T'?'<button data-tb="sync|">Synkronisér</button>':''}<button data-tb="undo|">↶ Fortryd stop</button></div>`;
 h+=`<div id="tbtime" class="mu" style="text-align:center">${B.play?'':'&nbsp;'}</div></div>`;
 h+=`<div class="tm"><h3 style="border-left:6px solid ${RCOL[B.role]};padding-left:6px">${tbRoleName(B.role)}</h3>`;
 h+=w.length?w.map(([z,at],i)=>`<div class="r" style="grid-template-columns:22px minmax(0,1fr) 140px 34px"><b>${i+1}</b><div>${txZn(B.map,z)}</div><select data-tbw="${i}">${secOpt(at)}</select><button data-tb="del|${i}" style="padding:4px">✕</button></div>`).join(''):'<div class="mu">Ingen stop endnu – tryk på en zone på kortet.</div>';
 h+=`<div style="display:flex;gap:8px;margin-top:6px;align-items:center"><span class="mu" style="white-space:nowrap">Samme rute som</span><select data-tbsame="1"><option value="">–</option>${ROLES[sd].map((r,k)=>k===B.role?'':`<option value="${k}">${r}</option>`).join('')}</select><button data-tb="clear|" style="flex:0 0 auto;padding:6px 10px">Ryd</button></div>`;
 if(sd==='T'&&B.role!==1)h+=`<label style="display:block;margin-top:6px"><input type="checkbox" data-tbch="1" ${B.ch.includes(B.role)?'checked':''}> Vent til bomben er plantet, og tag CT i ryggen</label>`;
 if(sd==='CT')h+=`<label style="display:block;margin-top:6px"><input type="checkbox" data-tbfb="1" ${B.fb?'checked':''}> Forward, Flex og Support falder tilbage til nærmeste site ved kontakt (eller efter ca. 20 sek.)</label>`;
 h+=`</div><div class="tm"><h3>Kontrol</h3>${C.out.map(([k,t])=>`<div style="padding:2px 0">${k==='x'?'✗':k==='ok'?'✓':'ⓘ'} ${t}</div>`).join('')}`;
 if(full){const opts=L.map(n=>`<option value="${n}" ${(B.rep||B.src)===n?'selected':''}>${txIsX(n)?txName(n):n}</option>`).join('');h+=`<div style="margin-top:8px">Biblioteket er fuldt (${L.length}/${UL.max}). Erstat: <select data-tbrep="1"><option value="">– vælg –</option>${opts}</select></div>`}
 if(B.msg)h+=`<div style="margin-top:6px;color:var(--t)">${B.msg}</div>`;
 h+=`<button data-tb="save|" style="width:100%;margin-top:8px;${C.ok?'background:#1b64d6;color:#fff;border-color:#1b64d6':''}" ${C.ok?'':'disabled'}>${B.own?'Gem ændringer':'Gem som ny taktik'}</button></div>`;
 return h}
function tbSave(){const B=TB,C=tbCheck();if(!C.ok)return;const L=ulGet(B.map,B.sd);
 if(!B.own&&L.length>=UL.max&&!(B.rep&&L.includes(B.rep))){B.msg='Vælg hvilken taktik i biblioteket, den nye skal erstatte.';return renderTactics()}
 const r=B.r.map(w=>w.map(([z,at])=>[z,at||0]));let tempoS=0;if(B.sd==='T'){const on=r.filter(w=>txLast(w)===B.st),ats=on.map(w=>Math.max(...w.map(x=>x[1]))).sort((a,b)=>a-b);tempoS=(ats[Math.floor(ats.length/2)]||0)*.4}
 const sy=B.sd==='T'?(tempoS<12?'A':tempoS<35?'M':'P'):'M',sk=r.every(w=>txLast(w)===txLast(r[0]));
 const ch=B.sd==='T'?B.ch.filter(k=>k!==1&&r[k].length):[];
 let id;WD.tx=WD.tx||{};WD.txn=WD.txn||0;
 if(B.own){id=B.src;Object.assign(WD.tx[id],{r:txEnc(r),st:B.sd==='T'?B.st:undefined,ch:ch.length?ch:undefined,cp:undefined,fb:B.sd==='CT'&&B.fb?true:undefined,sk:sk||undefined,sy});TXRC.delete(id);if(!ch.length){delete CHASE[id]}TXFB.delete(id);TSTACK.delete(id)}
 else{id='x'+(++WD.txn);WD.tx[id]={m:B.map,s:B.sd,r:txEnc(r),st:B.sd==='T'?B.st:undefined,ch:ch.length?ch:undefined,fb:B.sd==='CT'&&B.fb?true:undefined,sk:sk||undefined,sy,p:B.src||undefined,o:'egen',b:WD.season,by:WD.me.li+'-'+WD.me.ti}}
 txReg(id);const M0=MAPS[B.map];delete (B.sd==='T'?M0.tdesc:M0.cdesc)[id];txDescSet(id);
 // navn: dit eget eller automatisk; unikt blandt mappets taktikker for siden
 let nm=(B.nm||'').trim();if(!nm){delete WD.tx[id].nm;nm=txBaseName(id)}
 const used=new Set(tnOf(B.map,B.sd));ulGet(B.map,B.sd).forEach(n=>{if(n!==id&&txIsX(n))used.add(txName(n))});if(used.has(nm)){let i=2;while(used.has(nm+' #'+i))i++;nm+=' #'+i}WD.tx[id].nm=nm;
 if(!B.own){if(L.length>=UL.max){const i=L.indexOf(B.rep);L[i]=id;for(const b of ['pistol','standard','eco']){const o=MGR[B.map][B.sd][b];const j=o.indexOf(B.rep);if(j>=0)o[j]=id}ulClean(B.map,B.sd)}else ulAdd(B.map,B.sd,id)}
 try{saveGame()}catch(e){}const k={map:B.map,sd:B.sd};tbClose();TU.map=k.map;TU.side=k.sd;TU.open=id;renderTactics()}
function tbPlay(){const B=TB;if(B.play){clearInterval(B.play.iv);B.play=null;return renderTactics()}const C=tbCheck(),T=Math.max(5,...C.tl.map(x=>x.end))+2;B.play={t:0,T};renderTactics();
 B.play.iv=setInterval(()=>{if(!TB||!TB.play){return}const g=document.getElementById('tbdots'),tt=document.getElementById('tbtime');TB.play.t+=.25;if(g)g.innerHTML=tbDots(TB.play.t);if(tt)tt.textContent=`${TB.play.t.toFixed(0)} sek.`;if(TB.play.t>=TB.play.T){clearInterval(TB.play.iv);TB.play=null;const b=document.querySelector('[data-tb="play|"]');if(b)b.textContent='▶ Afspil'}},60)}
// ---------- bibliotekskort i Taktik-fanen ----------
function ulHTML(){const map=TU.map,sd=TU.side,L=ulGet(map,sd);
 const allStd=(MAPS[map].tn?MAPS[map].tn[sd]:TN[sd]).filter(n=>!L.includes(n));
 return `<div class="tm" id="ulib"><h3>Bibliotek på ${mapN(map)} – ${sd}-side (${L.length}/${UL.max})</h3><div class="mu">Kampens udvalg vælges herfra. Standardtaktikkerne tæller med, så der skal gøres plads til nye.</div>`+
  L.map(n=>{const x=txIsX(n),own=x&&WD.tx[n].o==='egen';return `<div class="r" style="grid-template-columns:minmax(0,1fr) auto auto;gap:6px"><div style="overflow-wrap:anywhere">${x?`<span class="mu" style="font-size:10px">${own?'EGEN':'KOPI'}</span> `:''}${x?txName(n):n}</div><button data-ub="ed|${encodeURIComponent(n)}" style="padding:4px 8px;font-size:12px">${own?'✎ Redigér':'Kopiér og redigér'}</button><button data-ub="rm|${encodeURIComponent(n)}" style="padding:4px 8px" ${L.length<=1?'disabled':''}>✕</button></div>`}).join('')+
  `<div style="display:flex;gap:8px;margin-top:8px"><select data-ubadd="1" ${L.length>=UL.max?'disabled':''}><option value="">+ Tilføj standardtaktik</option>${allStd.map(n=>`<option value="${encodeURIComponent(n)}">${n}</option>`).join('')}</select><button data-ub="new|" style="flex:0 0 auto;padding:6px 12px;background:#1b64d6;color:#fff;border-color:#1b64d6">+ Ny taktik</button></div></div>`}
// ---------- Taktik-fanen ----------
{const _rtU=renderTactics;renderTactics=function(){if(TB){$('tv').innerHTML=tbHTML();return}_rtU();try{if(typeof TSV!=='undefined'&&TSV.on)return;const el=$('tv');if(!el||!el.querySelectorAll)return;
  const card=[...el.querySelectorAll('.tm')].find(c=>{const h=c.querySelector('h3');return h&&/^Taktikker på/.test(h.textContent)});TXUI=true;let h;try{h=ulHTML()}finally{TXUI=false}
  if(card)card.insertAdjacentHTML('afterend',h);else el.insertAdjacentHTML('beforeend',h)}catch(e){console.error(e)}}}
$('tv').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-tb],[data-tbz],[data-ub]');if(!b)return;e.stopImmediatePropagation();e.preventDefault();
 if(b.dataset.ub){const[a,v0]=b.dataset.ub.split('|'),v=decodeURIComponent(v0||'');
  if(a==='rm'){ulRm(TU.map,TU.side,v);try{saveGame()}catch(x){}renderTactics()}
  else if(a==='ed')tbOpen(TU.map,TU.side,v);else if(a==='new')tbOpen(TU.map,TU.side,null);return}
 if(!TB)return;const B=TB;
 if(b.dataset.tbz){const z=b.dataset.tbz,w=B.r[B.role];if(!w.length||txLast(w)!==z)w.push([z,0]);if(B.sd==='T'&&B.role===1&&txMap(B.map).SITES.includes(z))B.st=z;B.msg='';return renderTactics()}
 const[a,v]=b.dataset.tb.split('|');
 if(a==='close')return tbClose();if(a==='role'){B.role=+v;return renderTactics()}
 if(a==='del'){B.r[B.role].splice(+v,1);return renderTactics()}if(a==='undo'){B.r[B.role].pop();return renderTactics()}
 if(a==='clear'){B.r[B.role]=[];return renderTactics()}if(a==='sync'){tbSync();return renderTactics()}
 if(a==='play')return tbPlay();if(a==='save')return tbSave()},true);
$('tv').addEventListener('change',e=>{const s=e.target;if(!s||!s.dataset)return;const D=s.dataset;
 if(D.ubadd){e.stopImmediatePropagation();if(s.value){ulAdd(TU.map,TU.side,decodeURIComponent(s.value));try{saveGame()}catch(x){}renderTactics()}return}
 if(!TB)return;const B=TB;
 if(D.tbw!=null){e.stopImmediatePropagation();B.r[B.role][+D.tbw][1]=Math.round(+s.value/.4);return renderTactics()}
 if(D.tbsite){e.stopImmediatePropagation();B.st=s.value;return renderTactics()}
 if(D.tbsame){e.stopImmediatePropagation();if(s.value!==''){B.r[B.role]=JSON.parse(JSON.stringify(B.r[+s.value]))}return renderTactics()}
 if(D.tbch){e.stopImmediatePropagation();B.ch=B.ch.filter(k=>k!==B.role);if(s.checked)B.ch.push(B.role);return}
 if(D.tbfb){e.stopImmediatePropagation();B.fb=s.checked;return}
 if(D.tbrep){e.stopImmediatePropagation();B.rep=s.value||null;B.msg='';return}},true);
$('tv').addEventListener('input',e=>{const s=e.target;if(TB&&s&&s.dataset&&s.dataset.tbn){e.stopImmediatePropagation();TB.nm=s.value}},true);
// kamprapportens kopiér-knap: besked, hvis biblioteket er fuldt
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-txc]');if(!b)return;e.stopImmediatePropagation();const r=txCopy(b.dataset.txc);
 b.outerHTML=r==='full'?`<span style="color:var(--t);font-size:11px">Biblioteket er fuldt (${UL.max}/${UL.max}) – fjern en taktik under Taktik først</span>`:'<span class="mu">Kopieret</span>'},true);
// oprydning: alle taktikker i dit bibliotek beholdes
{const _tsU=txSeason;txSeason=function(){try{if(WD.ulib)for(const m in WD.ulib)for(const sd in WD.ulib[m])ulClean(m,sd)}catch(e){}return _tsU()}}
// FAQ
{const _rfU=renderFaq;renderFaq=function(){_rfU();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 f.insertAdjacentHTML('beforeend',`<div class="tm"><h3>Dit taktikbibliotek og taktik-byggeren</h3>${li([
  `Du har pr. map et bibliotek på højst ${UL.max} taktikker pr. side – standardtaktikkerne tæller med. Kampens udvalg (5 pr. købstype) vælges fra biblioteket under Taktik. Vil du have en ny taktik ind, skal du fjerne en anden.`,
  'Tryk "+ Ny taktik" eller "Kopiér og redigér" på en taktik i biblioteket. Vælg en rolle, og tryk på zonerne på kortet i den rækkefølge, rollen skal gå – mellemzonerne fyldes ud af sig selv. Hvert stop kan få "vent til X sek.".',
  'T: Bombebæreren (Support) skal slutte på mål-sitet og kunne nå det inden ca. 75 sek. En rolle kan sættes til at vente, til bomben er plantet, og så tage CT i ryggen. "Synkronisér" sætter ventetider, så alle, der går på sitet, ankommer samtidig. CT: Forward, Flex og Support kan sættes til at falde tilbage ved kontakt.',
  '"▶ Afspil" viser ruterne med de rigtige gangtider. Din egen taktik kan redigeres senere; en kopi af en andens taktik gemmes som en ny.',
  'AI-holdene lærer også af dine taktikker, når de møder dem.'])}</div>`)}}
{const _lgU=loadGame;loadGame=function(){const ok=_lgU();if(ok){TB=null;try{if(WD.ulib)for(const m in WD.ulib)for(const sd in WD.ulib[m])WD.ulib[m][sd].forEach(n=>{if(txIsX(n))txDescSet(n)})}catch(e){}}return ok}}
