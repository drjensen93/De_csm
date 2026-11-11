/* ===== FASE 37: de_dust2 – nye og omdøbte taktikker ===== */
// Omdøbte taktikker får nye navne på de_dust2. De andre maps beholder de gamle navne. MAPS.dust2.ren flytter managerens gemte lister,
// og taktikstatistikken (WD.ts.dust2) flyttes ved indlæsning.
{const m=MAPS.dust2,W=(...z)=>z.map(x=>Array.isArray(x)?x:['='+x]);
 const ren=(sd,a,b,o)=>{const L=m.tn[sd],i=L.indexOf(a);if(i>=0)L[i]=b;const tac=m.tac[a]||(sd==='T'?TT:CC)[a];m.tac[b]=tac;
  const D=sd==='T'?m.tdesc:m.cdesc;D[b]=(o&&o.desc)||D[a]||(sd==='T'?TDESC:CDESC)[a];if(sd==='T')TSITE[b]=TSITE[a];STYLE[b]=STYLE[a];if(TSTACK.has(a))TSTACK.add(b);
  m.ren=Object.assign(m.ren||{},{[a]:b})};
 // T: omdøbninger
 ren('T','Connector-cut til B','B via Tunnels + Lower mid',{desc:['Går gennem Tunnels og leder angrebet ind på B efter ca. 12 sek.','Følger pos 1 gennem Tunnels, bærer bomben og planter på B.','Går via Mid til Lower mid og holder den. Dækker Mid doors.','Tager Lower mid tidligt og holder den sammen med Mid-kontrol.','Går gennem Tunnels ind på B og holder sitet efter plant.']});
 ren('T','Lang + Tunnels','A via Long + lurk i Tunnels');
 CHASE['A via Long + lurk i Tunnels']=CHASE['Lang + Tunnels'];CHASE_PRE['A via Long + lurk i Tunnels']=CHASE_PRE['Lang + Tunnels'];
 // T: omvejen gennem Mid fjernet (Tunnels → Lower mid direkte)
 m.tac['B-fake til A']=()=>{const E=W('TB',['LM',60],['A',76]);return[E,E,W('MID',['LM',55],['A',68]),W('LM',['A',70]),W('MID',['LM',58],['A',70])]};
 m.tac['Sen A-hit']=()=>[W('LA',['A',110]),W('MID',['A',112]),W('MID',['LA',100],['A',118]),W('LM',['A',116]),W('TB',['LM',80],['A',112])];
 // T: nye taktikker
 const BMA=W('TB','MD','CT','A');
 const add=(sd,n,f,desc,o)=>{m.tac[n]=f;m.tn[sd].push(n);(sd==='T'?m.tdesc:m.cdesc)[n]=desc;STYLE[n]=o.st;if(sd==='T')TSITE[n]=o.site;if(o.stack)TSTACK.add(n)};
 add('T','B til mid til A',()=>[BMA,BMA,BMA,BMA,BMA],
  ['Går gennem Tunnels og Lower mid til Mid doors, videre gennem CT-spawn og ind på A og tager første duel.','Følger samme vej, bærer bomben og planter på A.','Følger samme vej gennem Mid doors og CT-spawn ind på A.','Følger samme vej gennem Mid doors og CT-spawn ind på A.','Følger samme vej og holder A efter plant.'],{st:'A',site:'A',stack:1});
 add('T','B til mid til A + lurk på Long',()=>[BMA,BMA,BMA,W('LA'),BMA],
  ['Går gennem Tunnels og Lower mid til Mid doors, videre gennem CT-spawn og ind på A og tager første duel.','Følger samme vej, bærer bomben og planter på A.','Følger samme vej gennem Mid doors og CT-spawn ind på A.','Venter på Lang A. Når bomben er plantet, går han ind på A og tager CT\'erne i ryggen, når de retaker.','Følger samme vej og holder A efter plant.'],{st:'A',site:'A'});
 CHASE['B til mid til A + lurk på Long']=[3];// Lurker venter, til bomben er plantet (ingen CHASE_PRE)
 const SR=W('SH','A');
 add('T','Short rush',()=>[SR,SR,SR,SR,SR],
  ['Løber via Mid og Lower mid op på Short og tager første duel på A.','Følger tæt efter over Short og planter bomben på A.','Løber over Short til A sammen med holdet.','Løber over Short til A sammen med holdet.','Løber over Short til A og holder sitet efter plant.'],{st:'A',site:'A',stack:1});
 const SB=W('SH','A','CT','MD','B');
 add('T','Short til B',()=>[SB,SB,SB,W('TB',['B',40]),SB],
  ['Går over Short til A, videre gennem CT-spawn og Mid doors og ind på B og tager første duel.','Følger samme vej, bærer bomben og planter på B.','Følger samme vej over A, CT-spawn og Mid doors til B.','Venter i Tunnels og går ind på B efter ca. 16 sek., når stakken kommer.','Følger samme vej og holder B efter plant.'],{st:'M',site:'B'});
 // CT: Rush via A fortsætter fra T-spawn gennem Tunnels til B og hedder nu Sweep via Long til B
 {const R3=W('LA','LD','TS','TB','B');m.tac['Rush via A']=()=>[W('MD'),W('B'),R3,R3,R3]}
 ren('CT','Rush via A','Sweep via Long til B',{desc:['Holder Mid doors og dækker Lower mid og CT-spawn.','Holder B alene.','Presser over Lang A og gennem Long doors ind i T-spawn, tager T bagfra og fortsætter gennem Tunnels til B.','Følger pushet over Lang A, gennem T-spawn og Tunnels til B.','Følger pushet over Lang A, gennem T-spawn og Tunnels til B og dækker bagud.']});
 ren('CT','Rush via B','Sweep via Tunnels til A');
 ren('CT','3C-1A-1B','2C-2A-1B');
 const DM=W('SH',['A',40],'CT','MD','TB','B');
 add('CT','Delayed mid push',()=>[DM,DM,DM,DM,DM],
  Array(5).fill('Går til Short og venter ca. 10 sek. Går så via A og CT-spawn til Mid doors, videre gennem Lower mid og Tunnels og ind på B.'),{st:'M',stack:1});
}
// taktikstatistikken på de_dust2 flyttes til de nye navne
function d2Mig(){if(typeof WD!=='undefined'&&WD&&WD.ts)for(const mp of MAPIDS){const T=WD.ts[mp],rn=(MAPS[mp]&&MAPS[mp].ren)||{};if(!T)continue;for(const sd in T){const S=T[sd];for(const a in rn)if(S[a]&&!S[rn[a]]){S[rn[a]]=S[a];delete S[a]}}}cleanMGR()}
{const _lgR=loadGame;loadGame=function(){const ok=_lgR();if(ok)d2Mig();return ok}}
try{d2Mig()}catch(e){console.error(e)}

// målt matrix for de_dust2 efter de nye taktikker (2.750 fuldt købte runder og 250 pistolrunder pr. par, tilfældige AI-hold, blandet IGL-lederskab)
PM.dust2=[[33,47,25,27,13,33,57,47,31,58,74],[33,38,68,32,36,47,58,29,29,45,45],[55,59,69,35,58,62,41,45,36,47,52],[45,62,35,55,42,43,61,62,27,57,58],[42,35,39,86,48,45,68,61,45,61,53],[38,21,85,33,56,56,63,37,34,47,43],[51,55,34,80,44,51,68,66,34,61,72],[47,82,80,58,69,66,63,44,46,66,58],[57,80,28,48,29,38,51,55,42,60,42],[73,81,58,36,51,60,45,48,43,50,66],[58,79,45,37,40,49,39,42,39,52,36],[39,62,62,71,48,37,33,27,38,52,50],[45,56,33,54,31,49,66,46,45,64,65],[60,53,30,67,39,59,71,55,46,77,68],[33,44,33,58,31,45,49,47,40,61,60],[46,56,28,74,35,35,33,21,21,69,77]];
PMP.dust2=[[21,16,20,24,15,24,26,31,19,26,50],[8,29,47,22,21,28,22,4,15,33,9],[38,51,49,22,35,30,25,31,24,34,58],[28,42,22,42,25,32,50,52,20,30,50],[24,4,23,72,40,34,34,31,31,30,37],[12,16,70,16,32,28,14,9,14,24,5],[25,29,24,62,32,31,54,52,16,31,40],[29,70,67,46,58,40,28,18,26,52,25],[47,77,19,28,22,25,46,46,35,32,33],[59,69,37,26,36,27,35,29,35,35,55],[41,76,38,22,22,24,34,33,30,37,36],[22,33,29,56,30,18,17,13,26,34,41],[22,32,21,40,22,28,33,26,28,44,44],[31,35,23,50,24,38,37,36,26,59,54],[26,11,25,38,20,28,24,28,20,36,42],[37,16,24,61,19,23,21,13,14,51,62]];


/* ===== FASE 38: de_inferno – navne og beskrivelser efter de faktiske ruter + Sen A via CT-spawn ===== */
{const m=MAPS.inferno,W=(...z)=>z.map(x=>Array.isArray(x)?['='+x[0],x[1]]:['='+x]);
 const ren=(a,b,desc)=>{const L=m.tn.T,i=L.indexOf(a);if(i>=0)L[i]=b;m.tac[b]=m.tac[a]||TT[a];m.tdesc[b]=desc||m.tdesc[a]||TDESC[a];TSITE[b]=TSITE[a];STYLE[b]=STYLE[a];if(TSTACK.has(a))TSTACK.add(b);m.ren=Object.assign(m.ren||{},{[a]:b})};
 ren('Connector-cut til B','B via Banana + 2nd mid',['Går ned ad Banana og leder angrebet ind på B efter ca. 12 sek.','Følger pos 1 ned ad Banana, bærer bomben og planter på B.','Går via Mid og Mexico til 2nd mid og holder den. Dækker Short.','Tager 2nd mid tidligt og holder den sammen med Mid-kontrol.','Går ned ad Banana ind på B og holder sitet efter plant.']);
 ren('Connector-cut til A','A via Long + 2nd mid');
 Object.assign(m.tdesc,{
  'Mid-push til A':['Tager Mid og presser via Top mid og Short ind på A efter ca. 10 sek. og tager første duel.','Følger pos 1 via Top mid og Short, bærer bomben og planter på A.','Tager Mid først og går via Top mid og Long ind på A efter ca. 18 sek.','Går fra Mid gennem Mexico og 2nd mid og rammer A over Short efter ca. 13 sek.','Følger via Mid, Top mid og Short og holder A efter plant.'],
  'Sen A-hit':['Tager Long og holder den, går ind på A efter ca. 44 sek.','Står i Mid, bærer bomben og går via Top mid og Short ind på A efter ca. 45 sek.','Holder Mid og går via Top mid og Long ind på A efter ca. 47 sek.','Holder 2nd mid og går over Short ind på A efter ca. 46 sek.','Starter på Banana, trækker via Top banana og Mid mod A og holder sitet efter plant.']});
 // ny: fire venter på Top banana og går efter ca. 30 sek. bag om via Top mid, Long, Arch, CT-spawn og Library ind på A. Lurker: 2nd mid → Mexico, når stakken går
 const S=W('TB',['TM',75],'LO','AR','CT','LB','A');
 m.tac['Sen A via CT-spawn']=()=>[S,S,S,W('M2',['MX',75]),S];m.tn.T.push('Sen A via CT-spawn');TSITE['Sen A via CT-spawn']='A';STYLE['Sen A via CT-spawn']='P';
 m.tdesc['Sen A via CT-spawn']=['Venter på Top banana. Går efter ca. 30 sek. via Top mid, Long, Arch, CT-spawn og Library ind på A og tager første duel.','Følger samme vej, bærer bomben og planter på A.','Venter på Top banana og følger samme vej bag om CT ind på A.','Står i 2nd mid. Når stakken går fra Top banana efter ca. 30 sek., går han i Mexico og bliver der, til bomben er plantet.','Venter på Top banana, følger samme vej og holder A efter plant.'];
}
try{d2Mig()}catch(e){console.error(e)}
// ny CT-taktik: Mid-crunch. Short og Long mødes i Top mid efter ca. 30 sek., apartments-stakken presser frem til 2nd mid,
// alle samles i Mid og går efter ca. 40 sek. via Top banana og Banana til B
{const m=MAPS.inferno,W=(...z)=>z.map(x=>Array.isArray(x)?['='+x[0],x[1]]:['='+x]),G=['MID',['TB',100],'BN','B'];
 const SH=W('SH',['TM',75],...G),LO=W('LO',['TM',75],...G),AP=W('CAP',['TAP',75],'M2',...G);
 m.tac['Mid-crunch']=()=>[SH,AP,AP,AP,LO];m.tn.CT.push('Mid-crunch');STYLE['Mid-crunch']='M';
 m.cdesc['Mid-crunch']=['Holder Short. Går efter ca. 30 sek. til Top mid, mødes med Long og samles med holdet i Mid. Går efter ca. 40 sek. via Banana til B.','Holder CT-apartments med to andre. Presser efter ca. 30 sek. gennem T-apartments frem til 2nd mid, samles med holdet i Mid og går via Banana til B.','Holder CT-apartments. Presser efter ca. 30 sek. gennem T-apartments frem til 2nd mid, samles med holdet i Mid og går via Banana til B.','Holder CT-apartments. Presser efter ca. 30 sek. gennem T-apartments frem til 2nd mid, samles med holdet i Mid og går via Banana til B.','Holder Long. Går efter ca. 30 sek. til Top mid, mødes med Short og samles med holdet i Mid. Går efter ca. 40 sek. via Banana til B.']}
try{cleanMGR()}catch(e){}
// Mid-crunch med B-anker: som Mid-crunch, men B-ankeret bliver på B. To presser frem fra CT-apartments.
{const m=MAPS.inferno,W=(...z)=>z.map(x=>Array.isArray(x)?['='+x[0],x[1]]:['='+x]),G=['MID',['TB',100],'BN','B'];
 const SH=W('SH',['TM',75],...G),LO=W('LO',['TM',75],...G),AP=W('CAP',['TAP',75],'M2',...G);
 m.tac['Mid-crunch med B-anker']=()=>[SH,W('B'),AP,AP,LO];m.tn.CT.push('Mid-crunch med B-anker');STYLE['Mid-crunch med B-anker']='M';
 m.cdesc['Mid-crunch med B-anker']=['Holder Short. Går efter ca. 30 sek. til Top mid, mødes med Long og samles med de andre i Mid. Går efter ca. 40 sek. via Banana til B.','Holder B hele runden.','Holder CT-apartments med Flex. Presser efter ca. 30 sek. gennem T-apartments frem til 2nd mid, samles med de andre i Mid og går via Banana til B.','Holder CT-apartments med Forward. Presser efter ca. 30 sek. gennem T-apartments frem til 2nd mid, samles med de andre i Mid og går via Banana til B.','Holder Long. Går efter ca. 30 sek. til Top mid, mødes med Short og samles med de andre i Mid. Går efter ca. 40 sek. via Banana til B.']}

// målt matrix for de_inferno efter de nye taktikker (2.750 fuldt købte runder og 250 pistolrunder pr. par)
PM.inferno=[[56,53,18,65,16,58,52,32,32,42,39,46,39],[11,38,64,29,34,39,20,34,64,16,15,7,14],[64,73,71,37,40,51,65,47,63,27,35,26,36],[69,70,24,58,31,59,66,34,31,48,32,32,41],[63,70,19,87,47,70,53,38,26,61,50,57,49],[26,49,81,37,59,62,34,51,71,22,17,4,14],[71,61,25,82,28,50,72,29,37,41,31,36,36],[49,73,82,57,64,63,54,71,78,38,41,21,34],[76,83,17,52,15,57,75,35,32,53,49,75,55],[67,81,57,33,33,48,67,44,61,32,35,66,52],[62,45,19,76,38,58,59,47,25,41,47,51,51],[70,61,15,52,22,32,59,28,26,65,44,41,47],[34,34,19,50,34,26,43,21,43,61,31,29,32]];
PMP.inferno=[[8,9,9,47,8,15,8,11,16,23,23,28,20],[6,27,40,17,17,14,10,22,40,10,9,6,9],[48,45,48,30,26,39,54,24,37,19,17,15,16],[44,48,14,26,16,38,46,20,13,17,13,14,13],[8,9,13,76,28,20,9,17,12,41,34,39,30],[5,27,64,15,36,20,7,34,58,3,4,1,7],[52,33,17,67,13,34,58,13,13,24,23,16,16],[37,58,66,38,52,43,43,56,69,21,32,14,28],[66,68,12,28,8,42,65,21,16,28,32,58,32],[56,66,35,17,20,32,57,24,38,10,11,58,40],[49,24,14,59,33,44,47,40,16,30,41,34,32],[55,39,11,38,15,20,41,16,11,50,29,28,27],[21,12,12,35,18,20,18,15,26,18,25,15,16]];


/* ===== FASE 39: KAMPVISNING – grøn AWP, lige AK-skulderstøtte, kortere kampfeed ===== */
Object.assign(EQPAL,{G:'#3f8a3a',H:'#6cbf55',D:'#2a5e27'});
EQPX.sniper=[".......kkkkkkk..........","......kllllllgk.........","kk......kgkkgk..........","kGkkkkkkGGGGGGkkkkkkkkkk","kGGHHGGkGGGGGGGllllllllk","kDDDDDDDDkggggkkkkkkkkkk","kkkkkDDDDDkgkgk.........",".....kkkkkkkkk..........","........................"];
EQPX.ak47=["........kk............","kkkkkk.kllkkkkkk......","kWWWWWkklllllllkkkkkkk","kWwWWWkmmmmmmmkWWWmmmk","kwwwwwkgggggggkwwwkkkk","kkkkkkkggkkgggkkkk....","....kkkggk.kggk.......","......kggk..kggk......","......kkkk...kkk......"];
['sniper','ak47'].forEach(k=>{const g=EQPX[k],w=g[0].length,h=g.length;let r='';g.forEach((row,y)=>{for(let x=0;x<w;){const c=row[x];let e=x+1;while(e<w&&row[e]===c)e++;if(EQPAL[c])r+=`<rect x="${x}" y="${y}" width="${e-x}" height="1" fill="${EQPAL[c]}"/>`;x=e}});EQSVG[k]=[w,h,r]});
// kampfeedet viser kun map, plant, eksplosion, desarmering, frags og kampresultat
const FEEDOK=/Bomben er plantet|Bomben er desarmeret|Bomben eksploderer|\) har dræbt |\) trader |^Map: |Kampen er slut/;
{const _lg=log;log=function(c,h){if(!FEEDOK.test(String(h)))return;return _lg(c,h)}}
// spillerlisten i kampen: prikken for levende/døde fjernes. Livscirklen bliver grå, når spilleren er død
document.head.insertAdjacentHTML('beforeend','<style>.pr .dot{visibility:hidden;width:0}.r.pr{grid-template-columns:0 15px minmax(0,1fr) auto}</style>');


/* ===== FASE 40: LANDSHOLD I INDBAKKEN OG VM-MEDALJER ===== */
const ntMe=x=>x.li===WD.me.li&&x.ti===WD.me.ti;
const ntMsg=t=>{if(typeof ibAdd==='function')ibAdd('Landshold',t);else news(t,true)};
// udtagelse: besked for hver af dine spillere, der kommer på et landshold (én gang pr. sæson)
{const _np=ntPick;ntPick=function(){_np.apply(this,arguments);try{if(!WD.nt||WD.ntMsg===WD.nt.s)return;WD.ntMsg=WD.nt.s;
 for(const ci in WD.nt.c)WD.nt.c[ci].pl.filter(ntMe).forEach(x=>ntMsg(`<b>${x.n}</b> er udtaget til ${COUNTRIES[ci][0]}s landshold i sæson ${WD.nt.s}${x.igl?' som IGL':''}.${ecSeason(WD.nt.s)?` Der er VM i denne sæson.`:''}`))}catch(e){console.error(e)}}}
// VM: resultat af hver kamp med dit land, og hvordan det endte
{const _es=ecSim;ecSim=function(m){const was=m&&m.res;_es(m);try{const ci=WD.me.li;if(!m||was||!m.res||(m.a!==ci&&m.b!==ci))return;
 const me=m.a===ci?0:1,o=me?m.a:m.b,[x,y]=me?[m.res[1],m.res[0]]:m.res,r=x>y?'vandt':x<y?'tabte':'spillede uafgjort';
 ntMsg(`VM, ${m.st==='Gruppespil'?'puljekamp':m.st.toLowerCase()}: ${COUNTRIES[ci][0]} ${r} ${x}–${y} mod ${COUNTRIES[o][0]} på ${mapN(m.map)}.`)}catch(e){console.error(e)}}}
{const _ed=ecDay;ecDay=function(d){const E=WD.ec,ci=WD.me.li,inPo=()=>E&&E.seeds&&E.seeds.includes(ci);const before=E&&E.seeds;_ed(d);try{if(!E||E.s!==WD.season)return;
 if(!before&&E.seeds&&!inPo()){const g=E.g.find(x=>x.t.includes(ci)),k=g?etab(g).findIndex(s=>s.k===ci)+1:0;ntMsg(`VM: ${COUNTRIES[ci][0]} sluttede som nr. ${k} i pulje ${'ABCD'[E.g.indexOf(g)]} og er ude af turneringen.`)}
 if(d===48&&E.done){const h=(WD.ehof||[])[WD.ehof.length-1],i=h?h.t.indexOf(ci):-1;
  if(i>=0)ntMsg(`VM: ${COUNTRIES[ci][0]} vinder ${['guld','sølv','bronze'][i]}! ${['🥇','🥈','🥉'][i]}`);else if(h)ntMsg(`VM er slut. ${COUNTRIES[h.t[0]][0]} vandt over ${COUNTRIES[h.t[1]][0]} i finalen.`)}}catch(e){console.error(e)}}}
// medaljer: de udtagne spillere fra top 3 får en medalje på spillerkortet (p[37] = [[sæson, placering 1-3], ...])
{const _ed2=ecDay;ecDay=function(d){const E=WD.ec,was=E&&E.done;_ed2(d);try{if(!E||was||!E.done||E.medals)return;E.medals=1;const h=WD.ehof[WD.ehof.length-1];
 h.t.forEach((ci,i)=>{const sel=WD.nt&&WD.nt.c[ci];if(!sel)return;sel.pl.forEach(x=>{let p=null;WD.lg.forEach(g=>g.teams.forEach(t=>t.def.pl.forEach(q=>{if(!p&&q[0]===x.n&&q[11]===+ci)p=q})));
  if(p)(p[37]=p[37]||[]).push([E.s,i+1])})})}catch(e){console.error(e)}}}
const MEDAL=['','🥇','🥈','🥉'],MEDN=['','guld','sølv','bronze'];
function medHTML(p){const L=p&&p[37];if(!L||!L.length)return '';const c=[0,0,0,0];L.forEach(([s,i])=>c[i]++);
 const t='VM: '+L.map(([s,i])=>`${MEDN[i]} sæson ${s}`).join(', ');
 return ` <span title="${t}" style="font-size:12px;letter-spacing:-1px;white-space:nowrap">${[1,2,3].filter(i=>c[i]).map(i=>MEDAL[i]+(c[i]>1?`<small style="letter-spacing:0">×${c[i]}</small>`:'')).join('')}</span>`}
{const _ro=renderOverview;renderOverview=function(){const r=_ro.apply(this,arguments);try{const el=$('ov');if(!el||!el.querySelector)return r;
 TEAMS[0].pl.forEach((p,j)=>{if(!p[37]||!p[37].length)return;const b=el.querySelector(`[data-k="${j}"]`),c=b&&b.closest('.tm'),h=c&&c.querySelector('h3');if(!h)return;
  const mu=h.querySelector(':scope > .mu');if(mu)mu.insertAdjacentHTML('beforebegin',medHTML(p)+' ');else h.insertAdjacentHTML('beforeend',medHTML(p))})}catch(e){console.error(e)}return r}}


/* ===== FASE 41: navne på de_aztec og de_inferno, så de passer til det taktikkerne gør ===== */
{const ren=(mp,sd,a,b)=>{const m=MAPS[mp],L=m.tn[sd],i=L.indexOf(a);if(i<0)return;L[i]=b;m.tac[b]=m.tac[a]||(sd==='T'?TT:CC)[a];
  const D=sd==='T'?m.tdesc:m.cdesc;D[b]=D[a]||(sd==='T'?TDESC:CDESC)[a];if(sd==='T')TSITE[b]=TSITE[a];STYLE[b]=STYLE[a];if(TSTACK.has(a))TSTACK.add(b);m.ren=Object.assign(m.ren||{},{[a]:b})};
 ren('aztec','T','Connector-cut til B','B over broen + vandet');
 ren('aztec','CT','Rush via A','5-mands A-presning');
 ren('aztec','CT','Rush via B','Broen rundt til B');
 ren('aztec','CT','Bro rush','Over broen til A bagom');
 MAPS.aztec.ren['3C-1A-1B']='Over broen til A bagom';// gamle lister fra før Bro rush
 ren('inferno','CT','Rush via A','Sweep via Long og Mid');
 ren('inferno','CT','Rush via B','Sweep via Banana til A');
 ren('inferno','CT','3C-1A-1B','Tidlig Mid og fald tilbage');
 ren('inferno','CT','Mid-kontrol','5-mands Mid-kontrol');}
try{d2Mig()}catch(e){console.error(e)}


/* ===== FASE 43: DEFUSE KIT ===== */
// CT kan købe et defuse kit for PRICE.kit. Med kit tager desarmering halvt så lang tid (DEF_T/2).
// Standard- og force-runder: alle CT, der har råd efter våben og udstyr, køber kit. Pistol- og eco-runder: efter købsindstillingen (kun CT).
// Kittet beholdes, så længe spilleren overlever, og mistes ved død og ved halvleg (som kevlar og hjelm).
PRICE.kit=400;
BITEMS.push('kit');BIN.kit='Kit';
{const _b=buy;buy=function(t){const bt=_b(t);if(t.side==='CT'&&(bt==='standard'||bt==='force'))t.ps.forEach(p=>{if(!p.kit&&p.money>=PRICE.kit){p.money-=PRICE.kit;p.kit=true}});return bt}}
// pistol/eco med kit: samme købslogik som før, men 'kit' købes kun på CT-siden
ecoBuy=function(t,p,bt){const s=bsOf(t,p);if(!s)return;const L=bt==='pistol'?s.pistol:s.dyn&&oppPoor(t)?['kevlar']:s.eco,keep=bt==='pistol'?0:bsKeep(t,p,s);
 for(const it of L||[]){const c=it==='deagle'?(p.pt==='deagle'?0:PRICE.deagle):it==='kevlar'?(p.armor?0:PRICE.kevlar):it==='helm'?(p.helm?0:PRICE.helm+(p.armor?0:PRICE.kevlar)):it==='he'?(p.he?0:PRICE.he):it==='kit'?(t.side==='CT'&&!p.kit?PRICE.kit:0):0;
  if(!c||p.money-c<keep)continue;p.money-=c;
  if(it==='deagle'){p.pt='deagle';p.pis=mk('deagle')}else if(it==='kevlar')p.armor=100;else if(it==='helm'){p.armor=p.armor||100;p.helm=true}else if(it==='he')p.he=1;else if(it==='kit')p.kit=true}};
// pixelart: tang med blå håndtag
EQPX.kit=["..kk..kk..",".kmk..kmk.",".kmmkkmmk.","..kmmmmk..","...kllk...","..kBkkBk..",".kBk..kBk.",".kBk..kBk.","..k....k.."];
{const g=EQPX.kit,w=g[0].length,h=g.length;let r='';g.forEach((row,y)=>{for(let x=0;x<w;){const c=row[x];let e=x+1;while(e<w&&row[e]===c)e++;if(EQPAL[c])r+=`<rect x="${x}" y="${y}" width="${e-x}" height="1" fill="${EQPAL[c]}"/>`;x=e}});EQSVG.kit=[w,h,r]}
{const _eq=eq;eq=function(p){return _eq(p)+(p.kit?ico('kit','Defuse kit'):'')}}
// spillerrækkerne i kampen: ikonerne skaleres ned (1,5 px pr. pixel), så der er plads til kittet
// pengene flyttes op på navnelinjen, så udstyret har hele bredden, og ikonerne skaleres lidt ned
document.head.insertAdjacentHTML('beforeend','<style>.r.pr .pn{grid-column:2/4}.r.pr .mo{grid-row:1;grid-column:4}.r.pr .eq{grid-column:3/-1;display:flex;flex-wrap:nowrap;align-items:center;gap:2px;zoom:.78;min-width:0}</style>');
// FAQ
{const _rfK=renderFaq;renderFaq=function(){_rfK();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Defuse kit</h3>${li([`CT kan købe et defuse kit for $${PRICE.kit}. Med kit tager det ${DEF_T/2/TPS} sek. at desarmere bomben i stedet for ${DEF_T/TPS} sek.`,'I standard- og force-runder køber alle CT, der har penge tilbage efter våben og udstyr, et kit. I pistol- og eco-runder følger det købsindstillingen under Taktik (Kit gælder kun på CT-siden).','Kittet beholdes, så længe spilleren overlever, og mistes ved død og ved halvleg.'])}</div>`);
 const f=$('fq');if(f.querySelectorAll)f.querySelectorAll(':scope > .tm:not(details)').forEach(tm=>{const h=tm.querySelector(':scope > h3');if(!h)return;const d=document.createElement('details');d.className='tm fqd';const sm=document.createElement('summary');sm.innerHTML=h.innerHTML;h.remove();d.appendChild(sm);const b=document.createElement('div');while(tm.firstChild)b.appendChild(tm.firstChild);d.appendChild(b);tm.replaceWith(d)})}}


/* ===== FASE 44: OPSAMLING AF VÅBEN ===== */
// Når en spiller dør, falder hans primære våben (med resterende ammo) i zonen. Har han kun en Deagle, falder Deaglen som primært våben.
// En ubrugt HE og et defuse kit falder også. HE kan tages af alle uden HE, kittet kun af CT uden kit. Våben går forud for HE og kit.
// En levende spiller i samme zone samler op, når ingen modstander er i zonen, han ikke er i gang med noget, og våbnet er en opgradering.
// Opsamling tager WPK.t ticks (1 sek.), og imens kan han ikke skyde eller gå. Hans eget primære våben bliver liggende i zonen.
// Den, der allerede har en AWP, regnes som AWP-spiller og bytter den ikke væk.
// Bombebæreren samler ikke op, mens han står på et bombsite. Opsamlede våben følger med til næste runde, hvis han overlever.
const WPK={t:4,p0:.15,pIQ:.45,fav:.5};
const wpkRank=(p,ty)=>{if(ty==='sniper'){const t=M.teams[p.ti],i=t?t.ps.indexOf(p):-1;return (t&&t.snip&&t.snip[0]===i&&!t.noSnip)||p.fav==='sniper'||(p.gun&&p.gun.type==='sniper')?8:3}
 return ({ak47:7,m4a4:6,galil:5,famas:4,smg:2,deagle:1}[ty]??0)+(ty===p.fav?WPK.fav:0)};
const wpkOwn=p=>p.gun?p.gun.type:(p.pis&&p.pis.type==='deagle')?'deagle':'pistol';
const isSiteZ=z=>!!z&&typeof RSITE==='object'&&RSITE[z]===z;
{const _tr=tickRound;tickRound=function(){
 const before=M&&M.players?M.players.map(p=>p.alive):[];
 _tr();
 if(!M||!R||R.over)return;R.drops=R.drops||[];
 // nye døde: tab primært våben
 M.players.forEach((p,i)=>{if(!before[i]||p.alive||p._dr===R)return;p._dr=R;const z=p.zone||p.from||p.next;if(!z)return;
  if(p.gun&&(p.gun.mag+p.gun.res)>0)R.drops.push({z,g:p.gun,from:p});
  else if(!p.gun&&p.pis&&p.pis.type==='deagle'&&(p.pis.mag+p.pis.res)>0)R.drops.push({z,g:p.pis,from:p,dg:1});
  if(p.he)R.drops.push({z,he:1,from:p});if(p.kit)R.drops.push({z,kit:1,from:p})});
 // igangværende opsamlinger
 M.players.forEach(p=>{const w=p.wpk;if(!w)return;
  if(!p.alive||!p.act||p.act.type!=='wpk'){p.wpk=null;if(p.act&&p.act.type==='wpk')p.act=null;return}
  if(R.tick<w.until)return;
  const d=w.d,i=R.drops.indexOf(d);p.act=null;p.wpk=null;if(i<0)return;R.drops.splice(i,1);
  if(d.he){p.he=1;if(d.from)d.from.he=0;return}
  if(d.kit){p.kit=true;if(d.from)d.from.kit=false;return}
  if(d.g.type==='deagle'&&!p.gun){p.pis=d.g;p.pt='deagle'}
  else{if(p.gun)R.drops.push({z:p.zone,g:p.gun,from:null});p.gun=d.g}
  if(d.from){if(d.dg){d.from.pis=null;d.from.pt=null}else d.from.gun=null}});
 if(!R.drops.length)return;
 // nye opsamlinger
 for(const p of M.players){if(!p.alive||p.act||p.wpk||!p.zone)continue;
  if(R.carrier===p&&isSiteZ(p.zone))continue;
  if(M.players.some(q=>q.alive&&q.side!==p.side&&q.zone===p.zone))continue;
  const own=wpkRank(p,wpkOwn(p));let best=null,bv=own;
  for(const d of R.drops){if(d.z!==p.zone||!d.g)continue;if(d.g.type==='deagle'&&p.gun)continue;const v=wpkRank(p,d.g.type);if(v>bv){bv=v;best=d}}
  // ingen våbenopgradering: HE (alle uden HE) og kit (kun CT uden kit)
  if(!best)best=R.drops.find(d=>d.z===p.zone&&((d.he&&!p.he)||(d.kit&&p.side==='CT'&&!p.kit))&&!M.players.some(q=>q.wpk&&q.wpk.d===d))||null;
  if(!best||M.players.some(q=>q.wpk&&q.wpk.d===best))continue;
  if(rnd()>=WPK.p0+WPK.pIQ*attr(p,'iq')/100)continue;
  p.act={type:'wpk',left:9999};p.wpk={d:best,until:R.tick+WPK.t}}}}
// FAQ
{const _rfW=renderFaq;renderFaq=function(){_rfW();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Opsamling af våben</h3>${li(['Når en spiller dør, falder hans primære våben i zonen med det ammo, der er tilbage. Har han kun en Deagle, falder den som primært våben.','En spiller i samme zone samler våbnet op, hvis ingen modstander er i zonen, han ikke er i gang med noget, og det er en opgradering: AK-47 → M4A4 → Galil → FAMAS → SMG → Deagle → pistol. Hans yndlingsvåben vejer lidt tungere.',`AWP: holdets AWP-spiller (eller en spiller med AWP som yndlingsvåben) tager den før alt andet. Andre tager den kun i stedet for en SMG eller pistol.`,`Opsamlingen tager ${WPK.t/TPS} sek., og imens kan spilleren ikke skyde. Hans eget primære våben bliver liggende, så en holdkammerat kan tage det. Høj Playing IQ gør, at han hurtigere opdager våbnet.`,'En ubrugt HE og et defuse kit falder også. HE kan samles op af alle, der ikke har en, og kittet kun af CT uden kit. Et bedre våben samles op først.','Bombebæreren samler ikke op, mens han står på et bombsite.','Et opsamlet våben følger med til næste runde, hvis spilleren overlever.'])}</div>`);
 const f=$('fq');if(f.querySelectorAll)f.querySelectorAll(':scope > .tm:not(details)').forEach(tm=>{const h=tm.querySelector(':scope > h3');if(!h)return;const d=document.createElement('details');d.className='tm fqd';const sm=document.createElement('summary');sm.innerHTML=h.innerHTML;h.remove();d.appendChild(sm);const b=document.createElement('div');while(tm.firstChild)b.appendChild(tm.firstChild);d.appendChild(b);tm.replaceWith(d)})}}


/* ===== FASE 45: matricer målt forfra med defuse kit og opsamling af våben (dust2, inferno) ===== */
PM.dust2=[[41,51,53,26,18,36,60,70,34,72,73],[58,44,66,65,50,63,69,66,42,72,63],[61,61,74,59,62,68,51,48,40,72,53],[55,70,57,63,50,52,58,60,35,80,57],[49,40,65,84,55,55,67,64,44,78,66],[67,44,87,71,69,76,68,59,43,80,68],[63,60,61,81,49,56,69,71,43,76,73],[60,83,79,75,74,73,64,61,56,79,74],[59,79,55,50,33,38,53,53,42,75,46],[73,78,62,63,57,65,51,54,42,69,63],[59,77,59,53,42,55,42,44,40,70,52],[42,64,45,69,43,35,36,25,36,52,49],[62,67,62,60,39,61,73,76,54,72,69],[61,57,38,67,42,63,71,66,48,78,69],[45,51,60,60,37,48,53,60,45,74,67],[50,68,40,74,44,39,41,33,26,76,76]];
PMP.dust2=[[23,14,16,19,10,19,22,35,14,35,49],[10,32,46,24,21,28,23,10,16,30,12],[36,55,50,22,32,35,29,27,23,30,60],[33,46,28,38,28,28,45,50,17,31,54],[23,8,20,76,39,34,38,39,30,29,40],[13,15,71,23,40,30,17,8,16,22,3],[22,23,19,60,29,29,55,45,14,31,47],[30,72,63,42,56,43,30,14,28,48,22],[52,78,18,35,18,24,48,46,36,32,33],[64,62,41,28,29,26,36,32,32,38,63],[46,79,34,23,22,30,34,33,28,38,36],[25,29,24,55,27,15,20,11,17,36,29],[28,35,24,33,24,31,31,23,23,42,50],[31,43,18,52,32,39,38,38,21,60,56],[24,10,30,44,23,26,25,28,23,35,45],[30,18,25,56,26,20,20,16,16,55,66]];
PM.inferno=[[64,62,38,66,20,60,60,35,57,45,39,46,40],[37,43,65,52,40,68,41,40,67,51,43,40,38],[71,78,71,49,44,58,72,51,68,55,49,54,52],[74,75,37,67,36,64,71,44,53,50,49,41,47],[61,70,38,87,51,69,55,44,54,71,55,65,56],[51,63,82,63,62,77,52,57,76,60,57,52,47],[73,62,39,82,31,51,73,31,61,41,32,39,38],[78,78,83,73,66,79,73,73,82,63,71,63,60],[78,82,33,56,20,59,77,39,60,54,51,72,55],[74,83,60,51,37,53,74,44,64,63,59,68,52],[65,53,40,79,44,60,63,52,55,49,56,56,57],[72,66,37,64,34,42,61,33,54,65,52,52,53],[49,65,35,64,41,39,58,35,52,70,46,47,46]];
PMP.inferno=[[6,8,11,57,12,12,5,8,13,23,20,30,23],[8,27,38,21,19,16,14,25,38,10,8,6,9],[52,45,50,17,25,32,56,27,42,16,16,13,21],[40,53,14,34,15,36,48,16,11,18,14,16,10],[8,7,13,76,40,20,6,12,16,47,37,40,38],[8,31,67,15,37,20,10,36,56,2,2,2,7],[55,39,9,60,11,29,57,9,17,20,22,24,20],[37,61,66,41,45,42,42,55,61,28,37,16,27],[68,68,14,36,12,39,66,21,13,27,33,54,40],[55,64,32,22,20,30,58,20,41,9,13,55,33],[48,30,14,64,31,46,36,42,18,30,44,39,31],[54,49,16,42,16,24,41,15,13,46,33,31,26],[21,14,11,39,22,13,20,10,30,24,21,13,17]];


/* ===== FASE 46: de_dust2 – CT-spawn forbindes til B via Mid doors ===== */
// Den direkte vej CT-spawn → B fjernes. CT skal nu gennem Mid doors for at nå B (længere tid), og passerer dermed zoner,
// som T dækker fra Lower mid og Mid. CT-spawns udgange er nu A og Mid doors.
{const m=MAPS.dust2;m.edges=m.edges.filter(e=>!((e[0]==='CT'&&e[1]==='B')||(e[0]==='B'&&e[1]==='CT')));m.exits.CT=m.exits.CT.filter(z=>z!=='B');
 delete m.adj;delete m.sp;delete m.spx;if(CUR==='dust2')CUR=''}
Object.assign(MAPS.dust2.cdesc,{'Sweep via Tunnels til A':['Går via Mid doors og B ind i Tunnels og T-spawn og videre via Mid, Lower mid og Short til A.','Går via Mid doors og B ind i Tunnels og bliver der. Melder, hvis T kommer gennem Tunnels.','Går via Mid doors og B ind i Tunnels og T-spawn og videre via Mid, Lower mid og Short til A.','Går via Mid doors og B ind i Tunnels og T-spawn og videre via Mid, Lower mid og Short til A.','Går via Mid doors og B ind i Tunnels og T-spawn og videre via Mid, Lower mid og Short til A og dækker bagud.']});
{const d=MAPS.dust2.tdesc['B via Tunnels + Lower mid'];if(d){d[2]='Går via Mid til Lower mid og holder den. Dækker Mid doors, som CT skal igennem for at rotere til B.';d[3]='Tager Lower mid tidligt og holder den sammen med Mid-kontrol. Dækker Mid doors.'}}
{const _rfZ=renderFaq;renderFaq=function(){_rfZ();const f=$('fq');if(!f.querySelectorAll)return;const s=[...f.querySelectorAll('summary')].find(x=>x.textContent.includes('Zonekontrol (de_dust2)'));
 if(s&&s.nextElementSibling)s.nextElementSibling.insertAdjacentHTML('beforeend','<div style="padding:3px 0">CT-spawn har ingen direkte vej til B. CT skal gennem Mid doors for at nå B, og kan dermed blive set og beskudt af T i Lower mid og Mid.</div>')}}

// de_dust2 målt forfra efter at CT-spawn kun når B via Mid doors (FASE 46)
PM.dust2=[[41,46,36,29,19,39,39,43,21,73,70],[56,44,68,47,36,53,50,44,24,75,56],[59,66,75,48,56,63,46,46,39,73,50],[63,64,43,71,45,52,58,61,34,59,55],[52,41,50,87,54,57,50,60,38,80,67],[64,44,87,57,61,69,49,43,33,70,64],[63,64,51,80,52,61,71,71,35,78,72],[51,87,79,52,62,64,51,43,39,63,62],[72,85,39,47,36,44,54,57,44,78,38],[77,86,64,47,49,56,49,49,46,70,63],[64,86,50,43,41,56,42,42,44,74,44],[49,53,43,67,41,32,31,25,31,47,47],[49,53,43,57,40,52,60,46,41,69,67],[55,42,32,67,41,57,56,46,42,78,70],[46,47,46,58,36,53,34,46,25,76,61],[50,55,36,72,38,38,38,28,22,73,76]];
PMP.dust2=[[19,8,7,25,11,18,13,14,9,30,44],[6,22,45,7,11,24,12,4,6,22,8],[30,47,45,5,21,26,19,19,12,18,57],[25,30,10,44,18,18,43,46,18,22,40],[20,3,8,73,34,35,26,28,26,32,42],[16,10,74,6,28,22,10,8,8,14,5],[19,27,7,65,24,39,54,53,13,34,38],[13,71,62,21,41,37,26,15,11,36,13],[48,84,4,22,10,21,44,38,39,32,12],[65,58,29,9,21,30,28,25,30,27,47],[44,78,25,14,16,18,29,25,33,28,33],[20,19,20,53,27,13,11,12,17,27,31],[14,19,6,34,15,24,28,15,20,45,39],[19,18,3,49,23,26,30,13,18,61,50],[16,6,12,42,21,31,14,18,11,33,39],[33,7,11,54,16,17,13,8,12,58,63]];


/* ===== FASE 47: Spredt info – de fremskudte falder tilbage ===== */
// Forward, Flex og Support (CT-rolle 2–4) falder tilbage til det nærmeste site efter SIF.t sek., eller så snart en CT er i kamp et sted.
const SIF={t:20};
{const _tr=tickRound;tickRound=function(){_tr();if(!M||!R||R.over||R.siFb)return;const tm=teamOf('CT');if(!tm||tm.tac!=='Spredt info')return;
 const ct=M.players.filter(p=>p.alive&&p.side==='CT');
 if(R.tick<SIF.t*TPS&&!ct.some(p=>p.zone&&M.players.some(q=>q.alive&&q.side==='T'&&q.zone===p.zone)))return;
 R.siFb=true;const sites=Object.keys(RSITE).filter(z=>RSITE[z]===z);
 ct.forEach(p=>{if(p.rc<2||p.act)return;const here=p.zone||p.next;if(!here)return;p.ov=sites.slice().sort((a,b)=>dist(here,a)-dist(here,b))[0]})}}
for(const mp of MAPIDS){const D=MAPS[mp].cdesc,d=D&&(D['Spredt info']||CDESC['Spredt info']);if(!d)continue;
 D['Spredt info']=d.map((x,i)=>i>=2?x.replace(/\.$/,'')+'. Falder tilbage til nærmeste site efter ca. 20 sek., eller så snart der er kontakt et sted.':x)}

// Spredt info målt forfra efter tilbagefaldet (FASE 47)
PM.dust2=[[41,46,36,29,19,39,39,43,25,73,70],[56,44,68,47,36,53,50,44,31,75,56],[59,66,75,48,56,63,46,46,42,73,50],[63,64,43,71,45,52,58,61,46,59,55],[52,41,50,87,54,57,50,60,56,80,67],[64,44,87,57,61,69,49,43,44,70,64],[63,64,51,80,52,61,71,71,66,78,72],[51,87,79,52,62,64,51,43,40,63,62],[72,85,39,47,36,44,54,57,46,78,38],[77,86,64,47,49,56,49,49,45,70,63],[64,86,50,43,41,56,42,42,38,74,44],[49,53,43,67,41,32,31,25,50,47,47],[49,53,43,57,40,52,60,46,37,69,67],[55,42,32,67,41,57,56,46,40,78,70],[46,47,46,58,36,53,34,46,28,76,61],[50,55,36,72,38,38,38,28,36,73,76]];
PMP.dust2=[[19,8,7,25,11,18,13,14,17,30,44],[6,22,45,7,11,24,12,4,7,22,8],[30,47,45,5,21,26,19,19,12,18,57],[25,30,10,44,18,18,43,46,27,22,40],[20,3,8,73,34,35,26,28,48,32,42],[16,10,74,6,28,22,10,8,12,14,5],[19,27,7,65,24,39,54,53,44,34,38],[13,71,62,21,41,37,26,15,14,36,13],[48,84,4,22,10,21,44,38,34,32,12],[65,58,29,9,21,30,28,25,30,27,47],[44,78,25,14,16,18,29,25,25,28,33],[20,19,20,53,27,13,11,12,30,27,31],[14,19,6,34,15,24,28,15,20,45,39],[19,18,3,49,23,26,30,13,22,61,50],[16,6,12,42,21,31,14,18,14,33,39],[33,7,11,54,16,17,13,8,27,58,63]];
PM.inferno=[[64,62,38,66,20,60,60,31,57,45,39,46,40],[37,43,65,52,40,68,41,35,67,51,43,40,38],[71,78,71,49,44,58,72,53,68,55,49,54,52],[74,75,37,67,36,64,71,56,53,50,49,41,47],[61,70,38,87,51,69,55,49,54,71,55,65,56],[51,63,82,63,62,77,52,59,76,60,57,52,47],[73,62,39,82,31,51,73,46,61,41,32,39,38],[78,78,83,73,66,79,73,72,82,63,71,63,60],[78,82,33,56,20,59,77,47,60,54,51,72,55],[74,83,60,51,37,53,74,53,64,63,59,68,52],[65,53,40,79,44,60,63,67,55,49,56,56,57],[72,66,37,64,34,42,61,48,54,65,52,52,53],[49,65,35,64,41,39,58,56,52,70,46,47,46]];
PMP.inferno=[[6,8,11,57,12,12,5,16,13,23,20,30,23],[8,27,38,21,19,16,14,23,38,10,8,6,9],[52,45,50,17,25,32,56,25,42,16,16,13,21],[40,53,14,34,15,36,48,30,11,18,14,16,10],[8,7,13,76,40,20,6,33,16,47,37,40,38],[8,31,67,15,37,20,10,32,56,2,2,2,7],[55,39,9,60,11,29,57,34,17,20,22,24,20],[37,61,66,41,45,42,42,53,61,28,37,16,27],[68,68,14,36,12,39,66,27,13,27,33,54,40],[55,64,32,22,20,30,58,30,41,9,13,55,33],[48,30,14,64,31,46,36,50,18,30,44,39,31],[54,49,16,42,16,24,41,30,13,46,33,31,26],[21,14,11,39,22,13,20,27,30,24,21,13,17]];


/* ===== FASE 49: GENEREL TRANSIT-STRAF ===== */
// Alle zoner har nu mindst transit-værdi .3, og straffen er fordoblet (reaktion tvR 1 → 2 sek. × tv, træfbonus tvB .08 → .16 × tv).
// En spiller, der kun passerer en zone, modstanderen allerede holder, er sårbar overalt – også en CT-stak, der sweeper gennem T-spawn.
// Det mindsker fordelen ved hurtige taktikker og gør sene hits og fakes stærkere. Alle tre matricer er målt forfra.
const TVF={min:.3,tvR:2,tvB:.16};
for(const mp in MAPS){const Z=MAPS[mp].zn;if(Z)for(const z in Z)Z[z].tv=Math.max(Z[z].tv||0,TVF.min)}
SKC.tvR=TVF.tvR;SKC.tvB=TVF.tvB;
{const _rfT=renderFaq;renderFaq=function(){_rfT();const f=$('fq');if(!f||typeof f.innerHTML!=='string'||!f.innerHTML)return;
 f.innerHTML=f.innerHTML.replace(/<b>Transit:<\/b>[^<]*/,'<b>Transit:</b> en spiller, der kun passerer en zone, modstanderen allerede holder, reagerer langsommere og er lettere at ramme for den, der holder zonen. Det gælder i alle zoner, men mest i åbne krydspunkter som Lower mid på de_dust2. Det gør det dyrt at rotere, retake eller sweepe gennem en zone, modstanderen har taget – fx når en CT-stak går gennem T-spawn og møder T, der venter dér.')}}
// målt med transit-straffen (2.750 fuldt købte runder og 250 pistolrunder pr. par, tilfældige AI-hold, blandet IGL-lederskab)
PM.dust2=[[39,38,29,34,18,39,34,40,25,77,79],[45,36,73,38,32,49,43,34,30,74,51],[46,53,74,42,53,60,42,34,30,71,47],[51,52,38,64,37,45,46,44,34,56,47],[48,34,41,88,56,56,45,52,47,81,69],[56,42,88,51,61,62,46,32,37,73,55],[55,53,41,81,52,61,72,72,68,77,73],[43,86,82,40,59,63,45,33,36,63,50],[56,74,32,52,35,46,47,46,31,75,29],[61,80,62,42,47,55,39,36,31,69,53],[49,76,48,40,40,55,37,31,26,72,39],[44,45,44,69,39,32,29,24,46,47,42],[44,48,34,57,39,51,58,39,40,77,60],[47,35,29,69,42,60,55,41,39,86,63],[45,40,36,64,35,51,36,40,27,76,71],[49,47,38,84,45,46,44,33,47,83,85]];PMP.dust2=[[22,5,5,31,8,22,14,18,13,34,49],[7,18,54,5,18,24,14,2,13,25,7],[21,39,46,7,24,31,17,16,10,24,53],[27,27,9,43,16,20,38,37,24,18,40],[24,3,5,76,31,39,23,23,40,36,47],[14,11,68,4,30,26,8,6,19,12,5],[18,18,6,68,22,35,53,55,47,36,45],[14,69,64,12,37,37,20,9,8,33,12],[39,71,7,31,18,18,33,33,25,38,10],[52,54,31,16,22,24,25,17,20,30,40],[33,65,24,14,18,22,34,22,18,29,29],[21,15,17,53,23,13,15,8,31,30,32],[13,14,7,37,16,21,28,12,20,56,42],[18,13,5,57,26,27,34,13,22,68,48],[18,6,9,45,16,27,22,20,13,29,50],[38,8,10,68,20,15,22,8,33,68,72]];
PM.inferno=[[57,53,33,71,22,55,56,35,56,42,45,47,42],[35,44,67,51,38,65,39,37,67,49,44,39,37],[67,65,72,49,44,53,67,49,68,53,43,50,46],[67,62,35,67,37,64,65,57,50,50,50,37,39],[55,57,38,88,52,65,50,51,56,65,57,63,54],[46,60,85,62,61,76,46,58,76,59,60,52,44],[69,54,36,82,34,48,71,44,60,42,38,38,36],[77,72,83,75,65,79,71,72,83,60,68,67,64],[70,70,33,58,19,59,71,44,55,49,45,62,49],[66,70,60,50,36,52,65,51,65,62,52,58,44],[60,43,37,79,46,59,57,67,55,48,55,52,51],[56,54,36,62,32,35,50,43,53,66,54,53,54],[45,64,36,62,41,39,55,57,57,63,42,42,41]];PMP.inferno=[[5,6,10,57,9,11,7,16,14,21,22,28,24],[9,27,44,21,22,17,14,16,35,9,7,4,10],[50,36,46,22,22,33,53,25,46,12,19,18,16],[42,43,14,33,17,33,40,28,18,19,15,12,10],[8,4,12,74,36,18,6,35,10,44,32,34,28],[4,30,70,16,38,24,8,36,57,6,4,2,6],[56,30,8,64,17,28,60,33,15,18,29,22,13],[37,59,69,40,50,42,38,44,60,18,27,19,31],[63,68,6,27,12,35,57,30,16,32,37,52,30],[47,55,42,17,19,31,54,29,39,15,10,51,32],[42,21,17,61,34,47,37,55,14,35,40,29,26],[42,36,9,45,15,16,34,32,16,54,28,30,30],[16,12,12,33,24,17,20,32,31,18,26,10,13]];
PM.aztec=[[78,47,31,34,15,25,35,45,21,52],[67,54,81,54,42,38,62,44,31,56],[71,66,71,52,64,46,71,54,57,54],[89,48,39,61,26,35,49,69,23,51],[88,49,66,93,65,42,80,74,53,77],[67,64,87,66,72,42,84,54,63,69],[94,37,38,68,29,62,45,81,22,53],[66,52,80,64,73,54,86,52,61,68],[86,57,37,65,27,54,47,69,33,46],[71,60,72,56,62,38,72,50,56,52]];PMP.aztec=[[50,9,17,29,10,28,10,31,10,34],[19,36,65,30,22,20,34,14,23,39],[52,69,46,32,41,38,52,32,35,37],[58,39,20,52,14,22,34,44,11,32],[59,35,33,88,41,43,55,60,40,33],[13,45,79,29,50,29,55,20,48,46],[75,22,25,54,15,41,25,61,13,30],[20,45,66,34,46,40,51,24,52,46],[59,68,20,60,14,58,34,47,29,32],[24,65,50,25,46,40,47,27,44,36]];

/* ===== FASE 50: BOMBSITES I MATCH-RAPPORTEN ===== */
// Pr. runde med plant registreres site og udfald, delt på dit holds side i runden:
// som T = dine plants, som CT = modstanderens plants. Udfald: sprang, defused eller CT døde (alle CT elimineret efter plant).
function bsAdd(why){const i=myIdx();if(i<0||!R||!R.planted||!R.site)return;const sd=M.teams[i].side,s=R.site;
 const B=M.bs=M.bs||{T:{},CT:{}},e=B[sd][s]=B[sd][s]||{p:0,x:0,d:0};e.p++;if(why==='bombe sprunget')e.x++;else if(why==='bomben desarmeret')e.d++}
{const _frB=finishRound;finishRound=function(side,why){if(M&&!M.done&&R&&!R.over)try{bsAdd(why)}catch(e){}return _frB(side,why)}}
{const _ns=newMatch;newMatch=function(...a){const r=_ns(...a);if(M)M.bs={T:{},CT:{}};return r}}
function bsHTML(){const B=M.bs||{T:{},CT:{}},sites=Object.keys(RSITE).filter(z=>RSITE[z]===z).sort();
 const cell=e=>!e||!e.p?'<span class="mu">–</span>':`<b>${e.p}</b> plantet<br><span class="mu" style="font-size:11px;line-height:1.35">${e.x} sprang<br>${e.d} defused<br>${e.p-e.x-e.d} CT døde</span>`;
 const W='white-space:normal;overflow:visible;text-overflow:clip;vertical-align:top';const row=(sd,t,u)=>`<tr><td style="${W}">${t}<br><span class="mu" style="font-size:11px">${u}</span></td>${sites.map(s=>`<td class="n2" style="${W}">${cell(B[sd][s])}</td>`).join('')}</tr>`;
 return `<div style="margin-top:10px"><b>Bombsites</b></div><table class="rpt"><colgroup><col style="width:31%">${sites.map(()=>'<col>').join('')}</colgroup><thead><tr><th></th>${sites.map(s=>`<th class="n2">${s}-site</th>`).join('')}</tr></thead><tbody>${row('T','Som T','dine plants')}${row('CT','Som CT','modstanderens')}</tbody></table>`}
{const _rm=repHTMLm;repHTMLm=function(){const h=_rm();if(!h)return h;const k=h.indexOf('<div style="margin-top:10px"><b>Dine taktikker på T-siden');return k<0?h:h.slice(0,k)+bsHTML()+h.slice(k)}}
