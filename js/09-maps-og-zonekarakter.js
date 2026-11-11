/* ===== FASE 12: TO MAPS – de_csm og de_dust2 ===== */
// Hvert map har sine egne zoner, kanter, navne, spawn-udgange og rotationsmål.
// useMap() skifter de globale map-tabeller (ZN, adj, SP, EXITS, ZNAME, RSITE) før hver kamp.
const MAPS={
 csm:{name:'de_csm',zn:JSON.parse(JSON.stringify(ZN)),edges:EDGES.map(e=>e.slice()),zname:{...ZNAME},exits:JSON.parse(JSON.stringify(EXITS)),rsite:{...RSITE},alias:{T:{},CT:{}},tac:{},tdesc:{},cdesc:{}},
 dust2:{name:'de_dust2',
  // ang = vinkler, obs = gemmesteder, rng = afstand (0 kort – 1 lang), ch = choke/granatværdi, hz = holde-zone, snip = sniper-bonus
  zn:{TS:{obs:2,rng:.5,ch:.2,hz:.2,tr:.4},
   LD:{ang:2,obs:3,rng:.2,ch:.9,hz:.6,tr:.8},            // Long doors: ren choke, flash/smoke-kamp ved dørene
   LA:{ang:3,obs:4,rng:1,ch:.3,hz:.6,snip:.12,tr:.3},    // Lang A: kortets AWP-bane
   A:{ang:6,obs:3,rng:.6,ch:.5,hz:.7,snip:.06,tr:.5},    // A-site: åbent, mange vinkler
   SH:{ang:3,obs:3,rng:.35,ch:.7,hz:.5,tr:.6},           // Short / catwalk
   MID:{ang:2,obs:4,rng:.9,ch:.6,hz:.4,snip:.10,tr:.3},  // Top mid / xbox: lang sigtelinje
   LM:{ang:3,obs:2,rng:.35,ch:.7,hz:.3,tr:.6,tv:.7},     // Lower mid: åbent kryds, farligt at krydse
   MD:{ang:2,obs:3,rng:.7,ch:.7,hz:.7,snip:.08,tr:.6,tv:.4},// Mid doors: CT's forpost og rotationsvej
   TB:{ang:2,obs:6,rng:.1,ch:.9,hz:.6,tr:.9},            // Tunnels: smalle gange
   B:{ang:4,obs:8,rng:.25,ch:.7,hz:.9,tr:.8},            // B-site: tæt, svær at retake
   CT:{ang:3,obs:3,rng:.6,ch:.3,hz:.3,tr:.4}},
  edges:[['TS','LD',6],['TS','MID',6],['TS','TB',8],['LD','LA',5],['LD','MID',5],['LA','A',6],['MID','LM',3],['MID','MD',5],['LM','SH',3],['LM','TB',3],['LM','MD',4],['SH','A',4],['TB','B',4],['MD','CT',3],['MD','B',6],['CT','A',6],['CT','B',5]],
  zname:{TS:'T-spawn',LD:'Long doors',LA:'Lang A',A:'A-site',SH:'Short A',MID:'Mid',LM:'Lower mid',MD:'Mid doors',TB:'Tunnels',B:'B-site',CT:'CT-spawn'},
  exits:{TS:['LD','MID','TB'],CT:['A','MD','B']},
  rsite:{A:'A',LA:'A',LD:'A',SH:'A',B:'B',TB:'B'},
  // de_csm-koder i fælles taktikker oversættes: T's Connector = Lower mid, CT's Connector = Mid doors
  alias:{T:{CON:'LM'},CT:{CON:'MD'}},
  // taktikker med egen rute på dette map (T: index = rolle Entry, Support, Mid-kontrol, Lurker, Anker)
  tac:{
   'A-rush':()=>[[['LA'],['A']],[['LA'],['A']],[['SH'],['A']],[['SH'],['A']],[['LA'],['A']]],
   '3A-2B':()=>[[['LA'],['A']],[['LA'],['A']],[['MID'],['TB',30],['B',50]],[['LM'],['B',60]],[['LA',20],['A']]],
   'A-presning':()=>['A','B','LD','LD','LD'].map(P)},
  tdesc:{
   'A-rush':['Løber gennem Long doors og Lang A til A og tager første duel.','Følger pos 1 over Long og planter bomben på A.','Løber via Mid, Lower mid og Short op på A.','Løber via Mid og Short op på A sammen med Mid-kontrol.','Følger over Long og holder A efter plant.'],
   'B-rush':['Løber gennem Tunnels til B og tager første duel.','Følger tæt efter og planter bomben på B.','Løber gennem Tunnels til B sammen med holdet.','Løber gennem Tunnels til B sammen med holdet.','Går gennem Tunnels til B og holder sitet efter plant.'],
   'A-fake til B':['Viser sig på Lang A for at trække CT, og går efter ca. 24 sek. via Long doors, Mid og Lower mid til B.','Gør som pos 1, men bærer bomben og planter på B.','Holder Mid og går via Lower mid og Tunnels til B efter ca. 22 sek.','Tager Lower mid tidligt, venter og går via Tunnels ind på B efter ca. 28 sek.','Følger via Mid og Lower mid og holder B efter plant.'],
   'B-fake til A':['Viser sig i Tunnels for at trække CT, og går efter ca. 24 sek. via Lower mid og Short til A.','Gør som pos 1, men bærer bomben og planter på A.','Holder Mid og går via Short til A efter ca. 22 sek.','Tager Lower mid tidligt, venter og går via Short ind på A efter ca. 28 sek.','Følger via Mid og Short og holder A efter plant.'],
   '3A-2B':['Går over Long til A og tager første duel.','Går over Long til A og planter bomben.','Går via Mid og Lower mid ind i Tunnels og presser B (efter ca. 20 sek.) sammen med Lurker.','Tager Lower mid og går via Tunnels ind på B efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så over Long til A og holder sitet efter plant.'],
   '2A-3B':['Går gennem Tunnels til B og tager første duel.','Går gennem Tunnels til B og planter bomben.','Går via Mid og Long doors ud på Lang A og presser A (efter ca. 20 sek.) sammen med Lurker.','Tager Lower mid og går via Short ind på A efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så gennem Tunnels til B og holder sitet efter plant.'],
   'Mid-push til A':['Tager Mid og presser via Short ind på A efter ca. 10 sek. og tager første duel.','Følger pos 1, bærer bomben og planter på A.','Tager Mid først og går via Long doors og Lang A ind på A efter ca. 18 sek.','Går via Mid og Lower mid og rammer A via Short efter ca. 13 sek.','Følger via Mid og holder A efter plant.'],
   'Connector-cut til B':['Går gennem Tunnels og leder angrebet ind på B efter ca. 12 sek.','Følger pos 1 gennem Tunnels, bærer bomben og planter på B.','Går via Mid til Lower mid og skærer CT\'s rotation fra A af.','Tager Lower mid tidligt og holder det sammen med Mid-kontrol.','Går gennem Tunnels ind på B og holder sitet efter plant.'],
   'Sen A-hit':['Tager Lang A og holder den, går ind på A efter ca. 44 sek.','Står i Mid, bærer bomben og går via Short ind på A efter ca. 45 sek.','Holder Mid og går via Long doors og Lang A ind på A efter ca. 47 sek.','Holder Lower mid og går via Short ind på A efter ca. 46 sek.','Starter i Tunnels, trækker via Lower mid mod A og holder sitet efter plant.'],
   'Sen B-hit':['Tager Tunnels og holder dem, går ind på B efter ca. 44 sek.','Står i Mid, bærer bomben og går via Lower mid og Tunnels ind på B efter ca. 45 sek.','Holder Mid og går via Tunnels ind på B efter ca. 47 sek.','Holder Lower mid og går via Tunnels ind på B efter ca. 46 sek.','Starter på Lang A, trækker via Mid mod B og holder sitet efter plant.']},
  cdesc:{
   'Rush via B':['Går frem gennem Tunnels sammen med holdet.','Går frem gennem Tunnels sammen med holdet.','Leder pushet ind i Tunnels og tager første duel.','Følger pushet i Tunnels.','Følger pushet i Tunnels og dækker bagud.'],
   '2A-1C-2B':['Holder A.','Holder B.','Holder Mid doors og kan nå begge sites.','Holder A sammen med A-ankeret.','Holder B sammen med B-ankeret.'],
   '3C-1A-1B':['Holder A alene.','Holder B alene.','Holder Mid doors.','Holder Mid doors.','Holder Mid doors.'],
   'A-presning':['Holder A.','Holder B.','Presser frem over Lang A og tager kampen ved Long doors.','Presser frem over Lang A og tager kampen ved Long doors.','Presser frem over Lang A og tager kampen ved Long doors.'],
   'Spredt info':['Holder A.','Holder B.','Går frem på Lang A for info.','Går frem i Mid for info.','Går frem i Tunnels for info.']}}};
/* de_aztec: CT-favoriseret. Lange T-ruter, korte CT-ruter, åbne T-veje med AWP-bonus, lette retakes */
MAPS.aztec={name:'de_aztec',
 zn:{TS:{obs:2,rng:.5,ch:.2,hz:.2,tr:.4},
  TC:{ang:2,obs:2,rng:.5,ch:.4,hz:.3,tr:.5},             // T-connector: T's knudepunkt
  CA:{ang:2,obs:1,rng:.95,ch:.3,hz:.8,snip:.10,tr:.3},   // Connector til A: lang, smal, ingen dækning
  A:{ang:3,obs:4,rng:.6,ch:.4,hz:.9,snip:.06,tr:.5},     // A-site
  TP:{ang:5,obs:6,rng:.25,ch:.5,hz:.7,tr:.9},            // Temple: dørene skal tjekkes
  MID:{ang:4,obs:3,rng:.7,ch:.5,hz:.6,snip:.08,tr:.4,tv:.5},// Mid: stort og åbent
  BC:{ang:2,obs:1,rng:.2,ch:.7,hz:.6,tr:.8},             // B-connector: smal passage
  TBH:{ang:5,obs:3,rng:.15,ch:.5,hz:.6,tr:.9},           // T-brohus: lille, hævet, mange vinkler
  BR:{ang:1,obs:0,rng:.6,ch:.3,hz:.8,snip:.08,tr:.3},    // Broen: én vej, ingen dækning
  CBH:{ang:5,obs:3,rng:.15,ch:.5,hz:.8,tr:.9},           // CT-brohus: B's chokepunkt
  WA:{ang:3,obs:2,rng:.5,ch:.4,hz:.4,tr:.4,tv:.6},       // Water: langsom vading, man er let at ramme undervejs
  B:{ang:3,obs:4,rng:.3,ch:.5,hz:.9,tr:.7},              // B-site
  CT:{ang:3,obs:3,rng:.5,ch:.2,hz:.3,tr:.4}},
 edges:[['TS','TC',5],['TS','WA',6],['TC','CA',4],['TC','MID',4],['TC','TBH',3],['CA','A',7],['A','TP',4],['TP','CT',2],['MID','BC',4],['BC','CBH',3],['TBH','BR',3],['BR','CBH',4],['CBH','B',3],['B','CT',3],['WA','TBH',4],['WA','MID',6],['WA','CA',5],['WA','A',11]],
 zname:{TS:'T-spawn',TC:'T-connector',CA:'Connector til A',A:'A-site',TP:'Temple',MID:'Mid',BC:'B-connector',TBH:'T-brohus',BR:'Broen',CBH:'CT-brohus',WA:'Water',B:'B-site',CT:'CT-spawn'},
 exits:{TS:['TC','WA'],CT:['TP','B']},
 rsite:{A:'A',CA:'A',TP:'A',B:'B',CBH:'B',BC:'B',BR:'B'},
 alias:{T:{LA:'CA',TB:'BR',CON:'WA'},CT:{LA:'CA',TB:'CBH',CON:'MID'}},
 tac:{
  'A-rush':()=>[[['CA'],['A']],[['CA'],['A']],[['WA'],['A']],[['WA'],['A']],[['CA'],['A']]],
  'B-rush':()=>[[['BR'],['B']],[['BR'],['B']],[['MID'],['B']],[['MID'],['B']],[['BR'],['B']]],
  'A-fake til B':()=>[[['CA'],['TC',60],['BR',68],['B',76]],[['CA'],['TC',60],['BR',68],['B',76]],[['MID'],['BC',55],['B',68]],[['TBH'],['B',70]],[['MID'],['BC',58],['B',70]]],
  'B-fake til A':()=>[[['TBH'],['TC',60],['CA',68],['A',76]],[['TBH'],['TC',60],['CA',68],['A',76]],[['MID'],['CA',55],['A',68]],[['WA'],['A',70]],[['MID'],['CA',58],['A',70]]],
  'Rush via B':()=>F5('TBH')},
 tdesc:{
  'A-rush':['Løber via T-connector og Connector til A og tager første duel.','Følger pos 1 over Connector til A og planter bomben på A.','Løber gennem vandet op på A.','Løber gennem vandet op på A sammen med Mid-kontrol.','Følger over Connector til A og holder A efter plant.'],
  'B-rush':['Løber via T-brohus over broen og tager første duel ved CT-brohus.','Følger pos 1 over broen og planter bomben på B.','Løber via Mid og B-connector til B.','Løber via Mid og B-connector til B sammen med Mid-kontrol.','Følger over broen og holder B efter plant.'],
  'A-fake til B':['Viser sig i Connector til A for at trække CT, og går efter ca. 24 sek. via T-connector og over broen til B.','Gør som pos 1, men bærer bomben og planter på B.','Holder Mid og går via B-connector til B efter ca. 22 sek.','Venter i T-brohus og går over broen ind på B efter ca. 28 sek.','Følger via Mid og B-connector og holder B efter plant.'],
  'B-fake til A':['Viser sig i T-brohus for at trække CT, og går efter ca. 24 sek. via T-connector og Connector til A til A.','Gør som pos 1, men bærer bomben og planter på A.','Holder Mid og går via Connector til A ind på A efter ca. 22 sek.','Venter i vandet og går op på A efter ca. 28 sek.','Følger via Mid og Connector til A og holder A efter plant.'],
  '3A-2B':['Går over Connector til A og tager første duel.','Går over Connector til A og planter bomben.','Går via Mid og T-brohus ud på broen og presser B (efter ca. 20 sek.) sammen med Lurker.','Går ned i vandet og videre over broen ind på B efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så til A og holder sitet efter plant.'],
  '2A-3B':['Går over broen til B og tager første duel.','Går over broen til B og planter bomben.','Går via Mid og T-connector ind i Connector til A og presser A (efter ca. 20 sek.) sammen med Lurker.','Går gennem vandet og op på A efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så over broen til B og holder sitet efter plant.'],
  'Mid-push til A':['Tager Mid og presser via Connector til A ind på A efter ca. 10 sek. og tager første duel.','Følger pos 1, bærer bomben og planter på A.','Tager Mid først og går via Connector til A ind på A efter ca. 18 sek.','Går fra Mid ned i vandet og op på A efter ca. 13 sek.','Følger via Mid og holder A efter plant.'],
  'Connector-cut til B':['Går over broen og leder angrebet ind på B efter ca. 12 sek.','Følger pos 1 over broen, bærer bomben og planter på B.','Går via Mid ned i vandet og holder det, så CT ikke kan flanke.','Tager vandet tidligt og holder det sammen med Mid-kontrol.','Går over broen ind på B og holder sitet efter plant.'],
  'Sen A-hit':['Tager Connector til A og holder den, går ind på A efter ca. 44 sek.','Står i Mid, bærer bomben og går via Connector til A ind på A efter ca. 45 sek.','Holder Mid og går via Connector til A ind på A efter ca. 47 sek.','Holder vandet og går op på A efter ca. 46 sek.','Starter på broen, trækker via Mid mod A og holder sitet efter plant.'],
  'Sen B-hit':['Tager broen og holder den, går ind på B efter ca. 44 sek.','Står i Mid, bærer bomben og går via B-connector ind på B efter ca. 45 sek.','Holder Mid og går over broen ind på B efter ca. 47 sek.','Holder vandet og går over broen ind på B efter ca. 46 sek.','Starter i Connector til A, trækker via Mid mod B og holder sitet efter plant.']},
 cdesc:{
  'Rush via A':['Går frem gennem Connector til A sammen med holdet.','Går frem gennem Connector til A sammen med holdet.','Leder pushet ud i Connector til A og tager første duel.','Følger pushet i Connector til A.','Følger pushet i Connector til A og dækker bagud.'],
  'Rush via B':['Går over broen og ind i T-brohus sammen med holdet.','Går over broen og ind i T-brohus sammen med holdet.','Leder pushet over broen og tager første duel.','Følger pushet over broen.','Følger pushet over broen og dækker bagud.'],
  '2A-1C-2B':['Holder A.','Holder B.','Holder Mid.','Holder A sammen med A-ankeret.','Holder B sammen med B-ankeret.'],
  '3C-1A-1B':['Holder A alene.','Holder B alene.','Holder Mid.','Holder Mid.','Holder Mid.'],
  'A-presning':['Holder A.','Holder B.','Presser frem i Connector til A.','Presser frem i Connector til A.','Presser frem i Connector til A.'],
  'Spredt info':['Holder A.','Holder B.','Går frem i Connector til A for info.','Går frem i Mid for info.','Holder CT-brohus for info.']}};
/* de_inferno: utility-mappet. Høj granatværdi, kort afstand, mange angrebsveje til A. Sidebalancen er et resultat af designet */
MAPS.inferno={name:'de_inferno',
 zn:{TS:{obs:2,rng:.5,ch:.2,hz:.2,tr:.4},                // brøndrummet + T's udgangsområde
  TB:{ang:2,obs:2,rng:.3,ch:.9,hz:.5,tr:.9},             // Top banana: granatkrigen starter
  BN:{ang:3,obs:3,rng:.55,ch:.9,hz:.8,snip:.04,tr:.9},   // Banana: lang og smal, CT holder ved bilen
  B:{ang:5,obs:7,rng:.3,ch:.8,hz:.9,tr:.7},              // B-site: springvand og kasser
  CH:{ang:5,obs:3,rng:.15,ch:.5,hz:.6,tr:.8},            // Church: lille rum med mange vinkler, fører fra CT-spawn ind på B
  MID:{ang:2,obs:3,rng:.75,ch:.5,hz:.5,snip:.06,tr:.3},  // Mid: kortets bedste sigtelinje
  MX:{ang:2,obs:0,rng:.2,ch:1,hz:.9,tr:.9,tv:.7},        // Mexico: smal, udsat for granater og den, der sidder der i forvejen
  M2:{ang:3,obs:3,rng:.6,ch:.5,hz:.5,tr:.4},             // 2nd mid
  SH:{ang:4,obs:3,rng:.35,ch:.7,hz:.6,tr:.7},            // Short: A fra syd
  LO:{ang:3,obs:4,rng:.6,ch:.6,hz:.6,snip:.04,tr:.3},    // Long: A fra nord
  A:{ang:6,obs:5,rng:.45,ch:.6,hz:.8,tr:.5},             // A-site: kortets flest vinkler
  PIT:{ang:3,obs:5,rng:.5,ch:.5,hz:.8,snip:.06,tr:.5},   // Pit: under A
  TAP:{ang:4,obs:5,rng:.15,ch:.9,hz:.6,tr:.9},           // T-apartments
  CAP:{ang:4,obs:5,rng:.15,ch:.9,hz:.7,tr:.9},           // CT-apartments
  AR:{ang:3,obs:2,rng:.5,ch:.4,hz:.6,tr:.4,tv:.5},       // Arch: åben passage Long–CT, CT's rotationsvej
  LB:{ang:4,obs:4,rng:.2,ch:.6,hz:.7,tr:.8},             // Library: tæt passage Long–CT
  CT:{ang:3,obs:3,rng:.5,ch:.2,hz:.3,tr:.4}},
 edges:[['TS','TB',4],['TB','BN',4],['BN','B',5],['TS','M2',6],['M2','SH',4],['SH','A',3],['TS','MID',6],['MID','LO',5],['LO','A',3],['TS','TAP',3],['TAP','CAP',6],['CAP','PIT',3],['PIT','A',3],['CT','AR',3],['AR','LO',2],['CT','LB',3],['LB','LO',3],['CT','B',3],['CT','CH',3],['CH','B',2],['MID','MX',2],['MX','M2',2],['MID','TB',3]],
 zname:{TS:'T-spawn',TB:'Top banana',BN:'Banana',B:'B-site',CH:'Church',MID:'Mid',MX:'Mexico',M2:'2nd mid',SH:'Short',LO:'Long',A:'A-site',PIT:'Pit',TAP:'T-apartments',CAP:'CT-apartments',AR:'Arch',LB:'Library',CT:'CT-spawn'},
 exits:{TS:['TB','MID','M2','TAP'],CT:['B','CH','LB','AR']},
 rsite:{A:'A',SH:'A',LO:'A',PIT:'A',B:'B',BN:'B',CH:'B'},
 alias:{T:{LA:'LO',TB:'BN',CON:'M2'},CT:{LA:'LO',TB:'BN',CON:'AR'}},
 tac:{
  'A-rush':()=>[[['SH'],['A']],[['SH'],['A']],[['LO'],['A']],[['PIT'],['A']],[['PIT'],['A']]],
  'A-fake til B':()=>[[['LO'],['MID',60],['TB',68],['B',76]],[['LO'],['MID',60],['TB',68],['B',76]],[['MID'],['TB',55],['B',68]],[['TB'],['B',70]],[['MID'],['TB',58],['B',70]]],
  },
 tdesc:{
  'A-rush':['Løber via 2nd mid og Short til A og tager første duel.','Følger pos 1 over Short og planter bomben på A.','Løber via Mid og Long ind på A.','Løber gennem T- og CT-apartments og rammer A fra Pit.','Løber gennem apartments og Pit og holder A efter plant.'],
  'B-rush':['Løber via Top banana ned ad Banana og tager første duel.','Følger tæt efter og planter bomben på B.','Løber ned ad Banana sammen med holdet.','Løber ned ad Banana sammen med holdet.','Går ned ad Banana og holder B efter plant.'],
  'A-fake til B':['Viser sig på Long for at trække CT, og går efter ca. 24 sek. via Mid og Top banana til B.','Gør som pos 1, men bærer bomben og planter på B.','Holder Mid og går via Top banana til B efter ca. 22 sek.','Venter på Top banana og går ned ad Banana ind på B efter ca. 28 sek.','Følger via Mid og Banana og holder B efter plant.'],
  'B-fake til A':['Viser sig på Banana for at trække CT, og går efter ca. 24 sek. via Mid og Mexico til 2nd mid og ind over Short.','Gør som pos 1, men bærer bomben og planter på A.','Holder Mid og går via Mexico og Short til A efter ca. 22 sek.','Venter i 2nd mid og går over Short ind på A efter ca. 28 sek.','Følger via Mid og Mexico og holder A efter plant.'],
  '3A-2B':['Går over Short til A og tager første duel.','Går over Short til A og planter bomben.','Går via Mid og Top banana ud på Banana og presser B (efter ca. 20 sek.) sammen med Lurker.','Venter i 2nd mid og går via Mexico, Mid og Banana ind på B efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så til A og holder sitet efter plant.'],
  '2A-3B':['Går ned ad Banana til B og tager første duel.','Går ned ad Banana til B og planter bomben.','Går via Mid ud på Long og presser A (efter ca. 20 sek.) sammen med Lurker.','Venter i 2nd mid og går over Short ind på A efter ca. 24 sek.','Venter ca. 8 sek. i T-spawn, går så ned ad Banana til B og holder sitet efter plant.'],
  'Mid-push til A':['Tager Mid og presser via Long ind på A efter ca. 10 sek. og tager første duel.','Følger pos 1, bærer bomben og planter på A.','Tager Mid først og går via Long ind på A efter ca. 18 sek.','Går fra Mid gennem Mexico og rammer A over Short efter ca. 13 sek.','Følger via Mid og holder A efter plant.'],
  'Connector-cut til B':['Går ned ad Banana og leder angrebet ind på B efter ca. 12 sek.','Følger pos 1 ned ad Banana, bærer bomben og planter på B.','Går via Mid til 2nd mid og holder den, så CT ikke kan presse ud fra A.','Tager 2nd mid tidligt og holder den sammen med Mid-kontrol.','Går ned ad Banana ind på B og holder sitet efter plant.'],
  'Sen A-hit':['Tager Long og holder den, går ind på A efter ca. 44 sek.','Står i Mid, bærer bomben og går via Long ind på A efter ca. 45 sek.','Holder Mid og går via Long ind på A efter ca. 47 sek.','Holder 2nd mid og går over Short ind på A efter ca. 46 sek.','Starter på Banana, trækker via Mid mod A og holder sitet efter plant.'],
  'Sen B-hit':['Tager Banana og holder den, går ind på B efter ca. 44 sek.','Står i Mid, bærer bomben og går via Banana ind på B efter ca. 45 sek.','Holder Mid og går via Banana ind på B efter ca. 47 sek.','Holder 2nd mid og går via Mexico, Mid og Banana ind på B efter ca. 46 sek.','Starter på Long, trækker via Mid mod B og holder sitet efter plant.']},
 cdesc:{
  'Rush via A':['Går frem gennem Long sammen med holdet.','Går frem gennem Long sammen med holdet.','Leder pushet ud på Long og tager første duel.','Følger pushet på Long.','Følger pushet på Long og dækker bagud.'],
  'Rush via B':['Tager bananakontrol sammen med holdet.','Tager bananakontrol sammen med holdet.','Leder pushet op ad Banana og tager første duel.','Følger pushet på Banana.','Følger pushet på Banana og dækker bagud.'],
  '2A-1C-2B':['Holder A.','Holder B.','Holder Arch og kan nå A hurtigt.','Holder A sammen med A-ankeret.','Holder B sammen med B-ankeret.'],
  '3C-1A-1B':['Holder A alene.','Holder B alene.','Holder Arch.','Holder Arch.','Holder Arch.'],
  'A-presning':['Holder A.','Holder B.','Presser frem på Long.','Presser frem på Long.','Presser frem på Long.'],
  'Spredt info':['Holder A.','Holder B.','Går frem på Long for info.','Går frem i Mid for info.','Går frem på Banana for info.']}};
/* ===== ZONE-KARAKTER: støj (st), højde (hd) og gennemskydelig (wb), 0–1 ===== */
// st = hvor meget bevægelse høres (Awareness, info og fakes) · hd = højdefordel for den, der står først · wb = dækning, der kan skydes igennem (Playing IQ, straffer stakke)
const ZT={
 csm:{MID:{st:.3,wb:.3},LA:{st:.1,hd:.2},A:{st:.2,hd:.8,wb:.2},CON:{st:.7,wb:.6},TB:{st:.9,wb:.3},B:{st:.4,hd:.1,wb:.7}},
 dust2:{LD:{st:.6},LA:{st:.1,hd:.1},A:{st:.2,hd:.6,wb:.2},SH:{st:.3,hd:.5},MID:{st:.2,wb:.3},LM:{st:.4,wb:.2},MD:{st:.3,wb:.5},TB:{st:.9,wb:.2},B:{st:.3,hd:.1,wb:.6}},
 aztec:{CA:{st:.1},A:{st:.2,hd:.5},TP:{st:.5,wb:.4},MID:{st:.2},BC:{st:.6},TBH:{st:.5,hd:.6},BR:{st:.3},CBH:{st:.4,hd:.3,wb:.5},WA:{st:.9},B:{st:.3,hd:.2,wb:.4}},
 inferno:{TB:{st:.5},BN:{st:.6,wb:.3},B:{st:.4,hd:.2,wb:.5},CH:{st:.4},MID:{st:.2},MX:{st:.3,wb:.3},M2:{st:.2},SH:{st:.3,hd:.5},LO:{st:.1},A:{st:.3,hd:.4,wb:.3},TAP:{st:.7,wb:.4},CAP:{st:.7,hd:.3,wb:.4},AR:{st:.2},LB:{st:.4,wb:.5}}};
for(const m in ZT)for(const z in ZT[m]){Object.assign(MAPS[m].zn[z],ZT[m][z]);if(m==='csm'&&ZN[z])Object.assign(ZN[z],ZT[m][z])}
// kort beskrivelse af hver zones karakter (FAQ)
const ZDESC={
 csm:{MID:'Knudepunktet. Åbent, men med lidt dækning, der kan skydes igennem.',LA:'Lang og stille sigtelinje. Et godt sted at komme ubemærket frem.',A:'Hævet site med mange vinkler. Få spillere kan holde det, og det er svært at retake.',CON:'Smal og larmende. Den korteste rotation, men tynde vægge og dyr at krydse, når den er taget.',TB:'Smal og meget larmende. Alle hører, når du kommer, så den er god til fakes.',B:'Mange gemmesteder, men tynde vægge. En stak på B kan sprayes igennem.'},
 dust2:{LD:'Dørene høres tydeligt.',A:'Hævet og åbent site.',SH:'Catwalk med højde over A.',MD:'CT\'s forpost. Dørene kan skydes igennem.',TB:'Meget larmende tunneler.',B:'Tæt site med tynde vægge.'},
 aztec:{WA:'Vandet plasker, så alle hører, når du vader.',TBH:'Lille, hævet brohus med mange vinkler.',CBH:'B\'s chokepunkt med tynde vægge.',TP:'Templet skal tjekkes, og væggene kan skydes igennem.',A:'Hævet site.',BC:'Smal og larmende passage.'},
 inferno:{BN:'Lang og smal. Granatkrigen høres langt væk.',TAP:'Larmende lejligheder med tynde vægge.',CAP:'Lejligheder med lidt højde ned mod Pit.',SH:'Højde ned over A.',A:'Mange vinkler og lidt højde.',LB:'Tæt passage med tynde vægge.',B:'Springvand og kasser med tynde vægge.'}};
/* map-rotation: to maps pr. sæson; et map spiller to sæsoner i træk og roterer så ud.
 Sæson k (fra rotBase) spiller MORD[k] og MORD[k+1]. rotOver låser en sæsons par (bruges ved migrering af gamle saves). */
const MORD=['dust2','aztec','inferno'],MORD4=['csm','dust2','aztec','inferno'];
function seasonMaps(o){if(WD.rotBase==null){WD.rotBase=WD.season;WD.rotV=3}if(WD.rotV===2)migrateRot3();const s=WD.season+(o||0);if(WD.rotOver&&WD.rotOver.s===s)return WD.rotOver.m;const n=MORD.length,k=(((s-WD.rotBase)%n)+n)%n;return[MORD[k],MORD[(k+1)%n]]}
// gemte spil fra 4-map-rotationen (med de_csm): sæsonens par bevares, og fra næste sæson fortsætter det map, der skulle fortsætte, i den nye rotation
function migrateRot3(){const s=WD.season,k4=(((s-WD.rotBase)%4)+4)%4,cur=WD.rotOver&&WD.rotOver.s===s?WD.rotOver.m:[MORD4[k4],MORD4[(k4+1)%4]];WD.rotOver={s,m:cur};let k=MORD.indexOf(cur[1]);if(k<0)k=0;WD.rotBase=s+1-k;WD.rotV=3}
// gemte spil fra 3-map-rotationen: sæsonens par bevares, og rotationen fortsætter, så intet map spiller mere end to sæsoner i træk
function migrateRot(){if(WD.rotBase==null||WD.rotV>=2)return;const k3=(((WD.season-WD.rotBase)%3)+3)%3;if(k3===2){WD.rotOver={s:WD.season,m:['aztec','csm']};WD.rotBase=WD.season+1}else WD.rotBase=WD.season-k3;WD.rotV=2}
const rotOut=()=>{const a=seasonMaps(),b=seasonMaps(1);return a.find(m=>!b.includes(m))};
const rotIn=()=>{const a=seasonMaps(),b=seasonMaps(1);return b.find(m=>!a.includes(m))};
const MAPIDS=['dust2','aztec','inferno'],mapN=id=>(MAPS[id]||MAPS.csm).name;
let CUR='csm';
const replObj=(o,n)=>{for(const k in o)delete o[k];Object.assign(o,n)};
function useMap(id){id=MAPS[id]?id:'csm';if(CUR===id)return;const m=MAPS[id];
 if(!m.adj){const a={};m.edges.forEach(([x,y,d0])=>{const d=Math.round(d0*2.4*(m.tf||1));(a[x]=a[x]||{})[y]=d;(a[y]=a[y]||{})[x]=d});m.adj=a}
 replObj(adj,m.adj);if(!m.sp){const sp={};for(const z in adj)sp[z]=dij(z);m.sp=sp}
 replObj(SP,m.sp);if(!m.spx){const x={T:{},CT:{}};for(const z in adj){x.T[z]=dijB(z,'CT');x.CT[z]=dijB(z,'TS')}m.spx=x}replObj(SPX.T,m.spx.T);replObj(SPX.CT,m.spx.CT);replObj(ZN,m.zn);replObj(ZNAME,m.zname);replObj(EXITS,m.exits);replObj(RSITE,m.rsite);CUR=id}
// liga: ulige ligakampe på sæsonens første map, lige på det andet – returkampen (15 runder senere) får altid det andet map
const lgMap=r=>seasonMaps()[r%2?0:1];
// CL: grupperunder efter samme princip (returkamp 5 runder senere), kval og slutspil får tilfældigt map
function assignMaps(){if(!WD)return;const sm=seasonMaps(),rm=m=>{if(m&&!m.map)m.map=sm[rnd()<.5?0:1]};
 if(WD.qg)WD.qg.forEach(g=>{g.sf.forEach(rm);rm(g.fin)});
 if(WD.cg)WD.cg.forEach(g=>g.rounds.forEach((r,i)=>r.forEach(m=>{if(!m.map)m.map=sm[i%2]})));
 if(WD.po)WD.po.forEach(r=>r&&r.forEach(rm))}
{const _oe=onEnter;onEnter=function(d){_oe(d);assignMaps()}}
/* kamp på et bestemt map */
function newMatch(defs,quiet,noDraw,map){
 useMap(map);
 if(!quiet)$('feed').innerHTML='';const rO=()=>{const o={};['T','CT'].forEach(s=>{o[s]={};['pistol','standard','eco'].forEach(b=>o[s][b]=shuffle(tnOf(CUR,s)))});return o};
 M={defs,map:CUR,round:0,score:[0,0],done:false,noDraw:!!noDraw,ot:[0,0],quiet:!!quiet,teams:[],players:[]};
 defs.forEach((d,i)=>{posFix(d);const od=d.order&&d.order.csm?d.order[CUR]:d.order,t={i,name:d.name,side:i?'T':'CT',lead:lvl(ig(d)[12],LT),snip:d.snip||shuffle([0,1,2,3,4]),ps:[],last:null,order:od||aiOrder(d,CUR)||rO(),ix:{T:{pistol:0,standard:0,eco:0},CT:{pistol:0,standard:0,eco:0}}};
  line(d).forEach((a,j)=>{const p={id:i*5+j,ti:i,name:a[0],...pst(a,a[19]===1?0:lvl(ig(d)[12],LT)),igl:a[19]===1,fav:a[17],tim:a[22]||5,spec:a[23]||'',src:a,rt:a[15],rc:a[16],money:800,gun:null,he:0,armor:0,helm:false,k:0,d:0,a:0};clAdj(p);t.ps.push(p);M.players.push(p)});M.teams.push(t)});
 if(!quiet)log('n',`Map: <b>${mapN(CUR)}</b>`);
 antiStrat();
 startRound();if(!quiet)render();
}
function simMatch(defs,nd,map){newMatch(defs,true,nd,map);while(!M.done){if(R.over){if(over())M.done=true;else startRound()}else tickRound()}gain(defs);return M.score}
function assign(t,name){
 const T=t.side==='T',mp=MAPS[CUR],al=mp.alias[T?'T':'CT'],defs=((mp.tac[name])||(T?TT:CC)[name])();let ps=t.ps.slice().sort((a,b)=>a.rc-b.rc);
 if(T){R.site=TSITE[name];R.carrier=ps.find(p=>p.rt===1)}
 ps.forEach(p=>{p.wp=defs[T?p.rt:p.rc].map(([z,at])=>({z:z[0]==='='?z.slice(1):al[z]||z,at:at||0}));p.wi=0});
}
function step(){
 if(!M||paused||M.done)return;
 if(M.map&&M.map!==CUR)useMap(M.map);
 if(R.over){if(--R.wait<=0){if(over()){M.done=true;gain(M.defs);const[a,b]=M.score;log('n',`<b>Kampen er slut: ${M.teams[0].name} ${a} – ${b} ${M.teams[1].name}${a===b?' (uafgjort)':''}</b>`)}else startRound()}}
 else tickRound();
 render();
 if(M.done&&M.onEnd){const f=M.onEnd;M.onEnd=null;f()}
}
{const _r=render;render=function(){_r();if(M&&M.map){const s=$('clk').querySelector('small');if(s)s.textContent=mapN(M.map)+' · '+s.textContent}}}
/* liga- og CL-dage */
function simDay(r,cl,done){KC=!!r;CLM=false;let i=0;const f=()=>{
 if(i<WD.lg.length){const g=WD.lg[i],mine=i===WD.me.li;i++;
  if(r)for(const [h,a] of g.fix[r-1]){if(mine&&(h===WD.me.ti||a===WD.me.ti))continue;const s=simMatch([g.teams[h].def,g.teams[a].def],false,lgMap(r));g.res.push({h,a,hs:s[0],as:s[1],rd:r})}
  $('nx').textContent=`Simulerer ${i}/24`;return setTimeout(f,0)}
 CLM=true;for(const x of cl){if(x.m.res||isMe(x.m.a)||isMe(x.m.b))continue;const s=simMatch([kdef(x.m.a),kdef(x.m.b)],x.m.nd!==false,x.m.map);x.m.res=[s[0],s[1]]}CLM=false;
 done()};f()}
function playMine(r,liveMatch){
 let defs,fin,nd=false,map;KC=!!r;CLM=!r;
 if(r){const g=WD.lg[WD.me.li],m=g.fix[r-1].find(x=>x.includes(WD.me.ti));defs=[g.teams[m[0]].def,g.teams[m[1]].def];map=lgMap(r);fin=()=>g.res.push({h:m[0],a:m[1],hs:M.score[0],as:M.score[1],rd:r})}
 else{const c=myCL();if(!c)return endDay();defs=[kdef(c.m.a),kdef(c.m.b)];nd=c.m.nd!==false;map=c.m.map;fin=()=>{c.m.res=[M.score[0],M.score[1]]}}
 {const f0=fin;fin=()=>{f0();spMatch(defs)}}
 if(!liveMatch){simMatch(defs,nd,map);fin();return after(r)}
 paused=false;$('pb').textContent='Pause';$('nm').disabled=true;show('mv');newMatch(defs,false,nd,map);
 M.onEnd=()=>{fin();$('nm').disabled=false;after(r)}}
function clToday(){const c=myCL();return c?`I dag: ${c.m.st||'Kvalifikation'} – ${knm(c.m.a)} mod ${knm(c.m.b)} · ${mapN(c.m.map)}`:'Ingen ligakamp i dag'}
/* liga-UI med map */

/* CL-bracket med map */
const bmM=m=>m?bm(m).replace(/<\/div>$/,`<div class="bt mu" style="font-size:10.5px">${m.map?mapN(m.map):''}</div></div>`):bm(m);
const bracketM=(R,L)=>`<div class="br">${R.map((r,i)=>`<div class="bc"><div class="mu bl">${L[i]}</div>${r.map(bmM).join('')}</div>`).join('')}</div>`;
function kvalHTML(){if(!WD.qg)return `<div class="tm"><h3>Lodtrækning tirsdag i uge 1</h3><div class="mu">${WD.qual.length} hold spiller om 12 pladser i grupper à 4. Hver kamp spilles på et tilfældigt af sæsonens to maps.</div></div>`;
 return WD.qg.map((g,i)=>`<div class="tm"><h3>Gruppe ${i+1}</h3>${bracketM([g.sf,[g.fin]],['Semifinaler','Finale'])}${g.win?`<div class="mu">Vinder: ${kf(g.win)}</div>`:''}</div>`).join('')}
function poHTML(){
 if(!WD.po)return `<div class="tm"><h3>Playoff trækkes mandag i uge 5</h3><div class="mu">De to bedste fra hver gruppe går videre. Hver kamp spilles på et tilfældigt af sæsonens to maps.</div></div>`;
 const P=WD.po,g=(a,i)=>a&&a[i]?a[i]:null;
 return `<div class="tm">${bracketM([P[0],P[1]||Array(4).fill(null),[g(P[2],0),g(P[3],0)],[g(P[4],0)]],['1/8-finaler','Kvartfinaler','Semifinaler','Finale'])}</div><div class="tm"><h3>Bronzekamp</h3><div style="max-width:180px">${bmM(g(P[5],0))}</div></div>`}
{const _cg=cgHTML;cgHTML=function(){return _cg()+(WD.cg?`<div class="eq" style="padding:0 2px 8px">Holdene i en gruppe mødes to gange: én gang på hvert af sæsonens maps (${seasonMaps().map(mapN).join(' og ')}).</div>`:'')}}
/* taktik-UI med undermenu pr. map */
const tDesc=(sd,n,k)=>{const D=MAPS[TU.map][sd==='T'?'tdesc':'cdesc'];return (D[n]&&D[n][k])||(sd==='T'?TDESC:CDESC)[n][k]};

/* FAQ */
{const _rf4=renderFaq;renderFaq=function(){_rf4();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Maps</h3>${li(['<b>Rotation:</b> der spilles på to maps pr. sæson. Et map spiller to sæsoner i træk og roterer så ud i én sæson: de_dust2 + de_aztec → de_aztec + de_inferno → de_inferno + de_dust2 → forfra.','<b>Liga:</b> hvert opgør spilles to gange, én gang på hvert af sæsonens maps. Ulige ligakampe er på det første map, lige på det andet.','<b>CL-gruppespil:</b> samme princip. Holdene i en gruppe mødes én gang på hvert map.','<b>CL-kval og slutspil:</b> hver kamp får et tilfældigt af sæsonens to maps, som trækkes, når kampen oprettes.','<b>de_dust2</b> belønner Aim og AWP: Lang A og Mid er lange sigtelinjer. T roterer via Mid, mens CT roterer kort gennem CT-spawn. B er tæt og svær at retake, A er åben med mange vinkler.','<b>de_aztec</b> er CT-favoriseret: T har lange ruter over åbne veje (Connector til A og broen), hvor CT\'s AWP får stor bonus, og en meget lang rotation mellem sites. CT når begge sites hurtigt og retaker let. Brohusene er små rum med mange vinkler, og Temple skal tjekkes grundigt.','<b>de_inferno</b> er utility-mappet: kortets høje granatværdier og korte afstande belønner Playing IQ, Determination, Quickness og Handling. T har tre veje til A: Short (via 2nd mid eller Top mid), Long (via Mid og Top mid) og apartments, der fører gennem Pit ud på Short. Mexico er et hurtigt skift mellem Mid og 2nd mid, og boiler forbinder apartments med 2nd mid. B ligger tæt på CT, men banana er lang og smal. CT-spawn ligger midt imellem sites, så CT\'s rotation er lang.','Hvert map har sin egen taktikliste (se Taktikker pr. map). Taktikker med samme navn følger mappets ruter. Hvert map har sin egen taktikrækkefølge under Taktik, også mappet uden for rotation, så du kan forberede dig.'])}</div>`)}}
