/* ===== 11. nov.: holdstil, innovatører/forfinere og egne lister til pistol- og eco-runder ===== */
// stil: holdets profil ud fra startspillernes skills (TPROF: A aggressiv, M metodisk, P passiv), skubbet lidt af specialiteter. Beregnes én gang pr. sæson.
function txStyRaw(d){const L=line(d),A={};KS.forEach((k,i)=>A[k]=L.reduce((s,p)=>s+(+p[SI[i]]||0),0)/Math.max(1,L.length));
 const all=KS.reduce((s,k)=>s+A[k],0)/KS.length,v={};for(const st of ['A','M','P'])v[st]=TPROF[st].reduce((s,k)=>s+A[k],0)/TPROF[st].length-all;
 L.forEach(p=>{if(p[23]==='hot')v.A+=1.5;if(p[23]==='rock')v.P+=1.5;if(p[23]==='team')v.M+=1.5});return v}
// stilen måles i forhold til ligaens gennemsnit, så holdene fordeler sig på alle tre stilarter
function txSty(d){if(!d||!WD)return null;if(d.sty&&d.sty.s===WD.season)return d.sty;const w=txLiOf(d),li=w?w[0]:null;WD.styM=WD.styM||{};let mu=li!=null&&WD.styM[li]&&WD.styM[li].s===WD.season?WD.styM[li].v:null;
 if(!mu&&li!=null){mu={A:0,M:0,P:0};const T=WD.lg[li].teams;T.forEach(t=>{const r=txStyRaw(t.def);for(const k in mu)mu[k]+=r[k]/T.length});WD.styM[li]={s:WD.season,v:mu}}
 const raw=txStyRaw(d),v={};for(const k of ['A','M','P'])v[k]=raw[k]-(mu?mu[k]:0);const top=Object.entries(v).sort((a,b)=>b[1]-a[1])[0][0];return d.sty={s:WD.season,v,top}}
// taktikkens stil læses af dens 2D-punkter: T – ingen syncpoints og ingen ventetid = aggressiv, ventetid på 40+ sek. = passiv; CT – stak = passiv, spillere der rykker frem/roterer på tid = aggressiv
const TXSY=new Map();
function txSyOf(map,sd,n){const k=map+'|'+n;if(TXSY.has(k))return TXSY.get(k);const r2=typeof txR2Of==='function'?txR2Of(map,n):null;let sy='M';
 if(r2&&r2.length){const P=r2.flat();if(sd==='T'){const mx=Math.max(0,...P.map(p=>p[4]||0)),sy1=P.some(p=>p[0]===1);sy=mx>=40?'P':(!sy1&&mx<10)?'A':'M'}
  else{const I=txInfo(map,sd,n),moves=r2.filter(w=>w.length>1&&w.slice(1).some(p=>(p[4]||0)>0)).length;sy=I&&I.sk?'P':moves>=2?'A':'M'}}
 else{const I=txInfo(map,sd,n);sy=(I&&I.sy)||STYLE[n]||'M'}
 TXSY.set(k,sy);return sy}
function txFit(d,map,sd,n){try{const st=txSty(d);if(!st)return 0;return TAI.pf*(st.v[txSyOf(map,sd,n)]||0)/100}catch(e){return 0}}
// innovation: 0 = forfiner (mutationer, kopier, strengere adgang), 1 = innovatør (nye idéer, flere fase-taktikker, eksperimenterer også i knockout)
const txInn=d=>{if(d.inn==null)d.inn=Math.round(rnd()*100)/100;return d.inn};
const innLbl=d=>{const i=txInn(d);return i>=.67?'innovatør':i<.34?'forfiner':'balanceret'};
{const _nc=txNewCand;txNewCand=function(d,map,sd){const i=txInn(d),sv=[TXC.pMut,TXC.pNew],pv=TXD;let ph=null;TXC.pNew=.10+.35*i;TXC.pMut=.55-.35*i;try{ph=txSetPh(.4+.4*i)}catch(e){}TXD=d;
  try{return _nc(d,map,sd)}finally{TXC.pMut=sv[0];TXC.pNew=sv[1];if(ph!=null)try{txSetPh(ph)}catch(e){}TXD=pv}}}
{const _ev=txEval;txEval=function(d,map,sd){const sv=TXQ.margK;TXQ.margK=.5+.3*(1-txInn(d));try{return _ev(d,map,sd)}finally{TXQ.margK=sv}}}
{const _ch=txChoose;txChoose=function(d,map,sd,opp){const sv=TXC.exKO;TXC.exKO=.4+.5*txInn(d);try{return _ch(d,map,sd,opp)}finally{TXC.exKO=sv}}}
// runde-typer: d.tstB[map]['pistol|'+taktik] / 'eco|' / 'standard|'. Holdets almindelige statistik (d.tst) tæller kun fuldt køb.
const TXEC={n:15,lib:3,K:15,cand:false};/* cand: eco-kandidater (slået fra – i test 11. nov. tabte de flere eco-runder, end de vandt) */
{const _fr=finishRound;finishRound=function(side,why){let rec=null;try{if(TXON&&WD&&M&&!M.done&&R&&!R.over&&M.defs){const map=M.map||CUR;
   rec=['T','CT'].map(sd=>{const t=teamOf(sd);if(!t||!t.tac)return null;const d=M.defs[t.i],S=d.tst&&d.tst[map]&&d.tst[map][t.tac];return{sd,d,map,bt:t.bt==='force'?'eco':t.bt,tac:t.tac,b:S?S.slice():null}})}}catch(e){rec=null}
 const r=_fr(side,why);
 try{if(rec)for(const x of rec){if(!x||!txOk(x.d))continue;const won=side===x.sd?1:0,Bm=((x.d.tstB=x.d.tstB||{})[x.map]=x.d.tstB[x.map]||{});if(x.bt!=='standard'){const e=Bm[x.bt+'|'+x.tac]=Bm[x.bt+'|'+x.tac]||[0,0];e[0]+=won;e[1]++}
   if(x.bt!=='standard'){const S=x.d.tst&&x.d.tst[x.map];if(S){if(x.b)S[x.tac]=x.b;else delete S[x.tac]}}}}catch(e){console.error('finishRoundB',e)}
 return r}}
function txEcoNew(d,map,sd){const pv=TXD;TXD=d;try{const b=txEcoBuild(map,sd);if(!b)return;const id=txMk(map,sd,b,'eco',null,d);WD.tx[id].eco=1;d.tc[map][sd+'eco']=id;const Bm=(d.tstB=d.tstB||{})[map]=d.tstB[map]||{};Bm['eco|'+id]=[0,0]}catch(e){console.error('txEcoNew',e)}finally{TXD=pv}}
function txEcoEval(d,map,sd){if(!TXEC.cand||!d.tc||!d.tc[map]||!d.tl||!d.tl[map]||!txIs2D(map))return;const c=d.tc[map][sd+'eco'];if(!c||!WD.tx[c])return txEcoNew(d,map,sd);
 const Bm=d.tstB&&d.tstB[map]||{},e=Bm['eco|'+c]||[0,0];if(e[1]<TXEC.n)return;let w=0,k=0;for(const key in Bm)if(key.startsWith('eco|')&&key!=='eco|'+c){w+=Bm[key][0];k+=Bm[key][1]}const avg=k>=10?w/k:.3;
 const L=d.tl[map][sd+'eco']=d.tl[map][sd+'eco']||[],wr=x=>{const t=Bm['eco|'+x]||[0,0];return(t[0]+avg*TXEC.K)/(t[1]+TXEC.K)};
 if(e[0]/e[1]>avg+.5/Math.sqrt(e[1]+20)){if(L.length<TXEC.lib)L.push(c);else{const worst=L.slice().sort((a,b)=>wr(a)-wr(b))[0];if(wr(c)>wr(worst))L[L.indexOf(worst)]=c}}
 txEcoNew(d,map,sd)}
{const _g=gain;gain=function(defs){const r=_g(defs);try{if(TXON&&WD&&M&&defs&&defs.length===2){const map=M.map||CUR;defs.forEach(d=>{if(txOk(d)&&d.tl&&d.tl[map])for(const sd of ['T','CT'])txEcoEval(d,map,sd)})}}catch(e){console.error('gainB',e)}return r}}
// egne lister til pistol- og eco-runder: samme bibliotek (+ eco-taktikker), rangeret efter resultater i netop den runde-type
{const _ao=aiOrder;aiOrder=function(d,map,opp){const o=_ao(d,map,opp);try{if(o&&txOk(d)&&d.tl&&d.tl[map]){const li=txLiOf(d)[0],q=tcq(d),Bm=d.tstB&&d.tstB[map]||{};
   for(const sd of ['T','CT']){const os=sd==='T'?'CT':'T',O=opp&&opp[os]&&opp[os].standard||txMeta(li,map,os);
    for(const bt of ['pistol','eco']){const pool=[...new Set([...d.tl[map][sd],...(d.tl[map][sd+'eco']||[])])].filter(n=>txInfo(map,sd,n));if(!pool.length)continue;
     let w=0,k=0;pool.forEach(n=>{const t=Bm[bt+'|'+n];if(t){w+=t[0];k+=t[1]}});const avg=k>=10?w/k:(bt==='eco'?.3:.5);
     const bs=pool.map(n=>WD.tx[n]&&WD.tx[n].eco?null:txScore(d,map,sd,n,O)),bv=bs.filter(x=>x!=null),bm=bv.length?bv.reduce((a,b)=>a+b,0)/bv.length:.5;
     const L=pool.map((n,j)=>{const t=Bm[bt+'|'+n]||[0,0],pr=avg+(bs[j]!=null?bs[j]-bm:0);return[n,(t[0]+pr*TXEC.K)/(t[1]+TXEC.K)+txFit(d,map,sd,n)+txG()*.04*(1.5-q)]}).sort((a,b)=>b[1]-a[1]).slice(0,TXC.sel).map(x=>x[0]);
     /* runderne går listen igennem forfra hver kamp, og der er kun få eco-runder: eco-kandidaten lægges først eller som nr. 2 */
     if(bt==='eco'){const c=d.tc[map]&&d.tc[map][sd+'eco'];if(c&&txInfo(map,sd,c)){const j=L.indexOf(c);if(j>=0)L.splice(j,1);L.splice(Math.min(L.length,txR()<.5?0:1),0,c);if(L.length>TXC.sel)L.length=TXC.sel}}
     o[sd][bt]=L}}}}catch(e){console.error('aiOrderB',e)}return o}}
// sæsonskifte: halvér runde-type-statistik, lad innovation drive en smule
{const _se=txSeason;txSeason=function(){const r=_se.apply(this,arguments);try{WD.lg.forEach(g=>g.teams.forEach(t=>{const d=t.def;
   if(d.tstB)for(const map in d.tstB){const Bm=d.tstB[map];for(const k in Bm){Bm[k]=[Math.round(Bm[k][0]*5)/10,Math.round(Bm[k][1]*5)/10];if(Bm[k][1]<1){const n=k.split('|')[1];if(!(d.tc&&d.tc[map]&&Object.values(d.tc[map]).includes(n)))delete Bm[k]}}}
   if(d.inn!=null)d.inn=Math.round(Math.max(0,Math.min(1,d.inn+txG()*.05))*100)/100}))}catch(e){console.error('txSeasonB',e)}return r}}
