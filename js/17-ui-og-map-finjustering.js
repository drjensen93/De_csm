/* ===== FASE 54: OPRYDNING I UI ===== */
// Turneringstræer: rundeoverskrifterne står øverst i hver kolonne (flugter), og træer med mere end to runder stables lodret på smalle skærme
// (én runde ad gangen, kampene i to kolonner), så der ikke skal scrolles sidelæns. Noter i turneringer må bryde over flere linjer,
// så siden ikke bliver bredere end skærmen. Liga- og CL-tabeller viser holdnavne uden sponsor (fuldt navn i tooltip) og passer i bredden.
document.head.insertAdjacentHTML('beforeend',`<style>
.bc{position:relative;padding-top:18px}.bc>.bl{position:absolute;top:0;left:0;right:0}
#cl .eq,#lg .eq,#nt .eq,#hf .eq,#rk .eq{white-space:normal}
#cl .lg2,#lg .lg2{grid-template-columns:20px minmax(0,1fr) 18px auto auto 22px;column-gap:6px;font-size:12px}#cl .lg2 .r>div,#lg .lg2 .r>div{white-space:nowrap}#cl .sx,#lg .sx{overflow-x:visible}
#cl .lg2 .nm,#lg .lg2 .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:2px}
@media (max-width:640px){
 .br:has(> .bc:nth-child(3)){flex-direction:column;overflow:visible;gap:2px}
 .br:has(> .bc:nth-child(3))>.bc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:8px;flex:none;padding-top:22px;margin-bottom:8px}
 .br:has(> .bc:nth-child(3))>.bc>.bl{text-align:left;font-weight:700;color:var(--tx);font-size:12.5px}
 .br:has(> .bc:nth-child(3)) .bx{margin:3px 0}
}
</style>`);
{const _rcU=renderCL;renderCL=function(){_rcU();try{if(WD.cltab!=='grp')return;const el=$('cl');if(!el||!el.querySelectorAll)return;
 el.querySelectorAll('.lg2 [data-tm]').forEach(a=>{const[li,ti]=a.dataset.tm.split('-').map(Number),t=WD.lg[li]&&WD.lg[li].teams[ti];if(!t)return;const n=t.def.name||t.name;if(n){a.textContent=n;a.title=t.name}});
 const me=WD.lg[WD.me.li].teams[WD.me.ti];el.querySelectorAll('.lg2 .me2').forEach(s=>{const n=me.def.name||me.name;[...s.childNodes].forEach(c=>{if(c.nodeType===3&&c.textContent.trim()===me.name)c.textContent=' '+n})})}catch(e){}}}
{const _rlU=renderLeague;renderLeague=function(){_rlU();try{const el=$('lg');if(!el||!el.querySelectorAll)return;
 el.querySelectorAll('.lg2 [data-tm]').forEach(a=>{const[li,ti]=a.dataset.tm.split('-').map(Number),t=WD.lg[li]&&WD.lg[li].teams[ti];if(!t)return;const n=t.def.name||t.name;if(n){a.textContent=n;a.title=t.name}});
 const me=WD.lg[WD.me.li].teams[WD.me.ti],n=me.def.name||me.name;el.querySelectorAll('.lg2 .r.me .nm').forEach(c=>{if(c.textContent.trim()===me.name){c.textContent=n;c.title=me.name}})}catch(e){}}}
// kampvisning: dit holds aktuelle taktik under holdkortets overskrift
{const _rnT=render;render=function(){_rnT();try{if(!M||M.quiet||M.done||!R)return;const i=myIdx();if(i<0)return;const t=M.teams[i];if(!t||!t.tac)return;
 const pl=$('pl');if(!pl||!pl.children)return;const cards=[...pl.children].filter(c=>c.classList&&c.classList.contains('tm')&&c.id!=='mrep'&&c.querySelector('h3 b'));const card=cards[i];if(!card)return;
 const h=card.querySelector('h3');if(!h||card.querySelector('.mytac'))return;const n=typeof txIsX==='function'&&txIsX(t.tac)?txName(t.tac):t.tac;
 h.insertAdjacentHTML('afterend',`<div class="mytac" style="font-size:12px;margin:-2px 0 4px;overflow-wrap:anywhere">Taktik: <b>${n}</b></div>`)}catch(e){}}}
// kampfeedet ryddes, når en ny runde starter (ikke ved kampstart, så linjen med mappet bliver stående i første runde)
{const _srF=startRound;startRound=function(){try{if(M&&!M.quiet&&M.round>=1){const f=$('feed');if(f&&typeof f.innerHTML==='string')f.innerHTML=''}}catch(e){}return _srF.apply(this,arguments)}}


/* ===== FASE 55: de_dust2 – FINERE ZONER ===== */
// Tunnels → Upper tunnels (TB, lidt højde) + ny Lower tunnels (LT) mellem Upper tunnels og Lower mid. Mid går ikke længere direkte til Mid doors (kun via Lower mid).
// Long doors → T doors (LD) + ny CT doors (CD) mellem T doors og Long. Lang A → Long (LA). Ny Pit (PIT) i forlængelse af Long (blindgyde, AWP ned ad Long).
// Ny Car (CAR) mellem Long, CT-spawn og A: lille zone med godt gemmested, hvorfra man kan skyde til og fra de tre nabozoner (XZN).
// Ny Marked (MK) mellem T-spawn og Upper tunnels. Zonernes ID'er er uændrede, så alle taktikker virker videre; vejene findes automatisk.
const XZN={dust2:{CAR:['LA','CT','A']}};// zoner, der kan skyde til og fra deres nabozoner

{const m=MAPS.dust2,rm=(a,b)=>{m.edges=m.edges.filter(e=>!((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))};
 Object.assign(m.zn,{
  LT:{ang:2,obs:6,rng:.1,ch:.9,hz:.6,tr:.9,tv:.3,st:.7,wb:.2},          // Lower tunnels: som Upper tunnels, men lavere
  CD:{ang:2,obs:2,rng:.25,ch:.9,hz:.6,tr:.8,tv:.3,st:.5},               // CT doors: ren choke
  PIT:{ang:2,obs:6,rng:.95,ch:.2,hz:.9,snip:.14,tr:.2,tv:.3,st:.1},     // Pit: gemmested og AWP ned ad Long, blindgyde
  CAR:{ang:2,obs:6,rng:.5,ch:.4,hz:.8,tr:.5,tv:.3,st:.2},               // Car: lille, godt gemmested, skyder til nabozonerne
  MK:{ang:3,obs:2,rng:.4,ch:.5,hz:.3,tr:.5,tv:.3,st:.3}});              // Marked: åben forplads foran Upper tunnels
 m.zn.TB.hd=.3;// Upper tunnels ligger højere end Lower tunnels
 Object.assign(m.zname,{TB:'Upper tunnels',LT:'Lower tunnels',LD:'T doors',CD:'CT doors',LA:'Long',PIT:'Pit',CAR:'Car',MK:'Marked'});
 rm('LM','TB');rm('MID','MD');rm('LD','LA');rm('TS','TB');
 m.edges.push(['TB','LT',2],['LT','LM',2],['LD','CD',2],['CD','LA',3],['LA','PIT',3],['LA','CAR',4],['CAR','CT',3],['CAR','A',3],['TS','MK',4],['MK','TB',4]);
 Object.assign(m.rsite,{LT:'B',CD:'A',PIT:'A',CAR:'A'});
 m.exits.TS=['LD','MID','MK'];
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='dust2')CUR='';
 // beskrivelser: nye zonenavne
 const fix=s=>s.replace(/Lang A/g,'Long').replace(/Long doors/g,'T doors');
 for(const D of [m.tdesc,m.cdesc])for(const k in D)if(Array.isArray(D[k]))D[k]=D[k].map(fix);
 if(typeof ZDESC!=='undefined'&&ZDESC.dust2)Object.assign(ZDESC.dust2,{TB:'Upper tunnels: meget larmende, lidt højde over Lower tunnels.',LT:'Lower tunnels: smal og larmende forbindelse til Lower mid, lavere end Upper tunnels.',LD:'T doors: dørene høres tydeligt.',CD:'CT doors: smal choke ind til Long.',PIT:'Pit: godt gemmested med AWP-linje ned ad Long – men en blindgyde.',CAR:'Car: lille zone med godt gemmested. Herfra kan man skyde til og fra Long, CT-spawn og A.',MK:'Marked: åben forplads mellem T-spawn og Upper tunnels.'});
 if(typeof ZPOS!=='undefined')ZPOS.dust2={CT:[470,80],A:[660,120],B:[130,120],MD:[340,200],SH:[500,285],CAR:[615,215],PIT:[770,250],LA:[715,345],CD:[705,455],LD:[590,515],TS:[440,575],MID:[440,430],LM:[320,330],LT:[215,290],TB:[110,345],MK:[235,485]};
 if(typeof TXM!=='undefined')delete TXM.dust2;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('dust2'))delete TBC[k];}
{const _rfD=renderFaq;renderFaq=function(){_rfD();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 f.insertAdjacentHTML('beforeend',`<div class="tm"><h3>de_dust2: zoner</h3>${li([
  '<b>Tunnels</b> er delt i Upper tunnels (fra Marked foran T-spawn til B, lidt højde) og Lower tunnels (videre til Lower mid). Mid går kun til Mid doors via Lower mid.',
  '<b>Long</b>: T doors → CT doors → Long → A. Pit ligger for enden af Long: godt gemmested og AWP-linje, men en blindgyde.',
  '<b>Car</b> ligger mellem Long, CT-spawn og A. En spiller i Car kan skyde til og fra alle tre nabozoner – og kan selv blive beskudt derfra.'])}</div>`)}}

// de_dust2 målt forfra med de nye zoner (2.750 fuldt købte runder og 250 pistolrunder pr. par)
PM.dust2=[[33,18,36,34,14,35,29,38,22,36,80],[46,44,72,58,40,43,54,38,42,75,46],[60,52,72,57,58,60,45,56,37,69,49],[43,57,42,55,41,42,52,59,27,34,43],[48,29,50,87,53,52,58,64,45,70,58],[60,60,89,72,63,59,59,48,47,72,54],[39,22,48,83,44,57,52,58,50,38,73],[53,86,81,55,64,61,40,40,47,61,64],[43,70,38,52,29,42,49,60,26,37,31],[60,72,63,57,53,55,47,53,34,69,51],[44,70,47,52,33,51,41,53,24,54,39],[44,53,43,71,38,33,30,37,43,45,42],[52,42,43,58,35,53,55,52,35,75,60],[50,33,35,67,37,57,64,45,34,83,63],[35,17,42,62,30,47,15,61,18,35,72],[50,51,45,83,49,46,29,34,33,87,86]];PMP.dust2=[[14,12,7,37,9,20,19,16,16,37,55],[9,22,49,10,15,23,15,2,13,20,3],[33,46,49,11,24,30,19,37,13,29,57],[18,24,8,26,14,15,45,27,15,19,32],[23,4,13,76,36,34,24,39,34,38,48],[18,14,70,7,31,24,6,3,22,14,2],[9,22,8,65,22,37,37,21,28,32,46],[24,72,60,28,48,36,13,5,20,34,8],[25,68,4,30,15,24,43,18,28,35,9],[48,57,30,15,21,25,25,9,18,24,40],[29,57,24,26,12,22,32,4,22,35,27],[20,16,18,53,23,16,13,24,32,26,33],[14,11,5,37,12,23,23,13,16,53,26],[17,20,5,46,20,30,34,14,20,69,39],[14,10,10,45,17,26,12,21,12,33,56],[36,5,14,73,24,20,18,4,26,68,74]];


/* ===== FASE 56: de_dust2 – Box mellem Lower mid og Short ===== */
// Box (BX) er en hurtig, men udsat vej fra Lower mid op til Short: ingen gemmesteder, mange vinkler, larmende og sårbar i transit.
// Den, der kravler op fra Lower mid, får BOX.aim i aim-straf, så længe han står på Box. Den direkte vej Lower mid → Short fjernes.
// Ny vej Mid → Short uden om Box.
const BOX={dust2:{BX:{from:'LM',aim:25}}};
{const _atB=attr;attr=function(p,k){let v=_atB(p,k);if(k==='aim'&&p&&p.zone){const B=BOX[CUR]&&BOX[CUR][p.zone];if(B&&p.from===B.from)v=Math.max(0,v-B.aim)}return v}}
{const m=MAPS.dust2;m.edges=m.edges.filter(e=>!((e[0]==='LM'&&e[1]==='SH')||(e[0]==='SH'&&e[1]==='LM')));
 m.zn.BX={ang:3,obs:0,rng:.4,ch:.5,hz:.2,tr:.3,tv:.6,st:.4};
 m.zname.BX='Box';m.rsite.BX='A';
 m.edges.push(['LM','BX',1],['BX','SH',2],['MID','SH',5]);
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='dust2')CUR='';
 if(typeof ZDESC!=='undefined'&&ZDESC.dust2)ZDESC.dust2.BX='Box: hurtig vej fra Lower mid op til Short, men helt udsat. Den, der kravler op, sigter dårligere.';
 if(typeof ZPOS!=='undefined'&&ZPOS.dust2)ZPOS.dust2.BX=[405,290];
 if(typeof TXM!=='undefined')delete TXM.dust2;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('dust2'))delete TBC[k]}
{const _rfB=renderFaq;renderFaq=function(){_rfB();const f=$('fq');if(!f||!f.querySelectorAll)return;const h=[...f.querySelectorAll('h3')].find(x=>x.textContent==='de_dust2: zoner');
 if(h&&h.parentElement)h.parentElement.insertAdjacentHTML('beforeend',`<div style="padding:3px 0"><b>Box</b> ligger mellem Lower mid og Short: den hurtigste vej op til Short, men helt udsat. Den, der kravler op fra Lower mid, får ${BOX.dust2.BX.aim} i aim-straf, så længe han står på Box. Fra Mid kan man også gå til Short uden om Box.</div>`)}}

// de_dust2 målt forfra med Box (FASE 56)
PM.dust2=[[31,24,39,41,10,23,25,40,18,37,75],[46,43,74,61,42,42,53,38,45,73,46],[59,58,74,56,60,60,48,54,43,71,47],[45,60,41,57,42,45,51,64,35,36,40],[53,45,53,87,55,56,59,64,49,71,60],[59,58,89,70,61,58,56,48,47,72,52],[41,23,50,84,32,32,59,60,54,40,86],[54,85,82,54,65,58,43,42,47,60,64],[44,73,40,51,28,35,50,61,34,36,33],[62,76,62,59,50,54,52,53,39,67,51],[44,71,46,50,31,35,47,54,27,53,36],[45,54,45,73,39,34,30,37,45,46,42],[53,39,44,56,35,51,56,53,36,76,60],[50,32,34,66,40,56,64,43,35,80,63],[29,24,44,64,20,24,28,59,27,37,59],[54,46,41,83,41,39,47,34,38,85,75]];PMP.dust2=[[13,15,6,32,6,13,11,18,14,36,52],[7,24,50,13,14,23,8,2,12,21,4],[36,38,45,18,23,28,17,29,12,24,54],[19,25,8,34,16,16,38,29,19,27,30],[21,2,15,77,36,34,27,39,36,36,40],[21,9,74,10,28,19,8,3,21,13,1],[4,23,6,66,14,24,48,17,38,38,72],[27,72,68,25,42,30,14,5,20,34,8],[21,70,9,28,14,16,42,21,26,40,10],[42,48,25,16,21,23,30,8,14,28,40],[20,59,22,26,18,19,31,6,23,30,30],[23,18,18,50,19,14,13,30,32,28,31],[13,16,7,31,12,20,23,12,18,49,30],[16,14,8,54,24,25,34,14,21,64,40],[4,9,9,44,10,16,20,18,12,36,42],[44,4,9,67,21,22,10,6,29,68,62]];


/* ===== FASE 57: VM-HOLDENES TAKTIKKER ===== */
// Ved VM-lodtrækningen kopieres biblioteket fra power rankingens nr. 1 (for sæsonens maps) til WD.ec.lib.
// Alle landshold bruger de samme taktikker og vælger kampens 5 ud fra samme viden (den liga, nr. 1 spiller i) – samme forudsætning for alle.
function ecLibSnap(){const E=WD.ec;if(!E||E.lib)return;try{if(!WD.pr)computePR();const P=WD.pr;let best=null;for(const k in P.r)if(P.r[k]===1){best=+k;break}
 if(best==null)return;const li=Math.floor(best/PRN),ti=best%PRN,t=WD.lg[li]&&WD.lg[li].teams[ti];if(!t)return;const d=t.def,lib={};
 for(const map of seasonMaps()){if(!MAPS[map]||!MAPS[map].zn)continue;if(d!==TEAMS[0]&&txOk(d))txEnsure(d,map);
  const L=d===TEAMS[0]?{T:ulGet(map,'T').slice(),CT:ulGet(map,'CT').slice()}:{T:d.tl[map].T.slice(),CT:d.tl[map].CT.slice()};lib[map]=L}
 E.lib=lib;E.libLi=li;E.libFrom=t.def.name||t.name;WD.txKeep=[...new Set([...(WD.txKeep||[]),...Object.values(lib).flatMap(x=>[...x.T,...x.CT]).filter(txIsX)])]}catch(e){console.error(e)}}
{const _edL=ecDraw;ecDraw=function(){const r=_edL.apply(this,arguments);ecLibSnap();return r}}
{const _aoN=aiOrder;aiOrder=function(d,map,opp){try{if(d&&d.nat&&WD&&WD.ec&&WD.ec.s===WD.season){if(!WD.ec.lib)ecLibSnap();const E=WD.ec,L=E.lib&&E.lib[map];
  if(L){const o={};for(const sd of ['T','CT']){const os=sd==='T'?'CT':'T',O=opp&&opp[os]&&opp[os].standard&&opp[os].standard.length?opp[os].standard:L[os];
    const pick=L[sd].filter(n=>txInfo(map,sd,n)).map(n=>[n,txVal(E.libLi,map,sd,n,O)]).sort((a,b)=>b[1]-a[1]).slice(0,TXC.sel).map(x=>x[0]);o[sd]={pistol:pick,standard:pick,eco:pick}}return o}}}catch(e){console.error(e)}
 return _aoN(d,map,opp)}}
{const _rfV=renderFaq;renderFaq=function(){_rfV();const f=$('fq');if(!f||!f.querySelectorAll)return;const h=[...f.querySelectorAll('h3')].find(x=>x.textContent==='En meta, der udvikler sig');
 if(h&&h.parentElement)h.parentElement.insertAdjacentHTML('beforeend','<div style="padding:3px 0">Holdene starter med 8 tilfældige standardtaktikker pr. side og lærer kun af de kampe, der spilles. VM: ved lodtrækningen får alle landshold taktikkerne fra power rankingens nr. 1 og vælger ud fra den samme viden – samme forudsætning for alle.</div>')}}


/* ===== FASE 58: de_aztec – FINERE ZONER ===== */
// Connector til A forbindes til Mid. B-connector går fra Mid til B (ikke længere til CT-brohus). CT-brohus forbindes til Mid, B og Broen.
// Water deles: T-vand (WA, samme ID) ved T-spawn og T-connector, og CT-vand (CW) med A ramp (RA) op til A og Mid stairs (MS) op til Mid.
{const m=MAPS.aztec,rm=(a,b)=>{m.edges=m.edges.filter(e=>!((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))};
 rm('BC','CBH');rm('WA','TBH');rm('WA','MID');rm('WA','CA');rm('WA','A');
 Object.assign(m.zn,{
  CW:{ang:3,obs:2,rng:.6,ch:.4,hz:.3,tr:.4,tv:.5,st:.9},            // CT-vand: larmer
  RA:{ang:5,obs:1,rng:.7,ch:.3,hz:.4,tr:.3,tv:.6,snip:.06,st:.3},   // A ramp: stor, bred og åben
  MS:{ang:1,obs:2,rng:.15,ch:.9,hz:.5,tr:.9,tv:.4,st:.4}});         // Mid stairs: lille, smal trappe
 m.zn.WA.st=.9;
 m.edges.push(['CA','MID',4],['BC','B',3],['CBH','MID',4],['TC','WA',3],['WA','CW',4],['CW','RA',3],['RA','A',3],['CW','MS',2],['MS','MID',2]);
 Object.assign(m.zname,{WA:'T-vand',CW:'CT-vand',RA:'A ramp',MS:'Mid stairs'});
 m.rsite.RA='A';
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='aztec')CUR='';
 if(typeof ZDESC!=='undefined'&&ZDESC.aztec)Object.assign(ZDESC.aztec,{WA:'T-vand: vandet ved T-spawn og T-connector plasker, så alle hører det.',CW:'CT-vand: plasker også. Herfra går A ramp op til A og Mid stairs op til Mid.',RA:'A ramp: stor, bred rampe op til A – åben og udsat.',MS:'Mid stairs: lille, smal trappe fra vandet op til Mid.',BC:'Smal og larmende passage fra Mid til B.',CBH:'B\'s chokepunkt med tynde vægge – forbundet til Mid, Broen og B.'});
 if(typeof ZPOS!=='undefined')ZPOS.aztec={A:[110,110],TP:[270,70],CT:[440,80],B:[680,140],BC:[560,215],CBH:[650,310],BR:[560,405],TBH:[460,470],MID:[360,250],MS:[300,340],CW:[230,410],RA:[160,235],CA:[70,330],TC:[170,500],WA:[330,525],TS:[250,580]};
 if(typeof TXM!=='undefined')delete TXM.aztec;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('aztec'))delete TBC[k]}
{const _rfZ2=renderFaq;renderFaq=function(){_rfZ2();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 f.insertAdjacentHTML('beforeend',`<div class="tm"><h3>de_aztec: zoner</h3>${li([
  '<b>Vandet</b> er delt i T-vand (ved T-spawn og T-connector) og CT-vand. Fra CT-vand går A ramp – en stor, bred og udsat rampe – op til A, og Mid stairs – en lille, smal trappe – op til Mid.',
  '<b>Mid</b> er forbundet til Connector til A, B-connector (videre til B) og CT-brohus. CT-brohus ligger mellem Mid, Broen og B.'])}</div>`)}}
// standardtaktikker: "fra Mid ned i vandet" betyder nu CT-vand (via Mid stairs), ikke T-vand
{const m=MAPS.aztec;for(const n of m.tn.T){const f=m.tac[n]||TT[n];if(!f)continue;
 m.tac[n]=()=>f().map(w=>{let pm=false;return w.map(x=>{const z=x[0][0]==='='?x[0].slice(1):(m.alias.T[x[0]]||x[0]),r=(z==='WA'&&pm)?['=CW'].concat(x.slice(1)):x;pm=z==='MID';return r})})}
 if(typeof TXM!=='undefined')delete TXM.aztec}


/* ===== FASE 59: de_inferno – T-spawn via Mid til Top banana, og Car mellem Banana og B ===== */
{const m=MAPS.inferno,rm=(a,b)=>{m.edges=m.edges.filter(e=>!((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))};
 rm('TS','TB');rm('BN','B');m.exits.TS=m.exits.TS.filter(z=>z!=='TB');
 // Car: lille og trang, 3 gemmesteder (sandsække), trætønder og spånplader kan skydes igennem
 m.zn.CAR={ang:2,obs:3,rng:.2,ch:.7,hz:.7,tr:.7,tv:.4,st:.4,wb:.7};
 m.edges.push(['BN','CAR',2],['CAR','B',3]);
 m.zname.CAR='Car';m.rsite.CAR='B';
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='inferno')CUR='';
 if(typeof ZDESC!=='undefined'&&ZDESC.inferno)ZDESC.inferno.CAR='Car: lille, trang zone mellem Banana og B med 3 gemmesteder bag sandsække. Trætønder og spånplader kan skydes igennem.';
 if(typeof ZPOS!=='undefined'&&ZPOS.inferno)ZPOS.inferno.CAR=[155,185];
 if(typeof TXM!=='undefined')delete TXM.inferno;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('inferno'))delete TBC[k]}
{const _rfI=renderFaq;renderFaq=function(){_rfI();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;
 f.insertAdjacentHTML('beforeend',`<div class="tm"><h3>de_inferno: zoner</h3><div style="padding:3px 0">T-spawn går ikke direkte til Top banana – T skal via Mid. <b>Car</b> ligger mellem Banana og B: en lille, trang zone med 3 gemmesteder bag sandsække, men trætønderne og spånpladerne kan skydes igennem.</div></div>`)}}


/* ===== FASE 60: de_dust2 – CT-spawn og Long når kun A via Car ===== */
{const m=MAPS.dust2,rm=(a,b)=>{m.edges=m.edges.filter(e=>!((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))};
 rm('CT','A');rm('LA','A');rm('LA','CAR');m.edges.push(['LA','CAR',3]);
 m.exits.CT=['CAR','MD'];
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='dust2')CUR='';
 if(typeof TXM!=='undefined')delete TXM.dust2;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('dust2'))delete TBC[k]}
{const _rfC=renderFaq;renderFaq=function(){_rfC();const f=$('fq');if(!f||!f.querySelectorAll)return;const h=[...f.querySelectorAll('h3')].find(x=>x.textContent==='de_dust2: zoner');
 if(h&&h.parentElement)h.parentElement.insertAdjacentHTML('beforeend','<div style="padding:3px 0">Både CT-spawn og Long når kun A via Car.</div>')}}
// de_aztec: byggerens kort flyttet, så ingen forbindelseslinje går gennem en zone, den ikke er forbundet til (fx T-connector–Mid gennem CT-vand)
if(typeof ZPOS!=='undefined')ZPOS.aztec={A:[110,110],TP:[290,70],CT:[460,80],B:[690,140],BC:[580,220],CBH:[660,320],BR:[580,420],TBH:[480,490],MID:[420,270],MS:[215,320],CW:[120,410],RA:[80,250],CA:[260,180],TC:[350,470],WA:[180,530],TS:[340,585]};
if(typeof ZPOS!=='undefined'){ZPOS.dust2.CAR=[635,255];ZPOS.inferno.CH=[300,175]}
// de_aztec: T-connector og Mid er ikke forbundet (Mid nås via Connector til A, CT-brohus eller Mid stairs)
{const m=MAPS.aztec;m.edges=m.edges.filter(e=>!((e[0]==='TC'&&e[1]==='MID')||(e[0]==='MID'&&e[1]==='TC')));delete m.adj;delete m.sp;delete m.spx;if(CUR==='aztec')CUR='';
 if(typeof TXM!=='undefined')delete TXM.aztec;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('aztec'))delete TBC[k]}


/* ===== FASE 61: de_dust2 – finere zoner, sigtelinjer, choke-bredder og langsommere bevægelse ===== */
// Nye zoner: Top mid (TM), Outside long (OL), B doors (BD) og Catwalk (CAT). Mid (MID) bliver til Xbox og beholder sit ID.
// Sigtelinjer (SL): zoner, der kan skyde til og fra hinanden. Afstand k/m/l giver aim-straf (mindre for AWP), højde giver fordel.
//   Lange linjer stopper ikke bevægelse – man kan skyde, mens man går forbi. Korte og mellemlange holder én fast i kampen.
// Choke-bredder (CHW): højst <bredde> spillere fra samme hold kan gå ind i en forbindelse pr. CHK.gap ticks; resten venter.
//   Forsvareren får en lille pre-aim-bonus mod den, der lige er kommet gennem en bredde 1–2-choke.
// Tempo: mapets afstande ganges med m.tf (dust2: 1,2). Rundetiden er uændret.
const SLN={dust2:[['CAR','LA','m'],['CAR','CT','k'],['CAR','A','k'],['MD','TM','l'],['MD','MID','m'],['SH','MID','m','SH'],['SH','LM','k','SH'],['MD','BX','m'],
 ['PIT','LA','l'],['PIT','CD','l'],['A','LA','l'],['B','BD','k'],['CT','MD','k'],['B','TB','k'],['LA','CD','k'],['MD','CAT','m'],['SN','B','k'],['SN','MD','k']]};
const SLP={k:.02,m:.06,l:.14,awp:.25,hi:.04};
let XZB=1;// gemmesteds- og først-i-zonen-bonusser over en sigtelinje (1 = fuld bonus)
const SLI={};function slG(a,b){if(!a||!b||a===b)return null;let I=SLI[CUR];if(!I){I=SLI[CUR]={};for(const[x,y,r,hi]of SLN[CUR]||[]){(I[x]=I[x]||{})[y]={r,hi};(I[y]=I[y]||{})[x]={r,hi}}}return I[a]&&I[a][b]||null}
function xz(a,b){return !!slG(a,b)}
const slPin=(a,b)=>{if(a===b)return true;const s=slG(a,b);return !!s&&s.r!=='l'};
const CHW={dust2:{'TS-MK':5,'MK-TB':2,'TB-B':2,'TB-LT':2,'LT-LM':2,'TS-TM':3,'TS-OL':5,'OL-LD':2,'OL-TM':3,'TM-MID':4,'MID-LM':4,'MID-CAT':3,'CAT-SH':2,'LM-BX':1,'BX-SH':1,
 'LM-MD':3,'MD-CT':2,'MD-BD':2,'BD-B':2,'LD-CD':1,'CD-LA':2,'LA-PIT':3,'LA-CAR':5,'CAR-CT':5,'CAR-A':5,'SH-A':2,'MD-SN':1,'SN-B':1}};
const CHK={def:5,gap:3,pre:{1:.06,2:.03},preT:2};
function chW(a,b){const W=CHW[CUR];if(!W)return CHK.def;return W[a+'-'+b]||W[b+'-'+a]||(CHK.def===5?4:CHK.def)}
function chkQ(p,a,b){if(!CHW[CUR])return 0;const w=chW(a,b);if(w>=5)return 0;R.chq=R.chq||{};const k=p.side+a+'>'+b,L=R.chq[k]||(R.chq[k]=Array(w).fill(-99));
 let i=0;for(let j=1;j<L.length;j++)if(L[j]<L[i])i=j;const st=Math.max(R.tick,L[i]);L[i]=st+CHK.gap;return st-R.tick}
// ekstra træfchance: sigtelinje (afstand, højde) og pre-aim mod den, der lige er kommet gennem en smal choke
function xMod(p,t,gt){let c=0;
 if(t.zone!==p.zone){const s=slG(p.zone,t.zone);if(s){c-=SLP[s.r]*(gt==='sniper'?SLP.awp:1);if(s.hi)c+=s.hi===p.zone?SLP.hi:-SLP.hi}}
 else if(CHW[CUR]&&t.from&&p.arr<t.arr&&R.tick-t.arr<CHK.preT*TPS){const w=chW(t.from,t.zone);if(CHK.pre[w])c+=CHK.pre[w]}
 return c}
// info: ser en CT T i en site-zone på den anden side af en sigtelinje, kan IGL'en rotere dertil
function slTo(p,es){const n={};for(const q of es)if(q.zone!==p.zone&&RSITE[q.zone])n[RSITE[q.zone]]=(n[RSITE[q.zone]]||0)+1;let b=null;for(const k in n)if(!b||n[k]>n[b])b=k;return b}
// byggeren: gangtid med mapets tempo
function tbDij(map,sd,a){const m=MAPS[map],f=m.tf||1,blk=sd==='T'?'CT':'TS',D={[a]:0},P={},Q=new Set(Object.keys(m.zn)),W={};m.edges.forEach(([x,y,d0])=>{(W[x]=W[x]||{})[y]=d0*2.4*f/TPS;(W[y]=W[y]||{})[x]=d0*2.4*f/TPS});
 while(Q.size){let u=null;for(const k of Q)if(D[k]!=null&&(u===null||D[k]<D[u]))u=k;if(u===null)break;Q.delete(u);if(u===blk&&u!==a)continue;for(const v in W[u]){const nd=D[u]+W[u][v];if(D[v]==null||nd<D[v]){D[v]=nd;P[v]=u}}}return{D,P}}
{const m=MAPS.dust2,rm=(a,b)=>{m.edges=m.edges.filter(e=>!((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))};
 rm('TS','MID');rm('TS','LD');rm('LD','MID');rm('MD','B');rm('MID','SH');
 Object.assign(m.zn,{
  TM:{ang:3,obs:1,rng:.8,ch:.4,hz:.3,tr:.4,tv:.5,st:.2},               // Top mid: bred, åben, få gemmesteder
  OL:{ang:3,obs:3,rng:.4,ch:.4,hz:.4,tr:.5,tv:.3,st:.3},               // Outside long: T's samlepunkt før dørene
  BD:{ang:2,obs:2,rng:.2,ch:.9,hz:.6,tr:.8,tv:.4,st:.5,wb:.5},         // B doors: smal dobbeltdør, kan skydes igennem
  CAT:{ang:2,obs:2,rng:.4,ch:.6,hz:.5,tr:.6,tv:.4,st:.3,hd:.2},
  SN:{ang:1,obs:1,rng:.3,ch:.8,hz:.7,tr:.8,tv:.4,st:.3}});            // Snipers nest: lille hul i væggen, plads til én      // Catwalk: smal og lidt hævet
 Object.assign(m.zn.MID,{rng:.6,snip:.05});// Xbox: midten af Mid – den lange AWP-linje går nu Mid doors ↔ Top mid
 m.edges.push(['TS','TM',3],['TM','MID',3],['TS','OL',3],['OL','LD',3],['OL','TM',2],['MID','CAT',2],['CAT','SH',2],['MD','BD',2],['BD','B',2.5],['MD','SN',2],['SN','B',3]);
 Object.assign(m.zname,{MID:'Xbox',TM:'Top mid',OL:'Outside long',BD:'B doors',CAT:'Catwalk',SN:'Snipers nest'});
 Object.assign(m.rsite,{BD:'B',CAT:'A',SN:'B'});
 m.exits.TS=['OL','TM','MK'];
 m.tf=1.2;
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='dust2')CUR='';delete SLI.dust2;
 if(typeof ZDESC!=='undefined'&&ZDESC.dust2)Object.assign(ZDESC.dust2,{MID:'Xbox: kassen midt på Mid. Herfra går Catwalk op til Short.',TM:'Top mid: bred og åben. Ses fra Mid doors på lang afstand.',OL:'Outside long: T samler sig her før T doors og kan rotere til Top mid.',BD:'B doors: smal dobbeltdør mellem Mid doors og B. Kan skydes igennem.',CAT:'Catwalk: smal og lidt hævet vej fra Xbox op til Short.',SN:'Snipers nest: lille hul i væggen mellem Mid doors og B med plads til én. Kan skyde til og fra B og Mid doors.'});
 if(typeof ZPOS!=='undefined')ZPOS.dust2={CT:[470,80],A:[675,115],B:[120,120],BD:[235,170],SN:[250,240],MD:[345,200],SH:[515,280],BX:[415,300],CAR:[640,250],PIT:[780,250],LA:[730,350],CD:[720,455],LD:[640,530],OL:[540,575],TS:[395,600],TM:[440,500],MID:[440,400],CAT:[525,365],LM:[320,345],LT:[205,300],TB:[100,360],MK:[235,500]};
 if(typeof TXM!=='undefined')delete TXM.dust2;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('dust2'))delete TBC[k]}
{const _rfS=renderFaq;renderFaq=function(){_rfS();const f=$('fq');if(!f||!f.querySelectorAll)return;const h=[...f.querySelectorAll('h3')].find(x=>x.textContent==='de_dust2: zoner');
 if(h&&h.parentElement)h.parentElement.insertAdjacentHTML('beforeend',`<div style="padding:3px 0"><b>Mid</b> er delt i Top mid (T-siden), Xbox (midten) og Catwalk (op til Short). T-spawn går til Top mid, Outside long og Marked; Outside long fører videre til T doors og Top mid. <b>B doors</b> ligger mellem Mid doors og B. <b>Snipers nest</b> er en ekstra vej fra Mid doors til B: et lille hul i væggen med plads til én ad gangen, som kan skyde til og fra både B og Mid doors.</div>
<div style="padding:3px 0"><b>Sigtelinjer:</b> nogle zoner kan skyde til og fra hinanden, fx Mid doors ↔ Top mid, Pit ↔ Long, Short ↔ Lower mid og B ↔ Upper tunnels. Der er aim-straf efter afstanden (kort ${SLP.k*100}, mellem ${SLP.m*100}, lang ${SLP.l*100} procentpoint – AWP kun en fjerdedel), og den højeste side får +${SLP.hi*100}. Over lange sigtelinjer kan man skyde, mens man går forbi; korte og mellemlange holder én fast i kampen. Ser CT T i en zone ved et site, kan IGL'en rotere dertil.</div>
<div style="padding:3px 0"><b>Chokes:</b> hver forbindelse har en bredde fra 1 (én ad gangen, fx T doors → CT doors og Box) til 5 (helt åbent). Går flere fra samme hold gennem en smal choke, må de vente på tur (ca. ${CHK.gap/TPS} sek. pr. person pr. bane). Forsvareren får en lille bonus mod den, der lige er kommet gennem en choke med bredde 1–2.</div>
<div style="padding:3px 0"><b>Tempo:</b> alle afstande på de_dust2 er 20 % længere end før. Rundetiden er uændret.</div>`)}}


/* ===== FASE 62: AI-hold laver flere modsvar ===== */
// Nye kandidater: 30 % mutationer, 20 % helt nye, modsvar 30 % × (0,5 + taktisk evne), resten kopier. Modsvar rettes stadig mod det, holdet selv har tabt mest til.
Object.assign(TXC,{pMut:.3,pNew:.2,pCounter:.3});

// Modsvar bygges nu også helt nyt fra byggeklodserne, rettet mod den taktik, holdet har tabt mest til:
//  CT mod en T-taktik: 3-5 CT på det site, T-taktikken går efter (resten fordelt). T mod en CT-taktik: angreb på det site, CT-taktikken har færrest på.
function txCtrBuild(X,sd,map,tg){const I=txInfo(map,sd==='T'?'CT':'T',tg),m=X.m,SS=X.SITES;
 if(sd==='CT'){const st=I&&SS.includes(I.st)?I.st:txPick(SS),o=SS.find(s=>s!==st),fS=X.Z.filter(z=>m.rsite[z]===st&&z!==st),mids=X.Z.filter(z=>!m.rsite[z]&&z!=='TS');
  const nS=3+Math.floor(txR()*3),nO=Math.min(5-nS,Math.floor(txR()*2)+(nS<5?1:0)),pos=[];
  for(let i=0;i<nS;i++)pos.push(txR()<.25&&fS.length?txPick(fS):st);for(let i=0;i<nO;i++)pos.push(o);while(pos.length<5)pos.push(mids.length?txPick(mids):o);
  const r=pos.map(z=>[[z,0]]),ends=r.map(txLast);return{r,sk:ends.every(z=>z===ends[0]),fb:pos.some(z=>!SS.includes(z)&&z!=='CT')&&txR()<.5,sy:'M'}}
 const n={};for(const s of SS)n[s]=0;if(I&&I.r)for(const w of I.r){const z=txLast(w),s=SS.includes(z)?z:m.rsite[z];if(s in n)n[s]++}
 const weak=SS.slice().sort((a,b)=>n[a]-n[b]||txR()-.5)[0];let b=txBuildT(X);for(let k=0;k<12&&b.st!==weak;k++)b=txBuildT(X);return b}
function txNewCand(d,map,sd){const X=txMap(map),li=txLiOf(d)[0],q=tcq(d),os=sd==='T'?'CT':'T',nC=1+Math.round(q*4),O=txMeta(li,map,os);
 const mut=b=>{const e0=txEnc(b.r);let r;for(let k=0;k<8;k++){r=sd==='T'?txMutT(X,b):txMutC(X,b);if(txEnc(r.r)!==e0)break}return r};/* ingen mutation, der er identisk med forælderen */let mode,r=txR(),id=null;
 mode=r<TXC.pMut?'mut':r<TXC.pMut+TXC.pNew?'ny':r<TXC.pMut+TXC.pNew+TXC.pCounter*(.5+q)?'modsvar':'kopi';
 if(mode==='modsvar'){const lost=d.tls&&d.tls[map]&&d.tls[map][sd]||{},lt=Object.entries(lost).sort((a,b)=>b[1]-a[1])[0];
  if(!lt)mode='mut';else{const tg=lt[0];if(!txInfo(map,os,tg))mode='mut';else{
   const pool=txPool(d,map,sd).map(n=>[n,txBl(li,map,sd,n,tg)+txG()*.05*(1.2-q)]).sort((a,b)=>b[1]-a[1]);
   const cur=Math.max(...d.tl[map][sd].map(n=>txBl(li,map,sd,n,tg)));
   if(pool.length&&pool[0][1]>cur+.02)id=pool[0][0];
   else{const bn=pool.length?pool[0][0]:d.tl[map][sd][0],b=txInfo(map,sd,bn);let best=null;
    for(let c=0;c<nC;c++){const nid=txMk(map,sd,mut(b),'modsvar',bn,d),v=txBl(li,map,sd,nid,tg)+txG()*.03;if(!best||v>best[1])best=[nid,v]}
    for(let c=0;c<nC;c++){const nid=txMk(map,sd,txCtrBuild(X,sd,map,tg),'modsvar',null,d),v=txBl(li,map,sd,nid,tg)+txG()*.03;if(!best||v>best[1])best=[nid,v]}id=best[0]}}}}
 if(!id&&mode==='kopi'){const pool=txPool(d,map,sd).filter(n=>WD.tx[n]||txR()<.3).map(n=>[n,txVal(li,map,sd,n,O)+txG()*.04*(1.2-q)]).sort((a,b)=>b[1]-a[1]);if(pool.length)id=pool[0][0];else mode='mut'}
 if(!id){const cands=[];for(let c=0;c<nC;c++){if(mode==='ny')cands.push(txMk(map,sd,sd==='T'?txBuildT(X):txBuildC(X),'ny',null,d));
   else{const sc=d.tl[map][sd].filter(n=>txInfo(map,sd,n)).map(n=>[n,txScore(d,map,sd,n,O)+txG()*.05*(1.2-q)]).sort((a,b)=>b[1]-a[1]);const bn=sc.length?sc[0][0]:txStdL(map,sd)[0];cands.push(txMk(map,sd,mut(txInfo(map,sd,bn)),'mut',bn,d))}}
  id=cands.map(n=>[n,txVal(li,map,sd,n,O)+txG()*.06*(1.2-q)]).sort((a,b)=>b[1]-a[1])[0][0]}
 d.tc[map][sd]=id;d.tch[map][sd]=mode;d.tst=d.tst||{};const S=d.tst[map]=d.tst[map]||{};S[id]=[0,0]}
