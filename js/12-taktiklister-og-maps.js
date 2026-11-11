/* ===== FASE 18: TAKTIKLISTER PR. MAP ===== */
// Hvert map har sin egen liste af T- og CT-taktikker i MAPS[id].tn. Listerne kan have forskellig længde.
// Rækkefølgen er rækkefølgen i PM[map] (rækker = T, kolonner = CT).
// Fjernes en taktik fra et map, fjernes den også fra managerens gemte lister på det map.
MAPS.csm.tn={T:['A-rush','B-rush','A-fake til B','B-fake til A','3A-2B','2A-3B','Mid-push til A','Connector-cut til B','Sen A-hit','Sen B-hit'],
 CT:['Rush via A','Rush via B','4B-1A','4A-1B','2A-1C-2B','3C-1A-1B','Mid-kontrol','A-presning','Spredt info','Retake']};
MAPS.dust2.tn={T:['A-rush','B-rush','A-fake til B','B-fake til A','3A-2B','2A-3B','Mid-push til A','Connector-cut til B','Sen A-hit','Sen B-hit','Default'],
 CT:['Rush via A','Rush via B','4B-1A','4A-1B','2A-1C-2B','3C-1A-1B','Mid-kontrol','A-presning','Spredt info','Retake']};
MAPS.aztec.tn={T:['A-rush','B-rush','A-fake til B','B-fake til A','3A-2B','2A-3B','Mid-push til A','Connector-cut til B','Sen A-hit','Sen B-hit'],
 CT:['Rush via A','Rush via B','4B-1A','4A-1B','2A-1C-2B','3C-1A-1B','Mid-kontrol','A-presning','Spredt info','Retake']};
MAPS.inferno.tn={T:['A-rush','B-rush','A-fake til B','B-fake til A','3A-2B','2A-3B','Mid-push til A','Connector-cut til B','Sen A-hit','Sen B-hit','Connector-cut til A'],
 CT:['Rush via A','Rush via B','4B-1A','4A-1B','2A-1C-2B','3C-1A-1B','Mid-kontrol','A-presning','Spredt info','Retake']};
function tnOf(map,sd){const m=MAPS[map];return(m&&m.tn?m.tn:TN)[sd]}
const tnAll=sd=>[...new Set(MAPIDS.flatMap(m=>tnOf(m,sd)))];
// managerens lister: kun taktikker, der findes på mappet. En tom liste får mappets første 4
function cleanMGR(){for(const m of MAPIDS){if(!MGR[m])MGR[m]=mgr0();for(const sd of ['T','CT'])for(const b of ['pistol','standard','eco']){const L=tnOf(m,sd),rn=(MAPS[m]&&MAPS[m].ren)||{};let l=(MGR[m][sd][b]||[]).map(n=>rn[n]||n).filter((n,i,a)=>L.includes(n)&&a.indexOf(n)===i);if(!l.length)l=L.slice(0,4);MGR[m][sd][b]=l}}}
{const _lg=loadGame;loadGame=function(){const ok=_lg();if(ok)cleanMGR();return ok}}
cleanMGR();
/* Default: spredt info, derefter samling mod det site, hvor færrest CT er set. DEC = beslutningstidspunkt (gamle ticks, × TK) */
const DEC={'Default':55};
Object.assign(TT,{
 'Default':()=>[[['LA']],[['MID']],[['TB']],[['CON']],[['MID']]],
 'Connector-cut til A':()=>[[['LA'],['A',30]],[['LA'],['A',32]],[['MID'],['CON']],[['CON']],[['LA'],['A',34]]]});
Object.assign(TSITE,{'Default':null,'Connector-cut til A':'A'});
Object.assign(STYLE,{'Default':'M','Connector-cut til A':'M'});
{const _tr=tickRound;tickRound=function(){_tr();if(R.over||R.planted||!M)return;const t=teamOf('T'),d=DEC[t&&t.tac];if(d==null||R.tick!==Math.round(d*TK))return;
 const s=R.tSeen||{},a=s.A||0,b=s.B||0,to=a<b?'A':b<a?'B':(rnd()<.5?'A':'B');R.site=to;R.tcall=true;
 const al=t.ps.filter(q=>q.alive);if(!al.length)return;al.forEach(q=>{if(!q.act)q.ov=to});
 const c=al.find(q=>q.igl)||al[0];log('t',`${c.name} (IGL) kalder ${to}-site: ${a===b?'lige mange CT set':`færrest CT set på ${to}`}`)}}
/* de_dust2: Rush via A med flanke. A-ankeret holder Mid doors, B-ankeret bliver på B, tre går over Lang A og gennem Long doors ind i T-spawn og tager T bagfra */
{const R3=[['LA'],['LD'],['TS']];MAPS.dust2.tac['Rush via A']=()=>[[['MD']],[['B']],R3,R3,R3]}
Object.assign(MAPS.dust2.cdesc,{'Rush via A':['Holder Mid doors og dækker Lower mid og CT-spawn.','Holder B alene.','Presser over Lang A og gennem Long doors ind i T-spawn og tager T bagfra.','Følger pushet over Lang A og ind i T-spawn.','Følger pushet over Lang A og ind i T-spawn og dækker bagud.']});
Object.assign(MAPS.dust2.tdesc,{'Default':['Tager Lang A for info. Efter ca. 22 sek. går hele holdet mod det site, hvor færrest CT er set.','Står i Mid med bomben og går med holdet mod det valgte site.','Går i Tunnels for info og går med holdet mod det valgte site.','Holder Lower mid for info og går med holdet mod det valgte site.','Holder Mid og går med holdet mod det valgte site.']});
Object.assign(MAPS.inferno.tdesc,{'Connector-cut til A':['Går via Mid ud på Long og leder angrebet ind på A efter ca. 12 sek.','Følger pos 1 over Long, bærer bomben og planter på A.','Går via Mid og Mexico til 2nd mid og holder den, så Short er dækket.','Tager 2nd mid tidligt og holder den sammen med Mid-kontrol.','Går via Mid og Long ind på A og holder sitet efter plant.']});
/* FAQ */
{const _rfT=renderFaq;renderFaq=function(){_rfT();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Taktikker pr. map</h3>${li(['Hvert map har sin egen liste af taktikker, og listerne kan have forskellig længde. Taktikker med samme navn følger mappets ruter.',`Antal taktikker (T / CT): ${MAPIDS.map(m=>`${mapN(m)} ${tnOf(m,'T').length} / ${tnOf(m,'CT').length}`).join(' · ')}.`,'<b>Default</b> (de_dust2, T): holdet spreder sig for info i ca. 22 sek. Derefter kalder IGL\'en det site, hvor færrest CT er set, og hele holdet går dertil. Den klarer sig godt mod opstillinger, der stakker ét site eller spreder sig, og dårligt mod CT, der presser frem.','<b>A via Long + 2nd mid</b> (de_inferno, T): to tager 2nd mid og holder Short, mens tre går over Long ind på A. Den er et modsvar til Retake. <b>B via Banana + 2nd mid</b> er det samme mod B.','<b>Sen A via CT-spawn</b> (de_inferno, T): fire venter på Top banana og går efter ca. 30 sek. bag om via Top mid, Long, Arch, CT-spawn og Library ind på A. Lurkeren står i 2nd mid og går i Mexico, når stakken går, og bliver der til bomben er plantet.','<b>Sweep via Long til B</b> (de_dust2, CT): A-ankeret holder Mid doors, B-ankeret bliver på B, og tre CT går over Lang A, gennem Long doors og T-spawn og videre gennem Tunnels til B. <b>Sweep via Tunnels til A</b> går den modsatte vej rundt.','<b>Delayed mid push</b> (de_dust2, CT): alle fem venter ca. 10 sek. på Short og går så via A og CT-spawn til Mid doors og videre gennem Lower mid og Tunnels til B.','<b>B til mid til A</b> (de_dust2, T): alle fem går gennem Tunnels og Lower mid til Mid doors og ind på A gennem CT-spawn. I varianten <b>+ lurk på Long</b> venter Lurkeren på Lang A og går ind på A efter plant. <b>Short til B</b>: fire går over Short, A, CT-spawn og Mid doors til B, mens Lurkeren venter i Tunnels.','På de_dust2 er tre taktikker omdøbt: Connector-cut til B hedder B via Tunnels + Lower mid, Lang + Tunnels hedder A via Long + lurk i Tunnels, og 3C-1A-1B hedder 2C-2A-1B. Dine gemte lister er flyttet med.','Fjernes en taktik fra et map, fjernes den også fra dine gemte lister på det map.','<b>Spawn er ingen genvej:</b> en spiller går aldrig gennem modstanderens spawn på vej et andet sted hen. Han kan kun gå derind, hvis spawnet selv er målet, fx Rush via A på de_dust2.'])}</div>`)}}
/* ===== FASE 19: de_dust2 – T-spawn dækker Tunnels, Rush via B med info i Tunnels ===== */
// T-spawn har sigtelinje ind i Tunnels (samme dækning som Mid → Mid doors): en CT, der går ind i Tunnels, mens en T står i T-spawn, forsinkes og får et skud på tværs
Object.assign(MAPS.dust2.zn.TS,{cv:['TB']});
// Rush via B: B-ankeret går via B ind i Tunnels og bliver der for info. De fire andre går via B og Tunnels ind i T-spawn og videre via Mid, Lower mid og Short til A.
// Ser eller hører B-ankeret T i Tunnels, kan IGL'en kalde rotation til B, så de fire vender om og tager T bagfra.
{const RA=[['B'],['TB'],['TS'],['MID'],['SH'],['A']];MAPS.dust2.tac['Rush via B']=()=>[RA,[['B'],['TB']],RA,RA,RA]}
Object.assign(MAPS.dust2.cdesc,{'Rush via B':['Går via B og Tunnels ind i T-spawn og videre via Mid, Lower mid og Short til A.','Går via B ind i Tunnels og bliver der. Melder, hvis T kommer gennem Tunnels.','Går via B og Tunnels ind i T-spawn og videre via Mid, Lower mid og Short til A.','Går via B og Tunnels ind i T-spawn og videre via Mid, Lower mid og Short til A.','Går via B og Tunnels ind i T-spawn og videre via Mid, Lower mid og Short til A og dækker bagud.']});
// i Rush via B på de_dust2 vender alle fire om ved et rotationskald (normalt bliver ankeret på det andet site)
{const _dr=doRotate;doRotate=function(){const to=R.rot&&R.rot.to,tm=teamOf('CT');_dr();
 if(CUR==='dust2'&&tm&&(tm.tac==='Rush via B'||tm.tac==='Sweep via Tunnels til A')&&to)tm.ps.forEach(p=>{if(p.alive&&!p.act&&p.rc!==1&&target(p)!==to)p.ov=to})}}
// 3C-1A-1B på de_dust2: én af de tre fra stakken står på Short i stedet for i Mid doors
MAPS.dust2.tac['3C-1A-1B']=()=>['A','B','MD','MD','SH'].map(P);
Object.assign(MAPS.dust2.cdesc,{'3C-1A-1B':['Holder A alene.','Holder B alene.','Holder Mid doors og dækker Lower mid og CT-spawn.','Holder Mid doors og dækker Lower mid og CT-spawn.','Holder Short og dækker Lower mid. Tæt på A.']});
/* Jagt: spillere med jagt-rolle venter, til kampen starter i en bestemt zone (CHASE_PRE) eller bomben er plantet.
 Derefter går de mod den nærmeste levende CT, der ikke står i den zone (eller på sitet efter plant), og forsøger at komme bag på ham. */
const CHASE={'Lang + Tunnels':[2,3]},CHASE_PRE={'Lang + Tunnels':'A'};
{const _as=assign;assign=function(t,name){_as(t,name);t.ps.forEach(p=>{p.chase=t.side==='T'&&(CHASE[name]||[]).includes(p.rt)})}}
{const _tr=tickRound;tickRound=function(){_tr();if(!R||R.over||!M)return;const tT=teamOf('T');if(!tT||!CHASE[tT.tac])return;const pre=CHASE_PRE[tT.tac];
 const go=R.planted||(pre&&M.players.some(q=>q.alive&&q.side==='T'&&q.zone===pre&&M.players.some(c=>c.alive&&c.side==='CT'&&c.zone===pre)));if(!go)return;
 const goal=R.planted?R.site:pre;
 for(const p of tT.ps){if(!p.alive||!p.chase||p.act)continue;const here=p.zone||p.next;
  const cs=M.players.filter(q=>q.alive&&q.side==='CT'&&(q.zone||q.next)&&(q.zone||q.next)!==goal);
  if(!cs.length){p.ov=goal;continue}
  cs.sort((a,b)=>dist(here,a.zone||a.next)-dist(here,b.zone||b.next));p.ov=cs[0].zone||cs[0].next}}}
{const LA=[['LA'],['A']];TT['Lang + Tunnels']=()=>[LA,LA,[['TB']],[['TB']],LA]}
TSITE['Lang + Tunnels']='A';STYLE['Lang + Tunnels']='M';MAPS.dust2.tn.T.push('Lang + Tunnels');
Object.assign(MAPS.dust2.tdesc,{'Lang + Tunnels':['Går over Long doors og Lang A og tager første duel på A.','Følger pos 1 over Lang A, bærer bomben og planter på A.','Sidder i Tunnels. Når kampen på A starter, går han efter CT\'erne og forsøger at komme bag på dem.','Sidder i Tunnels sammen med Mid-kontrol og går efter CT\'erne, når kampen på A starter.','Går over Lang A og holder A efter plant.']});
/* ===== FASE 20: PLACERING EFTER PLANT ===== */
// Efter plant står POST.siteT T på sitet. De øvrige stilles i nabozonerne: enten samlet i samme zone (god placering) eller spredt én pr. zone.
// Chancen for den gode placering = POST.pp0 + POST.ppL × T-IGL'ens lederskab (0 → 20 %, 1 → 35 %, ... 5 → 95 %). Afgøres én gang pr. plant.
Object.assign(POST,{pp0:.2,ppL:.15});
/* FAQ */
{const _rfP=renderFaq;renderFaq=function(){_rfP();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Placering efter plant</h3>${li([`Efter plant står ${POST.siteT} T på sitet. De andre stiller sig i zonerne lige ved sitet.`,`<b>God placering:</b> de står sammen i samme zone, så de kan trade hinanden. <b>Dårlig placering:</b> de spredes én i hver zone og falder lettere én ad gangen.`,`Chancen for den gode placering afhænger af T-IGL'ens lederskab: ${[0,1,2,3,4,5].map(l=>`${l}: ${Math.round((POST.pp0+POST.ppL*l)*100)} %`).join(' · ')}.`])}</div>`)}}
/* ===== FASE 21: de_inferno – egne CT-ruter og zonedækning ===== */
// Pit er forbundet til Short, ikke direkte til A-site
{const m=MAPS.inferno;m.edges=m.edges.filter(([x,y])=>!((x==='PIT'&&y==='A')||(x==='A'&&y==='PIT')));m.edges.push(['PIT','SH',3])}
// Boiler: forbindelse mellem T-apartments og 2nd mid
MAPS.inferno.edges.push(['TAP','M2',4]);
// Top mid: krydset mellem Mid, Long og Short. Erstatter den direkte forbindelse Mid–Long
{const m=MAPS.inferno;m.edges=m.edges.filter(([x,y])=>!((x==='MID'&&y==='LO')||(x==='LO'&&y==='MID')));m.edges.push(['MID','TM',2],['TM','LO',3],['TM','SH',3]);
 m.zn.TM={ang:3,obs:2,rng:.6,ch:.6,hz:.4,tr:.4,tv:.5,st:.2,cv:['MID']};/* Top mid dækker Mid */m.zname.TM='Top mid';if(typeof ZDESC==='object'&&ZDESC.inferno)ZDESC.inferno.TM='Krydset mellem Mid, Long og Short. Åbent og farligt at passere.'}
// CT-spawn dækker B-site (kun den forbindelse): en T, der går ind på B, mens en CT står i CT-spawn, forsinkes og får et skud på tværs
// Library dækker CT-spawn: en T, der går ind i CT-spawn, mens en CT står i Library, forsinkes og får et skud på tværs
Object.assign(MAPS.inferno.zn.CT,{cv:['B']});Object.assign(MAPS.inferno.zn.LB,{cv:['CT']});
{const tac=MAPS.inferno.tac,W=(...z)=>z.map(x=>Array.isArray(x)?x:[x]),APT=['TAP','CAP','PIT','A'];
 // CT-roller: A-anker, B-anker, Forward, Flex, Support
 tac['Rush via A']=()=>[W('AR','LO','MID',...APT),W('AR','LO','MID','TB','BN','B'),W('AR','LO','MID'),W('AR','LO','MID'),W('AR','LO','MID',...APT)];
 tac['Rush via B']=()=>{const R4=W('B','BN','TB','MID',...APT);return[R4,W('B','BN','TB','MID',rnd()<.5?'B':'CH'),R4,R4,R4]};
 tac['4B-1A']=()=>['A','B','B','B','CT'].map(P);
 tac['2A-1C-2B']=()=>['A','B',rnd()<.5?'AR':'LB','A','B'].map(P);
 tac['3C-1A-1B']=()=>[P('A'),P('B'),W('AR','LO',['MID',20],['CH',50]),W('AR','LO',['MID',20],['CT',50]),W('AR','LO',['MID',20],['LB',50])];
 // Mid-kontrol: alle via Arch, Long og Top mid til Mid. To bliver i Mid, én går til 2nd mid, og to fortsætter via Top banana og Banana til B
 {const MK=W('AR','LO','TM','MID');tac['Mid-kontrol']=()=>[MK.concat(W('MX','M2')),MK.concat(W('TB','BN','B')),MK,MK,MK.concat(W('TB','BN','B'))]}
 // Short-kontrol: dækker Short, 2nd mid og Pit
 tac['Short-kontrol']=()=>[W('AR','LO','A','PIT'),P('B'),W('AR','LO','A','SH','M2'),W('AR','LO','A','SH','M2'),W('AR','LO','A','SH')];
 tac['Retake']=()=>['LB','B','CT','CT','CT'].map(P);}
MAPS.inferno.tn.CT=MAPS.inferno.tn.CT.filter(n=>n!=='A-presning').concat('Short-kontrol');STYLE['Short-kontrol']='M';
Object.assign(MAPS.inferno.cdesc,{
 'Rush via A':['Går via Arch og Long til Mid og videre gennem T-spawn og apartments ind på A via Pit.','Går via Arch og Long til Mid og videre ned ad Banana til B.','Går via Arch og Long til Mid og bliver der.','Går via Arch og Long til Mid og bliver der.','Går via Arch og Long til Mid og videre gennem T-spawn og apartments ind på A via Pit.'],
 'Rush via B':['Går via B og Banana til Mid og videre gennem T-spawn og apartments ind på A via Pit.','Går med holdet via B og Banana til Mid og vender så tilbage til B eller Church.','Går via B og Banana til Mid og videre gennem T-spawn og apartments ind på A via Pit.','Går via B og Banana til Mid og videre gennem T-spawn og apartments ind på A via Pit.','Går via B og Banana til Mid og videre gennem T-spawn og apartments ind på A via Pit.'],
 '4B-1A':['Holder A alene.','Holder B.','Holder B.','Holder B.','Står i CT-spawn og dækker B: T, der går ind på B, bliver forsinket og beskudt.'],
 '4A-1B':['Holder A.','Holder B alene.','Stacker A.','Stacker A.','Stacker A.'],
 '2A-1C-2B':['Holder A.','Holder B.','Holder Arch eller Library (50/50). I Library dækker han CT-spawn.','Holder A sammen med A-ankeret.','Holder B sammen med B-ankeret.'],
 '3C-1A-1B':['Holder A alene.','Holder B alene.','Venter på Long, tager Mid efter ca. 8 sek. og trækker sig efter ca. 20 sek. tilbage til Church.','Venter på Long, tager Mid efter ca. 8 sek. og trækker sig efter ca. 20 sek. tilbage til CT-spawn.','Venter på Long, tager Mid efter ca. 8 sek. og trækker sig efter ca. 20 sek. tilbage til Library.'],
 'Mid-kontrol':['Går med holdet via Arch, Long og Top mid til Mid og videre via Mexico til 2nd mid.','Går med holdet via Arch, Long og Top mid til Mid og videre via Top banana og Banana til B.','Går med holdet via Arch, Long og Top mid til Mid og bliver der.','Går med holdet via Arch, Long og Top mid til Mid og bliver der.','Går med holdet via Arch, Long og Top mid til Mid og videre via Top banana og Banana til B.'],
 'Short-kontrol':['Går via Arch, Long og A ned i Pit og holder A nedefra.','Holder B.','Går via A og Short ind i 2nd mid og presser.','Går via A og Short ind i 2nd mid og presser.','Går via A og holder Short.'],
 'Retake':['Venter i Library og går ind efter plant.','Holder B.','Venter i CT-spawn og går ind efter plant.','Venter i CT-spawn og går ind efter plant.','Venter i CT-spawn og går ind efter plant.']});
/* FAQ */
{const _rfI2=renderFaq;renderFaq=function(){_rfI2();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>Zonekontrol (de_inferno)</h3>${li(['<b>Pit</b> fører til Short, ikke direkte op på A. Fra apartments kommer man derfor ind på A via Short.','<b>Top mid</b> forbinder Mid med Long og Short og dækker Mid: en modstander, der går ind i Mid, mens en spiller står i Top mid, bliver forsinket og får et skud på tværs.','<b>Boiler</b> forbinder T-apartments og 2nd mid. Fra Mid går vejen til apartments via Mexico, 2nd mid og boiler.','<b>CT-spawn</b> dækker B-site: en T, der går ind på B, mens en CT står i CT-spawn, bliver forsinket og får et skud på tværs. Kun forbindelsen til B er dækket.','<b>Library</b> dækker CT-spawn: en T, der går ind i CT-spawn, mens en CT står i Library, bliver forsinket og får et skud på tværs.','Det bruges af 4B-1A (én CT i CT-spawn), 2A-1C-2B (Forward i Library halvdelen af runderne) og 3C-1A-1B og Retake (en CT i Library og en i CT-spawn).'])}</div>`)}}
/* Cover A (CT): én i CT-apartments, to på Short, én på Long. B-ankeret løber via B og Banana op til Top banana for info og trækker sig efter ca. 15 sek. tilbage til Church */
MAPS.inferno.rsite.TB='B';// T i Top banana er på vej mod B: en CT der kan give info
MAPS.inferno.tac['Cover A']=()=>{const W=(...z)=>z.map(x=>Array.isArray(x)?x:[x]);return[W('AR','LO'),W('B','BN','=TB',['CH',38]),W('AR','LO','A','SH'),W('AR','LO','A','SH'),W('AR','LO','A','PIT','CAP')]};
MAPS.inferno.tn.CT.push('Cover A');STYLE['Cover A']='M';
Object.assign(MAPS.inferno.cdesc,{'Cover A':['Holder Long.','Løber via B og Banana op til Top banana for info og trækker sig efter ca. 15 sek. tilbage til Church.','Holder Short.','Holder Short.','Går via A og Pit op i CT-apartments og holder dem.']});
/* Banana-fake til A (T): to larmer i Banana, så CT hører dem og roterer mod B. Efter ca. 22-24 sek. rammer resten A fra tre sider (2nd mid/Short, Pit/Short og Long) */
MAPS.inferno.tac['Banana-fake til A']=()=>{const W=(...z)=>z.map(x=>Array.isArray(x)?x:[x]);return[
 W('BN',['=TB',55],'MID','TM','LO','A'),// Entry: fake i Banana, så via Mid, Top mid og Long til A
 W('M2',['SH',60],'A'),// Support (bombe): venter i 2nd mid, går via Short
 W('TAP','CAP','PIT',['SH',60],'A'),// Mid-kontrol: venter i Pit, går via Short
 W('BN'),// Lurker: bliver i Banana og holder B-siden travl
 W('MID','TM',['LO',60],'A')]};// Anker: venter i Top mid, går via Long
TSITE['Banana-fake til A']='A';STYLE['Banana-fake til A']='M';MAPS.inferno.tn.T.push('Banana-fake til A');
Object.assign(MAPS.inferno.tdesc,{'Banana-fake til A':['Larmer i Banana sammen med Lurker, så CT roterer mod B. Går efter ca. 22 sek. via Top banana, Mid, Top mid og Long ind på A.','Bærer bomben. Venter i 2nd mid og går efter ca. 24 sek. via Short ind på A.','Går gennem apartments ned i Pit og venter. Går efter ca. 24 sek. via Short ind på A.','Larmer i Banana og bliver der hele runden, så CT\'s B-side er bundet.','Venter i Top mid og går efter ca. 24 sek. via Long ind på A.']});
/* ===== FASE 22: de_aztec – Bro rush (erstatter 3C-1A-1B) ===== */
// A-anker holder A, B-anker holder B. Tre går via CT-brohus over broen, gennem T-brohus ned i vandet og op på A
MAPS.aztec.tac['Bro rush']=()=>{const W=(...z)=>z.map(x=>Array.isArray(x)?x:[x]),R3=W('=CBH','=BR','=TBH','=WA','A');return[P('A'),P('B'),R3,R3,R3]};
MAPS.aztec.tn.CT=MAPS.aztec.tn.CT.map(n=>n==='3C-1A-1B'?'Bro rush':n);
MAPS.aztec.ren=Object.assign(MAPS.aztec.ren||{},{'3C-1A-1B':'Bro rush'});// gemte lister: 3C-1A-1B bliver til Bro rush
STYLE['Bro rush']='A';
Object.assign(MAPS.aztec.cdesc,{'Bro rush':['Holder A.','Holder B.','Går via CT-brohus over broen, gennem T-brohus ned i vandet og op på A bag om T.','Går via CT-brohus over broen, gennem T-brohus ned i vandet og op på A bag om T.','Går via CT-brohus over broen, gennem T-brohus ned i vandet og op på A bag om T.']});
// Retake på de_aztec: fire venter i Temple, B-ankeret holder B
MAPS.aztec.tac['Retake']=()=>['TP','B','TP','TP','TP'].map(P);
Object.assign(MAPS.aztec.cdesc,{'Retake':['Venter i Temple og går ind efter plant.','Holder B.','Venter i Temple og går ind efter plant.','Venter i Temple og går ind efter plant.','Venter i Temple og går ind efter plant.']});
// Rush via B på de_aztec: over broen ind i T-brohus, ned i vandet, via Mid og B-connector tilbage til B. A-ankeret går fra T-brohus via T-connector og Connector til A til A
{const W=(...z)=>z.map(x=>Array.isArray(x)?x:[x]),BR=['=CBH','=BR','=TBH'],R4=W(...BR,'=WA','=MID','B');
 MAPS.aztec.tac['Rush via B']=()=>[W(...BR,'=TC','=CA','A'),R4,R4,R4,R4]}
Object.assign(MAPS.aztec.cdesc,{'Rush via B':['Går med holdet over broen ind i T-brohus og videre via T-connector og Connector til A til A.','Går over broen ind i T-brohus, ned i vandet og via Mid og B-connector tilbage til B.','Går over broen ind i T-brohus, ned i vandet og via Mid og B-connector tilbage til B.','Går over broen ind i T-brohus, ned i vandet og via Mid og B-connector tilbage til B.','Går over broen ind i T-brohus, ned i vandet og via Mid og B-connector tilbage til B.']});
/* ===== FASE 23: SNIPER-VALG OG GEMNING AF TAKTIK ===== */
// d.sniper = navnet på spilleren, der køber sniper først ('-' = ingen sniper, tom = tilfældig som før). Gælder på alle maps.
{const _nm=newMatch;newMatch=function(defs,quiet,noDraw,map){_nm(defs,quiet,noDraw,map);
 M.teams.forEach((t,i)=>{const d=M.defs[i];t.noSnip=false;if(!d||!d.sniper)return;if(d.sniper==='-'){t.noSnip=true;return}
  const k=t.ps.findIndex(p=>p.name===d.sniper);if(k>=0)t.snip=[k,...t.snip.filter(x=>x!==k)]})}}
// valget i Taktik-fanen
{const _rt=renderTactics;renderTactics=function(){_rt();if(typeof TSV!=='undefined'&&TSV.on)return;const el=$('tv');if(!el||!el.querySelector)return;const c=el.querySelector('.tm.rl');if(!c||!c.insertAdjacentHTML)return;
 const d=TEAMS[0],L=line(d),cur=d.sniper||'',o=(v,t)=>`<option value="${v}" ${cur===v?'selected':''}>${t}</option>`;
 c.insertAdjacentHTML('beforeend',`<div class="sl" style="gap:8px;align-items:center;padding-top:8px;border-top:1px solid var(--bd);margin-top:6px"><b style="white-space:nowrap">AWP</b><select data-snip="1" style="max-width:220px">${o('','Tilfældig')}${L.map(p=>o(p[0],p[0]+(p[17]==='sniper'?' (yndlingsvåben)':''))).join('')}${o('-','Ingen AWP')}</select></div>`)}}
// ingen forklarende hjælpetekster i Taktik-fanen (kolonneoverskrifter og fejlbeskeder bliver)
{const _rt2=renderTactics;renderTactics=function(){_rt2();if(typeof TSV!=='undefined'&&TSV.on)return;const el=$('tv');if(!el||!el.querySelectorAll)return;
 el.querySelectorAll('.eq').forEach(x=>{if(!x.classList.contains('r'))x.remove()});el.querySelectorAll('.dsc > div[style*="margin-top:4px"]').forEach(x=>x.remove())}}
$('tv').addEventListener('change',e=>{const s=e.target;if(!s.dataset||!s.dataset.snip)return;e.stopImmediatePropagation();if(s.value)TEAMS[0].sniper=s.value;else delete TEAMS[0].sniper;saveGame();renderTactics()},true);
// taktikvalg, roller, lineup og IGL gemmes med det samme
{const _oc=$('tv').onclick;$('tv').onclick=e=>{const r=_oc(e);try{saveGame()}catch(x){}return r}}
{const _och=$('tv').onchange;$('tv').onchange=e=>{const r=_och(e);try{saveGame()}catch(x){}return r}}
/* FAQ */
{const _rfS=renderFaq;renderFaq=function(){_rfS();const li=a=>a.map(x=>`<div style="padding:3px 0">${x}</div>`).join('');
 $('fq').insertAdjacentHTML('beforeend',`<div class="tm"><h3>AWP</h3>${li(['Under Taktik vælger du, hvilken spiller i lineup\'en der køber AWP. Han køber den, når han har råd til den, i fuldt købte runder. Vælger du "Ingen AWP", køber holdet kun rifler. Vælger du "Tilfældig", trækkes rækkefølgen før hver kamp.','Valget gælder på alle maps. Ryger spilleren ud af lineup\'en, trækkes det tilfældigt, til du vælger en ny.'])}</div>`)}}
