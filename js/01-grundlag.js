/* ===== KONFIG ===== */
const ARMOR_WEAR=3.5; // armor-slitage pr. skadepoint der reduceres
const TICK_MS=70,TPS=4,TK=1.6,ROUND_TICKS=420,BOMB_TICKS=160,PLANT_T=12,DEF_T=40,LATE=80,RELOAD=8; // 1 tick = 0,25 s. TK = omregning fra gamle 0,4 s-ticks (taktik-tidspunkter)
const TN={T:['A-rush','B-rush','A-fake til B','B-fake til A','3A-2B','2A-3B','Mid-push til A','Connector-cut til B','Sen A-hit','Sen B-hit'],CT:['Rush via A','Rush via B','4B-1A','4A-1B','2A-1C-2B','3C-1A-1B','Mid-kontrol','A-presning','Spredt info','Retake']};
// Managerens rækkefølge (hold 1). Ret frit. Hold 2 får tilfældig rækkefølge.
const mgr0=()=>({T:{pistol:TN.T.slice(0,4),standard:TN.T.slice(0,4),eco:TN.T.slice(0,4)},CT:{pistol:TN.CT.slice(0,4),standard:TN.CT.slice(0,4),eco:TN.CT.slice(0,4)}});
const MGR={csm:mgr0(),dust2:mgr0(),aztec:mgr0(),inferno:mgr0()}; // taktikrækkefølge pr. map
// spiller: [navn,aim,handling,playingIQ,quickness,awareness,determination,calmness,patience]
const TEAMS=[
{name:'Copenhagen Wolves',igl:0,lead:4,snip:[3,1,0,2,4],order:MGR,roles:{T:[0,1,2,3,4],CT:[0,1,2,3,4]},pl:[['Frost',74,68,70,72,70,66,62,64,27,4],['Viper',82,70,60,78,72,70,58,55,22,2],['Mads',70,66,76,68,74,60,70,72,29,3],['Kaizen',88,74,55,84,70,76,64,50,19,1],['Ørn',68,72,72,64,68,62,76,78,34,2]]},
{name:'Aarhus Storm',igl:2,lead:3,pl:[['Storm',76,64,66,74,68,72,60,60],['Blitz',80,68,58,80,70,68,56,52],['Nova',70,70,74,66,72,64,72,70],['Rask',84,72,56,82,68,74,62,54],['Hugin',66,66,70,62,70,60,74,76]]}];
/* ===== MAP de_csm ===== */
// Zone-egenskaber: ang = vinkler (Awareness), obs = gemmesteder (Positioning), rng = afstand 0 kort–1 lang (Aim ↔ Quickness/Handling),
// ch = choke/granatværdi (Playing IQ, Determination), hz = holde-zone (Patience), snip = sniper-bonus, tr = trade-værdi 0–1 (Teamplay: høj i tætte zoner)
// tv = transit-sårbarhed 0–1: hvor udsat en spiller er, når han kun passerer zonen (fx under rotation), mens modstanderen holder den
const ZN={TS:{obs:2,rng:.5,ch:.2,hz:.2,tr:.4},MID:{ang:3,obs:5,rng:.7,ch:.5,hz:.4,tr:.6,tv:.5},LA:{ang:4,snip:.08,obs:4,rng:.95,ch:.4,hz:.5,tr:.3},A:{ang:5,snip:.08,obs:3,rng:.6,ch:.4,hz:.8,tr:.5},CON:{ang:3,obs:6,rng:.2,ch:.8,hz:.5,tr:.9,tv:.8},TB:{ang:2,obs:7,rng:.15,ch:.9,hz:.6,tr:.9},B:{ang:2,obs:9,rng:.3,ch:.6,hz:.9,tr:.8},CT:{ang:3,obs:3,rng:.5,ch:.2,hz:.3,tr:.4}};
// Skill-koblinger (tunes med +10-testen)
// Efter plant: antal T på selve sitet (inkl. planter), resten spredes i tilstødende zoner. clear = sek. pr. (ang+obs) for CT at gå ind på et plantet site
// ctB/tB = træfbonus efter plant for CT / T
const POST={siteT:3,clear:1.3,ctB:0,tB:.01};
const SKC={aimB:.16,calmNerve:.5,hsA:.15,aimR:.22,awA:.4,awM:.7,qB:.25,qR:.7,recR:1,recM:.25,heB:.4,heC:1.2,heD:.6,heDC:.8,detB:.55,detC:.8,calmM:2,calmLate:.3,calmHit:.7,patPen:.25,patHold:.8,patT:25,
 // Teamplay: trW = trade-vindue (ticks, 12 = 3 sek.) efter en holdkammerats død · trQ = reaktionsfaktor mod drabsmanden · trB = træfbonus mod drabsmanden (×(Teamplay−50)/100 × zonens tr)
 // syW = maks. sek. en CT venter på holdkammerater ved retake (× holdets gns. Teamplay/100) · syMin = ingen venten, når bomben har under så mange sek. tilbage
 trW:12,trQ:.6,trB:.4,syW:4,syMin:15,
 // front = ekstra skytter pr. side ud over zonens vinkler (ang), der kan skyde samtidig · heS = HE-splash: andel af skaden, de andre modstandere i zonen får
 front:1,heS:.8,
 // Transit: tvR = ekstra reaktionstid (sek. × zonens tv) for en spiller, der kun passerer zonen · tvB = træfbonus (× tv) til den, der holder zonen, mod en spiller i transit
 tvR:1,tvB:.08,tvPre:0,
 // Støj: stS = hvor meget hurtigere den, der allerede står i zonen, opdager en, der kommer ind (× zonens st) · stC = chance (× st) for at CT hører mindst 2 T i en støjende site-zone og IGL'en kan kalde rotation
 // Højde: hdB = træfbonus (× zonens hd) til den, der stod først i zonen · Gennemskydelig: wbO = andel af gemmestedernes værdi, der forsvinder (× wb) · wbB = træfbonus (× wb × Playing IQ) med riffel/SMG mod flere modstandere i zonen
 stS:.5,stC:.6,hdB:.08,wbO:.6,wbB:.1};
// 15 spawn-positioner pr. side: forsinkelse (ticks) til hvert udgangspunkt = afstand fra positionens foretrukne udgang * 3 + række
const SPAWN=Array.from({length:15},(_,i)=>({col:i%3,row:i/3|0})),EXITS={TS:['LA','MID','TB'],CT:['A','CON','B']};
const EDGES=[['TS','MID',8],['TS','LA',10],['TS','TB',9],['MID','LA',5],['MID','CON',6],['MID','TB',5],['LA','A',6],['CON','A',5],['CON','B',6],['TB','B',4],['A','CT',7],['B','CT',6],['CON','CT',5],['CT','MID',6]];
const ZNAME={TS:'T-spawn',MID:'Mid',LA:'Lang A',A:'A-site',CON:'Connector',TB:'Tunnel B',B:'B-site',CT:'CT-spawn'};
const adj={};EDGES.forEach(([a,b,d0])=>{const d=Math.round(d0*2.4);(adj[a]=adj[a]||{})[b]=d;(adj[b]=adj[b]||{})[a]=d});
function dij(s){const D={[s]:0},P={},Q=new Set(Object.keys(adj));while(Q.size){let u=null;for(const k of Q)if(D[k]!==undefined&&(u===null||D[k]<D[u]))u=k;if(u===null)break;Q.delete(u);for(const v in adj[u]){const nd=D[u]+adj[u][v];if(D[v]===undefined||nd<D[v]){D[v]=nd;P[v]=u}}}return{D,P}}
const SP={};for(const z in adj)SP[z]=dij(z);
// dijB: som dij, men zonen blk kan ikke passeres (kun være start eller mål)
function dijB(s,blk){const D={[s]:0},P={},Q=new Set(Object.keys(adj));while(Q.size){let u=null;for(const k of Q)if(D[k]!==undefined&&(u===null||D[k]<D[u]))u=k;if(u===null)break;Q.delete(u);if(u===blk&&u!==s)continue;for(const v in adj[u]){const nd=D[u]+adj[u][v];if(D[v]===undefined||nd<D[v]){D[v]=nd;P[v]=u}}}return{D,P}}
const SPX={T:{},CT:{}};for(const z in adj){SPX.T[z]=dijB(z,'CT');SPX.CT[z]=dijB(z,'TS')}
const spS=(a,b,s)=>s&&SPX[s]&&SPX[s][a]&&SPX[s][a].D[b]!=null?SPX[s]:SP;
const dist=(a,b,s)=>spS(a,b,s)[a].D[b];
const hop=(a,b,s)=>{const S=spS(a,b,s);let c=b;while(S[a].P[c]!==a)c=S[a].P[c];return c};
/* ===== VÅBEN & TAKTIKKER ===== */
// SMG: nichevåben til force-buy. fall/acc = maks. tab i skade/træfchance på lang afstand (fuldt fra zone-afstand 1, intet under SMGV.r0)
const SMGV={dmg:26,rate:7,rec:.75,fall:.45,acc:.4,r0:.3};
// capM = faktor på loftet for rekylstraffen (standard 1) · d1 = ekstra ticks (0,25 s) fra spilleren er klar til første skud · c = kategori · s = kun for den side · hk = headshot dræber altid uden hjelm (rifler) · rate = skud pr. sek. · rec = rekyl
// headshot: ×2,5 uden hjelm, ×1,5 med hjelm (hjelm: Glock/P2000 3 hs, Deagle 2 hs, rifler 2 hs (FAMAS 3)). Kroppen: ×1, ben/arme: ×0,5
const W={glock:{n:'Glock',c:'pistol',s:'T',ap:.6,dmg:23,mag:20,mags:6,rate:3.2,rec:.4},p2000:{n:'P2000',c:'pistol',s:'CT',ap:.6,dmg:25,mag:13,mags:4,rate:2.6,rec:.4},deagle:{n:'Desert Eagle',c:'pistol',dmg:55,mag:7,mags:5,rate:2,rec:1.8,hs1:1.5},
 ak47:{n:'AK-47',c:'rifle',s:'T',hk:1,dmg:40,mag:30,mags:3,rate:5,rec:1},m4a4:{n:'M4A4',c:'rifle',s:'CT',hk:1,dmg:38,mag:30,mags:3,rate:5,rec:.9},galil:{n:'Galil',c:'rifle',s:'T',hk:1,dmg:34,mag:35,mags:3,rate:5,rec:1},famas:{n:'FAMAS',c:'rifle',s:'CT',hk:1,dmg:30,mag:25,mags:4,rate:5,rec:.85},
 smg:{n:'SMG',c:'smg',dmg:SMGV.dmg,mag:30,mags:4,rate:SMGV.rate,rec:SMGV.rec,fall:SMGV.fall,acc:SMGV.acc},sniper:{n:'AWP',c:'sniper',d1:1,dmg:115,mag:5,mags:4,rate:.8333,rec:0},he:{n:'HE-granat'}};
const PRICE={deagle:700,smg:1250,galil:1800,famas:2000,ak47:2700,m4a4:2900,sniper:5000,he:300,kevlar:500,helm:300};
// sidens våben: R1 = fuld riffel, R2 = billig riffel, P = gratis pistol. SWAP = tilsvarende våben på den anden side
const SIDEW={T:{R1:'ak47',R2:'galil',P:'glock'},CT:{R1:'m4a4',R2:'famas',P:'p2000'}},SWAP={ak47:'m4a4',m4a4:'ak47',galil:'famas',famas:'galil',glock:'p2000',p2000:'glock'};
// hs1 = faktor på headshot-andelen for første skud i en serie, når skytten står i zonen (ikke i transit) · HS1F = samme faktor for alle våben mod en flanket modstander (højeste faktor gælder)
const HS1F=1.5;
const swW=(ty,sd)=>W[ty]&&W[ty].s&&W[ty].s!==sd?SWAP[ty]:ty;
// headshot-skade: rifler dræber altid uden hjelm
const hsD=(w,t,b)=>t.helm?b*1.5:w.hk?Math.max(b*2.5,100):b*2.5;
// yndlingsvåben: et bestemt våben. Vægt = hvor ofte nye spillere får det
const FAVW={ak47:3,m4a4:3,galil:1,famas:1,sniper:2,smg:1,deagle:2,glock:1,p2000:1};
function rFav(){let x=rnd()*Object.values(FAVW).reduce((a,b)=>a+b,0);for(const k in FAVW){x-=FAVW[k];if(x<0)return k}return 'ak47'}
// gamle kategorier → bestemt våben
const favMig=v=>v==='rifle'?(rnd()<.5?'ak47':'m4a4'):v==='pistol'?['glock','p2000','deagle'][ri(0,2)]:v;
// rundeøkonomi: win = sejr · loss = tabsbonus efter 1., 2., 3., 4. og 5.+ tab i træk · dec = en sejr sænker tabsserien så mange trin (CS2: 1)
// start = tabsserie ved halvleg (1 = første tab giver 1.900, som i CS2) · max = maks. penge pr. spiller
const ECON_R={win:3250,loss:[1400,1900,2400,2900,3400],dec:1,start:1,max:16000};
// købsprioritet i standardrunder: [våben, kevlar, hjelm, HE]. R1 = AK-47/M4A4, R2 = Galil/FAMAS
const PR=[['sniper',1,1,1],['R1',1,1,1],['sniper',1,1,0],['R1',1,1,0],['sniper',1,0,0],['R1',1,0,0],['R2',1,1,1],['R2',1,1,0],['R2',1,0,0],['R1',0,0,1],['R1',0,0,0],['R2',0,0,1],['R2',0,0,0],['smg',1,1,0],['smg',1,0,0]];
const ROLES={T:['Pos 1 (IGL)','Pos 2','Pos 3','Pos 4','Pos 5'],CT:['Pos 1 (IGL)','Pos 2','Pos 3','Pos 4','Pos 5']};
const P=z=>[[z]],F5=z=>Array(5).fill(P(z));
// waypoints: [zone, tidligst-tick]. Slot 0 = bombebærer / plant-site (T)
const TT={'A-rush':()=>F5('A'),'B-rush':()=>F5('B'),
'A-fake til B':()=>[[['LA'],['MID',60],['CON',68],['B',76]],[['LA'],['MID',60],['CON',68],['B',76]],[['MID'],['CON',55],['B',68]],[['CON'],['B',70]],[['MID'],['CON',58],['B',70]]],
'B-fake til A':()=>[[['TB'],['MID',60],['CON',68],['A',76]],[['TB'],['MID',60],['CON',68],['A',76]],[['MID'],['CON',55],['A',68]],[['CON'],['A',70]],[['MID'],['CON',58],['A',70]]],
'3A-2B':()=>[[['A']],[['A']],[['MID'],['TB',30],['B',50]],[['CON'],['B',60]],[['A',20]]],'2A-3B':()=>[[['B']],[['B']],[['MID'],['LA',30],['A',50]],[['CON'],['A',60]],[['B',20]]]};
// T-taktikker: index = rolle (Entry, Support, Mid-kontrol, Lurker, Anker)
const TSITE={'A-rush':'A','B-rush':'B','A-fake til B':'B','B-fake til A':'A','3A-2B':'A','2A-3B':'B'},MAXSEL=5;
// beskrivelse pr. T-rolle (Entry, Support, Mid-kontrol, Lurker, Anker)
const TDESC={
'A-rush':['Løber direkte til A og tager første duel.','Følger tæt efter og planter bomben på A.','Løber direkte til A sammen med holdet.','Løber direkte til A sammen med holdet.','Går direkte til A og holder sitet efter plant.'],
'B-rush':['Løber direkte til B og tager første duel.','Følger tæt efter og planter bomben på B.','Løber direkte til B sammen med holdet.','Løber direkte til B sammen med holdet.','Går direkte til B og holder sitet efter plant.'],
'A-fake til B':['Viser sig på Lang A for at trække CT, og går efter ca. 24 sek. via Mid og Connector til B.','Gør som pos 1, men bærer bomben og planter på B.','Holder Mid og går via Connector til B efter ca. 22 sek.','Tager Connector tidligt, venter og går ind på B efter ca. 28 sek.','Følger via Mid og Connector og holder B efter plant.'],
'B-fake til A':['Viser sig i Tunnel B for at trække CT, og går efter ca. 24 sek. via Mid og Connector til A.','Gør som pos 1, men bærer bomben og planter på A.','Holder Mid og går via Connector til A efter ca. 22 sek.','Tager Connector tidligt, venter og går ind på A efter ca. 28 sek.','Følger via Mid og Connector og holder A efter plant.'],
'3A-2B':['Går direkte til A og tager første duel.','Går direkte til A og planter bomben.','Går via Mid og Tunnel B og presser B (efter ca. 20 sek.) sammen med Lurker.','Tager Connector og går ind på B efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så til A og holder sitet efter plant.'],
'2A-3B':['Går direkte til B og tager første duel.','Går direkte til B og planter bomben.','Går via Mid og Lang A og presser A (efter ca. 20 sek.) sammen med Lurker.','Tager Connector og går ind på A efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så til B og holder sitet efter plant.']};
const CC={'Rush via A':()=>F5('LA'),'Rush via B':()=>F5('TB'),'4B-1A':()=>['A','B','B','B','B'].map(P),'4A-1B':()=>['A','B','A','A','A'].map(P),
'2A-1C-2B':()=>['A','B','CON','A','B'].map(P),'3C-1A-1B':()=>['A','B','CON','CON','CON'].map(P)};
/* ===== HJÆLPERE ===== */
const $=id=>document.getElementById(id),rnd=Math.random,ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
let M,R,paused=false,timer;
const cnt=s=>R.cn[s];function recount(){R.cn={CT:0,T:0};M.players.forEach(p=>{if(p.alive)R.cn[p.side]++})}
const sum=t=>t.ps.reduce((s,p)=>s+p.aim+p.handling+p.iq+p.quick+p.aware+p.det+p.calm+p.pat,0);
function cK(p){const a=cnt(p.side),e=cnt(p.side==='CT'?'T':'CT'),late=R.planted?R.bombLeft<15*TPS:R.tick>ROUND_TICKS-15*TPS;return Math.max((a===1&&e===1?.5:a===1&&e>1?.4:a<=2&&e>a?.25:a<=3&&e>a?.15:0)*SKC.calmM,late?SKC.calmLate:0)}
function attr(p,k){let v=p[k];if(k!=='calm'&&k!=='pat'){if(p.alive)v-=(100-p.calm)*cK(p);v-=Math.min(30,Math.max(0,p.hold/TK-30)*(100-p.pat)/100*SKC.patPen)}{const w=p.gun&&p.gun.mag+p.gun.res>0?p.gun.type:p.pis?p.pis.type:'glock',pi=W[w]&&W[w].c==='pistol';if(p.fav===w&&!(p.spec==='pist'&&pi))v*=1.02;if(p.spec==='pist'&&pi)v*=1.03}if(k==='aware'&&p.spec==='eagle'&&p.zone&&(ZN[p.zone].obs||0)>=6)v*=1.08;return Math.max(0,v)}
const tn=t=>`<b class="${t.side==='CT'?'ct':'t'}">${t.name}</b>`;
function log(c,h){if(M.quiet)return;const f=$('feed'),d=document.createElement('div');d.className=c;d.innerHTML=h;f.prepend(d);while(f.children.length>400)f.lastChild.remove()}
const mk=ty=>({type:ty,mag:W[ty].mag,res:W[ty].mag*W[ty].mags});
const teamOf=s=>M.teams.find(t=>t.side===s);
