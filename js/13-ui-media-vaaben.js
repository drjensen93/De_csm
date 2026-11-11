/* ===== FASE 24: KAMPVISNING – stilling på én linje, menuen skjult under kampen ===== */
document.head.insertAdjacentHTML('beforeend',`<style>
#mv .hd{flex-direction:column;align-items:stretch;gap:4px}
#mv .lsb{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;font-weight:700;font-size:15px}
#mv .lsb .tn{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0}
#mv .lsb .tn:first-child{text-align:right}
#mv .lsb .lsc{font-size:22px;font-variant-numeric:tabular-nums;white-space:nowrap}
#mv #clk{display:flex;justify-content:center;align-items:baseline;gap:8px;font-size:17px;text-align:center}
#mv #clk small{display:inline}
.app.live .nav,.app.live #nx{display:none}
</style>`);
const liveOn=()=>VIEW==='mv'&&!!M&&!M.done&&!M.quiet;
function liveCls(){const a=document.querySelector('.app');if(a&&a.classList)a.classList.toggle('live',liveOn())}
{const _r=render;render=function(){_r();if(!M||!M.teams||M.teams.length<2)return;const A=M.teams[0],B=M.teams[1],c=t=>t.side==='CT'?'ct':'t';
 $('sc').innerHTML=`<div class="lsb"><span class="tn ${c(A)}" title="${A.name}">${A.name}</span><span class="lsc">${M.score[0]} – ${M.score[1]}</span><span class="tn ${c(B)}" title="${B.name}">${B.name}</span></div>`;const ck=$('clk');if(ck&&typeof ck.innerHTML==='string'){ck.innerHTML=ck.innerHTML.replace(' · bombe plantet','');ck.style.color=R&&R.planted&&!R.over?'var(--t)':''}// bomben plantet: uret bliver rødt
 liveCls()}}
{const _s=show;show=function(v){_s(v);liveCls()}}
/* holdene ved siden af hinanden, og stillingstabel (K/A/D) i pausen mellem runderne */
document.head.insertAdjacentHTML('beforeend',`<style>
#pl{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start}
#pl>.tm{min-width:0;margin-bottom:0}
#pl>#mrep{grid-column:1/-1}
#pl .tm h3{font-size:13px}
#pl .pr .eq{white-space:normal;line-height:1.2}
#pl .pr .pn b{overflow-wrap:anywhere}
#pl .kdt{grid-column:1/-1}
.kdt table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
.kdt th,.kdt td{padding:4px 6px;border-top:1px solid var(--bd);text-align:right;white-space:nowrap}
.kdt th:first-child,.kdt td:first-child{text-align:left;white-space:normal;overflow-wrap:anywhere}
.kdt thead th{color:var(--mu);font-weight:600;font-size:11.5px;border-top:0}
.kdt .th td{font-weight:700;border-top:2px solid var(--tx)}
</style>`);
function kdTable(title){const sb=t=>{const ps=t.ps.slice().sort((a,b)=>b.k-a.k||a.d-b.d||b.a-a.a),c=t.side==='CT'?'ct':'t';
 return `<tr class="th"><td class="${c}">${t.name}</td><td colspan="5">${M.score[t.i]}</td></tr>`+ps.map(p=>`<tr><td>${p.name}${p.igl?' <span class="mu">IGL</span>':''}</td><td>${p.k}</td><td>${p.a}</td><td>${p.d}</td><td>${p.k-p.d>0?'+':''}${p.k-p.d}</td><td>${p.d?(p.k/p.d).toFixed(2):p.k.toFixed(2)}</td></tr>`).join('')};
 return `<div class="tm kdt"><h3>${title||'Stilling efter runde '+M.round}</h3><table><thead><tr><th>Spiller</th><th>K</th><th>A</th><th>D</th><th>+/−</th><th>K/D</th></tr></thead><tbody>${sb(M.teams[0])}${sb(M.teams[1])}</tbody></table></div>`}
// stillingstabellen vises kun, når holdene skifter side (halvleg og i forlængelsen) og når kampen er slut. Pausen er så ca. 8 sek., ellers ca. 1,4 sek.
function swNext(r){return r===12||(r>=24&&(r-24)%3===0)}
{const _r=render;render=function(){_r();if(!M||M.quiet||!R)return;const pl=$('pl');if(!pl||typeof pl.innerHTML!=='string')return;
 if(!M.done&&R.over&&swNext(M.round))pl.innerHTML=kdTable(M.round===12?'Halvleg':'Sideskift efter runde '+M.round);
 else if(M.done){const rep=pl.querySelector&&pl.querySelector('#mrep');if(rep){const t=rep.querySelector('table.rpt');if(t)t.remove()}const cards=pl.querySelectorAll?[...pl.querySelectorAll(':scope > .tm:not(#mrep)')]:[];cards.forEach(c=>c.remove());pl.insertAdjacentHTML('afterbegin',kdTable('Slutstilling'))}}}
/* ===== FASE 25: TRANSFER – ingen kick-beskeder, spillere vist som i Hold-fanen ===== */
const KICKMSG=/har kicket|fri af økonomiske årsager/;
{const _n=news;news=function(txt,al){if(KICKMSG.test(txt))return;return _n(txt,al)}}
{const _rt=renderTransfer;renderTransfer=function(){try{const T=TMD();if(T&&T.news)T.news=T.news.filter(n=>!KICKMSG.test(n.txt))}catch(e){}_rt()}}
// spillerkort som i Hold-fanen: skills med limits, samlet med summen af limits, værdi og løn
function pCard(p){const S=fl(tot(p)),LS=p[14].reduce((a,b)=>a+b,0);
 return `<div class="mu" style="margin-bottom:6px">${p[13]} kampe · Personlighed: ${persN(p)} · Yndlingsvåben: ${WN[p[17]]} · Erfaring ${lvl(p[13],ET)}/5 · Ledelse ${lvl(p[12],LT)}/5 (${p[12]} IGL-kampe)</div><div class="sg">${SK.map((s,k)=>{const b=fl(p[SI[k]]);return `<div><div class="sl"><span>${s}</span><b>${b} <span class="mu">/${p[14][k]}</span></b></div>${sbar(b,0,p[14][k])}</div>`}).join('')}</div><div class="sl" style="margin-top:8px"><b>Samlet</b><b>${S} <span class="mu">/${LS}</span></b></div><div class="sb sb2"><i class="g" style="width:${LS/10}%"></i><i class="o" style="width:${S/10}%"></i></div>${valHTML(p,1)}`}
/* ===== FASE 26: TRÆNING – rapporten øverst, ingen rumoversigt ===== */
{const _rt=renderTrain;renderTrain=function(){_rt();const el=$('tr');if(!el||!el.querySelectorAll)return;
 const cards=[...el.querySelectorAll(':scope > .tm')],h3=c=>{const x=c.querySelector('h3');return x?x.textContent:''};
 cards.filter(c=>h3(c).startsWith('Træningsrum')).forEach(c=>c.remove());
 const rep=cards.find(c=>h3(c).startsWith('Træningsrapport')),hd=el.querySelector(':scope > .hd');if(rep&&hd)hd.after(rep)}}
/* ===== FASE 27: VIST SPILLERVÆRDI (lineær) ===== */
// Den viste værdi (Hold, Transfer, Ranking og power ranking) er lineær: VAL2.sk pr. skillpoint + VAL2.ex pr. erfaringsniveau + VAL2.ld pr. lederskabsniveau.
// Potentiale, alder og pensionsrisiko tæller ikke med. AI-holdene vurderer stadig transfers ud fra den fulde værdi (pVal) med potentiale.
const VAL2={sk:100,ex:4000,ld:10000};

// skills vægtes svagt efter deres betydning for at vinde (SW): vægt = 1 + VAL2.wt × (SW/gns. SW − 1)
VAL2.wt=.15;const SWm=SW.reduce((a,b)=>a+b,0)/SW.length,SKW=SW.map(w=>1+VAL2.wt*(w/SWm-1));
function wskSum(p){return SI.reduce((a,i,k)=>a+(p[i]||0)*SKW[k],0)}
function pVal2(p){return Math.round(VAL2.sk*wskSum(p)+VAL2.ex*flvl(p[13],ET)+VAL2.ld*flvl(p[12],LT))}
// taktikstatistik: kun de enkelte maps
{const _sh=statsHTML;statsHTML=function(){if(!MAPIDS.includes(TSV.map))TSV.map=MAPIDS.includes(TU.map)?TU.map:MAPIDS[0];return _sh()}}
/* FAQ */
{const _rfV=renderFaq;renderFaq=function(){_rfV();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Vist spillerværdi</h3>${li([`Værdien i Hold, Transfer, Ranking og power ranking er: ${kr(VAL2.sk)} pr. skillpoint (vægtet svagt efter skillens betydning: ${KS.map((k,i)=>SK[i]+' ×'+SKW[i].toFixed(2).replace('.',',')).join(', ')}) + ${kr(VAL2.ex)} pr. erfaringsniveau + ${kr(VAL2.ld)} pr. lederskabsniveau. Den stiger jævnt med hvert point.`,'Potentiale, alder og pensionsrisiko tæller ikke med i den viste værdi.','AI-holdene vurderer stadig køb og salg ud fra den fulde spillerværdi med potentiale (se Spillerværdi). Derfor kan et ungt talent koste mere end hans viste værdi.'])}</div>`)}}
/* ===== FASE 28: SCOUTS ===== */
// Et hold får kun tryouts med en scout. know (spillerkendskab 0-5): +1 til mindste limit pr. point · net (netværk 0-5): 1+net tryouts pr. sæson
// Løn: SCOUT.w ± SCOUT.wv pr. sæson (udbetales ugentligt med spillerlønnen). Kontrakten gælder én sæson. Ved sæsonstart: 3 nye tilbud + genansættelse af den nuværende
const SCOUT={w:1000,wv:.0571,n:3,first:2,span:45};
var SCK=0;// spillerkendskab for den tryout, der genereres lige nu
function mkScout(li){return{name:pickName(li),nat:li,know:ri(0,5),net:ri(0,5),w:Math.round(SCOUT.w*(1+(rnd()*2-1)*SCOUT.wv))}}
const scoutDays=sc=>{if(!sc)return[];const n=1+sc.net;return Array.from({length:n},(_,i)=>SCOUT.first+Math.round(i*SCOUT.span/n))};
// sæsonstart: kontrakterne udløber. Dit hold får tilbud, AI-holdene ansætter den bedste, de har råd til
function scoutSeason(keepMine){WD.scV=1;WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const d=t.def,k={li,ti},old=d.scout||null,offers=Array.from({length:SCOUT.n},()=>mkScout(li));
 if(isMe(k)){WD.scOffers={old,list:offers};if(!keepMine)d.scout=null;WD.tryNew=true;return}
 const c=(old?[old]:[]).concat(offers).sort((a,b)=>(b.know+b.net)-(a.know+a.net)||a.w-b.w);d.scout=null;
 for(const s of c){if(aiRoom(d,k,s.w)>=0){d.scout=s;break}}}))}
// tryouts på de dage, scouten finder en spiller
function scoutDay(){let any=false;WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const d=t.def,sc=d.scout;if(!sc||!scoutDays(sc).includes(WD.day))return;
 SCK=sc.know;let n;try{n=mkTry(li)}finally{SCK=0}any=true;
 if(isMe({li,ti})){WD.offer=n;WD.tryNew=true}else aiTryout(d,n)}));return any}
function scoutNext(){const sc=TEAMS[0].scout;if(!sc)return'Du har ingen scout, så du får ingen tryouts. Ansæt en scout herover.';const nx=scoutDays(sc).find(x=>x>WD.day);return nx==null?'Din scout finder ikke flere spillere i denne sæson.':`Din scout finder næste spiller dag ${nx+1}.`}
function hireScout(i){const O=WD.scOffers;if(!O)return;const s=i==='old'?O.old:O.list[+i];if(!s)return;TEAMS[0].scout=s;WD.scOffers=null;saveGame();renderTryout();renderNav()}
// nyt spil og gamle gemte spil
{const _nl=newLeague;newLeague=function(){const r=_nl.apply(this,arguments);try{scoutSeason()}catch(e){console.error(e)}saveGame();return r}}
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok&&!WD.scV)scoutSeason();return ok}}
// UI i Tryout-fanen
const scLine=s=>`<div class="sr"><span>Spillerkendskab</span><b>${s.know}/5 <span class="mu">(mindste limit ${70+s.know})</span></b></div><div class="sr"><span>Netværk</span><b>${s.net}/5 <span class="mu">(${1+s.net} tryout${s.net?'s':''} pr. sæson)</span></b></div><div class="sr"><span>Løn</span><b>${kr(s.w)} pr. sæson</b></div>`;
function scoutHTML(){const d=TEAMS[0],sc=d.scout,O=WD.scOffers;let h='';
 if(sc)h+=`<div class="tm"><h3>Din scout: ${flag(FLAGC[sc.nat])} ${sc.name}</h3><div class="spc">${scLine(sc)}</div><div class="mu">Tryout-dage i denne sæson: ${scoutDays(sc).map(x=>x+1).join(', ')}.</div></div>`;
 if(O){h+=`<div class="tm"><h3>Ansæt en scout</h3><div class="mu" style="margin-bottom:6px">Kontrakten gælder resten af sæsonen. Uden scout får holdet ingen tryouts. Scouten finder især spillere fra dit eget land.</div>`;
  if(O.old)h+=`<div class="spc"><div class="sh"><b>${flag(FLAGC[O.old.nat])} ${O.old.name}</b> <span class="mu">din scout sidste sæson</span></div>${scLine(O.old)}<button data-sc="old">Genansæt ${O.old.name}</button></div>`;
  h+=O.list.map((s,i)=>`<div class="spc"><div class="sh"><b>${flag(FLAGC[s.nat])} ${s.name}</b></div>${scLine(s)}<button data-sc="${i}">Ansæt ${s.name}</button></div>`).join('')+'</div>'}
 return h}
{const _rt=renderTryout;renderTryout=function(){_rt();const el=$('ty');if(!el||!el.querySelector)return;const hd=el.querySelector('.hd');if(hd)hd.insertAdjacentHTML('afterend',scoutHTML())}}
$('ty').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sc]');if(b)hireScout(b.dataset.sc)});
/* FAQ */
{const _rfSc=renderFaq;renderFaq=function(){_rfSc();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Scouts</h3>${li(['Et hold får kun tryouts, hvis det har en scout. Det gælder også AI-holdene.','<b>Spillerkendskab (0-5):</b> hvert point hæver den mindste limit for alle skills hos de spillere, scouten finder, med 1 (fra 70 til højst 75).','<b>Netværk (0-5):</b> scouten finder 1 + netværk spillere pr. sæson, fordelt jævnt over sæsonen.',`<b>Løn:</b> ca. ${kr(SCOUT.w)} pr. sæson (±${String(SCOUT.wv*100).replace('.',',')} %). Den udbetales ugentligt sammen med spillerlønnen og står under Løn.`,'<b>Kontrakt:</b> én sæson. Ved sæsonstart får du tre tilbud fra nye scouts, og har du en scout, kan du genansætte ham. Tilbuddene ligger i Tryout-fanen, til du vælger en.','85 % af de spillere, scouten finder, er fra dit eget land.','AI-holdene ansætter ved sæsonstart den bedste scout, de har råd til.'])}</div>`)}}
/* ===== FASE 29: HALL OF FAME – medaljetabel som tabel, uden sponsornavne ===== */
document.head.insertAdjacentHTML('beforeend',`<style>
.mdt{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums;table-layout:fixed}
.mdt th,.mdt td{padding:4px 2px;border-top:1px solid var(--bd);text-align:center}
.mdt thead th{border-top:0;font-weight:400}
.mdt th:first-child,.mdt td:first-child{text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.mdt col.m{width:34px}
.mdt td.z{color:var(--mu)}
</style>`);
const hofName=x=>{const n=String(x.n||''),i=n.indexOf(' - ');return i>0?n.slice(i+3):n};// sponsornavnet står før " - "
const hofLink=x=>{const y={...x,n:hofName(x)};return hfl(y)};
renderHof=function(){const H=(WD.hof||[]).slice().reverse(),M3=['🥇','🥈','🥉'];
 const row=(x,i)=>`<div class="sl" style="padding:3px 0"><span class="nm">${M3[i]} ${x?`<span class="${x.me?'me2':''}">${flag(FLAGC[x.li])} ${hofLink(x)}</span>`:'<span class="mu">Ingen bronzekamp spillet</span>'}</span></div>`;
 const cnt={};(WD.hof||[]).forEach(e=>e.t.forEach((x,i)=>{if(!x)return;const id=x.id||hofName(x),c=cnt[id]=cnt[id]||{li:x.li,id:x.id,me:x.me,m:[0,0,0]};c.n=x.n;c.me=c.me||x.me;c.m[i]++}));
 const tab=Object.values(cnt).sort((a,b)=>b.m[0]-a.m[0]||b.m[1]-a.m[1]||b.m[2]-a.m[2]).slice(0,10);
 const td=v=>`<td class="${v?'':'z'}">${v}</td>`;
 $('hf').innerHTML=`<div class="hd"><b>Hall of Fame</b><span class="mu">Champions League top 3</span></div>`+(H.length?
  (tab.length?`<div class="tm"><h3>Medaljetabel</h3><table class="mdt"><colgroup><col><col class="m"><col class="m"><col class="m"></colgroup><thead><tr><th></th><th>🥇</th><th>🥈</th><th>🥉</th></tr></thead><tbody>${tab.map(c=>`<tr><td><span class="${c.me?'me2':''}">${flag(FLAGC[c.li])} ${hofLink(c)}</span></td>${td(c.m[0])}${td(c.m[1])}${td(c.m[2])}</tr>`).join('')}</tbody></table></div>`:'')+
  H.map(e=>`<div class="tm"><h3>Sæson ${e.s}</h3>${e.t.map(row).join('')}</div>`).join('')
  :`<div class="tm"><div class="mu">Endnu ingen afsluttede sæsoner. Top 3 i Champions League skrives ind her ved hver sæsonslut.</div></div>`)};

/* FAQ: hver sektion kan foldes ud og ind. Åbn/luk alle øverst. */
{const _rfF=renderFaq;renderFaq=function(){_rfF();const f=$('fq');if(!f.querySelectorAll)return;
 f.querySelectorAll(':scope > .tm').forEach(tm=>{const h=tm.querySelector(':scope > h3');if(!h)return;const d=document.createElement('details');d.className='tm fqd';const sm=document.createElement('summary');sm.innerHTML=h.innerHTML;h.remove();d.appendChild(sm);const b=document.createElement('div');while(tm.firstChild)b.appendChild(tm.firstChild);d.appendChild(b);tm.replaceWith(d)});
 const hd=f.querySelector('.hd');if(hd)hd.insertAdjacentHTML('afterend','<div class="bar"><button data-fqa="1">Åbn alle</button><button data-fqa="0">Luk alle</button></div>')}}
$('fq').addEventListener('click',e=>{const b=e.target.closest('[data-fqa]');if(!b)return;$('fq').querySelectorAll('details.fqd').forEach(d=>d.open=b.dataset.fqa==='1')});


/* ===== MEDIA-RATING OG SPONSORER v2 ===== */
// Holdets media-rating (1-5) bestemmer, hvilke sponsorer der byder, og hvor meget tilbuddene er værd. Fordeles efter percentil hvert år ved sæsonstart.
// w = vægte (CL sidste sæson, landekoef. + ligaplacering sidste sæson, startfemmerens spillerværdi). Sæson 1: kun landekoef. og spillerværdi
// cum = målfordeling (kumuleret andel af alle hold) for 1-5 ★: 15 / 35 / 32 / 12 / 6 % · v0/v1 = lineup-værdi i forhold til gns., der giver 0 og fuld score
// glob = mindste rating for globale sponsorer · title = mindste rating for titelbonus · loy/loyMax = loyalitetsbonus pr. sæson i træk / loft · n = antal tilbud (lokal / global rating)
// rng = forventet sæsonværdi pr. rating i × WD.B0 (holdets placering inden for ratingen afgør hvor i spændet) · cHi/cLo = sponsorernes landefaktor for nr. 1 / nr. 24 på koefficientlisten
// star = tillæg pr. sponsorstjerne over 1 · fix = spænd for den faste ugeandel pr. rating
const MR={w:[.25,.45,.3],cum:[.15,.5,.82,.94,1],v0:.5,v1:1.5,glob:3,title:4,loy:.03,loyMax:.09,n:[4,5],
 rng:[[.45,.6],[.6,.8],[.8,1.05],[1.05,1.35],[1.35,1.75]],cHi:1.25,cLo:.85,star:.0125,fix:[[.6,.8],[.6,.8],[.45,.7],[.3,.6],[.3,.6]]};
const mrOf=d=>d.mr||1;
const kKey=k=>k.li+'|'+k.ti;
// CL-indsats: 0 = ikke med · 1 = tabt kval-semi · 2 = tabt kval-finale · 3 = gruppespil · 4 = 1/8 · 5 = kvart · 6 = tabt bronze · 6,5 = bronze · 7 = sølv · 8 = vinder
function clStages(){const S={},set=(k,v)=>{if(k&&(S[kKey(k)]||0)<v)S[kKey(k)]=v},los=m=>m&&m.res?(winK(m)===m.a?m.b:m.a):null;
 try{(WD.qual||[]).forEach(k=>set(k,1));(WD.qg||[]).forEach(g=>{if(g.fin){set(g.fin.a,2);set(g.fin.b,2)}});(WD.clTeams||[]).forEach(k=>set(k,3));(WD.seeds||[]).forEach(k=>set(k,4));
  const P=WD.po||[];(P[1]||[]).forEach(m=>{set(m.a,5);set(m.b,5)});
  const b=P[5]&&P[5][0];if(b&&b.res){set(los(b),6);set(winK(b),6.5)}
  const f=P[4]&&P[4][0];if(f&&f.res){set(los(f),7);set(winK(f),8)}}catch(e){console.error(e)}
 return S}
const CLSN=['ikke med','kvalifikation','kval-finale','gruppespil','1/8-finale','kvartfinale','semifinale','bronze','finale','vinder'];
const clLbl=s=>s>=8?'vinder':s>=7?'finale':s>=6.5?'bronze':s>=6?'semifinale':CLSN[s|0];
{const _se=seasonEnd;seasonEnd=function(){WD.clSt=clStages();WD.clStS=WD.season;return _se.apply(this,arguments)}}
const luVal=d=>line(d).reduce((a,p)=>a+pVal(p).tot,0);
// beregnes ved sæsonstart (dag 0). Alle hold rangeres på deres score, og ratingen tildeles efter målfordelingen MR.cum.
// Fra sæson 2 kan ratingen højst flytte sig ét trin pr. sæson. pp = holdets placering inden for sin rating (0-1), som bestemmer, hvor i spændet tilbuddene ligger
// free: første beregning efter det nye system (også i gamle gemte spil) må flytte mere end ét trin
function mrCompute(){if(WD.mrS===WD.season)return;WD.mrS=WD.season;const first=WD.season<2,free=first||WD.mrV!==3;WD.mrV=3;
 const all=[];WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>all.push({li,ti,t,v:luVal(t.def)})));
 const avg=all.reduce((a,x)=>a+x.v,0)/all.length||1,S=WD.clSt||{};
 all.forEach(x=>{const cs=first?0:S[x.li+'|'+x.ti]||0,cr=Math.max(0,WD.rank.indexOf(x.li)),lp=Math.max(0,(WD.prev[x.li]||[]).indexOf(x.ti)),ratio=x.v/avg;
  const c1=cs/8,c2=first?1-cr/23:.5*(1-cr/23)+.5*(1-lp/15),c3=cl((ratio-MR.v0)/(MR.v1-MR.v0),0,1);
  x.sc=first?(MR.w[1]*c2+MR.w[2]*c3)/(MR.w[1]+MR.w[2]):MR.w[0]*c1+MR.w[1]*c2+MR.w[2]*c3;x.b={cs,cr:cr+1,lp:lp+1,ratio,first}});
 const N=all.length;all.slice().sort((a,b)=>a.sc-b.sc).forEach((x,i)=>{const pct=(i+.5)/N;let tg=1;while(pct>MR.cum[tg-1])tg++;
  const d=x.t.def,r0=mrOf(d),r=free?tg:Math.max(r0-1,Math.min(r0+1,tg)),lo=r>1?MR.cum[r-2]:0,hi=MR.cum[r-1],pp=tg>r?1:tg<r?0:cl((pct-lo)/(hi-lo),0,1);
  d.mr=r;d.mrB=Object.assign(x.b,{sc:x.sc,tg,r0,pct,pp})})}
// alle lokale (1-2 ★) byder til alle hold · globale byder kun op til holdets rating, og kun fra rating 3
function spPool2(li,r){const L=SPN[li].map((n,i)=>({n,r:i%2?1:2,nat:li})),G=r>=MR.glob?GSP.filter(n=>GSPR[n]<=r).map(n=>({n,r:GSPR[n],nat:-1})):[];return L.concat(G)}
function spDraw2(li,pool,n){const pos=Math.max(0,WD.rank.indexOf(li)),gs=SPC.gTop-(SPC.gTop-SPC.gBot)*pos/23,out=[];pool=pool.slice();
 const one=c=>{const w=c.map(s=>s.nat<0?SPC.gW[s.r]:SPC.nW[s.r]);let x=rnd()*w.reduce((p,q)=>p+q,0),i=0;while(i<c.length-1&&x>=w[i]){x-=w[i];i++}return c[i]};
 while(out.length<n&&pool.length){const glob=rnd()<gs;let c=pool.filter(s=>(s.nat<0)===glob);if(!c.length)c=pool;const s=one(c);out.push(s);pool.splice(pool.indexOf(s),1)}
 // med global rating er mindst ét tilbud globalt
 if(pool.some(s=>s.nat<0)&&!out.some(s=>s.nat<0)&&out.length){const g=one(pool.filter(s=>s.nat<0)),j=out.findIndex(s=>s.nat>=0);if(j>=0)out[j]=g}
 return out}
const loyOf=d=>d.spL&&d.spL.n?Math.min(MR.loyMax,MR.loy*((d.spL.k||0)+1)):0;
// tilbuddets forventede sæsonværdi: ratingens spænd (placering pp inden for ratingen) × sponsorens landefaktor × stjernetillæg × loyalitet
// 1-2 ★: lokale variable dele med placeringsbonus for top 8 / top 12 · 3 ★: placeringsbonus for nr. 1 / top 3 · fra 4 ★ også titelbonus (liga og CL)
const spFac=li=>{const r=Math.max(0,WD.rank.indexOf(li));return MR.cHi-(MR.cHi-MR.cLo)*r/23};
mkOffer=function(s,loyal,li,d){const lp=loyal||0,r=d?mrOf(d):1,pp=d&&d.mrB&&d.mrB.pp!=null?d.mrB.pp:.5,R=MR.rng[r-1],L=li!=null?li:s.nat>=0?s.nat:WD.me.li;
 const B=(WD.B0||START_WAGE)*(R[0]+pp*(R[1]-R[0]))*spFac(L)*(1+MR.star*(s.r-1))*(1+lp),o={n:s.n,r:s.r,nat:s.nat,y:1,loyal:lp>0,loyP:lp,ev:B,c:{},v3:true};
 const FX=MR.fix[r-1],f=Math.round((FX[0]+rnd()*(FX[1]-FX[0]))*20)/20;
 const vars=r>=MR.title?['round','match','sign','place','title','youth']:r>=MR.glob?['round','match','sign','place','youth']:['round','match','sign','placeL','youth'];if(s.nat>=0)vars.push('natp','natp');
 const k=rnd()<.5?1:2,pick=[];while(pick.length<k){const v=pk(vars);if(!pick.includes(v))pick.push(v)}
 const a=(1-f)*(.4+rnd()*.2),sh=k===1?[1-f]:[a,1-f-a];
 let rest=B*f;pick.forEach((v,i)=>{let x=B*sh[i]/EVU[v](o);if(SPCAP[v]!=null)x=Math.min(x,SPCAP[v]*B*(.8+rnd()*.4));x=nice(x);o.c[v]=x;rest+=B*sh[i]-x*EVU[v](o)});
 o.c.week=nice(rest/7);return o};
function spOffers(li,t){const d=t.def,r=mrOf(d),pool=spPool2(li,r),n=r>=MR.glob?MR.n[1]:MR.n[0],L=d.spL&&pool.find(s=>s.n===d.spL.n),out=[];
 if(L)out.push(mkOffer(L,loyOf(d),li,d));
 spDraw2(li,pool.filter(s=>s!==L),n-out.length).forEach(s=>out.push(mkOffer(s,0,li,d)));return out}
sponsorSetup=function(){ensureGood();if(WD.day===0)setWages();if(WD.day===0)mrCompute();WD.needSp=false;
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{if(t.sp)return;const mine=li===WD.me.li&&ti===WD.me.ti,o=spOffers(li,t);
  if(mine){WD.offers=o;WD.needSp=true;WD.lastSp=null}else setSp(t,aiPickSp(g,t,o))}))};
// loyalitet: samme sponsor som sidste sæson tæller op, ellers starter den forfra
{const _s=setSp;setSp=function(t,o,mine){_s(t,o,mine);const d=t.def;if(!o)return;d.spL={n:o.n,k:o.loyal&&d.spL&&d.spL.n===o.n?(d.spL.k||0)+1:0}}}
{const _t=spTerms;spTerms=function(o){return _t(o).replace('+3 % loyalitetsbonus',`+${Math.round((o.loyP||.03)*100)} % loyalitetsbonus`)}}
const mrBox=()=>{const d=myT().def,r=mrOf(d),b=d.mrB,f=x=>Math.round(x*100),R=MR.rng[r-1],F=spFac(WD.me.li),B0=WD.B0||START_WAGE;
 let h=`<div class="tm"><div class="sl" style="font-size:13px;align-items:center;gap:8px"><b>Media-rating</b><span style="white-space:nowrap">${STAR(r)}</span></div>`;
 h+=`<div class="mu">${r>=MR.glob?`Globale sponsorer op til ${r} ★ kan byde. Du får ${MR.n[1]} tilbud.`:`Kun lokale sponsorer byder. Du får ${MR.n[0]} tilbud. Globale sponsorer kræver rating ${MR.glob}.`} ${r>=MR.title?'Tilbud kan have titelbonus.':`Titelbonus kræver rating ${MR.title}.`}</div>`;
 h+=`<div class="mu">Tilbud ved ${r} ★ i ${COUNTRIES[WD.me.li][0]}: ca. ${kr(Math.round(B0*R[0]*F/100)*100)}–${kr(Math.round(B0*R[1]*F/100)*100)} pr. sæson${b&&b.pp!=null?`, dine ca. ${kr(Math.round(B0*(R[0]+b.pp*(R[1]-R[0]))*F/100)*100)}`:''} (+0–5 % for sponsorens stjerner).</div>`;
 if(b){const rows=[];if(!b.first)rows.push(['CL sidste sæson',clLbl(b.cs)]);rows.push(['Landekoefficient',`nr. ${b.cr} af 24`]);if(!b.first)rows.push(['Ligaplacering sidste sæson',`nr. ${b.lp}`]);
  rows.push(['Lineup-værdi',`${f(b.ratio)} % af gns.`],['Score',`${f(b.sc)}/100`],['Placering blandt alle hold',b.pct!=null?`top ${Math.max(1,f(1-b.pct))} % (mål ${b.tg} ★)`:`mål ${b.tg} ★`]);
  if(b.r0!==r&&!b.first)rows.push(['Ændring',`${b.r0} ★ → ${r} ★`]);if(b.tg!==r&&!b.first)rows.push(['Begrænsning','højst ét trin pr. sæson']);
  h+=`<div class="spc">${rows.map(([a,v])=>`<div class="sr"><span>${a}</span><b>${v}</b></div>`).join('')}</div>`}
 return h+'</div>'};
{const _r=renderSponsor;renderSponsor=function(){_r();const s=$('sp');if(s&&typeof s.innerHTML==='string'){const i=s.innerHTML.indexOf('</div>');if(i>=0)s.innerHTML=s.innerHTML.slice(0,i+6)+mrBox()+s.innerHTML.slice(i+6)}}}

/* migrering: Mid-push til B er erstattet af Connector-cut til B */
{const _lgM=loadGame;loadGame=function(){const ok=_lgM();if(ok)for(const m in MGR)for(const sd in MGR[m])for(const b in MGR[m][sd])MGR[m][sd][b]=MGR[m][sd][b].map(n=>n==='Mid-push til B'?'Connector-cut til B':n);return ok}}
/* ===== FASE 30: ERFARING & LEDERSKAB SOM NIVEAUBARER + SKILLS PÅ AI-HOLD ===== */
// 5 firkanter pr. bar. Hver firkant har sin egen blå nuance: lys blå (niveau 1) → azurblå (niveau 5)
const LVC=['#bfe0ff','#93caff','#66b3ff','#3399ff','#007fff'];
(()=>{const s=document.createElement('style');s.textContent='.lvg{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin:2px 0 8px}.lvb{display:flex;gap:3px;margin-top:2px}.lvb i{flex:1;height:10px;border:1px solid #000;background:#fff}';document.head.appendChild(s)})();
const lvBar=n=>`<div class="lvb">${LVC.map((c,k)=>`<i style="${k<n?`background:${c}`:''}"></i>`).join('')}</div>`;
function lvHTML(p){const e=lvl(p[13],ET),l=lvl(p[12],LT);
 return `<div class="lvg"><div><div class="sl"><span>Erfaring <span class="mu">${p[13]} kampe</span></span><b>${e}/5</b></div>${lvBar(e)}</div><div><div class="sl"><span>Lederskab <span class="mu">${p[12]} IGL</span></span><b>${l}/5</b></div>${lvBar(l)}</div></div>`}
const LVRX=/ · Erfaring \d\/5 · Ledelse \d\/5 \(\d+ IGL-kampe\)/;
// fjerner tekstversionen i et kort og sætter barerne ind lige under linjen
function lvSwap(root,pl){if(!root||!root.querySelectorAll)return;const ms=[...root.querySelectorAll('.mu')].filter(m=>LVRX.test(m.innerHTML));ms.forEach((m,j)=>{const p=pl[j];if(!p)return;m.innerHTML=m.innerHTML.replace(LVRX,'');m.insertAdjacentHTML('afterend',lvHTML(p))})}
// Hold-fanen
{const _r=renderOverview;renderOverview=function(){_r();lvSwap($('ov'),TEAMS[0].pl)}}
// Transfer-fanen (spillerkortet)
{const _pc=pCard;pCard=function(p){const h=_pc(p),i=h.indexOf('</div>');return h.slice(0,i).replace(LVRX,'')+'</div>'+lvHTML(p)+h.slice(i+6)}}
// AI-hold: skillbarer, erfaring og lederskab under hver spiller
{const _r=renderHV;renderHV=function(){_r();if(!HV)return;const t=WD.lg[HV.li].teams[HV.ti],rs=$('hv').querySelectorAll('.hvr');
 t.def.pl.forEach((p,j)=>{const r=rs[j];if(!r)return;const S=fl(tot(p)),LS=p[14].reduce((a,b)=>a+b,0);
  r.insertAdjacentHTML('beforeend',`<div style="margin-top:6px">${lvHTML(p)}<div class="sg">${SK.map((s,k)=>{const b=fl(p[SI[k]]);return `<div><div class="sl"><span>${s}</span><b>${b} <span class="mu">/${p[14][k]}</span></b></div>${sbar(b,0,p[14][k])}</div>`}).join('')}</div><div class="sl" style="margin-top:8px"><b>Samlet</b><b>${S} <span class="mu">/${LS}</span></b></div><div class="sb sb2"><i class="g" style="width:${LS/10}%"></i><i class="o" style="width:${S/10}%"></i></div></div>`)})}}

/* ===== FASE 31: VÅBEN – købsindstillinger for pistol- og eco-runder, AI-køb, yndlingsvåben ===== */
// købsindstilling pr. spiller: pistol/eco = rækkefølge af ting, keep = beløb der beholdes til næste runde i eco
const BITEMS=['deagle','kevlar','helm','he'],BIN={deagle:'Deagle',kevlar:'Kevlar',helm:'Hjelm',he:'HE'},BKEEP=[0,1000,2000,3000,4000,5000];
const bsD=()=>({pistol:['kevlar','he'],eco:[],keep:0});
const bsGet=(d,n)=>(d.buyS&&d.buyS[n])||bsD();
// AI: ecq afgør. dyn = køber kevlar i eco, når modstanderen også er fattig · keep 'full' = præcis nok til fuldt køb næste runde
function aiBuyS(d,t){const q=ecq(d),ps={},sc=p=>p.aim+(p.fav==='deagle'||p.spec==='pist'?8:0),by=t.ps.slice().sort((a,b)=>sc(b)-sc(a));
 const C=[['kevlar','he'],['kevlar'],['he'],['kevlar','helm'],['deagle'],['deagle','he'],[]];
 if(q>=QG.good)by.forEach((p,k)=>ps[p.name]={pistol:['kevlar','he'],eco:k<2?['deagle']:[],keep:'full',dyn:k>=2});
 else if(q>=QG.mid){const nd=ri(0,2),np=rnd()<.3?1:0;by.forEach((p,k)=>ps[p.name]={pistol:k<np?['deagle']:C[ri(0,3)],eco:k<nd?['deagle']:[],keep:[1000,2000,3000][ri(0,2)]})}
 else by.forEach(p=>ps[p.name]={pistol:C[ri(0,C.length-1)],eco:C[ri(0,C.length-1)],keep:rnd()<.5?0:1000});
 return{ps}}
function bsOf(t,p){if(!M||!M.defs)return null;const d=M.defs[t.i];if(!d)return null;if(d===TEAMS[0])return bsGet(d,p.name);
 if(!t.bs)t.bs=aiBuyS(d,t);return t.bs.ps[p.name]||bsD()}
function bsKeep(t,p,s){if(s.keep!=='full')return s.keep||0;const full=PRICE[SIDEW[t.side].R1]+PRICE.kevlar+PRICE.helm,lb=ECON_R.loss[Math.min(ECON_R.loss.length-1,t.ls||0)];return Math.max(0,full-lb)}
function oppPoor(t){const o=M.teams.find(x=>x!==t);if(!o)return false;return o.ps.reduce((a,p)=>a+p.money+(p.gun?PRICE[p.gun.type]||0:0),0)/o.ps.length<3000}
// gamle yndlingsvåben (kategorier) → bestemt våben
function favWalk(root){const st=[root],seen=new Set();while(st.length){const o=st.pop();if(!o||typeof o!=='object'||seen.has(o))continue;seen.add(o);
 if(Array.isArray(o)){if(o.length>=18&&typeof o[0]==='string'&&typeof o[1]==='number'&&(o[17]==='rifle'||o[17]==='pistol'))o[17]=favMig(o[17]);for(const x of o)if(x&&typeof x==='object')st.push(x)}
 else for(const k in o){const x=o[k];if(x&&typeof x==='object')st.push(x)}}}
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok){try{favWalk(WD)}catch(e){}}return ok}}
{const _nm=newMatch;newMatch=function(defs,quiet,noDraw,map){try{favWalk(defs)}catch(e){}return _nm(defs,quiet,noDraw,map)}}
// Taktik-fanen: købsindstilling pr. lineup-spiller
let BSO=null;
{const _rt=renderTactics;renderTactics=function(){_rt();if(typeof TSV!=='undefined'&&TSV.on)return;const el=$('tv');if(!el||!el.querySelector)return;const c=el.querySelector('.tm.rl');if(!c||!c.insertAdjacentHTML)return;
 const d=TEAMS[0],L=line(d),fm=a=>a&&a.length?a.map(x=>BIN[x]).join(' → '):'intet';
 const btn=(n,k,it,a)=>{const i=a.indexOf(it);return `<button class="${i>=0?'on':''}" data-bb="t|${k}|${it}|${encodeURIComponent(n)}">${i>=0?(i+1)+'. ':''}${BIN[it]}<small>$${PRICE[it]}</small></button>`};
 let h=`<div class="tm" id="bsx"><h3>Køb i pistol- og eco-runder</h3>`;
 h+=L.map(p=>{const n=p[0],s=bsGet(d,n),op=BSO===n;
  let r=`<div class="bsr" data-bb="o|${encodeURIComponent(n)}"><div class="bsn"><b>${n}</b> <span class="mu">${op?'▴':'▾'}</span></div><div class="mu">Pistol: ${fm(s.pistol)} · Eco: ${fm(s.eco)}${s.keep?' · behold $'+s.keep.toLocaleString('da-DK'):''}</div></div>`;
  if(op)r+=`<div class="bse"><div class="mu">Pistolrunde ($800)</div><div class="bar bsb">${BITEMS.map(it=>btn(n,'pistol',it,s.pistol)).join('')}</div>
   <div class="mu">Eco-runde</div><div class="bar bsb">${BITEMS.map(it=>btn(n,'eco',it,s.eco)).join('')}</div>
   <div class="sl" style="align-items:center;gap:8px;margin:4px 0"><span>Behold mindst</span><select data-bk="${encodeURIComponent(n)}">${BKEEP.map(v=>`<option value="${v}" ${(s.keep||0)===v?'selected':''}>$${v.toLocaleString('da-DK')}</option>`).join('')}</select></div>
   <button data-bb="a||-|${encodeURIComponent(n)}" style="width:100%;padding:6px">Brug for hele lineup'en</button></div>`;
  return r}).join('');
 c.insertAdjacentHTML('afterend',h+'</div>')}}
document.head.insertAdjacentHTML('beforeend',`<style>
#bsx .bsr{border-top:1px solid var(--bd);padding:7px 0;cursor:pointer}#bsx .bsr .mu{font-size:12px}
#bsx .bse{padding:2px 0 8px}#bsx .bsb{flex-wrap:wrap;gap:4px;margin:3px 0 6px}#bsx .bsb{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}#bsx .bsb button{padding:5px 2px;min-width:0;font-size:13px;line-height:1.2;white-space:nowrap}#bsx .bsb small{display:block;opacity:.7;font-size:11px;font-weight:400}
</style>`);
$('tv').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-bb]');if(!b)return;e.stopImmediatePropagation();
 const[a,k,it,nE]=b.dataset.bb.split('|'),d=TEAMS[0];
 if(a==='o'){const n=decodeURIComponent(k);BSO=BSO===n?null:n;renderTactics();return}
 const n=decodeURIComponent(nE);d.buyS=d.buyS||{};const s=d.buyS[n]=d.buyS[n]||bsD();
 if(a==='t'){const L=s[k],i=L.indexOf(it);if(i>=0)L.splice(i,1);else L.push(it)}
 else if(a==='a')line(d).forEach(p=>{if(p[0]!==n)d.buyS[p[0]]=JSON.parse(JSON.stringify(s))});
 try{saveGame()}catch(x){}renderTactics()},true);
$('tv').addEventListener('change',e=>{const sl=e.target;if(!sl.dataset||!sl.dataset.bk)return;e.stopImmediatePropagation();const d=TEAMS[0],n=decodeURIComponent(sl.dataset.bk);d.buyS=d.buyS||{};const s=d.buyS[n]=d.buyS[n]||bsD();s.keep=+sl.value||0;try{saveGame()}catch(x){}renderTactics()},true);
