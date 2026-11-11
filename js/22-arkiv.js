/* ===== 11. nov.: arkiv over gamle taktikker ===== */
// Ved sæsonskiftet gemmes taktikker, der forsvinder, men som klarede sig godt (min. TXA.minN runder og mindst TXA.gap over standardernes median), i et fælles arkiv (højst TXA.max pr. map og side).
// Når et hold kopierer, kan det hente en arkiveret taktik – kun hvis den taktik, den tabte mest til, ikke længere bruges meget i ligaen (under TXA.nem af runderne).
const TXA={minN:30,gap:.03,max:10,nem:.05,p:.5};
function txArcStats(){const R={};for(const li in WD.tk||{})for(const map in WD.tk[li]){const K=WD.tk[li][map];for(const k in K){const[t,c]=k.split('|'),e=K[k];
   for(const [n,sd,won] of [[t,'T',e[1]-e[0]],[c,'CT',e[0]]]){const o=((R[map]=R[map]||{})[n]=R[map][n]||{sd,w:0,n:0,vs:{}});o.w+=won;o.n+=e[1];const v=o.vs[sd==='T'?c:t]=o.vs[sd==='T'?c:t]||[0,0];v[0]+=won;v[1]+=e[1]}}}return R}
{const _se=txSeason;txSeason=function(){let pre=null,st=null;try{pre={};for(const id in WD.tx)pre[id]=JSON.parse(JSON.stringify(WD.tx[id]));st=txArcStats()}catch(e){pre=null}
 const r=_se.apply(this,arguments);
 try{if(pre){WD.txArc=WD.txArc||{};for(const id in pre){if(WD.tx[id])continue;const x=pre[id],S=st[x.m]&&st[x.m][id];if(!S||S.n<TXA.minN||!MAPS[x.m])continue;
     const std=txStdL(x.m,x.s).map(n=>st[x.m]&&st[x.m][n]).filter(o=>o&&o.n>=20).map(o=>o.w/o.n).sort((a,b)=>a-b),med=std.length?std[Math.floor((std.length-1)/2)]:.5,wr=S.w/S.n;if(wr<med+TXA.gap)continue;
     let nem=null,bw=2;for(const o in S.vs){const v=S.vs[o];if(v[1]>=10&&v[0]/v[1]<bw){bw=v[0]/v[1];nem=o}}
     const A=((WD.txArc[x.m]=WD.txArc[x.m]||{})[x.s]=WD.txArc[x.m][x.s]||[]);if(A.some(a=>a.id===id))continue;const ent={id,x,wr:Math.round(wr*1000)/1000,gap:Math.round((wr-med)*1000)/1000,nem,s:WD.season};
     if(A.length<TXA.max)A.push(ent);else{const w=A.slice().sort((a,b)=>a.gap-b.gap)[0];if(ent.gap>w.gap)A[A.indexOf(w)]=ent}}}}catch(e){console.error('txArc',e)}
 return r}}
function txArcUse(li,map,sd){const A=WD.txArc&&WD.txArc[map]&&WD.txArc[map][sd];if(!A||!A.length)return[];const os=sd==='T'?'CT':'T',U=WD.tu&&WD.tu[li]&&WD.tu[li][map]&&WD.tu[li][map][os]||{},tot=Object.values(U).reduce((a,b)=>a+b,0)||1;
 return A.filter(a=>!a.nem||(U[a.nem]||0)/tot<TXA.nem)}
{const _pl=txPool;txPool=function(d,map,sd){const P=_pl(d,map,sd);try{if(txR()<TXA.p){const li=txLiOf(d)[0];for(const a of txArcUse(li,map,sd)){if(!WD.tx[a.id]){WD.tx[a.id]=JSON.parse(JSON.stringify(a.x));WD.tx[a.id].rv=(WD.tx[a.id].rv||0)+1;WD.tx[a.id].rvS=WD.season;txReg(a.id);WD.txRev=(WD.txRev||0)+1}
   if(!P.includes(a.id)&&!d.tl[map][sd].includes(a.id))P.push(a.id)}}}catch(e){console.error('txPoolArc',e)}return P}}
// FAQ
{const _rf=renderFaq;renderFaq=function(){_rf();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 f.insertAdjacentHTML('beforeend',`<div class="tm"><h3>AI-holdenes taktiske personlighed</h3>${li([
  '<b>Stil:</b> hvert AI-hold har en stil ud fra startspillernes skills i forhold til ligaens gennemsnit – aggressiv (aim, reaktion, beslutsomhed), metodisk (spilforståelse, overblik, teamplay) eller passiv (tålmodighed, positionering, ro). Holdet foretrækker en smule taktikker i sin stil og bygger oftere nye i den. Stilen beregnes ved hver sæsonstart.',
  '<b>Innovatører og forfinere:</b> nogle hold prøver mange helt nye idéer og eksperimenterer også i knockoutkampe, andre forfiner det, der virker, med mutationer og kopier og kræver mere, før en ny taktik kommer ind. Trækket ændrer sig lidt fra sæson til sæson.',
  '<b>Pistol- og eco-runder:</b> AI-holdene vælger deres taktikker til pistol- og eco-runder ud fra, hvad der har virket i netop den slags runder. Den almindelige taktikstatistik tæller kun runder med fuldt køb.',
  '<b>Arkiv:</b> gode taktikker, der går af mode, gemmes. Holdene kan hente dem frem igen, når det modsvar, der fik dem til at forsvinde, ikke længere bruges meget.'])}</div>`)}}
