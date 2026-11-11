/* ===== KAMP ===== */

function buy(t){
 const ps=t.ps,SW=SIDEW[t.side],R1=SW.R1,R2=SW.R2;
 if(M.round===1||M.round===13){ps.forEach(p=>ecoBuy(t,p,'pistol'));return'pistol'}
 if(!ps.every(p=>p.gun||p.money>=PRICE[R2])){
  // force-buy: har alle uden våben råd til SMG (+ kevlar, hvis de mangler det), køber holdet i stedet for at spare
  const need=p=>PRICE.smg+(p.armor?0:PRICE.kevlar);if(!ps.every(p=>p.gun||p.money>=need(p))){ps.forEach(p=>ecoBuy(t,p,'eco'));return'eco'}
  for(const p of ps){if(p.gun)continue;const k=p.armor?0:PRICE.kevlar,g=p.money>=PRICE[R1]+k?R1:p.money>=PRICE[R2]+k?R2:'smg';p.money-=PRICE[g]+k;p.gun=mk(g);p.armor=100;if(p.money>=PRICE.helm&&!p.helm){p.money-=PRICE.helm;p.helm=true}}
  return'force'}
 // standardrunde: SMG skiftes til fuld riffel, Galil/FAMAS kun hvis der også er råd til kevlar og hjelm
 ps.forEach(p=>{if(!p.gun)return;const ty=p.gun.type,full=PRICE[R1]+(p.armor?0:PRICE.kevlar)+(p.helm?0:PRICE.helm);if(ty==='smg'&&p.money>=PRICE[R1]||ty===R2&&p.money>=full)p.gun=null});let sn=ps.some(p=>p.gun&&p.gun.type==='sniper');
 for(const i of t.snip){const p=ps[i];
  for(const [g0,k,h,e] of PR){const g=g0==='R1'?R1:g0==='R2'?R2:g0;
   if(p.gun?p.gun.type!==g:(g==='smg'||g==='sniper'&&(sn||t.noSnip)))continue;
   const c=(p.gun?0:PRICE[g])+(k&&!p.armor?PRICE.kevlar:0)+(h&&!p.helm?PRICE.helm:0)+(e&&!p.he?PRICE.he:0);
   if(p.money<c)continue;
   p.money-=c;if(!p.gun){p.gun=mk(g);if(g==='sniper')sn=true}
   if(k&&!p.armor)p.armor=100;if(h)p.helm=true;if(e)p.he=1;break}}
 return'standard';
}
// pistol- og eco-runder: spilleren køber efter sin købsindstilling (rækkefølge), så langt pengene rækker. Eco: beholder mindst keep til næste runde
function ecoBuy(t,p,bt){const s=bsOf(t,p);if(!s)return;const L=bt==='pistol'?s.pistol:s.dyn&&oppPoor(t)?['kevlar']:s.eco,keep=bt==='pistol'?0:bsKeep(t,p,s);
 for(const it of L||[]){const c=it==='deagle'?(p.pt==='deagle'?0:PRICE.deagle):it==='kevlar'?(p.armor?0:PRICE.kevlar):it==='helm'?(p.helm?0:PRICE.helm+(p.armor?0:PRICE.kevlar)):it==='he'?(p.he?0:PRICE.he):0;
  if(!c||p.money-c<keep)continue;p.money-=c;
  if(it==='deagle'){p.pt='deagle';p.pis=mk('deagle')}else if(it==='kevlar')p.armor=100;else if(it==='helm'){p.armor=p.armor||100;p.helm=true}else if(it==='he')p.he=1}}
function pick(t,bt){
 const o=t.order[t.side][bt],l=t.last;
 if(l&&l.side===t.side&&l.won&&rnd()<t.lead*.2)return l.name;
 const i=t.ix[t.side][bt]++;return o[i%o.length];
}

function startRound(){
 M.round++;if(M.round>24&&(M.round-25)%6===0)M.ot=[0,0];if(M.round===13||(M.round>24&&((M.round-25)%6===0||(M.round-25)%6===3)))M.teams.forEach(t=>t.side=t.side==='CT'?'T':'CT');
 if(M.round===1||M.round===13||(M.round>24&&(M.round-25)%6===0))M.players.forEach(p=>{p.money=M.round>24?10000:800;p.gun=null;p.pt=null;p.he=0;p.armor=0;p.helm=false;p.kit=false});
 if(M.round===1||M.round===13||(M.round>24&&(M.round-25)%6===0))M.teams.forEach(t=>t.ls=ECON_R.start);
 R={cn:{CT:5,T:5},tick:0,planted:false,over:false,luck:[0,0],carrier:null,dropped:null,site:null,bombLeft:0,contact:null,tcall:false,wait:0,rot:null,rotTo:null};
 const s0=sum(M.teams[0]),s1=sum(M.teams[1]),f=Math.max(0,1-Math.abs(s0-s1)/(.15*(s0+s1)));
 R.luck=[(rnd()*2-1)*.1*f,(rnd()*2-1)*.1*f];
 M.teams.forEach(t=>t.ps.forEach(p=>{p.side=t.side;p.zone=t.side==='T'?'TS':'CT';p.hp=100;p.alive=true;if(p.pt!=='deagle')p.pt=null;p.pis=mk(p.pt||SIDEW[p.side].P);if(p.gun)p.gun=mk(swW(p.gun.type,p.side));p.next=null;p.from=null;p.flk=null;p.flP=0;p.travel=0;p.act=null;p.ov=null;p.hold=0;p.engZ=null;p.rl=0;p.rowShots=0;p.lastShot=-9;p.thrown=false;p.peek=0;p.held=0;p.dmgBy={};p.hurt=-1;p.arr=-1;p.trade=null;p.syncT=null;p.fb=false;p.jit=ri(-(10-p.tim),10-p.tim)}));
 const tT=teamOf('T'),tC=teamOf('CT');
 M.teams.forEach(t=>shuffle([...Array(15).keys()]).slice(0,5).forEach((s,k)=>t.ps[k].sp=s));
 M.teams.forEach(t=>{t.bt=buy(t);t.tac=pick(t,t.bt==='force'?'eco':t.bt);assign(t,t.tac)});
 log('n',`Runde ${M.round} starter: ${tn(tC)} (${tC.bt}) mod ${tn(tT)} (${tT.bt})`);
 const me=M.teams[0];log('n',`<span style="font-weight:400;color:var(--mu)">Dit hold (${me.side}) kører: ${me.tac}</span>`);
}
function finishRound(side,why){
 R.over=true;R.wait=swNext(M.round)?114:20;const w=teamOf(side);M.score[w.i]++;if(M.round>24)M.ot[w.i]++;
 log(side==='CT'?'ct':'t',`<b>Runde ${M.round}: ${w.name} vinder (${why})</b>`);
 M.teams.forEach(t=>{t.last={side:t.side,name:t.tac,won:t===w}});
 M.teams.forEach(t=>{if(t===w)t.ls=Math.max(0,(t.ls||0)-ECON_R.dec);else t.ls=Math.min(ECON_R.loss.length-1,(t.ls||0)+1)});
 const lb=t=>ECON_R.loss[Math.max(0,(t.ls||1)-1)];
 M.players.forEach(p=>{const t=M.teams[p.ti];p.money=Math.min(ECON_R.max,p.money+(p.side===side?ECON_R.win:lb(t)));if(!p.alive){p.gun=null;p.pt=null;p.he=0;p.armor=0;p.helm=false;p.kit=false}});
}
/* ===== TICK ===== */
const aj=(p,a)=>a>0?Math.round((a+p.jit)*TK):0;
function target(p){
 if(p.ov)return p.ov;
 while(p.wi+1<p.wp.length&&p.zone===p.wp[p.wi].z&&R.tick>=aj(p,p.wp[p.wi+1].at))p.wi++;
 return R.tick<aj(p,p.wp[p.wi].at)?p.zone:p.wp[p.wi].z;
}
function tickRound(){
 R.tick++;recount();const live=()=>M.players.filter(p=>p.alive);let al=live();
 if(R.planted)R.bombLeft--;
 const enem=p=>al.filter(q=>q.side!==p.side&&q.zone&&(q.zone===p.zone||(typeof xz==='function'&&xz(p.zone,q.zone))));
 // tabt bombe
 if(R.carrier&&!R.carrier.alive&&!R.planted){R.dropped=R.carrier.zone||R.carrier.next;R.carrier=null}
 if(R.dropped&&!R.planted){const ts=al.filter(p=>p.side==='T');if(ts.length&&!ts.some(p=>p.ov===R.dropped)){ts.sort((a,b)=>dist(a.zone||a.next,R.dropped)-dist(b.zone||b.next,R.dropped));ts[0].ov=R.dropped}}
 // bevægelse
 for(const p of al){
  if(p.act)continue;
  if(p.zone===null){if(--p.travel<=0){p.zone=p.next;p.next=null;p.arr=R.tick;p.trA=target(p)!==p.zone;flArr(p,al);if(p.side==='T'&&!R.planted&&ZN[p.zone].st)noise(p)}continue}
  if(enem(p).some(q=>typeof slPin!=='function'||slPin(p.zone,q.zone))){if(p.hold)p.held=p.hold;p.hold=0;fallBack(p,al);continue}
  if(p.side==='CT'&&R.rot&&R.tick>=R.rot.at&&!R.planted)doRotate();
  const tg=target(p);
  if(p.zone!==tg&&!syncWait(p,tg,al)){const h=hop(p.zone,tg,p.side);p.from=p.zone;p.next=h;p.travel=adj[p.zone][h];if(typeof chkQ==='function')p.travel+=chkQ(p,p.zone,h);zcv(p,h,al);if(R.planted&&p.side==='CT'&&h===R.site)p.travel+=Math.round(((ZN[h].ang||3)+(ZN[h].obs||0))*POST.clear*TPS);if(p.sp!=null&&EXITS[p.zone]&&R.tick<13){p.travel+=Math.round((Math.abs(EXITS[p.zone].indexOf(h)-SPAWN[p.sp].col)*3+SPAWN[p.sp].row)*(1.5-p.tim*.1)*TK);p.sp=null}p.zone=null;p.hold=0}else p.hold++;
 }
 // kamp
 const hits=[],used={},fire={};if(R.cx&&R.cx.length){for(const x of R.cx)if(x.t.alive)hits.push(x);R.cx=[]}
 for(const p of al){
  if(!p.zone)continue;const es=enem(p);
  if(!es.length){p.engZ=null;p.rowShots=0;p.peek=0;p.sc=0;p.held=0;p.flP=0;continue}
  if(p.engZ!==p.zone){
   p.engZ=p.zone;p.eng0=R.tick;if(p.side==='T'&&!R.planted&&RSITE[p.zone]){R.tSeen=R.tSeen||{};const st=RSITE[p.zone];R.tSeen[st]=Math.max(R.tSeen[st]||0,es.length)}const arr=p.arr===R.tick,Z=ZN[p.zone],rg=Z.rng??.5,chk=Z.ch??.4;
   let sp=Math.round(TK*((100-attr(p,'aware'))/16*SKC.awM*(1-SKC.awA+SKC.awA*(Z.ang||3)/3)+rnd()*1.5));if(!arr)sp=Math.round(sp/2);if(Z.st&&es.every(q=>q.arr>p.arr))sp=Math.round(sp*(1-SKC.stS*Z.st));// støj: den, der står i zonen, hører modstanderen komme
   p.ready=R.tick+sp+Math.round(TK*((100-attr(p,'quick'))/16*(SKC.qB+SKC.qR*(1-rg))+rnd()*1.5));p.peekT=null;
   if(Z.tv&&inTr(p))p.ready+=Math.round(SKC.tvR*TPS*Z.tv);// transit: overrasket, mens han passerer en zone, modstanderen holder
   if(p.trade&&R.tick<=p.trade.until&&es.some(q=>q.id===p.trade.id))p.ready=Math.min(p.ready,trReady(p));
   p.peek=arr&&(p.spec==='hot'||rnd()*100<attr(p,'det'))?SKC.detB*attr(p,'det')/100*(1-SKC.detC/2+SKC.detC*chk):0;
   if(p.side==='CT'&&!R.planted){const to=RSITE[p.zone]||(typeof slTo==='function'?slTo(p,es):null);if(to&&es.length>=ROT.cMin&&to!==R.contact){R.contact=to;contactCall(to)}}// info: CT ser flere T på vej mod et site
   if(p.side==='T'&&!R.planted&&!R.tcall&&R.site&&es.length>=ROT.tMin&&(RSITE[p.zone]===R.site||p.zone===R.site))tCall(p);// T møder en stak på vej mod sitet: IGL kan skifte site
  }
  if(p.flP){p.ready=Math.max(p.ready??R.tick,R.tick)+p.flP;p.flP=0}// flanket: reagerer senere
  if(p.act||R.tick<p.ready)continue;
  if(SKC.front!=null){const fk=p.zone+'|'+p.side;fire[fk]=(fire[fk]||0)+1;if(fire[fk]>(ZN[p.zone].ang||3)+SKC.front)continue}
  const ang=ZN[p.zone].ang||3,srt=es.slice().sort((a,b)=>a.hp-b.hp);
  const trd=p.trade&&R.tick<=p.trade.until?es.find(q=>q.id===p.trade.id):null;// trade: drabsmanden går forud for laveste HP
  const t=trd||srt.find(q=>(used[q.id]||0)<ang)||srt[0];used[t.id]=(used[t.id]||0)+1;
  const ZC=ZN[p.zone].ch??.4,ZR=ZN[p.zone].rng??.5;
  if(p.he&&!p.thrown&&rnd()<attr(p,'iq')/100*.5/TK*(SKC.heB+SKC.heC*ZC)){
   p.he=0;p.thrown=true;const iq=attr(p,'iq')/100;
   if(rnd()<.2+.7*iq){const fr=Math.min(1,rnd()*.5+iq*.5),t0=es[ri(0,es.length-1)],dm=80*fr*(SKC.heD+SKC.heDC*ZC);hits.push({s:p,t:t0,dmg:dm,w:'he',head:false});
    if(SKC.heS)es.forEach(q=>{if(q!==t0)hits.push({s:p,t:q,dmg:dm*SKC.heS,w:'he',head:false})})}// splash: de andre i zonen får heS af skaden, så stakke straffes
   continue}
  const g=p.gun&&p.gun.mag+p.gun.res>0?p.gun:p.pis,w=W[g.type];
  if(g.mag<=0&&g.res>0&&!p.rl)p.rl=RELOAD;
  if(p.rl>0){if(--p.rl===0){const f=Math.min(w.mag,g.res);g.mag=f;g.res-=f}p.rowShots=0;continue}
  if(g.mag<=0)continue;
  if(R.tick-p.lastShot>Math.max(2,Math.ceil(TPS/w.rate)+1))p.sc=Math.max(p.sc||0,1-(1+(w.d1||0))*w.rate/TPS+1e-9);p.sc=Math.min(3,(p.sc||0)+w.rate/TPS);const nsh=Math.floor(p.sc);if(nsh<1)continue;p.sc-=nsh;
  if(R.tick-p.lastShot>Math.max(2,Math.ceil(TPS/w.rate)+1))p.rowShots=0;// langsomme våben (Deagle) skyder også i serie, så rekylen tæller
  if(p.peek&&p.peekT===null)p.peekT=t.id;
  for(let i=0;i<nsh&&g.mag>0;i++){
   g.mag--;p.rowShots++;
   const hdl=100-attr(p,'handling');let pen=Math.min(45*hdl/50*(w.capM||1),w.rec*hdl*SKC.recM*p.rowShots*(1+SKC.recR*(.5-ZR)));let aim=Math.max(0,attr(p,'aim')-pen);// loftet på rekyl-straffen afhænger også af Handling
   aim=Math.max(0,aim-(100-attr(p,'calm'))*SKC.calmNerve*Math.max(0,1-(R.tick-p.ready)/(4*TK)));// nerver i duellens første sekund
   if(p.hurt>=R.tick-2)aim=Math.max(0,aim-(100-attr(p,'calm'))*SKC.calmHit);// under beskydning: Calmness holder sigtet roligt
   let ch=.12+(SKC.aimB+SKC.aimR*ZR)*aim/100;const xf=t.zone===p.zone||typeof XZB!=='number'?1:XZB;
   if(p.held&&p.arr<t.arr)ch+=xf*(ZN[p.zone].hz??.3)*Math.min(1,p.held/(SKC.patT*TK))*(attr(p,'pat')-50)/100*SKC.patHold;// tålmodig holder får bonus, utålmodig mister fordelen
   if(g.type==='sniper')ch+=.1+(ZN[p.zone].snip||0);if(typeof xMod==='function')ch+=xMod(p,t,g.type);
   if(t.flk&&R.tick<=t.flk.until&&t.flk.ids.includes(p.id))ch+=FL.b;// flanke: træfbonus mod den, der blev taget bagfra
   if(ZN[p.zone].tv&&p.arr<t.arr&&inTr(t)&&!inTr(p))ch+=xf*SKC.tvB*ZN[p.zone].tv;
   if(ZN[p.zone].hd&&p.arr<t.arr)ch+=xf*SKC.hdB*ZN[p.zone].hd;// højde: den, der stod først, har overblikket
   if(ZN[p.zone].wb&&es.length>1&&(w.c==='rifle'||w.c==='smg'))ch+=SKC.wbB*ZN[p.zone].wb*attr(p,'iq')/100*Math.min(1,(es.length-1)/3);// gennemskydelig: spray gennem dækningen rammer stakke
   if(trd===t)ch+=SKC.trB*(attr(p,'team')-50)/100*(ZN[p.zone].tr??.5);// Teamplay: træfbonus (eller straf under 50) mod den, der lige har dræbt en holdkammerat
   if(p.peek&&p.peekT===t.id)ch+=p.peek;if(R.planted)ch+=p.side==='CT'?POST.ctB:POST.tB;if(p.arr<t.arr)ch+=xf*((ZN[p.zone].obs||0)*(1-SKC.wbO*(ZN[p.zone].wb||0))*.012*Math.max(0,(attr(p,'pos')-20)/50)+(attr(p,'pos')-70)*.0015);
   const rf=w.fall?Math.max(0,(ZR-SMGV.r0)/(1-SMGV.r0)):0;if(rf)ch*=1-w.acc*rf;
   ch=cl(ch*(1+R.luck[p.ti]),.03,.92);
   if(rnd()<ch){const f1=p.rowShots===1?Math.max(w.hs1&&!inTr(p)?w.hs1:1,t.flk&&R.tick<=t.flk.until&&t.flk.ids.includes(p.id)?HS1F:1):1,hd=(.03+SKC.hsA*aim/100)*f1,r=rnd(),head=r<hd,b=w.dmg*(1-(w.fall||0)*rf);hits.push({s:p,t,dmg:head?hsD(w,t,b):b*(r<hd+.5?1:.5),w:g.type,head})}
  }
  p.lastShot=R.tick;
 }
 // skade (samtidig)
 const dead=[];
 for(const h of shuffle(hits)){const t=h.t,b=t.hp;let d=h.dmg;if(!h.head&&t.armor>0){const ap=(W[h.w]&&W[h.w].ap)??.9,r=Math.min(d*(1-ap),t.armor);t.armor=Math.max(0,t.armor-Math.min(d*.1,t.armor)*ARMOR_WEAR);d-=r}t.hp-=d;t.dmgBy[h.s.id]=(t.dmgBy[h.s.id]||0)+Math.min(d,Math.max(0,b));t.hurt=R.tick;if(b>0&&t.hp<=0){t.kl=h;dead.push(t)}}
 for(const t of dead){
  t.alive=false;t.hp=0;t.d++;const h=t.kl,k=h.s;k.k++;k.money+=300;
  for(const id in t.dmgBy)if(+id!==k.id&&t.dmgBy[id]>=25){const a=M.players[+id];if(a.side!==t.side)a.a++}
  const isTr=k.trade&&k.trade.id===t.id&&R.tick<=k.trade.until;if(isTr)k.trade=null;
  log(k.side==='CT'?'ct':'t',isTr?`${k.name} (${k.k}/${k.d}/${k.a}) trader ${t.name} (${t.k}/${t.d}/${t.a}) med ${W[h.w].n}${h.head?' (headshot)':''}!`:`${k.name} (${k.k}/${k.d}/${k.a}) har dræbt ${t.name} (${t.k}/${t.d}/${t.a}) med ${W[h.w].n}${h.head?' (headshot)':''}!`);
  // trading: holdkammerater i samme zone får et vindue mod drabsmanden. Høj Teamplay = hurtigere reaktion
  // også holdkammerater på vej ind i zonen (fx support lige bag entry) får vinduet, og det gælder fra de ankommer
  if(k.alive&&k.zone===t.zone)for(const q of M.players)if(q.alive&&q.side===t.side&&(q.zone===t.zone||q.next===t.zone)){q.trade={id:k.id,until:R.tick+SKC.trW};
   if(q.zone&&q.engZ===q.zone&&q.ready!=null)q.ready=Math.min(q.ready,trReady(q))}
  if(t.side==='CT')ctDeath(t);
 }
 // plant / defuse
 recount();al=live();
 for(const p of al){
  if(p.act){
   const a=p.act;
   if(p.hurt===R.tick&&rnd()*100>=attr(p,'det')*.9){p.act=null;continue}
   if(--a.left>0)continue;
   p.act=null;
   if(a.type==='pick'){R.carrier=p;R.dropped=null;p.ov=R.site}
   else if(a.type==='plant'&&R.tick<ROUND_TICKS){
    R.planted=true;R.bombLeft=BOMB_TICKS;R.site=p.zone;{const tT=teamOf('T');R.pp=rnd()<(POST.pp0??0)+(POST.ppL??0)*(tT?tT.lead:0)}log('t',`<b>Bomben er plantet på ${ZNAME[p.zone]}!</b>`);
    const az=Object.keys(adj[R.site]).filter(z=>!(z in EXITS)),load={};az.forEach(z=>load[z]=0);p.ov=R.site;
    al.forEach(q=>{if(q.side==='CT'&&!q.act)q.ov=R.site});
    al.filter(q=>q.side==='T'&&q!==p&&!q.act).sort((a,b)=>dist(a.zone||a.next,R.site)-dist(b.zone||b.next,R.site)).forEach((q,i)=>{
     if(i<POST.siteT-1||!az.length){q.ov=R.site;return}const z=az.slice().sort((a,b)=>(R.pp?load[b]-load[a]:load[a]-load[b])||dist(q.zone||q.next,a)-dist(q.zone||q.next,b))[0];load[z]++;q.ov=z})}
   else if(a.type==='def'&&R.planted&&R.bombLeft>0){log('ct','<b>Bomben er desarmeret!</b>');finishRound('CT','bomben desarmeret');return}
   continue}
  if(p.zone===null)continue;
  const en=al.some(q=>q.side!==p.side&&q.zone===p.zone);
  if(R.dropped&&p.side==='T'&&p.zone===R.dropped&&!R.planted&&!R.carrier)p.act={type:'pick',left:2};
  else if(R.carrier===p&&!R.planted&&p.zone===R.site&&(!en||R.tick>=ROUND_TICKS-LATE))p.act={type:'plant',left:PLANT_T};
  else if(R.planted&&p.side==='CT'&&p.zone===R.site&&!en&&!al.some(q=>q.act&&q.act.type==='def')){p.act={type:'def',left:p.kit?DEF_T/2:DEF_T};al.forEach(q=>{if(q.side==='T'&&!q.act&&q.zone&&q.zone!==R.site&&adj[R.site][q.zone]!=null)q.ov=R.site})}
 }
 // vinder
 const nT=cnt('T'),nC=cnt('CT');
 if(nC===0)finishRound(nT===0&&!R.planted?'CT':'T',nT===0?'alle er døde':'alle CT elimineret');
 else if(nT===0&&!R.planted)finishRound('CT','alle T elimineret');
 else if(R.planted&&R.bombLeft<=0){log('t','<b>Bomben eksploderer!</b>');finishRound('T','bombe sprunget')}
 else if(!R.planted&&R.tick>=ROUND_TICKS)finishRound('CT','tiden løb ud');
}
/* ===== CT-ROTATION =====
 En CT dør på eller foran et site -> IGL kan kalde rotation dertil. Afhænger kun af IGL'ens lederskab (0-5).
 Ankeret på det andet site bliver altid. */
const ROT={p0:.25,pL:.15,s0:1,sL:1.2,c0:.6,cL:.08,cMin:2,fb:1,t0:.5,tL:.08,tMin:3};// t0/tL/tMin: T-side skift ved mødt stak // chance = p0 + pL*lederskab · forsinkelse (sek.) = s0 + sL*(5-lederskab)
// info-kald: ser en CT mindst cMin T i en zone, der hører til et site, kan IGL'en rotere dertil (chance c0 + cL*lederskab, samme forsinkelse)
const RSITE={A:'A',LA:'A',B:'B',TB:'B'};
// Teamplay: seneste tick, en spiller med trade-vindue skyder mod drabsmanden
const trReady=p=>R.tick+Math.round(TK*(100-attr(p,'team'))/16*SKC.trQ);
// Transit: spilleren kom ind i zonen på vej et andet sted hen og har stadig et andet mål (en holder, der får ny ordre midt i en kamp, tæller ikke). tvPre = kun før plant
// støj: T, der kommer ind i en støjende zone på vej mod et site, kan høres af CT, uden at nogen ser dem
function noise(p){const to=RSITE[p.zone];if(!to||to===R.contact||R.rotTo===to)return;if(M.players.filter(q=>q.alive&&q.side==='T'&&q.zone===p.zone).length<ROT.cMin)return;if(rnd()<ZN[p.zone].st*SKC.stC){R.contact=to;contactCall(to)}}
const inTr=p=>!!p.zone&&p.trA&&(!R.planted||!SKC.tvPre)&&target(p)!==p.zone;
/* Teamplay ved retake: en CT, der står lige uden for det plantede site, venter på holdkammerater, der er længere væk,
 så de går ind samlet. Ventetiden er højst SKC.syW sek. × holdets gns. Teamplay/100 og bortfalder, når bomben har under SKC.syMin sek. */
function syncWait(p,tg,al){
 if(p.side!=='CT'||!R.planted||tg!==R.site||!p.zone||hop(p.zone,tg,p.side)!==R.site||R.bombLeft<SKC.syMin*TPS)return false;
 const cts=al.filter(q=>q.side==='CT'),me=dist(p.zone,R.site);
 if(!cts.some(q=>q!==p&&!q.act&&q.ov===R.site&&(q.zone||q.next)&&dist(q.zone||q.next,R.site)>me)){p.syncT=null;return false}
 if(p.syncT==null)p.syncT=R.tick;
 const avg=cts.reduce((s,q)=>s+attr(q,'team'),0)/cts.length;
 return R.tick-p.syncT<Math.round(SKC.syW*TPS*avg/100)}
function ctDeath(t){
 if(R.planted)return;const to=RSITE[t.zone];if(!to||to===R.rotTo||(R.rot&&R.rot.to===to))return;
 const tm=teamOf('CT'),L=tm.lead;if(rnd()>=ROT.p0+ROT.pL*L)return;
 R.rot={to,at:R.tick+Math.round((ROT.s0+ROT.sL*(5-L))*TPS)};
}
/* infospil: en CT uden for sitene, der er i undertal mod mindst 2 T, trækker sig tilbage til det nærmeste site (én gang pr. runde) i stedet for at dø alene */
function fallBack(p,al){if(!ROT.fb||p.side!=='CT'||R.planted||p.fb||p.zone==='A'||p.zone==='B'||p.zone in EXITS)return false;
 const e=al.filter(q=>q.side==='T'&&q.zone===p.zone).length,f=al.filter(q=>q.side==='CT'&&q.zone===p.zone).length;if(e<2||e<=f)return false;
 const to=RSITE[p.zone]||(dist(p.zone,'A')<=dist(p.zone,'B')?'A':'B');p.fb=true;p.ov=to;const h=hop(p.zone,to,p.side);p.from=p.zone;p.next=h;p.travel=adj[p.zone][h];p.zone=null;p.hold=0;p.engZ=null;return true}
/* T-side info: møder T mindst tMin CT'er i en zone mod det planlagte site, kan IGL'en skifte til det andet site (én gang pr. runde).
 Chance t0 + tL*lederskab. Spillerne i kontakten bliver og kæmper, resten går mod det nye site. */
function tCall(p){R.tcall=true;const tm=teamOf('T'),L=tm.lead;if(rnd()>=ROT.t0+ROT.tL*L)return;
 const to=R.site==='A'?'B':'A',c=tm.ps.find(q=>q.igl&&q.alive)||p;R.site=to;
 tm.ps.forEach(q=>{if(q.alive&&!q.act)q.ov=to});if(R.dropped)R.dropped=R.dropped;
 log('t',`${c.name} (IGL) kalder skift til ${to}-site`)}
function contactCall(to){if(to===R.rotTo||(R.rot&&R.rot.to===to))return;const L=teamOf('CT').lead;if(rnd()>=ROT.c0+ROT.cL*L)return;R.rot={to,at:R.tick+Math.round((ROT.s0+ROT.sL*(5-L))*TPS)}}
function doRotate(){
 const to=R.rot.to,tm=teamOf('CT'),keep=to==='A'?1:0,c=tm.ps.find(p=>p.igl&&p.alive)||tm.ps.find(p=>p.igl)||tm.ps[0];R.rot=null;R.rotTo=to;
 const ps=tm.ps.filter(p=>p.alive&&!p.act&&p.rc!==keep&&target(p)!==to);if(!ps.length)return;
 ps.forEach(p=>p.ov=to);log('ct',`${c.name} (IGL) kalder rotation mod ${to}-site: ${ps.map(p=>p.name).join(', ')}`);
}
