/* ===== UI ===== */

function render(){
 const A=M.teams[0],B=M.teams[1],c=t=>t.side==='CT'?'ct':'t';
 $('sc').innerHTML=`<span class="${c(A)}">${A.name}</span> ${M.score[0]} – ${M.score[1]} <span class="${c(B)}">${B.name}</span>`;
 let sec=R.planted?Math.max(0,R.bombLeft)/TPS:Math.max(0,ROUND_TICKS-R.tick)/TPS;sec=Math.ceil(sec);
 $('clk').innerHTML=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}<small>${M.done?'Kampen er slut':(M.round>24?'Forlængelse':'Runde '+M.round+'/24')+(R.planted?' · bombe plantet':'')}</small>`;
 $('pl').innerHTML=M.teams.map(t=>`<div class="tm"><h3>${tn(t)} <span style="font-weight:400;color:var(--mu)">${t.side} · ${{pistol:'Pistolrunde',standard:'Standardrunde',eco:'Eco-runde',force:'Force-buy'}[t.bt]} · tabsbonus $${ECON_R.loss[Math.max(0,Math.min(ECON_R.loss.length-1,t.ls||0))]}</span></h3>${t.ps.slice().sort((a,b)=>t.side==='T'?a.rt-b.rt:a.rc-b.rc).map(p=>`<div class="r pr"><span class="dot ${p.alive?'':'d'}"></span><div class="pn"><b>${p.name}</b>${p.igl?' <small>IGL</small>':''} <small>· ${ROLES[t.side][t.side==='T'?p.rt:p.rc]}</small></div><span class="hpc" style="background:conic-gradient(var(--${p.side==='CT'?'ct':'t'}) ${Math.max(0,p.hp)}%,var(--dead) 0)"></span><div class="eq">${eq(p)}</div><div class="mo">$${p.money}</div></div>`).join('')}</div>`).join('');
}
function over(){return M.round>=24&&(!M.noDraw||(M.round===24?M.score[0]!==M.score[1]:Math.max(M.ot[0],M.ot[1])>=4))}

$('pb').onclick=()=>{paused=!paused;$('pb').textContent=paused?'Fortsæt':'Pause'};
$('nm').onclick=()=>{if(M&&M.done)showLeague()};
/* ===== NYE TAKTIKKER ===== */
Object.assign(TT,{
'Mid-push til A':()=>[[['MID'],['A',24]],[['MID'],['A',24]],[['MID'],['LA',40],['A',46]],[['MID'],['CON',26],['A',32]],[['MID'],['A',30]]],
'Connector-cut til B':()=>[[['TB'],['B',30]],[['TB'],['B',32]],[['MID'],['CON']],[['CON']],[['TB'],['B',34]]],
'Sen A-hit':()=>[[['LA'],['A',110]],[['MID'],['A',112]],[['MID'],['LA',100],['A',118]],[['CON'],['A',116]],[['TB'],['MID',80],['A',112]]],
'Sen B-hit':()=>[[['TB'],['B',110]],[['MID'],['B',112]],[['MID'],['TB',100],['B',118]],[['CON'],['B',116]],[['LA'],['MID',80],['B',112]]]});
Object.assign(TSITE,{'Mid-push til A':'A','Connector-cut til B':'B','Sen A-hit':'A','Sen B-hit':'B'});
Object.assign(CC,{'Mid-kontrol':()=>['A','B','MID','MID','MID'].map(P),'A-presning':()=>['A','B','LA','LA','LA'].map(P),'Spredt info':()=>['A','B','LA','MID','TB'].map(P),'Retake':()=>F5('CT')});
Object.assign(TDESC,{
'Mid-push til A':['Går via Mid og presser A efter ca. 10 sek. og tager første duel.','Følger pos 1, bærer bomben og planter på A.','Tager Mid først og går via Lang A ind på A efter ca. 18 sek.','Går via Mid og Connector og rammer A fra Connector-siden efter ca. 13 sek.','Følger via Mid og holder A efter plant.'],
'Connector-cut til B':['Går i Tunnel B og leder angrebet ind på B efter ca. 12 sek.','Følger pos 1 gennem Tunnel B, bærer bomben og planter på B.','Går via Mid til Connector og skærer CT\'s rotation fra A af.','Tager Connector tidligt og holder den sammen med Mid-kontrol.','Går gennem Tunnel B ind på B og holder sitet efter plant.'],
'Sen A-hit':['Tager Lang A og holder den, går ind på A efter ca. 44 sek.','Står i Mid, bærer bomben og går ind på A efter ca. 45 sek.','Holder Mid og går via Lang A ind på A efter ca. 47 sek.','Holder Connector og går ind på A efter ca. 46 sek.','Starter i Tunnel B, trækker via Mid mod A og holder sitet efter plant.'],
'Sen B-hit':['Tager Tunnel B og holder den, går ind på B efter ca. 44 sek.','Står i Mid, bærer bomben og går ind på B efter ca. 45 sek.','Holder Mid og går via Tunnel B ind på B efter ca. 47 sek.','Holder Connector og går ind på B efter ca. 46 sek.','Starter på Lang A, trækker via Mid mod B og holder sitet efter plant.']});
// beskrivelse pr. CT-rolle (A-anker, B-anker, Forward, Flex, Support)
const CDESC={
'Rush via A':['Går frem gennem Lang A sammen med holdet.','Går frem gennem Lang A sammen med holdet.','Leder pushet ud på Lang A og tager første duel.','Følger pushet på Lang A.','Følger pushet på Lang A og dækker bagud.'],
'Rush via B':['Går frem gennem Tunnel B sammen med holdet.','Går frem gennem Tunnel B sammen med holdet.','Leder pushet ind i Tunnel B og tager første duel.','Følger pushet i Tunnel B.','Følger pushet i Tunnel B og dækker bagud.'],
'4B-1A':['Holder A alene.','Holder B.','Stacker B.','Stacker B.','Stacker B.'],
'4A-1B':['Holder A.','Holder B alene og bliver, hvis der roteres.','Stacker A.','Stacker A.','Stacker A.'],
'2A-1C-2B':['Holder A.','Holder B.','Holder Connector og kan nå begge sites.','Holder A sammen med A-ankeret.','Holder B sammen med B-ankeret.'],
'3C-1A-1B':['Holder A alene.','Holder B alene.','Holder Connector.','Holder Connector.','Holder Connector.'],
'Mid-kontrol':['Holder A.','Holder B.','Tager kontrol over Mid.','Tager kontrol over Mid.','Tager kontrol over Mid.'],
'A-presning':['Holder A.','Holder B.','Presser frem på Lang A.','Presser frem på Lang A.','Presser frem på Lang A.'],
'Spredt info':['Holder A.','Holder B.','Går frem på Lang A for info.','Går frem i Mid for info.','Går frem i Tunnel B for info.'],
'Retake':['Venter i CT-spawn og går ind efter plant.','Venter i CT-spawn og går ind efter plant.','Venter i CT-spawn og går ind efter plant.','Venter i CT-spawn og går ind efter plant.','Venter i CT-spawn og går ind efter plant.']};
const SL={A:'Aggressiv',M:'Mix',P:'Passiv'};
const STYLE={'A-rush':'A','B-rush':'A','Mid-push til A':'A','Connector-cut til B':'M','A-fake til B':'M','B-fake til A':'M','3A-2B':'M','2A-3B':'M','Sen A-hit':'P','Sen B-hit':'P','Rush via A':'A','Rush via B':'A','Mid-kontrol':'A','A-presning':'A','2A-1C-2B':'M','3C-1A-1B':'M','Spredt info':'M','4B-1A':'P','4A-1B':'P','Retake':'P'};
/* ===== TAKTIK-UI ===== */
let TU={map:'dust2',side:'T',bt:'pistol'};
function showTactics(){show('tv');renderTactics()}

$('tv').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const[a,v]=b.dataset.a.split('|'),l=MGR[TU.map][TU.side][TU.bt],i=+v;
 if(a==='back')return showLeague();
 if(a==='map'){TU.map=v;TU.open=null}else if(a==='side')TU.side=v;else if(a==='bt')TU.bt=v;else if(a==='open')TU.open=TU.open===v?null:v;else if(a==='igl'){if(TEAMS[0].pl[i][15]>=0)TEAMS[0].pl.forEach((p,k)=>p[19]=k===i?1:0)}
 else if(a==='lu'){const d=TEAMS[0],p=d.pl[i];if(TU.swapIn==null){if(p[15]<0)TU.swapIn=i}else{if(p[15]>=0){const q=d.pl[TU.swapIn];q[15]=p[15];q[16]=p[16];q[19]=p[19];p[15]=-1;p[16]=-1;p[19]=0}TU.swapIn=null}}
 else if(a==='up'&&i>0)[l[i-1],l[i]]=[l[i],l[i-1]];
 else if(a==='dn'&&i<l.length-1)[l[i+1],l[i]]=[l[i],l[i+1]];
 else if(a==='rm'&&l.length>1)l.splice(i,1);
 else if(a==='add'&&l.length<MAXSEL)l.push(v);
 renderTactics()};
$('tv').onchange=e=>{const s=e.target;if(!s.dataset.r)return;const d=TEAMS[0],j=+s.dataset.r.split('|')[1],nv=+s.value,q=d.pl[j],o=d.pl.find(p=>p!==q&&p[15]===nv);if(o)o[15]=q[15];q[15]=nv;d.pl.forEach(p=>{if(p[15]>=0){p[16]=p[15];p[19]=p[15]===0?1:0}});plOrder(d);renderTactics()};
/* ===== NAVIGATION & HOLDOVERSIGT ===== */
let VIEW='lg';
const VT={hf:'Hall of Fame',fq:'FAQ',tn:'Holdnavn',sp:'Sponsor',cl:'Champions League',tr:'Træning',ty:'Tryout',ec:'Økonomi',lg:'Liga',tv:'Taktik',ov:'Holdoversigt',mv:'Kamp'};
function show(v){
 if(VIEW==='mv'&&v!=='mv'&&M&&!M.quiet&&!M.done&&!paused){paused=true;$('pb').textContent='Fortsæt'}
 VIEW=v;['lg','tv','ov','cl','tr','ty','ec','sp','tn','fq','hf','mv'].forEach(k=>$(k).style.display=k===v?'':'none');$('ttl').textContent=VT[v];renderNav()}
function live(){return !!(M&&!M.quiet&&!M.done)}

$('nav').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;const v=b.dataset.v;v==='lg'?showLeague():v==='tv'?showTactics():v==='ov'?showOverview():v==='cl'?showCL():v==='tr'?showTrain():v==='ty'?showTryout():v==='ec'?showEcon():v==='sp'?showSponsor():v==='fq'?(show('fq'),renderFaq()):v==='hf'?showHof():show('mv')};
$('nx').onclick=()=>{if(live())show('mv');else playNext()};
function showOverview(){show('ov');renderOverview()}

/* ===== LIGA ===== */
const NP=['Ka','Ze','Ro','Vi','Mo','Tr','Sk','Ny','Dra','Fe','Lu','Ba'],NS=['x','ro','n','vin','ke','ss','do','th','la','ri'];
const TNAMES=['Aarhus Storm','Odense Rebels','Aalborg Vikings','Esbjerg Ravens','Randers Phoenix','Kolding Titans','Horsens Hawks','Silkeborg Sharks','Roskilde Reapers','Viborg Vipers','Herning Havoc'];
let L;
const OFF=[7,0,-3,4,1,0,0,-4];// aim, handling, IQ, quickness, awareness, det, calm, patience
function genTeam(name,avg,used){const C=[0,1,3,4,5],pl=[];for(let j=0;j<5;j++){let n;do n=NP[ri(0,11)]+NS[ri(0,9)];while(used.has(n));used.add(n);pl.push([n,...Array.from({length:8},(_,k)=>(C.includes(k)?avg:68)+(rnd()*2-1)*(C.includes(k)?9:16))])}
 const mn=ks=>pl.reduce((s,p)=>s+ks.reduce((a,k)=>a+p[k+1],0),0)/(5*ks.length),mc=mn(C),mu=mn([2,6,7]);
 pl.forEach(p=>{for(let k=0;k<8;k++)p[k+1]=Math.round(cl(p[k+1]+(C.includes(k)?avg-mc:68-mu),35,96))});
 const ig=ri(0,4),ld=ri(1,5);pl.forEach((p,j)=>p.push(ri(16,34),j===ig?ld:ri(0,3)));return{name,igl:ig,lead:ld,pl}}
function fixtures(n){const t=[...Array(n).keys()],A=[];for(let r=0;r<n-1;r++){const m=[];for(let i=0;i<n/2;i++){let a=t[i],b=t[n-1-i];if(i===0&&r%2)[a,b]=[b,a];m.push([a,b])}A.push(m);t.splice(1,0,t.pop())}return A.concat(A.map(m=>m.map(([a,b])=>[b,a])))}


function table(){const S=L.teams.map((d,i)=>({i,p:0,w:0,d:0,l:0,rf:0,ra:0,pts:0,h:0}));
 L.res.forEach(r=>{const h=S[r.h],a=S[r.a];h.p++;a.p++;h.rf+=r.hs;h.ra+=r.as;a.rf+=r.as;a.ra+=r.hs;if(r.hs>r.as){h.w++;a.l++;h.pts+=2}else if(r.hs<r.as){a.w++;h.l++;a.pts+=2}else{h.d++;a.d++;h.pts++;a.pts++}});
 const by=S.slice().sort((x,y)=>y.pts-x.pts),out=[];
 for(let i=0;i<by.length;){let j=i;while(j<by.length&&by[j].pts===by[i].pts)j++;const g=by.slice(i,j),ids=g.map(x=>x.i);
  if(g.length>1)L.res.forEach(r=>{if(ids.includes(r.h)&&ids.includes(r.a)){const pt=r.hs>r.as?[2,0]:r.hs<r.as?[0,2]:[1,1];S[r.h].h+=pt[0];S[r.a].h+=pt[1]}});
  g.sort((x,y)=>y.h-x.h||(y.rf-y.ra)-(x.rf-x.ra)||y.rf-x.rf);out.push(...g);i=j}
 return out}
function showLeague(){show('lg');renderLeague()}
