/* ===== FASE 13: POWER RANKING OG RANKING-MENU ===== */
// Power ranking = samlet spillerværdi (pVal) af holdets startende lineup (5 spillere). Ingen andre faktorer.
// Opdateres mandag i uge 1, 3, 5 og 7 (dag 0, 14, 28, 42). Lige værdi: forrige placering afgør.
// WD.pr = {s: sæson, d: dag, v: lineup-værdi, r: placering, p: forrige placering (null ved første ranking)}. Index = li*16+ti.
const PR_DAYS=[0,14,28,42],PRN=16,prIx=(li,ti)=>li*PRN+ti;
function computePR(){const v=[],ks=[];
 WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const k=prIx(li,ti);v[k]=Math.round(line(t.def).reduce((a,p)=>a+pVal2(p),0));ks.push(k)}));
 const o=WD.pr,r=[];ks.sort((a,b)=>v[b]-v[a]||(o?o.r[a]-o.r[b]:a-b)).forEach((k,i)=>r[k]=i+1);
 WD.pr={s:WD.season,d:WD.day,v,r,p:o?o.r.slice():null}}
/* pixelpile: 7×7 form med mørk kant (9×9), 1 pixel = 2 CSS-px */
const PRA=(()=>{const up=['...x...','..xxx..','.xxxxx.','xxxxxxx','..xxx..','..xxx..','..xxx..'],n=up.length;
 const rot=g=>g.map((_,r)=>g.map(row=>row[r]).reverse().join(''));// 90° med uret
 const mk=(g,c,o)=>{const on=(x,y)=>x>=1&&y>=1&&x<=n&&y<=n&&g[y-1][x-1]==='x';let s='';
  for(let y=0;y<n+2;y++)for(let x=0;x<n+2;x++){const f=on(x,y)?c:(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1))?o:null;if(f)s+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${f}"/>`}
  return s};
 return{up:mk(up,'#22b35a','#12723a'),dn:mk(up.slice().reverse(),'#d4352b','#8a1e17'),eq:mk(rot(up),'#f5c518','#a86a00')}})();
function prMove(k){const P=WD.pr;if(!P||!P.p||!P.p[k])return null;const a=P.p[k],b=P.r[k];return b<a?'up':b>a?'dn':'eq'}
function prArrow(k){const m=prMove(k);if(!m)return'';const a=WD.pr.p[k],t=m==='up'?`Steget fra nr. ${a}`:m==='dn'?`Faldet fra nr. ${a}`:'Uændret';
 return `<svg class="px" viewBox="0 0 9 9" width="18" height="18" shape-rendering="crispEdges" style="flex:none"><title>${t}</title>${PRA[m]}</svg>`}
const prWk=P=>Math.floor(P.d/7)+1;
function prNext(){const n=PR_DAYS.find(x=>x>WD.day);return n==null?'mandag i uge 1 næste sæson':`mandag i uge ${n/7+1}`}
/* holdsider: placering + pil */
function prBox(li,ti){const P=WD.pr;if(!P)return'';const k=prIx(li,ti),m=prMove(k),a=P.p&&P.p[k];
 const txt=!m?'Første ranking':m==='up'?`Op fra nr. ${a}`:m==='dn'?`Ned fra nr. ${a}`:'Uændret siden sidst';
 return `<div class="tm"><div class="sl" style="font-size:13px;align-items:center;gap:8px"><b>Power ranking</b><b class="rka">${prArrow(k)}nr. ${P.r[k]} af ${P.v.length}</b></div><div class="mu">${txt} · lineup-værdi ${kr(P.v[k])} · opdateret sæson ${P.s}, uge ${prWk(P)}</div></div>`}
{const _r=renderHV;renderHV=function(){_r();if(!HV)return;const h=$('hv').querySelector('.hd');if(h)h.insertAdjacentHTML('afterend',prBox(HV.li,HV.ti))}}
{const _r=renderOverview;renderOverview=function(){_r();const h=$('ov').querySelector('.hd');if(h)h.insertAdjacentHTML('afterend',prBox(WD.me.li,WD.me.ti))}}
/* Ranking-menu: Power ranking og Landekoef. */
VT.rk='Ranking';
{const _sh=show;show=function(v){_sh(v);$('rk').style.display=v==='rk'?'':'none'}}
function showRank(){show('rk');renderRank();window.scrollTo(0,0)}
function prHTML(){const P=WD.pr;if(!P)return `<div class="tm"><div class="mu">Ingen ranking endnu.</div></div>`;
 const f=WD.prf==null?'all':String(WD.prf),ord=WD.lg.map((x,i)=>i).sort((a,b)=>WD.lg[a].c.localeCompare(WD.lg[b].c,'da'));
 let L=[];WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>L.push({li,ti,t,k:prIx(li,ti)})));
 if(f!=='all')L=L.filter(x=>x.li===+f);L.sort((a,b)=>P.r[a.k]-P.r[b.k]);
 let h=`<div class="tm"><select data-pf="1"><option value="all" ${f==='all'?'selected':''}>Alle lande</option>${ord.map(i=>`<option value="${i}" ${f===String(i)?'selected':''}>${WD.lg[i].c}</option>`).join('')}</select><div class="mu" style="margin-top:6px">Samlet spillerværdi af den startende lineup. Opdateret sæson ${P.s}, uge ${prWk(P)}. Næste opdatering ${prNext()}.</div><label class="mu" style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" data-prv="1" ${WD.prHide?'':'checked'}> Vis lineup-værdi</label></div>`;
 h+=`<div class="tm rkl${WD.prHide?' nv':''}"><h3>Power ranking${f==='all'?'':' – '+WD.lg[+f].c}</h3><div class="r eq"><div>#</div><div></div><div>Hold</div>${WD.prHide?'':'<div class="v">Lineup-værdi</div>'}</div>`+
  L.map(x=>`<div class="r ${isMe(x)?'me':''}"><div>${P.r[x.k]}</div><div class="ar">${prArrow(x.k)}</div><div class="nm" title="${x.t.name}">${flag(FLAGC[x.li])} ${tl(x.li,x.ti,x.t.def.name)}</div>${WD.prHide?'':`<div class="v">${kr(P.v[x.k])}</div>`}</div>`).join('')+
  `<div class="eq" style="padding-top:6px;white-space:normal">Pilen viser ændringen siden sidste opdatering. Placeringen er altid den globale blandt alle ${P.v.length} hold.</div></div>`;
 return h}
// Top 100: de mest værdifulde spillere i alle ligaer (startere og bænk), med aktuelle værdier og holdet, de spiller på
const TOPN=100;
function topHTML(){const A=[];WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>t.def.pl.forEach(p=>A.push({p,li,ti,t,v:pVal2(p)}))));
 A.sort((a,b)=>b.v-a.v);const L=A.slice(0,TOPN),mine=L.filter(x=>isMe(x)).length;
 return `<div class="tm"><div class="mu">De ${TOPN} mest værdifulde spillere i alle 24 ligaer, både startere og bænkspillere. Værdierne er aktuelle. Tryk på et hold for at se det.${mine?` Du har ${mine} spiller${mine>1?'e':''} på listen.`:''}</div></div>`+
 `<div class="tm"><h3>Top ${TOPN} spillere</h3>`+L.map((x,i)=>`<div class="hvr tpr ${isMe(x)?'me':''}"><div class="tn">${i+1}</div><div class="nm">${flag(FLAGC[x.p[11]])} <b>${x.p[0]}</b> <span class="mu">${x.p[9]} år${x.p[15]<0?' · bænk':''}</span></div><b class="v">${kr(x.v)}</b><div class="nm mu tt">${flag(FLAGC[x.li])} ${tl(x.li,x.ti,x.t.name)}</div></div>`).join('')+'</div>'}
function renderRank(){const t=['coef','top'].includes(WD.rktab)?WD.rktab:'pr',seg=(v,l)=>`<button class="${t===v?'on':''}" data-rt="${v}">${l}</button>`;
 $('rk').innerHTML=`<div class="hd"><b>Ranking</b><span class="mu">Sæson ${WD.season}</span></div><div class="bar sm">${seg('pr','Power rank')}${seg('top','Top 100')}${seg('coef','Landekoef.')}</div>`+(t==='coef'?coefHTML():t==='top'?topHTML():prHTML())}
$('rk').addEventListener('click',e=>{const b=e.target.closest('[data-rt]');if(!b)return;WD.rktab=b.dataset.rt;renderRank()});
$('rk').addEventListener('change',e=>{if(e.target.dataset.pf){WD.prf=e.target.value==='all'?null:+e.target.value;renderRank()}if(e.target.dataset.prv){WD.prHide=!e.target.checked;renderRank();saveGame()}});
/* nav: Rank-knap efter CL */
{const _rn=renderNav;renderNav=function(){_rn();const n=$('nav'),c=n.querySelector('[data-v="cl"]');if(c&&!n.querySelector('[data-v="rk"]'))c.insertAdjacentHTML('afterend',`<button class="${VIEW==='rk'?'on':''}" data-v="rk">Rank</button>`)}}
{const _nc=$('nav').onclick;$('nav').onclick=e=>{const b=e.target.closest('[data-v]');if(b&&b.dataset.v==='rk')return showRank();_nc(e)}}
/* Tilbage fra et hold åbnet i Ranking */
$('hv').addEventListener('click',e=>{if(e.target.closest('[data-hb]')&&HV&&HV.from==='rk'){e.stopImmediatePropagation();showRank()}},true);
/* opdatering hver 2. uge */
{const _e=endDay;endDay=function(){_e();if(WD.over)return;
 if(PR_DAYS.includes(WD.day)&&!(WD.pr&&WD.pr.s===WD.season&&WD.pr.d===WD.day)){computePR();saveGame();if(VIEW==='hv')renderHV();if(VIEW==='ov')renderOverview()}
 if(VIEW==='rk')renderRank()}}
{const _nl=newLeague;newLeague=function(){_nl();WD.pr=null;computePR();saveGame()}}
/* CL-pladser i sæson 1: der er ingen forrige sæson, så holdene i hvert land ordnes efter power ranking.
 Den direkte plads (og derefter kvalifikationspladserne) går til de højest rankede hold i landet. Dit hold kan stadig ikke starte i CL. */
function prSeed(){if(WD.season!==1||WD.day!==0||!WD.pr)return;
 WD.prev=WD.lg.map((g,li)=>g.teams.map((t,ti)=>ti).sort((a,b)=>WD.pr.r[prIx(li,a)]-WD.pr.r[prIx(li,b)]));allocate();WD.prSeed=true}
{const _nl=newLeague;newLeague=function(){_nl();prSeed();saveGame()}}
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok&&!WD.prSeed)prSeed();return ok}}
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok&&!WD.pr)computePR();return ok}}
/* gem: decimaltal afrundes til 2 decimaler, og en fejlet gemning giver en advarsel */
const r2=v=>Math.round(v*100)/100;
/* Kompakt format for 2D-punkter i gemningen: "t.cx.cy.dir.at.sw,…;…" (én rute pr. position) */
function r2Enc(r){return r.map(w=>w.map(p=>p.map(v=>v==null?'':v).join('.')).join(',')).join(';')}
function r2Dec(s){return s.split(';').map(w=>w?w.split(',').map(p=>p.split('.').map(v=>v===''?null:+v)):[])}
function r2Rev(k,v){return k==='r2'&&typeof v==='string'?r2Dec(v):v}
saveGame=function(){let ok=false;
 try{const z=svPack(JSON.stringify({WD,PN,NU:[...NU],ECON,order:MGR},(k,v)=>k==='snap'||k==='wsnap'?undefined:k==='r2'&&Array.isArray(v)?r2Enc(v):typeof v==='number'&&!Number.isInteger(v)?r2(v):v));localStorage.setItem(SAVE_KEY,z);SVN=z.length;ok=true}catch(e){}
 saveWarn(ok);if(ok)svWarn();return ok};
function saveWarn(ok){const el=$('svw');if(ok){if(el)el.remove();return}
 if(!el)$('ttl').parentNode.insertAdjacentHTML('afterend',`<div id="svw" class="tm" style="border-color:#d4352b;background:#fdecea;color:#d4352b;font-weight:700">Spillet kunne ikke gemmes. Browserens lager er fuldt eller blokeret, så fremskridt siden sidste gemning går tabt, hvis siden lukkes.</div>`)}
/* FAQ */
{const _rf5=renderFaq;renderFaq=function(){_rf5();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Power ranking</h3>${li(['Alle hold rangeres efter den samlede spillerværdi af deres startende lineup (de 5 spillere, der starter). Bænkspillere tæller ikke.','Rankingen opdateres mandag i uge 1, 3, 5 og 7. Er to hold lige, afgør den forrige placering.',`Pilen viser ændringen siden sidste opdatering: ${'<span class="rka">'}grøn op, rød ned og gul ved uændret placering</span>. Ved den første ranking vises ingen pil.`,'Ranking-fanen har også landekoefficienterne, som stadig bruges til CL-pladser, seedning, sponsorer og indtægter.'])}</div>`)}}

/* ===== FASE 14: TEAMPLAY (10. SKILL) OG AI'S TAKTISKE EVNE ===== */
// gemte spil fra før Teamplay: limit trækkes som de andre skills (70-100), værdien = gns. af spillerens 9 skills ±5 (inden for limit)
function migTeam(p){if(!p||p[30]>=0)return;const l=p[14];while(l.length<NSK)l.push(ri(70,100));let s=0;for(let i=0;i<9;i++)s+=skVal(p[SI[i]]||0);
 p[30]=Math.round(cl(100+VAL.dbl*Math.log2(s/9/VAL.top)+ri(-5,5),0,l[9])*10)/10}// gennemsnittet tages i værdi (ikke point), så spillerens værdi og løn er uændret
// AI: taktisk evne (tcq), uafhængig af holdstyring (mq) og økonomi (ecq). Samme grænser (QG): dårlig < 0,6 ≤ middel < 0,8 ≤ god
// Dårlig: alle mappets taktikker i tilfældig rækkefølge (som før). Middel/god: de MAXSEL bedste pr. side og købstype, scoret ud fra map og spillere.
// Listen lægges før kampen og ligger fast hele kampen; kun IGL'ens gentagelse af en vindende taktik reagerer undervejs.
const TCQ=[.4,1];
const tcq=d=>d.tcq!=null?d.tcq:(d.tcq=TCQ[0]+rnd()*(TCQ[1]-TCQ[0]));
// de 0-3 hold pr. land, der er gode til holdstyring og økonomi, er også gode til taktik
function goodTac(ai){ai.forEach(t=>{const d=t.def;if(mq(d)>=QG.good&&ecq(d)>=QG.good&&tcq(d)<QG.good)d.tcq=QG.good+rnd()*(1-QG.good)})}
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok&&!WD.tcqSet){WD.lg.forEach((g,li)=>goodTac(g.teams.filter((t,ti)=>!isMe({li,ti}))));WD.tcqSet=true}return ok}}
// PM = målt CT-sejrsprocent i fuldt købte runder pr. map for hvert par (T-taktik × CT-taktik), i rækkefølgen fra mappets taktikliste (MAPS[id].tn). Målt med blandet IGL-lederskab (0-5): PM[map][T-index][CT-index]
const PM={
 csm:[[64,49,42,69,26,37,37,42,21,59],[19,61,63,33,28,44,65,56,32,40],[61,55,62,32,36,56,56,49,43,40],[74,79,39,63,42,58,70,67,64,56],[71,48,49,88,52,48,65,51,38,57],[38,72,80,39,51,47,66,44,44,34],[51,50,36,68,47,57,37,36,26,58],[51,79,76,48,45,70,73,52,54,53],[72,61,35,56,32,49,53,53,41,55],[67,65,47,39,33,60,53,48,42,38]],
 dust2:[[33,49,24,26,13,37,54,50,34,53],[34,38,70,34,40,52,58,33,30,39],[54,54,77,37,60,67,41,42,33,42],[47,60,32,53,45,48,58,60,24,56],[41,34,40,86,58,51,65,65,45,61],[36,20,87,31,62,59,65,38,29,43],[44,54,37,82,48,56,75,74,40,60],[50,79,79,57,73,72,54,41,48,61],[62,77,31,44,31,41,54,57,37,56],[68,75,60,40,54,61,40,44,38,46],[66,77,45,37,38,52,36,39,34,51],[43,60,64,74,52,42,41,30,44,52]],
 aztec:[[69,30,35,24,20,20,36,43,29,41],[44,63,79,51,44,35,74,33,31,52],[67,85,72,47,65,51,73,50,52,53],[81,66,44,60,27,45,55,62,17,48],[78,59,50,88,63,60,72,66,46,54],[46,75,86,59,70,48,81,45,59,65],[86,50,42,65,28,64,45,65,14,46],[43,61,79,60,70,56,83,38,52,68],[84,83,43,59,27,72,51,67,32,44],[56,84,72,53,58,49,73,43,51,53]],
 inferno:[[56,53,20,67,15,56,48,33,30,45,43],[10,35,62,28,37,41,17,31,62,16,13],[65,75,69,34,41,50,68,45,65,27,32],[68,70,25,62,32,60,69,35,30,52,34],[61,71,21,88,47,68,52,37,26,65,49],[24,48,84,33,57,62,33,52,72,19,14],[74,61,25,79,31,54,74,33,38,41,33],[48,74,81,51,62,61,50,71,78,36,39],[77,81,19,50,13,56,77,38,33,54,48],[68,78,60,30,32,44,69,41,61,30,33],[61,44,22,75,40,57,59,53,24,40,50],[74,57,16,54,22,32,63,31,24,67,46]]};
// spillerprofil: holdets gns. i stilens skills minus gns. i alle skills (×pf). Stakkede taktikker får også Teamplay-afvigelsen (×st).
// kw = hvor meget modstanderens taktikliste vægter (god / middel) · støj på scoren = nz × (1 − evne + n0)
const TAI={pf:.5,st:.3,nz:.4,n0:.5,kw:[1,.5]};
const TPROF={A:['aim','quick','det'],M:['iq','aware','team'],P:['pat','pos','calm']},TSTACK=new Set(['A-rush','B-rush','Rush via A','Rush via B','4B-1A','4A-1B','Retake']);
// forventet rundesejr for taktik n på siden sd mod en liste af modstanderens taktikker (tom liste = alle mappets taktikker lige ofte)
// PMP = som PM, men målt i pistolrunder (250 runder pr. par, tilfældige AI-hold med deres egne pistolkøb). Bruges, når AI'en vælger pistoltaktikker
const PMP={csm:[[44,5,12,42,11,25,27,23,12,25],[0,44,36,18,13,34,13,5,10,13],[48,24,44,11,16,14,42,36,25,16],[70,70,14,36,16,25,64,60,55,26],[52,6,14,81,31,32,40,46,18,26],[6,59,57,4,20,20,23,11,24,11],[17,6,9,51,20,30,13,10,10,28],[15,64,61,8,21,26,37,18,34,25],[63,5,13,34,8,22,32,33,19,31],[53,43,33,14,11,25,42,41,30,25]],
 dust2:[[17,15,14,24,6,18,24,28,16,31],[4,22,46,14,14,20,6,1,10,19],[34,44,47,15,24,32,22,19,13,27],[18,48,19,32,21,25,48,49,18,31],[13,6,18,81,35,24,37,33,23,26],[6,11,73,15,28,21,12,3,8,20],[10,24,16,52,15,16,46,50,10,25],[15,72,62,28,41,28,18,6,19,42],[28,80,14,24,16,14,47,45,34,30],[22,57,28,15,23,27,26,20,35,25],[24,77,33,16,16,24,30,25,31,27],[17,15,29,58,23,11,7,12,23,32]],
 aztec:[[48,10,18,24,7,23,10,31,13,44],[14,36,54,24,18,22,26,11,16,31],[53,77,44,24,32,38,42,32,28,27],[48,53,26,42,16,34,33,36,10,38],[53,44,35,84,42,55,51,52,32,32],[11,51,73,28,42,35,47,16,35,29],[63,24,20,50,16,39,28,40,11,33],[18,52,66,31,36,42,40,14,33,31],[64,86,23,39,10,69,39,45,18,34],[20,86,46,25,32,41,54,20,40,30]],
 inferno:[[5,5,6,52,7,8,5,5,14,19,17],[0,15,29,17,17,8,5,12,36,1,2],[53,32,41,15,15,26,54,22,32,3,7],[52,55,8,25,8,32,50,13,16,22,14],[4,6,12,75,24,12,3,9,10,43,35],[4,17,64,7,32,15,8,22,42,2,0],[58,34,7,54,8,27,62,10,13,13,15],[21,54,61,30,37,29,27,40,50,11,8],[70,76,8,32,4,39,74,24,12,22,32],[58,62,31,10,13,29,65,19,38,3,5],[41,21,10,64,20,38,37,29,11,29,32],[62,52,6,37,16,25,50,11,8,47,41]]};
function pmVal(map,sd,n,opp,bt){const P=(bt==='pistol'&&PMP[map])||PM[map];if(!P)return .5;const os=sd==='T'?'CT':'T',L=(opp&&opp.length?opp:tnOf(map,os)).map(x=>tnOf(map,os).indexOf(x)).filter(x=>x>=0),me=tnOf(map,sd).indexOf(n);
 if(!L.length||me<0)return .5;return L.reduce((s,o)=>s+(sd==='T'?100-((P[me]||[])[o]??50):((P[o]||[])[me]??50)),0)/L.length/100}
function tacScore(d,map,sd,opp,kw,bt){const L=line(d),g=ig(d),gl=g?lvl(g[12],LT):0,A={};
 KS.forEach((k,i)=>A[k]=L.reduce((s,p)=>s+effStat(p,i,p[19]===1?0:gl),0)/L.length);const all=KS.reduce((s,k)=>s+A[k],0)/NSK;
 return tnOf(map,sd).map(n=>{const P=TPROF[STYLE[n]];
  let v=(opp?kw*pmVal(map,sd,n,opp,bt)+(1-kw)*pmVal(map,sd,n,null,bt):pmVal(map,sd,n,null,bt))+TAI.pf*(P.reduce((s,k)=>s+A[k],0)/P.length-all)/100;if(TSTACK.has(n))v+=TAI.st*(A.team-all)/100;
  return[n,v]})}
// opp = modstanderens liste pr. side og købstype (anti-strat). Uden opp vælges ud fra mappet og spillerne alene.
function aiOrder(d,map,opp){const q=tcq(d);if(q<QG.mid)return null;const o={},kw=q>=QG.good?TAI.kw[0]:TAI.kw[1];
 ['T','CT'].forEach(sd=>{o[sd]={};const os=sd==='T'?'CT':'T';
  ['pistol','standard','eco'].forEach(b=>{const base=tacScore(d,map,sd,opp?opp[os][b]:null,kw,b);o[sd][b]=base.map(([n,v])=>[n,v+(rnd()*2-1)*TAI.nz*(1-q+TAI.n0)]).sort((x,y)=>y[1]-x[1]).slice(0,MAXSEL).map(x=>x[0])})});
 return o}
// anti-strat: middel og gode AI-taktikere studerer modstanderens taktikker på mappet før kampen og vælger modtræk
function antiStrat(){const base=M.teams.map(t=>t.order);
 M.teams.forEach((t,i)=>{const d=M.defs[i];if(d.order)return;const o=aiOrder(d,CUR,base[1-i]);if(!o)return;t.order=o;t.anti=tcq(d)>=QG.good?'god':'middel'});
 const me=M.teams.find((t,i)=>M.defs[i]===TEAMS[0]),op=me&&M.teams.find(t=>t!==me);if(op&&op.anti&&!M.quiet)log('n',`<span style="font-weight:400;color:var(--mu)">${op.name} har studeret jeres taktikker på ${mapN(CUR)} og vælger modtræk.</span>`)}

/* FAQ: AI-taktik */
{const _rf6=renderFaq;renderFaq=function(){_rf6();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>AI-taktik</h3>${li(['AI-holdene har en skjult taktisk evne, som er uafhængig af holdstyring og økonomi. Den afgør, hvilke taktikker holdet vælger før kampen.','<b>Dårlige</b> taktikere bruger alle mappets taktikker i tilfældig rækkefølge.',`<b>Middel</b> og <b>gode</b> taktikere vælger ligesom dig højst ${MAXSEL} taktikker pr. side og købstype. Valget bygger på, hvordan taktikkerne klarer sig på mappet, og hvor godt de passer til spillerne: aggressive taktikker til Aim, Quickness og Determination, mix-taktikker til Playing IQ, Awareness og Teamplay, passive til Patience, Positioning og Calmness. Stakkede taktikker belønner også Teamplay.`,'<b>Anti-strat:</b> middel og gode taktikere studerer modstanderens taktikker på mappet før kampen og vælger modtræk, fx et site-hit mod en CT-stak på det andet site. Gode taktikere rammer oftere rigtigt end middel. Det gælder også dine lister, så en liste, der aldrig ændres, er lettere at læse. Når et AI-hold har studeret jer, står det i kampfeedet.','Listen ligger fast hele kampen. Undervejs kan kun IGL\'en gentage en vindende taktik.'])}</div>`)}}

/* FAQ: info, rotation og efter plant */
{const _rf7=renderFaq;renderFaq=function(){_rf7();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Info, rotation og efter plant</h3>${li(['<b>Info:</b> ser en CT mindst 2 T i en zone, der hører til et site (fx Lang A eller Tunnels på de_dust2), kan IGL\'en kalde rotation dertil. Chancen og hastigheden stiger med lederskab. Det gør fakes stærkere, fordi de kan lokke CT til det forkerte site.','<b>Tilbagetrækning:</b> en CT uden for sitene, der er i undertal mod mindst 2 T, trækker sig tilbage til det nærmeste site i stedet for at dø alene. Det sker højst én gang pr. runde.','<b>HE mod stakke:</b> en HE rammer også de andre modstandere i zonen med 80 % af skaden. Fem spillere samlet i én zone er derfor sårbare.','<b>T-skift:</b> møder T mindst 3 CT\'er på vej mod det planlagte site, kan IGL\'en kalde skift til det andet site (højst én gang pr. runde, oftere med højt lederskab). Spillerne i kampen bliver og kæmper, resten går mod det nye site.','<b>Støj:</b> nogle zoner larmer (fx Tunnels på de_dust2 og vandet på de_aztec). Den, der allerede står i zonen, opdager hurtigere en modstander, der kommer ind, og når mindst 2 T går ind i en støjende zone på vej mod et site, kan CT høre dem og rotere, uden at nogen har set dem. Det gør fakes gennem larmende zoner stærkere og stille ruter som Lang A gode til overraskelser.','<b>Højde:</b> på hævede positioner (fx Short på de_dust2 og T-brohus på de_aztec) har den, der stod først, en træfbonus. Det gør dem lette at holde med få og svære at retake.','<b>Gennemskydelig:</b> i zoner med tynde vægge (fx B-site og Mid doors på de_dust2) er gemmestederne mindre værd, og en spiller med riffel eller SMG rammer bedre, jo flere modstandere der står i zonen. Effekten vokser med Playing IQ. Det straffer stakke.','<b>Transit:</b> en spiller, der kun passerer en zone, fx Lower mid på de_dust2 under en rotation eller en retake, reagerer langsommere og er lettere at ramme for den, der holder zonen. Det gør det dyrt at rotere eller retake gennem en zone, modstanderen har taget, og det er sådan, en stak kan straffes.','<b>Taktikker:</b> der er ingen kunstig justering af taktikkerne. Hver taktik har sine styrker og svagheder, og de fleste har tydelige modtræk: en taktik, der er stærk mod én opstilling, kan være svag mod en anden.','<b>Skudlinjer:</b> i en zone kan højst vinkler + 1 spillere pr. side skyde på samme tid. I smalle zoner hjælper det mindre at være mange.','<b>Efter plant</b> har T en lille træfbonus, når de forsvarer bomben.'])}</div>`)}}

/* FAQ: rundeøkonomi */
{const _rf8=renderFaq;renderFaq=function(){_rf8();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Rundeøkonomi</h3>${li([`<b>Sejr:</b> $${ECON_R.win} pr. spiller. <b>Drab:</b> $300.`,`<b>Tabsbonus:</b> stiger for hvert tab i træk: ${ECON_R.loss.map(x=>'$'+x).join(' / ')}. En sejr sænker serien ét trin, så et hold, der skiftevis vinder og taber, stadig får en god tabsbonus.`,'Ved halvleg og forlængelse starter serien på ét trin, så et tabt pistolrunde giver $1900.',`Højst $${ECON_R.max} pr. spiller.`,'Tabsbonussen gør det lettere at komme tilbage efter et par tabte runder og mindsker, hvor meget en lille fordel vokser via økonomien.'])}</div>`)}}

/* FAQ: CL-pladser */
{const _rf9=renderFaq;renderFaq=function(){_rf9();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>CL-pladser</h3>${li(['Hvert land har et antal direkte pladser og kvalifikationspladser efter sin landekoefficient. Pladserne går til holdene i rækkefølge efter sidste sæsons slutstilling.','<b>Sæson 1:</b> der er ingen sidste sæson, så holdene i hvert land ordnes efter power ranking. Den direkte plads går til landets højest rankede hold, og kvalifikationspladserne til de næste.','Dit hold kan ikke starte i CL i sæson 1.'])}</div>`)}}

/* ===== FASE 15: MATCH-RAPPORT OG TAKTIKSTATISTIK ===== */
// Pr. runde registreres dit holds taktik, købstype og udfald: i M.rep (kun denne kamp, vises efter live-kampe)
// og i WD.ts (gemmes; alle dine kampe, også simulerede). WD.ts[map][side][taktik][købstype] = [vundne, spillede]. Force-buy tælles som eco.
const TBT=['pistol','standard','eco'],TBN={pistol:'Pistol',standard:'Std.',eco:'Eco'};
const myIdx=()=>M&&M.defs?M.defs.indexOf(TEAMS[0]):-1;
function tsAdd(o,map,sd,tac,bt,won){const a=((o[map]=o[map]||{})[sd]=o[map][sd]||{})[tac]=o[map][sd][tac]||{},e=a[bt]=a[bt]||[0,0];e[1]++;if(won)e[0]++}
{const _fr=finishRound;finishRound=function(side,why){_fr(side,why);const i=myIdx();if(i<0)return;const t=M.teams[i],bt=t.bt==='force'?'eco':t.bt,won=t.side===side;
 tsAdd(M.rep=M.rep||{},M.map||CUR,t.side,t.tac,bt,won);if(WD)tsAdd(WD.ts=WD.ts||{},M.map||CUR,t.side,t.tac,bt,won)}}
const pctC=e=>e&&e[1]?`<span class="pc">${Math.round(100*e[0]/e[1])} %</span><br><span class="mu" style="font-size:11px">${e[1]} rd.</span>`:'<span class="mu">–</span>';
const sumE=(a,b)=>[(a?a[0]:0)+(b?b[0]:0),(a?a[1]:0)+(b?b[1]:0)];
// tabel: én række pr. taktik med succesrate og antal runder pr. købstype og i alt
function tacTable(rows,showAll,sd){const tot=r=>TBT.reduce((s,b)=>sumE(s,r[b]),[0,0]);let L=Object.keys(rows).map(n=>[n,rows[n],tot(rows[n])]);
 if(showAll)(TSV.map==='all'?tnAll(sd):tnOf(TSV.map,sd)).forEach(n=>{if(!rows[n])L.push([n,{},[0,0]])});L.sort((a,b)=>b[2][1]-a[2][1]||(b[2][1]?b[2][0]/b[2][1]-a[2][0]/a[2][1]:0)||a[0].localeCompare(b[0]));
 if(!L.length)return'<div class="mu">Ingen runder.</div>';
 return `<table class="rpt tst"><colgroup><col style="width:31%"><col><col><col><col></colgroup><thead><tr><th>Taktik</th>${TBT.map(b=>`<th class="n2">${TBN[b]}</th>`).join('')}<th class="n2">I alt</th></tr></thead><tbody>${L.map(([n,r,t])=>`<tr${t[1]?'':' style="color:var(--mu)"'}><td title="${n}">${n}</td>${TBT.map(b=>`<td class="n2">${pctC(r[b])}</td>`).join('')}<td class="n2"><b>${pctC(t)}</b></td></tr>`).join('')}</tbody></table>`}
function repHTMLm(){const i=myIdx();if(i<0)return'';const me=M.teams[i],op=M.teams[1-i],R0=(M.rep||{})[M.map||CUR]||{},my=M.score[i],ot=M.score[1-i];
 const res=my>ot?'Sejr':my<ot?'Nederlag':'Uafgjort',kd=p=>p.d?(p.k/p.d).toFixed(2):p.k.toFixed(2);
 const sb=t=>`<tr><th colspan="5" style="background:#fff">${t.name}</th></tr>`+t.ps.slice().sort((a,b)=>b.k-a.k||a.d-b.d).map(p=>`<tr><td>${p.name}${p.igl?' <span class="mu">IGL</span>':''}</td><td class="n2">${p.k}</td><td class="n2">${p.d}</td><td class="n2">${p.a}</td><td class="n2">${kd(p)}</td></tr>`).join('');
 return `<div class="tm" id="mrep"><h3>Match-rapport · ${res} ${my}–${ot} mod ${op.name} · ${mapN(M.map||CUR)}</h3>
 <table class="rpt"><colgroup><col style="width:44%"><col><col><col><col></colgroup><thead><tr><th>Spiller</th><th class="n2">K</th><th class="n2">D</th><th class="n2">A</th><th class="n2">K/D</th></tr></thead><tbody>${sb(me)}${sb(op)}</tbody></table>
 <div style="margin-top:10px"><b>Dine taktikker på T-siden</b></div>${tacTable(R0.T||{},false,'T')}
 <div style="margin-top:10px"><b>Dine taktikker på CT-siden</b></div>${tacTable(R0.CT||{},false,'CT')}
 <div class="mu" style="margin-top:6px">Succesrate = vundne runder med taktikken. Under procenten står antal runder (rd.). Std. = standardrunder. Force-buy tælles som eco, fordi eco-listen bruges i force-runder. Rapporten forsvinder, når næste kamp starter.</div></div>`}
{const _r=render;render=function(){_r();if(M&&M.done&&!M.quiet&&myIdx()>=0)$('pl').insertAdjacentHTML('afterbegin',repHTMLm())}}
/* statistik i Taktik-fanen */
let TSV={on:false,map:'dust2',rs:false};
function tsRows(sd){const T=WD.ts||{},maps=TSV.map==='all'?MAPIDS:[TSV.map],o={};
 maps.forEach(m=>{const S=T[m]&&T[m][sd];if(!S)return;for(const n in S){const a=o[n]=o[n]||{};TBT.forEach(b=>{if(S[n][b])a[b]=sumE(a[b],S[n][b])})}});return o}
function statsHTML(){const sg=(v,t,on)=>`<button class="${on?'on':''}" data-ts="map|${v}">${t}</button>`;
 const tot=sd=>{const r=tsRows(sd);return Object.values(r).reduce((s,x)=>TBT.reduce((q,b)=>sumE(q,x[b]),s),[0,0])};
 let h=`<div class="hd"><b>Taktikstatistik – ${TEAMS[0].name}</b><button style="flex:0 0 auto;padding:6px 12px" data-ts="close|">Tilbage</button></div>`;
 h+=`<div class="tm"><select data-tsm="1">${MAPIDS.map(m=>`<option value="${m}" ${TSV.map===m?'selected':''}>${mapN(m)}</option>`).join('')}</select><div class="mu" style="margin-top:6px">Akkumuleret succesrate for dine taktikker i alle dine kampe (liga og CL, live og simulerede). Under procenten står antal runder (rd.). Std. = standardrunder. Force-buy tælles som eco.</div></div>`;
 ['T','CT'].forEach(sd=>{const t=tot(sd);h+=`<div class="tm"><h3>${sd}-side <span class="mu">· ${t[1]?Math.round(100*t[0]/t[1])+' % af '+t[1]+' runder':'ingen runder endnu'}</span></h3>${tacTable(tsRows(sd),true,sd)}</div>`});
 h+=`<button data-ts="reset|" style="width:100%" class="${TSV.rs?'alert':''}">${TSV.rs?'Sikker? Tryk igen for at nulstille':'Nulstil statistik'}</button><div class="mu" style="margin-top:4px">Nulstiller statistikken for alle maps.</div>`;
 return h}
{const _rt=renderTactics;renderTactics=function(){if(TSV.on){$('tv').innerHTML=statsHTML();return}_rt();const hd=$('tv').querySelector('.hd');if(hd){const b=hd.querySelector('button');if(b)b.insertAdjacentHTML('beforebegin','<button style="flex:0 0 auto;padding:6px 12px" data-ts="open|">Statistik</button>')}}}
$('tv').addEventListener('click',e=>{const b=e.target.closest('[data-ts]');if(!b)return;e.stopImmediatePropagation();const[a,v]=b.dataset.ts.split('|');
 if(a==='open'){TSV.on=true;TSV.rs=false}else if(a==='close'){TSV.on=false;TSV.rs=false}else if(a==='map'){TSV.map=v;TSV.rs=false}
 else if(a==='reset'){if(TSV.rs){WD.ts={};TSV.rs=false;saveGame()}else{TSV.rs=true;setTimeout(()=>{if(TSV.rs){TSV.rs=false;if(TSV.on&&VIEW==='tv')renderTactics()}},3000)}}
 renderTactics();window.scrollTo(0,0)},true);
{const _st=showTactics;showTactics=function(){TSV.on=false;TSV.rs=false;_st()}}
$('tv').addEventListener('change',e=>{if(!e.target.dataset.tsm)return;e.stopImmediatePropagation();TSV.map=e.target.value;TSV.rs=false;renderTactics()},true);
/* FAQ */
{const _rf10=renderFaq;renderFaq=function(){_rf10();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Match-rapport og taktikstatistik</h3>${li(['<b>Match-rapport:</b> efter en live-kamp vises K/D/A for begge hold og succesraten for de taktikker, dit hold har brugt, fordelt på pistol-, standard- og eco-runder. Rapporten gemmes ikke.','<b>Taktikstatistik:</b> under Taktik → Statistik ser du den samlede succesrate for alle dine taktikker pr. map eller for alle maps. Alle dine kampe tæller, også simulerede. Knappen nederst nulstiller statistikken.','Force-buy-runder tælles som eco, fordi spillet bruger din eco-liste i force-runder.'])}</div>`)}}

/* FAQ: indtægter fra kampe og præmier (vises med denne sæsons beløb) */
{const _rfI=renderFaq;renderFaq=function(){_rfI();const B=ecoB(),me=WD.me.li,f=lgFac(me),row=(a,b)=>`<tr><td style="white-space:normal">${a}</td><td class="n2">${b}</td></tr>`,tb=(t,r)=>`<div style="margin-top:8px"><b>${t}</b></div><table class="rpt"><colgroup><col style="width:62%"><col></colgroup><tbody>${r}</tbody></table>`;
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Indtægter fra kampe og præmier</h3><div class="mu">Beløbene herunder gælder denne sæson. De fastsættes ved sæsonstart ud fra den gennemsnitlige lønsum pr. hold i alle ligaer (nu ${kr(B)}), så de følger lønniveauet. Kampindtægter går kun til hjemmeholdet.</div>`+
 tb('Liga',row(`Hjemmekamp i ${COUNTRIES[me][0]} (landefaktor ×${f.toFixed(2)})`,kr(lgAmt(me)))+row('Hjemmekamp i landet nr. 1 på koefficientlisten',kr(Math.round(B*ECO.lg*ECO.fHi)))+row('Hjemmekamp i landet nr. 24 på koefficientlisten',kr(Math.round(B*ECO.lg*ECO.fLo)))+[0,1,2].map(i=>row(`Ligapræmie nr. ${i+1} i ${COUNTRIES[me][0]}`,kr(prizeAmt(me,i)))).join(''))+
 tb('Champions League – kampe',['kq','kf','g','r16','qf','sf'].map(st=>row(`Hjemmekamp: ${CLN[st]}`,kr(clAmt(st)))).join('')+row('Bronzekamp (neutral bane, deles)',kr(clAmt('br')/2)+' hver')+row('Finale (neutral bane, deles)',kr(clAmt('fin')/2)+' hver'))+
 tb('Champions League – præmier',row('Kvalificeret til 1/8-finalerne',kr(B*ECO.r16))+row('Vinder',kr(B*ECO.clP[0]))+row('Sølv (taber finalen)',kr(B*ECO.clP[1]))+row('Bronze (vinder bronzekampen)',kr(B*ECO.clP[2])))+
 `<div class="mu" style="margin-top:6px">Ligapræmier udbetales ved sæsonslut, CL-præmien for 1/8-finalerne når slutspillet trækkes, og CL-præmierne for top 3 lige efter bronzekampen og finalen. Sponsorindtægter er forklaret under Sponsorer.</div></div>`)}}
