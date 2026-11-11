/* ===== FASE 63: de_inferno – finere zoner, sigtelinjer, choke-bredder og langsommere bevægelse ===== */
// Nye zoner: Boiler (BOI) midt i lejlighederne, Dark (DK) og Coffins (COF) som gemmesteder på B. Pit forbindes direkte til A,
// så T-spawn → A er lige langt via Short og via lejlighederne (13). Den gamle dækning (cv) erstattes af sigtelinjer. Tempo ×1,2.
{const m=MAPS.inferno,rm=(a,b)=>{m.edges=m.edges.filter(e=>!((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))};
 rm('TAP','CAP');
 for(const z in m.zn)delete m.zn[z].cv;
 Object.assign(m.zn,{
  BOI:{ang:2,obs:2,rng:.15,ch:.9,hz:.6,tr:.9,tv:.4,st:.6,wb:.3},   // Boiler: lille rum midt i lejlighederne
  DK:{ang:2,obs:6,rng:.25,ch:.6,hz:.8,tr:.6,tv:.3,st:.3},          // Dark: mørkt hjørne på B mod Banana-siden
  COF:{ang:2,obs:6,rng:.3,ch:.5,hz:.8,tr:.6,tv:.3,st:.3}});        // Coffins: kisterne bagerst på B
 m.edges.push(['TAP','BOI',3],['BOI','CAP',3],['PIT','A',1],['B','DK',1],['B','COF',1]);
 Object.assign(m.zname,{BOI:'Boiler',DK:'Dark',COF:'Coffins'});
 Object.assign(m.rsite,{DK:'B',COF:'B'});
 m.tf=1.2;
 SLN.inferno=[['LB','CT','k'],['CT','B','m'],['TM','MID','l'],['AR','TM','m'],['SH','A','k','SH'],['PIT','A','m'],['CAR','BN','k'],['CAR','B','k'],
  ['DK','CAR','k'],['COF','B','k'],['COF','CH','m'],['B','BN','l'],['M2','SH','m']];
 CHW.inferno={'TB-BN':3,'TS-M2':4,'M2-SH':2,'SH-A':3,'TS-MID':5,'LO-A':4,'TS-TAP':2,'TAP-BOI':1,'BOI-CAP':2,'CAP-PIT':2,'PIT-A':2,'CT-AR':3,'AR-LO':2,'CT-LB':2,'LB-LO':2,
  'CT-B':3,'CT-CH':3,'CH-B':2,'MID-MX':1,'MX-M2':1,'MID-TB':3,'PIT-SH':3,'TAP-M2':2,'MID-TM':4,'TM-LO':3,'TM-SH':2,'BN-CAR':2,'CAR-B':2,'B-DK':2,'B-COF':2};
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='inferno')CUR='';delete SLI.inferno;
 if(typeof ZDESC!=='undefined'&&ZDESC.inferno)Object.assign(ZDESC.inferno,{BOI:'Boiler: lille rum midt i lejlighederne. Døren ind fra T-apartments tager én ad gangen.',DK:'Dark: mørkt hjørne på B mod Banana-siden. Godt gemmested med sigt mod Car.',COF:'Coffins: kisterne bagerst på B. Gemmested med sigt over B og mod Church.',PIT:'Pit: gemmested ved A med direkte vej op på sitet.'});
 if(typeof ZPOS!=='undefined')ZPOS.inferno={CT:[450,80],B:[150,95],COF:[235,50],DK:[55,160],CH:[300,175],CAR:[160,200],BN:[160,295],TB:[190,420],MID:[360,400],MX:[440,460],M2:[520,495],TM:[460,320],SH:[590,400],LO:[640,280],A:[710,340],AR:[520,235],LB:[580,150],TS:[310,580],TAP:[555,590],BOI:[670,605],CAP:[775,560],PIT:[700,475]};
 if(typeof TXM!=='undefined')delete TXM.inferno;if(typeof TBC!=='undefined')for(const k in TBC)if(k.startsWith('inferno'))delete TBC[k]}
{const _rfI2=renderFaq;renderFaq=function(){_rfI2();const f=$('fq');if(!f||!f.querySelectorAll)return;const h=[...f.querySelectorAll('h3')].find(x=>x.textContent==='de_inferno: zoner');
 if(h&&h.parentElement)h.parentElement.insertAdjacentHTML('beforeend',`<div style="padding:3px 0">Lejlighederne er delt af <b>Boiler</b>, et lille rum, hvor døren fra T-apartments kun tager én ad gangen. <b>Pit</b> har en direkte vej op på A, så fra T-spawn er der lige langt til A via Short og via lejlighederne. På B ligger to gemmesteder: <b>Dark</b> mod Banana-siden og <b>Coffins</b> bagerst mod CT-siden.</div>
<div style="padding:3px 0"><b>Sigtelinjer</b> som på de_dust2, fx Library ↔ CT-spawn, CT-spawn ↔ B, Top mid ↔ Mid (lang), Short ↔ A (Short højest), Pit ↔ A, Car ↔ Banana og B, B ↔ Banana (lang) og 2nd mid ↔ Short. <b>Chokes</b>: fx Mexico (bredde 1 i begge ender) og døren til Boiler (bredde 1). Alle afstande er 20 % længere end før.</div>`)}}
