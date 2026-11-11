/* ===== FASE 4: NATIONALITET, LEDERSKAB, ERFARING, LIMITS ===== */
const LT=[25,75,150,225,300],ET=[50,125,200,275,350],KS=['aim','handling','iq','quick','aware','det','calm','pat','pos','team'],SI=[1,2,3,4,5,6,7,8,21,30],NSK=KS.length;// Teamplay ligger i p[30]
const FLAGC=['DE','FR','DK','ES','PT','PL','SE','NO','FI','JP','GB','BE','NL','AT','CH','EE','AR','KR','LV','BR','US','RO','GR','CA'];
const flag=c=>c?String.fromCodePoint(...[...c].map(ch=>127397+ch.charCodeAt(0))):'🧑‍💼';
const lvl=(n,T)=>T.filter(t=>n>=t).length;
// boost: hvert niveau = +1% af grundværdien; over limit tæller et niveau kun 0,3%
function boostStat(b,lim,n){let v=b;for(let k=0;k<n;k++){const inc=b*.01;if(v>=lim)v+=b*.003;else if(v+inc<=lim)v+=inc;else{const f=(lim-v)/inc;v+=inc*f+b*.003*(1-f)}}return v}



/* ===== FASE 5: HOLD, TRÆNING, TRYOUT, ØKONOMI ===== */
const SK=['Aim','Handling','Playing IQ','Quickness','Awareness','Determination','Calmness','Patience','Positioning','Teamplay'],TT0=[168,224,281,338,393,450],TRY_DAYS=[2,11,20,29,38],WN={pistol:'Pistol',rifle:'Riffel',glock:'Glock',p2000:'P2000',deagle:'Desert Eagle',ak47:'AK-47',m4a4:'M4A4',galil:'Galil',famas:'FAMAS',smg:'SMG',sniper:'AWP'};
let PN=100,OVK=null;
function line(d){return d.pl.filter(p=>p[15]>=0)}
function ig(d){return d.pl.find(p=>p[19]===1)}
function tot(p){let s=0;for(const k of SI)s+=p[k];return s}
const fl=x=>Math.floor(x+1e-6),kr=n=>Math.round(n).toLocaleString('da-DK')+' csm';
// rater og aldring er ganget med 10/9 ved overgangen fra 9 til 10 skills, så tempoet målt i værdi er uændret
const rate=a=>a<19?.81:a<22?.57:a<28?.38:a<33?.26:a<39?.12:0,aging=a=>a<30?0:a<34?.56:a<37?1.11:a<41?1.67:3.33;
/* positioner: p[15]=p[16]=pos (0-4), pos 1 (0) er IGL */
function posFix(d){if(!d||!d.pl)return;const L=d.pl.filter(p=>p[15]>=0),used=new Set(),bad=[];L.forEach(p=>{const k=p[15];if(k>4||used.has(k))bad.push(p);else used.add(k)});bad.forEach(p=>{const k=[0,1,2,3,4].find(r=>!used.has(r));p[15]=k==null?-1:k;if(k!=null)used.add(k)});const LL=d.pl.filter(p=>p[15]>=0),g=LL.find(p=>p[19]===1);if(g&&g[15]!==0){const z=LL.find(p=>p[15]===0);if(z)z[15]=g[15];g[15]=0}d.pl.forEach(p=>{if(p[15]<0){p[16]=-1;p[19]=0}else{p[16]=p[15];p[19]=p[15]===0?1:0}});if(LL.length&&!LL.some(p=>p[15]===0)){const m=LL.slice().sort((a,b)=>a[15]-b[15])[0];m[15]=m[16]=0;m[19]=1}}
function syncRoles(d){posFix(d);const bi=d.pl.find(p=>p[19]===1&&p[15]<0);if(bi){bi[19]=0;if(!d.pl.some(p=>p[19]===1))line(d)[0][19]=1}d.roles={T:d.pl.map(p=>p[15]),CT:d.pl.map(p=>p[16])};d.igl=d.pl.findIndex(p=>p[19]===1)}

function fixTeam(d){
 while(d.pl.length<5)d.pl.push(mkTry(d.li));
 const L=line(d),uT=new Set(L.map(p=>p[15])),uC=new Set(L.map(p=>p[16])),bench=d.pl.filter(p=>p[15]<0).sort((a,b)=>tot(b)-tot(a));
 while(L.length<5){const p=bench.shift(),t=[0,1,2,3,4].find(r=>!uT.has(r)),c=[0,1,2,3,4].find(r=>!uC.has(r));p[15]=t;p[16]=c;uT.add(t);uC.add(c);L.push(p)}
 if(!L.some(p=>p[19]===1))L[0][19]=1}




function birthdays(d){WD.lg.forEach(g=>g.teams.forEach(t=>t.def.pl.forEach(p=>{if(p[18]===d){p[9]++;specAge(p)}})))}
function seasonEnd(){WD.lg.forEach((g,li)=>g.teams.forEach((t,ti)=>{const d=t.def,mine=li===WD.me.li&&ti===WD.me.ti;
 for(let j=d.pl.length-1;j>=0;j--){const p=d.pl[j];if(rnd()<penRisk(p[9],p)){if(mine)WD.report.push(`${p[0]} (${p[9]} år) er gået på pension`);d.pl.splice(j,1)}}
 const n=d.pl.length;fixTeam(d);if(mine&&d.pl.length>n)WD.report.push(`${d.pl.length-n} ung spiller tilføjet, så holdet har 5 spillere`)}))}



$('ov').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const j=+b.dataset.k;if(OVK===j){TEAMS[0].pl.splice(j,1);fixTeam(TEAMS[0]);OVK=null}else OVK=j;renderOverview()};
function showTrain(){show('tr');renderTrain()}

$('tr').onchange=e=>{const s=e.target;if(s.dataset.t==null)return;TEAMS[0].pl[+s.dataset.t][20]=+s.value;renderTrain()};
function showTryout(){show('ty');renderTryout()}

$('ty').onclick=e=>{if(e.target.id==='tk1'&&WD.offer&&!ysFull(TEAMS[0],WD.offer)){ysTake(TEAMS[0],WD.offer);WD.offer=null}else if(e.target.id==='tk2')WD.offer=null;else return;renderTryout()};
const ECON={fortune:0,income:{'Liga':0,'Transfers':0,'Sponsor':0,'Champions League':0,'Præmiepenge':0},expense:{'Løn':0,'Personale':0,'Transfers':0,'Transfergebyr':0,'Træningsrum':0}};
function ecoAdd(kind,cat,amt){ECON[kind][cat]=(ECON[kind][cat]||0)+amt;ECON.fortune+=kind==='income'?amt:-amt}
function showEcon(){show('ec');renderEcon()}
function renderEcon(){
 const sec=(t,o)=>`<div class="tm"><h3>${t}</h3>${Object.keys(o).map(k=>`<div class="sl" style="padding:3px 0"><span>${k}</span><b>${kr(o[k])}</b></div>`).join('')}</div>`;
 $('ec').innerHTML=`<div class="hd"><b>Økonomi</b></div><div class="tm"><h3>Samlet formue</h3><div style="font-size:26px;font-weight:700;color:#1e9e4a">${kr(ECON.fortune)}</div></div>`+sec('Indtægter',ECON.income)+sec('Udgifter',ECON.expense)}
/* ===== NAVNE OG AI-LINEUP ===== */
const lsum=p=>p[14].reduce((a,b)=>a+b,0);

const CNAME={
'Danmark':'drjensen,Mtin,Ernie,Verba,Ventus,ZaiW00t,Ice_top,Pattie,Aries,SiQ,Heesche,Linde,Donque,Odo,Amica,Brille,Andez,Rebbyd,Obea,Noiah,Skovsen,Nordlys,Vikingen,Fjordfisk,Rugbrød,Kaffebøf,Tivoli,Lillebror,Tordenskjold,Havfrue,Pølsemanden',
'Letland':'Oxbow,Nitty,Skrejējs,Vilks,Zibens,Putniņš,Ziema,Mežs,Saule,Jūrmala,Bulta,Ezis',
'Norge':'Storegut,Alvin,Bjornzo,hezla,Sub-zero,Fjellrev,Brunost,Ulven,Nordmann,Elgen,Trollet,Kaldt,Tindra,Lakselus,Snøfall',
'Belgien':'TheLegend27,Frietje,Wafel,Pralin,Brusseler,Vlaming,Bierke,Mannekin,Ardenner,Tintin22,Wallon,Gentenaar',
'Sverige':'Darnious,Booban,Eddewin,Mpi,wumpah,Älgen,Fika,Surströmming,Midsommar,Vasa,Lingon,Kanelbulle,Draken,Snöstorm,Valkyria',
'Portugal':'Eze,Wargod,SpiDeviL,Stripeskid,Bacalhau,Lusitano,Fado,Tubarão,Pastel,Navegador,Falcão,Sardinha,Tejo,Saudade',
'Frankrig':'Feuille,Rqptor,Blo0,Kortex,Gosu,Rifle+,Baguette,Le_Chat,Fromage,Mousquetaire,Corbeau,Lutin,Éclair,Croissant,Renard,Tonnerre,Phénix',
'Tyskland':'Raid-on,Kirsch,a1rstar,Alex,BigY,Lilith,Phil Helmuth,pixeL,Wrath,Schnitzel,Bratwurst,Blitzkrieg,Donner,Wolfsburg,Eisbär,Kaiser,Sturmvogel,Zeppelin,Fuchs',
'Argentina':'Alejandro1337,Gaucho,Tango,Malbec,Asado,Pampa,Che_Boludo,Condor,Fuego,Patagonia,Milonga,Lobo',
'Polen':'Fau,Fernu,janek,Pierogi,Zubr,Burza,Smok,Orzeł,Kielbasa,Szabla,Żbik,Mróz',
'Grækenland':'SiTzei,Ronin,Gyros,Kronos,Spartiatis,Titan_GR,Feta,Kerberos,Poseidon,Odyssefs,Keraunos,Lykos,Ouzo',
'Rumænien':'Tricky,Black coffee,Destiny,Apoc,Dracula,Carpati,Vlad,Lupul,Zimbru,Furtuna,Dacian,Mamaliga,Fulger,Vulturul',
'Finland':'Wzxku,Zoif,Sisu,Sauna,Salmiakki,Poro,Kalevala,Myrsky,Susi,Karhu,Pakkanen,Lumi,Tuisku',
'Holland':'ProxyNL,Stroopwafel,Klompen,Tulp,Windmolen,Gouda,Fietser,Oranje,Haring,Kaasman,Dijk,Vuurtoren',
'Storbritannien':'# HaDeS,jonnylaris,Cheddar,Bulldog,Crumpet,Spitfire,Londoner,Pint,Bobby,Thistle,Cuppa,Mancunian,Gentleman',
'Spanien':'Toro,Siesta,Paella,Matador,Tapas,Fuego_ES,Conquistador,Halcon,Sombra,Gazpacho,Flamenco,Lince',
'Estland':'Kalev,Tallinn,Karu,Torm,Hunt,Saare,Vanapagan,Jää,Tuletorn,Kungla,Tõrva',
'Japan':'Ronin_JP,Kitsune,Ninja,Tanuki,Sakura,Katana,Tsunami,Oni,Shogun,Kaminari,Hayabusa,Samurai_X',
'Korea':'Hwarang,Kimchi,Tiger_KR,Haetae,Dokkaebi,Taekwon,Hanbit,Cheonji,Gumiho,Baram,Seoul_Fox,Jangmi',
'Brasilien':'Capoeira,Jaguar,Carnaval,Feijoada,Boto,Curupira,Tucano,Samba,Zico_BR,Pantanal,Caipira,Onça',
'USA':'Maverick,Bald_Eagle,Yankee,Texan,Gunslinger,Route66,Bison,Redwood,Brooklyn,Liberty,Cowboy,Rattler',
'Canada':'Maple,Moose,Poutine,Loonie,Hoser,Mountie,Grizzly,Beaver_CA,Canuck,Timbit,Northern,Lumberjack',
'Schweiz':'Edelweiss,Fondue,Matterhorn,Raclette,Taschenmesser,Uhrwerk,Alpenwolf,Heidi,Bernhard,Rösti,Gletscher,Zürich',
'Østrig':'Wiener,Schnitzler,Sachertorte,Alpenjodler,Mozart,Hofburg,Strudel,Gemsbock,Kaiserin,Tiroler,Donauwalzer'};
const CN=COUNTRIES.map(([c])=>CNAME[c].split(','));
const GN='Shadow,Phantom,Reaper,Ghost,Blaze,Nova,Havoc,Rogue,Specter,Frostbite,Razor,Cobra,Savage,Hunter,Striker,Rampage,Venom,Vortex,Zero,Cipher,Glitch,Static,Onyx,Rocket,Sniper_X,Clutch,Ace,Echo,Pulse,Nemesis,Wraith,Hawk,Ember,Drift,Jinx,Kraken,Lynx,Mirage,Omen,Quake'.split(',');
const ADJ='Dark,Silent,Toxic,Crimson,Frozen,Savage,Rapid,Lone,Mad,Neon,Iron,Wild,Cold,Rogue,Swift,Grim,Lucky,Hyper,Ultra,Cyber'.split(','),NOUN='Wolf,Hawk,Fox,Raven,Viper,Ghost,Blade,Storm,Rider,Shot,Bear,Fang,Spark,Knight,Pilot,Hero,Falcon,Shark,Tiger,Dragon'.split(',');
GN.push(...'Atlas,Bandit,Banshee,Bolt,Bravo,Bullet,Cannon,Chaos,Cinder,Comet,Cosmo,Crash,Crow,Cyclone,Dagger,Dash,Delta,Dingo,Doom,Dusk,Eclipse,Edge,Enigma,Fenrir,Flare,Flux,Fury,Gadget,Gale,Gambit,Gargoyle,Gunner,Halo,Harbinger,Hex,Hydra,Icarus,Inferno,Ironclad,Jackal,Jester,Joker,Karma,Kilo,Kodiak,Lancer,Legion,Loki,Lotus,Magnet,Mantis,Marauder,Matrix,Meteor,Mongoose,Monolith,Mustang,Nebula,Nightfall,Nitro,Nomad,Nuke,Oblivion,Orca,Outlaw,Panther,Paragon,Phoenix,Pirate,Plasma,Predator,Prism,Prowler,Python,Quasar,Radar,Rage,Ranger,Raptor,Rebel,Recon,Revenant,Rhino,Ripper,Rival,Rune,Sabre,Scorpion,Scout,Serpent,Shard,Sirius,Skull,Slayer,Smoke,Spartan,Sphinx,Spike,Spirit,Stalker,Steel,Stinger,Surge,Talon,Tempest,Thunder,Tornado,Trigger,Turbo,Typhoon,Umbra,Valor,Vandal,Vector,Vengeance,Vertex,Vulture,Warden,Warlock,Whisper,Wildfire,Wolfpack,Xenon,Yeti,Zenith,Zephyr,Zodiac'.split(','));
ADJ.push(...'Silver,Golden,Black,White,Red,Blue,Atomic,Phantom,Rabid,Brutal,Fierce,Stealth,Mega,Nitro,Ancient,Burning,Hollow,Broken,Electric,Royal'.split(','));NOUN.push(...'Bullet,Blitz,Reaper,Hunter,Sniper,Wizard,Samurai,Monk,Phoenix,Cobra,Panther,Hammer,Shield,Arrow,Comet,Titan,Warrior,Ghoul,Joker,Demon'.split(','));
const cnIdx=n=>COUNTRIES.findIndex(c=>c[0]===n);CN[cnIdx('Danmark')].push('Haarh(d)core','Noobeater 24/7','Acetyl');CN[cnIdx('Norge')].push('Magiske Magne');CN[cnIdx('Schweiz')].push('Heli','Sparta');
const NU=new Set();
