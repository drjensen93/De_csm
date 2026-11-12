/* ===== FASE 63: 2D-MOTOR PÅ de_dust2 =====
 Selve runden (bevægelse, syn, skud, bombe) køres af 2D-motoren (CSM2D) på et gitter udtrukket af radarbilledet.
 Spillet beholder alt andet: økonomi og køb, taktikvalg (også AI's og dine egne), rapporter, statistik og forlænget spilletid.
 Zone-ruter omregnes automatisk: hvert punkt i ruten bliver et sted i det tilsvarende område, tidspunkter bliver tidligste afgang.
 Specialer: Hothead swinger altid. Ørneøje bruger stadig områdernes gemmesteder. Holdspiller gælder holdkammerater inden for 10 felter.
 Ingen automatiske rotationer, site-skift eller tilbagefald: kun taktikkens waitpoints styrer, hvornår spillerne går videre. */
{
const E=window.CSM2D;
const M2D={};// map-id -> motor-kort
const E2D_MAPS={dust2:DUST2_JSON,inferno:INFERNO_JSON,aztec:AZTEC_JSON};
// inferno: nye zoner fra 2D-kortet (T ramp mellem T-spawn og Banana/Mid, Speedway mellem CT-spawn og Arch)
{const m=MAPS.aztec;if(m&&!m.zn.CAT){m.zn.CAT={...(m.zn.MID||{}),obs:1};m.zname.CAT='Catwalk';m.edges.push(['CA','CAT',2],['CAT','MID',2]);delete m.adj;delete m.sp;delete m.spx;if(CUR==='aztec')CUR=''}}
{const m=MAPS.inferno;if(m&&!m.zn.TR){Object.assign(m.zn,{TR:{...(m.zn.TB||{}),obs:2},SW:{...(m.zn.AR||{}),obs:1}});Object.assign(m.zname,{TR:'T ramp',SW:'Speedway'});
  m.edges.push(['TS','TR',3],['TR','TB',2],['TR','MID',3],['CT','SW',2],['SW','AR',2],['SW','CH',3]);Object.assign(m.rsite,{SW:'B'});delete m.adj;delete m.sp;delete m.spx;if(CUR==='inferno')CUR=''}}
const e2dOn=()=>!(WD&&WD.e2d===false);
const use2D=()=>e2dOn()&&!!E2D_MAPS[CUR];
function e2dMap(id){if(!M2D[id]){const mp=E.makeMap(E2D_MAPS[id]);mp.slots=buildSlots(mp);for(const z in mp.J.alias||{})if(!mp.slots[z]&&mp.slots[mp.J.alias[z]]){mp.slots[z]=mp.slots[mp.J.alias[z]];mp.slots[mp.J.alias[z]].forEach((_,i)=>{for(const sd of['T','CT'])mp.dirTo[z+'|'+i+'|'+sd]=mp.dirTo[mp.J.alias[z]+'|'+i+'|'+sd]})}M2D[id]=mp}return M2D[id]}
// fem spredte steder pr. område (med lidt afstand til væggene) + retning mod hver spawn
function buildSlots(mp){const{W,H,C}=mp,by={};
  const clear=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!mp.ok(x+dx,y+dy))return false;return true};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=mp.cells[y*W+x];if(a==='#')continue;(by[a]=by[a]||{all:[],clr:[]}).all.push([x,y]);if(clear(x,y))by[a].clr.push([x,y])}
  const out={};
  for(const a in by){const L=by[a].clr.length>=5?by[a].clr:by[a].all;let cx=0,cy=0;L.forEach(c=>{cx+=c[0];cy+=c[1]});cx/=L.length;cy/=L.length;
    let first=L.reduce((b,c)=>Math.hypot(c[0]-cx,c[1]-cy)<Math.hypot(b[0]-cx,b[1]-cy)?c:b,L[0]);const pts=[first];const d=L.map(c=>Math.hypot(c[0]-first[0],c[1]-first[1]));
    while(pts.length<5&&pts.length<L.length){let bi=0;for(let i=1;i<L.length;i++)if(d[i]>d[bi])bi=i;const p=L[bi];pts.push(p);for(let i=0;i<L.length;i++)d[i]=Math.min(d[i],Math.hypot(L[i][0]-p[0],L[i][1]-p[1]))}
    // de øvrige steder trækkes lidt ind mod midten, så de ikke ligger i hjørnerne
    out[a]=pts.map((p,i)=>i?[Math.round(p[0]*0.6+first[0]*0.4),Math.round(p[1]*0.6+first[1]*0.4)]:p).map(([x,y])=>{const[nx,ny]=mp.nearestWalk(x,y);return[nx*C+C/2,ny*C+C/2]})}
  // retning: et stykke ad vejen mod hver spawn (der hvor modstanderen kommer fra)
  const sp={T:mp.J.spawns.T[0],CT:mp.J.spawns.CT[0]};mp.dirTo={};
  for(const a in out)out[a].forEach((pt,i)=>{for(const s of['T','CT']){const[sx,sy]=mp.cellOf(pt[0],pt[1]),[tx,ty]=mp.nearestWalk(...mp.cellOf(sp[s][0],sp[s][1]));const path=E.astar(mp,...mp.nearestWalk(sx,sy),tx,ty);
    let dir=null;if(path){let acc=0,prev=pt;for(const q of path){acc+=Math.hypot(q[0]-prev[0],q[1]-prev[1]);prev=q;if(acc>90){dir=q;break}}dir=dir||path[path.length-1]}
    mp.dirTo[a+'|'+i+'|'+s]=dir}});
  return out}
// zone-rute -> 2D-rute. Tidspunkt (gamle 0,4 s-ticks + spillerens timing-udsving) bliver tidligste afgang i sek.
function convRoute(mp,gp,side,role){const wp=gp.wp||[],out=[];const opp=side==='T'?'CT':'T';
  wp.forEach((w,i)=>{const sl=mp.slots[w.z];if(!sl)return;const k=(role+i)%sl.length,pt=sl[k];const last=i===wp.length-1;
    const at=w.at?Math.max(0,(w.at+(gp.jit||0))*0.4):0;
    let dir=null;if(last)dir=mp.dirTo[w.z+'|'+k+'|'+opp];else{const nx=wp[i+1],ns=mp.slots[nx.z];if(ns)dir=ns[(role+i+1)%ns.length]}
    out.push({t:'way',x:pt[0],y:pt[1],at,dir});});
  if(!out.length){const s=mp.J.spawns[side][role%5];out.push({t:'way',x:s[0],y:s[1]})}
  // første punkt er ofte spawn-zonen: spring over, hvis den ligger i spawn-området
  return out.slice(0,8)}
// game-spiller <-> motor-spiller
const gOf=ep=>ep.ref;
// skills regnes én gang pr. skridt pr. spiller (attr har mange lag)
function e2dSkill(ep,k){const gp=ep.ref;if(!gp)return ep.sk[k];const R2=R&&R.e2;if(!R2)return attr(gp,k);
  if(gp._skt!==R2.t){gp._skt=R2.t;gp._skc={};{const z2=R2.M.areaAt(ep.x,ep.y);gp.zone=ZN[z2]?z2:gp.zone}gp.hold=ep.still*TPS;gp.gun=ep.gun;gp.pis=ep.pis;gp.alive=ep.alive}
  const c=gp._skc[k];if(c!==undefined)return c;return gp._skc[k]=attr(gp,k)}
// Holdspiller: holdkammerater inden for 10 felter (i stedet for samme zone)
{const _at=attr;attr=function(p,k){if(k==='team'&&R&&R.e2&&p&&p._e){const z=p.zone;p.zone='__2d__';let v=_at(p,k);p.zone=z;const me=p._e,C=R.e2.M.C;
    if(R.e2.P.some(q=>q!==me&&q.alive&&q.side===me.side&&q.ref&&q.ref.spec==='team'&&Math.hypot(q.x-me.x,q.y-me.y)<=C*10))v*=1.05;return v}
  return _at(p,k)}}
// ---------- rundestart ----------
{const _sr=startRound;startRound=function(){const r=_sr.apply(this,arguments);try{if(M&&R&&use2D())setup2D()}catch(e){console.error('2D-opsætning',e);R.e2=null}return r}}
function setup2D(){const mp=e2dMap(CUR);
  E.CFG.roundTime=ROUND_TICKS/TPS;E.CFG.bombTime=BOMB_TICKS/TPS;E.CFG.plantTime=PLANT_T/TPS;E.CFG.defuseTime=DEF_T/TPS;E.CFG.reload=RELOAD/TPS;
  const tT=teamOf('T'),tC=teamOf('CT');
  const ordT=tT.ps.slice().sort((a,b)=>a.rt-b.rt),ordC=tC.ps.slice().sort((a,b)=>a.rc-b.rc);
  const mkTeam=ps=>ps.map(p=>({name:p.name,sk:{},ref:p}));
  const lo=ps=>ps.map(p=>({gun:p.gun?p.gun.type:null,pis:p.pis?p.pis.type:null,armor:p.armor||0,helm:!!p.helm,he:p.he?1:0}));
  const routes={T:ordT.map((p,i)=>convRoute(mp,p,'T',i)),CT:ordC.map((p,i)=>convRoute(mp,p,'CT',i))};
  const bomb=Math.max(0,ordT.indexOf(R.carrier));
  const R2=E.newRound(mp,{seed:Math.floor(rnd()*1e9),teamT:mkTeam(ordT),teamCT:mkTeam(ordC),loadout:{T:lo(ordT),CT:lo(ordC)},routes,bomb,site:R.site||'A',
    skill:e2dSkill,luck:ep=>R.luck[ep.ref.ti]||0,alwaysSwing:ep=>ep.ref.spec==='hot',visual:!M.quiet});
  R2.P.forEach(ep=>{ep.ref._e=ep});
  R.e2=R2;R.e2acc=0;
}
// ---------- tick: 0,25 s spil = to motor-skridt ----------
const WHY={'Bomben er desarmeret':['CT','bomben desarmeret'],'Bomben sprang':['T','bombe sprunget'],'T er døde':['CT','alle T elimineret'],'CT er døde':['T','alle CT elimineret'],'Tiden løb ud':['CT','tiden løb ud']};
{const _tr=tickRound;tickRound=function(){if(!(R&&R.e2))return _tr.apply(this,arguments);tick2D()}}
function tick2D(){const R2=R.e2;R.tick++;
  const n=Math.round(0.25/E.CFG.dt);for(let i=0;i<n&&!R2.over;i++){E.step(R2);events2D(R2)}
  R2.P.forEach(ep=>{const gp=ep.ref;gp.alive=ep.alive;gp.hp=Math.max(0,Math.round(ep.hp));gp.zone=ep.alive?(z2=>ZN[z2]?z2:gp.zone)(R2.M.areaAt(ep.x,ep.y)):null;gp.armor=Math.round(ep.armor);gp.he=ep.he});
  recount();
  if(R2.planted){R.planted=true;R.bombLeft=Math.ceil(R2.bombLeft*TPS)}
  R.carrier=R2.P.find(p=>p.bomb&&p.alive)?.ref||null;
  if(R2.over){if(R2.winner==='T'&&R2.why==='Bomben sprang')log('t','<b>Bomben eksploderer!</b>');const[s,w]=WHY[R2.why]||[R2.winner,'tiden løb ud'];finishRound(s,w)}}
function events2D(R2){for(const ev of R2.events){
  if(ev.type==='kill'){const k=ev.k.ref,t=ev.v.ref;t.alive=false;t.hp=0;t.d++;k.k++;k.money+=300;ev.assist.forEach(a=>a.ref.a++);
    const wn=ev.he?'HE-granat':(W[ev.w]?W[ev.w].n:ev.w);
    if(!M.quiet)log(k.side==='CT'?'ct':'t',`${k.name} (${k.k}/${k.d}/${k.a}) har dræbt ${t.name} (${t.k}/${t.d}/${t.a}) med ${wn}${ev.head?' (headshot)':''}!`)}
  else if(ev.type==='plant'){R.planted=true;R.site=ev.site;R.bombLeft=BOMB_TICKS;if(!M.quiet)log('t',`<b>Bomben er plantet på ${ZNAME[ev.site]||ev.site}!</b>`)}
  else if(ev.type==='defuse'){if(!M.quiet)log('ct',`<b>${ev.p.ref.name} desarmerer bomben!</b>`)}
}
  R2.events.length=0}
// ---------- rundeslut: udstyr tilbage til spillet ----------
{const _fr=finishRound;finishRound=function(side,why){if(R&&R.e2&&!R.over){R.e2.P.forEach(ep=>{const gp=ep.ref;gp.alive=ep.alive;
    if(ep.alive){gp.gun=ep.gun&&ep.gun.mag+ep.gun.res>0?ep.gun:(ep.gun||null);gp.pis=ep.pis;if(ep.pis&&ep.pis.type==='deagle')gp.pt='deagle';gp.armor=Math.round(ep.armor);gp.helm=ep.helm&&ep.armor>0;gp.he=ep.he}})}
  return _fr.apply(this,arguments)}}

// ---------- 2D-visning i kampvisningen ----------
let cv2=null,ctx2=null,img2=null,lastTickAt=0,imgFor=null;
function ensureCanvas(){if(cv2)return;const mv=$('mv');if(!mv||!mv.insertBefore)return;const wrap=document.createElement('div');wrap.id='e2w';wrap.style.cssText='position:relative;width:100%;max-width:640px;margin:6px auto;aspect-ratio:1/1;background:#e4e7ea;border:1px solid #000;transition:background .2s';
  cv2=document.createElement('canvas');cv2.style.cssText='width:100%;height:100%;display:block';wrap.appendChild(cv2);const fd=$('feed');mv.insertBefore(wrap,fd);ctx2=cv2.getContext('2d');
  const tg=document.createElement('div');tg.style.cssText='display:flex;gap:8px;justify-content:center;font-size:12px;margin:2px 0 6px';tg.innerHTML='<label><input type="checkbox" id="e2names" checked> Navne</label><label><input type="checkbox" id="e2areas"> Områdenavne</label>';mv.insertBefore(tg,fd);
  $('e2areas').onchange=()=>{imgFor=null}}
// kortet tegnes som radaren: glatte kanter, farve efter højde (blå = lav, grøn = høj), grå kasser, døre og vægge som streger
function mapImage(mp){const{W,H,C}=mp,S=1024;
  const up=(fill)=>{const o=document.createElement('canvas');o.width=W;o.height=H;const x=o.getContext('2d');const d=x.createImageData(W,H);fill(d.data);x.putImageData(d,0,0);
    const b=document.createElement('canvas');b.width=S;b.height=S;const y=b.getContext('2d');y.imageSmoothingEnabled=true;y.imageSmoothingQuality='high';y.drawImage(o,0,0,S,S);return y.getImageData(0,0,S,S).data};
  // kasser = væg-felter, der ikke hænger sammen med det, der er uden for kortet
  const out=new Uint8Array(W*H),q=[];for(let x=0;x<W;x++)for(const y of[0,H-1]){const k=y*W+x;if(!mp.walk[k]&&!out[k]){out[k]=1;q.push(k)}}for(let y=0;y<H;y++)for(const x of[0,W-1]){const k=y*W+x;if(!mp.walk[k]&&!out[k]){out[k]=1;q.push(k)}}
  while(q.length){const k=q.pop(),x=k%W,y=(k/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const n=ny*W+nx;if(!mp.walk[n]&&!out[n]){out[n]=1;q.push(n)}}}
  // lukkede væg-områder: små = kasser, store = huller i kortet (fx midt i Top mid)
  {const seen=new Uint8Array(W*H);for(let k0=0;k0<W*H;k0++){if(mp.walk[k0]||out[k0]||seen[k0])continue;const comp=[k0],st=[k0];seen[k0]=1;
    while(st.length){const k=st.pop(),x=k%W,y=(k/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const n=ny*W+nx;if(!mp.walk[n]&&!out[n]&&!seen[n]){seen[n]=1;st.push(n);comp.push(n)}}}
    if(comp.length>40)comp.forEach(k=>out[k]=1)}}
  const BXR=mp.J.boxes||null;if(BXR)for(const[a,b,c2,d]of BXR)for(let y=Math.floor(b/C)-1;y<=Math.floor(d/C)+1;y++)for(let x=Math.floor(a/C)-1;x<=Math.floor(c2/C)+1;x++){if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x;if(mp.walk[k])continue;
    const ox=Math.min(c2+6,x*C+C)-Math.max(a-6,x*C),oy=Math.min(d+6,y*C+C)-Math.max(b-6,y*C);if(ox>0&&oy>0)out[k]=0}
  // væg-streger (fx kanten mellem Xbox og Catwalk) tegnes som mørk væg, ikke som hul
  const wl=new Uint8Array(W*H);for(const f of mp.J.features||[]){if(f.type!=='wall'||f.rail)continue;const[a,b,c2,d]=f.line,n=Math.max(2,Math.ceil(Math.hypot(c2-a,d-b)/2));
    for(let i=0;i<=n;i++){const px=a+(c2-a)*i/n,py=b+(d-b)*i/n,k=Math.floor(py/C)*W+Math.floor(px/C);if(k>=0&&k<W*H&&!mp.walk[k]){wl[k]=1;out[k]=0}}}
  let fl;if(mp.J.outline){// omrids som polygoner: lige vægge og skarpe hjørner
    const o=document.createElement('canvas');o.width=S;o.height=S;const g=o.getContext('2d');g.fillStyle='#000';g.beginPath();
    for(const P of mp.J.outline){g.moveTo(P[0],P[1]);for(let i=2;i<P.length;i+=2)g.lineTo(P[i],P[i+1]);g.closePath()}g.fill('evenodd');
    for(const f of mp.J.features||[])if(f.type==='stairs'&&f.arc){const[cx,cy,r0,r1,a0,a1]=f.arc;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,r1,(a0-2)*Math.PI/180,(a1+2)*Math.PI/180);g.closePath();g.fill()}
    fl=g.getImageData(0,0,S,S).data}
  else fl=up(d=>{for(let k=0;k<W*H;k++)d[k*4+3]=out[k]?0:255});           // gulv inkl. kasser
  const bx=up(d=>{for(let k=0;k<W*H;k++)d[k*4+3]=!out[k]&&!mp.walk[k]&&!wl[k]?255:0});// kasser
  const wm=up(d=>{for(let k=0;k<W*H;k++)d[k*4+3]=wl[k]?255:0});// væg-streger
  const hh=up(d=>{for(let k=0;k<W*H;k++){let v=mp.height[k];if(!mp.walk[k]){let s=0,n=0;const x=k%W,y=(k/W)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&mp.walk[ny*W+nx]){s+=mp.height[ny*W+nx];n++}}v=n?s/n:0}d[k*4]=v*28;d[k*4+3]=255}});
  const c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d');const img=x.createImageData(S,S),D=img.data;
  const isF=i=>fl[i*4+3]>=128,isB=i=>!BXR&&bx[i*4+3]>=128,sand=mp.J.id==='dust2',stone=mp.J.id==='inferno'||mp.J.id==='aztec',azt=mp.J.id==='aztec',tex=sand||stone;
  const MAT=mp.J.mat||null,MR=mp.J.matRes||4,MW=MAT?MAT[0].length:0;let MPD=null;if(mp.J.matPoly){const o=document.createElement('canvas');o.width=S;o.height=S;const g=o.getContext('2d');g.imageSmoothingEnabled=false;
    const codes={w:1,v:2,b:3,s:4,c:5};for(const code in codes){const L=mp.J.matPoly.filter(q=>q.m===code);if(!L.length)continue;g.fillStyle=`rgb(${codes[code]},0,0)`;
      for(const q of L){const P=q.p;g.beginPath();g.moveTo(P[0],P[1]);for(let i=2;i<P.length;i+=2)g.lineTo(P[i],P[i+1]);g.closePath();g.fill('evenodd')}}/* hver flade for sig, så overlap lægges sammen */MPD=g.getImageData(0,0,S,S).data}
  const MPC=['g','w','v','b','s','c'];
  const matAt=MPD?(X,y)=>{const k=((y|0)*S+(X|0))*4;return MPD[k+3]>=128?MPC[MPD[k]]||'g':'g'}:(X,y)=>MAT?(MAT[Math.min(MAT.length-1,(y/MR)|0)]||'')[Math.min(MW-1,(X/MR)|0)]||'g':null;
  const inSite=(X,y)=>{for(const k in mp.J.sites){const r=mp.J.sites[k].rect;if(X>=r[0]-24&&X<=r[2]+24&&y>=r[1]-24&&y<=r[3]+24)return true}return false};
  // støj og fliser (deterministisk, så kortet ser ens ud hver gang)
  const hsh=(a,b)=>{let h=Math.imul(a,374761393)+Math.imul(b,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
  // afstand til væggen (glat): sløret gulvmaske, bruges til skygge langs væggene
  let sh=null;if(tex){const R2=5,A=new Float32Array(S*S),Bf=new Float32Array(S*S);for(let i=0;i<S*S;i++)A[i]=isF(i)?1:0;
    for(let y=0;y<S;y++){let acc=0;for(let X=-R2;X<S;X++){if(X+R2<S)acc+=A[y*S+X+R2];if(X-R2-1>=0)acc-=A[y*S+X-R2-1];if(X>=0)Bf[y*S+X]=acc/(2*R2+1)}}
    for(let X=0;X<S;X++){let acc=0;for(let y=-R2;y<S;y++){if(y+R2<S)acc+=Bf[(y+R2)*S+X];if(y-R2-1>=0)acc-=Bf[(y-R2-1)*S+X];if(y>=0)A[y*S+X]=acc/(2*R2+1)}}sh=A}
  const lo=sand?[148,106,62]:stone?[104,88,64]:[47,76,87],hi=sand?[208,178,134]:stone?[178,174,166]:[94,104,72];// dust2: dæmpet sand
  for(let y=0;y<S;y++)for(let X=0;X<S;X++){const i=y*S+X,o=i*4;if(!isF(i)){D[o+3]=0;continue}
    let edge=false;for(const[dx,dy]of[[2,0],[-2,0],[0,2],[0,-2]]){const nx=X+dx,ny=y+dy;if(nx<0||ny<0||nx>=S||ny>=S||!isF(ny*S+nx)){edge=true;break}}
    if(edge){if(stone){D[o]=62;D[o+1]=64;D[o+2]=66}else if(sand){D[o]=92;D[o+1]=60;D[o+2]=32}else{D[o]=58;D[o+1]=62;D[o+2]=66}D[o+3]=255;continue}
    if(wm[o+3]>=110){if(stone){D[o]=58;D[o+1]=60;D[o+2]=62}else if(sand){D[o]=88;D[o+1]=58;D[o+2]=30}else{D[o]=51;D[o+1]=55;D[o+2]=59}D[o+3]=255;continue}
    if(isB(i)){let be=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=(y+dy)*S+X+dx;if(!isB(n)){be=true;break}}
      if(sand){// trækasse: lys planke med mørk kant og svage planke-linjer
        const pl=((X+y*0)%10===0)||((y)%10===0);const n=hsh(X>>1,y>>1)*14-7;const g=be?[112,76,40]:pl?[176,134,82]:[206,166,108];D[o]=g[0]+n;D[o+1]=g[1]+n;D[o+2]=g[2]+n*.6}
      else if(stone){// trækasse som på det gamle inferno: lyse brædder med mørk kant
        const pl=(X%6===0);const n=hsh(X>>1,y>>1)*12-6;const g=be?[84,62,36]:pl?[150,124,84]:[204,180,132];D[o]=g[0]+n;D[o+1]=g[1]+n;D[o+2]=g[2]+n*.6}
      else{const g=be?96:138;D[o]=g;D[o+1]=g+2;D[o+2]=g+4}D[o+3]=255;continue}
    let t=Math.max(0,Math.min(1,hh[o]/28/9));
    if(sand){// sand: lys og glat højt oppe, mørkere og mere ru lavt nede, fliser og korn ovenpå
      const tx=X/22|0,ty=y/22|0,tile=(hsh(tx,ty)-.5)*14,mortar=(X%22===0||y%22===0)?-10:0,grain=(hsh(X,y)-.5)*(20-t*10),rough=(hsh(X>>2,y>>2)-.5)*(1-t)*26;
      const sd=sh?Math.min(1,Math.max(0,(1-sh[i])*2.2)):0,shade=1-sd*.35;
      for(let k=0;k<3;k++)D[o+k]=Math.max(0,Math.min(255,(lo[k]+(hi[k]-lo[k])*t+tile+mortar+grain+rough)*shade));D[o+3]=255}
    else if(stone&&MAT){// materialer som på det gamle inferno: grå sten, brunt træ, brosten, trapper
      const sd=sh?Math.min(1,Math.max(0,(1-sh[i])*2.2)):0,shade=(1-sd*.4)*(.88+.12*t);const m=matAt(X,y),grain=(hsh(X,y)-.5)*12;let c;
      if(m==='b'){const py=(y/9|0),off=(hsh(py,3)*40)|0,seam=(y%9===0)?-22:((X+off)%46===0?-14:0),v=(hsh((X+off)/46|0,py)-.5)*14,w=(hsh(X>>3,y)-.5)*10;c=[112+v+seam+w,95+v+seam+w,62+v*.7+seam+w*.6]}
      else if(m==='c'){const r=(y/8|0),sx=X+(r%2)*4,mo=(sx%8===0||y%8===0)?-24:0,v=(hsh(sx/8|0,r)-.5)*24;c=[138+v+mo,116+v+mo,106+v*.8+mo]}
      else if(m==='s'){const ln=(X%6===0||y%6===0)?-26:0;c=azt?[188+ln,178+ln,150+ln]:[170+ln,152+ln,148+ln]}
      else if(m==='w'){// vand i ankelhøjde: grønligt med små krusninger
        const a1=(hsh(X>>3,y>>3)-.5)*20,a2=(hsh(X>>1,y>>1)-.5)*14,rip=Math.sin(X*.35+Math.sin(y*.21)*2.2+y*.08)>.86?16:0;c=[66+a1*.6+a2*.5+rip*.6,90+a1+a2+rip,74+a1*.6+a2*.5+rip*1.1]}
      else if(m==='v'){// græs: grønt med pletter i flere størrelser
        const a1=(hsh(X>>3,y>>3)-.5)*26,a2=(hsh(X>>1,y>>1)-.5)*22,a3=(hsh((X+y)>>4,(y-X)>>4)-.5)*16,bl=hsh(X,y)>.93?-24:0;c=[78+a1*.7+a2*.6+a3+bl,96+a1+a2+a3+bl,52+a1*.5+a2*.4+a3*.6+bl]}
      else if(azt){// aztec-sten: uregelmæssige fliser i rækker
        const rh=11,r=(y/rh|0),off=(hsh(r,11)*30)|0,bw=14+((hsh(r,5)*10)|0),bi=((X+off)/bw)|0,mo=(y%rh===0||(X+off)%bw===0)?-30:0,v=(hsh(bi,r)-.5)*30,sp=(hsh(X>>1,y>>1)>.96)?16:0;
        c=[150+v+mo+sp,142+v+mo+sp,126+v*.9+mo+sp]}
      else{const tx=X/20|0,ty=y/20|0,tile=(hsh(tx+7,ty)-.5)*12,mortar=(X%20===0||y%20===0)?-12:0,sp=(hsh(X>>1,y>>1)>.97)?18:0;c=[156+tile+mortar+sp,150+tile+mortar+sp,136+tile+mortar+sp]}
      for(let k=0;k<3;k++)D[o+k]=Math.max(0,Math.min(255,(c[k]+grain)*shade));D[o+3]=255}
    else if(stone){// sten: grå fliser højt oppe, mørk brun jord lavt nede, rødlige brosten på sites
      const sd=sh?Math.min(1,Math.max(0,(1-sh[i])*2.2)):0,shade=1-sd*.38;const u=Math.max(0,Math.min(1,(t-.22)/.22)),m=u*u*(3-2*u);
      const grain=(hsh(X,y)-.5)*14;let c;
      if(inSite(X,y)&&m>.5){const cx=(X+((y/9|0)%2)*4)/9|0,cy=y/9|0,mo=((X+((y/9|0)%2)*4)%9===0||y%9===0)?-26:0,v=(hsh(cx,cy)-.5)*22;c=[146+v+mo,116+v+mo,104+v*.8+mo]}
      else{const tx=X/18|0,ty=y/18|0,tile=(hsh(tx+7,ty)-.5)*12,mortar=(X%18===0||y%18===0)?-14:0,rough=(hsh(X>>2,y>>2)-.5)*26;
        const g=[lo[0]+(hi[0]-lo[0])*t,lo[1]+(hi[1]-lo[1])*t,lo[2]+(hi[2]-lo[2])*t];const dirt=[96+rough,82+rough*.9,58+rough*.7],st=[g[0]+tile+mortar,g[1]+tile+mortar,g[2]+tile+mortar];
        c=[dirt[0]+(st[0]-dirt[0])*m,dirt[1]+(st[1]-dirt[1])*m,dirt[2]+(st[2]-dirt[2])*m]}
      for(let k=0;k<3;k++)D[o+k]=Math.max(0,Math.min(255,(c[k]+grain)*shade));D[o+3]=255}
    else{D[o]=lo[0]+(hi[0]-lo[0])*t;D[o+1]=lo[1]+(hi[1]-lo[1])*t;D[o+2]=lo[2]+(hi[2]-lo[2])*t;D[o+3]=255}}
  for(const sl of mp.J.slopes||[]){// skrå flade (fx A ramp på aztec): lysere øverst, mørkere nederst, svage højdelinjer på tværs
    const[a,b,c2,d2]=sl.rect,L0=sl.dir==='e'||sl.dir==='w'?c2-a:d2-b;
    for(let y=Math.max(0,b|0);y<Math.min(S,d2);y++)for(let X=Math.max(0,a|0);X<Math.min(S,c2);X++){const i=y*S+X;if(!isF(i))continue;
      const p=sl.dir==='n'?(d2-y):sl.dir==='e'?(X-a):sl.dir==='w'?(c2-X):(y-b),t=p/L0,band=(p%16)<1.5?1.1:((p%16)>13.5?0.9:1),f=(1.2-0.4*t)*band,o=i*4;
      D[o]=Math.min(255,D[o]*f);D[o+1]=Math.min(255,D[o+1]*f);D[o+2]=Math.min(255,D[o+2]*f)}}
  if(mp.J.raisedAreas&&MPD){// mørk kant hvor vand møder sten i hævede områder (fx T-brohus på aztec)
    const RA=new Set(mp.J.raisedAreas),LM=new Set(mp.J.lowMats||['w']),C0=mp.C,W0=mp.W,ar=(X,y)=>mp.cells[((y/C0)|0)*W0+((X/C0)|0)];
    const SR=(mp.J.features||[]).filter(f=>f.type==='steps').map(f=>f.rect),inSteps=(X,y)=>SR.some(r=>X>=r[0]-1&&X<=r[2]+1&&y>=r[1]-1&&y<=r[3]+1);// trapper: ingen kant, de fører jo ned
    const isRaised=(X,y)=>X>=0&&y>=0&&X<S&&y<S&&isF(y*S+X)&&!LM.has(matAt(X,y))&&RA.has(ar(X,y))&&!inSteps(X,y);
    for(let y=0;y<S;y++)for(let X=0;X<S;X++){const i=y*S+X;if(!isF(i)||!LM.has(matAt(X,y)))continue;let e=false;
      for(let dy=-2;dy<=2&&!e;dy++)for(let dx=-2;dx<=2;dx++)if(isRaised(X+dx,y+dy)){e=true;break}
      if(e){const o=i*4;D[o]=58;D[o+1]=60;D[o+2]=62;D[o+3]=255}}}
  x.putImageData(img,0,0);
  for(const sl of mp.J.slopes||[]){if(!sl.steps)continue;// trappe: trinkanter på tværs af gangretningen, mørk kant + lys næse
    const[a,b,c2,d2]=sl.rect,vert=sl.dir==='n'||sl.dir==='s',L0=vert?d2-b:c2-a,n=Math.max(3,Math.round(L0/(sl.step||7)));x.save();x.globalCompositeOperation='source-atop';x.beginPath();x.rect(a,b,c2-a,d2-b);x.clip();
    for(let i=1;i<n;i++){const t=i/n;if(vert){const yy=b+(d2-b)*t;x.fillStyle='rgba(30,20,10,.55)';x.fillRect(a,yy-1,c2-a,1.6);x.fillStyle='rgba(255,236,200,.22)';x.fillRect(a,yy+0.6,c2-a,1.2)}
      else{const xx=a+(c2-a)*t;x.fillStyle='rgba(30,20,10,.55)';x.fillRect(xx-1,b,1.6,d2-b);x.fillStyle='rgba(255,236,200,.22)';x.fillRect(xx+0.6,b,1.2,d2-b)}}
    x.restore()}
  for(const f of mp.J.features||[]){if(f.type==='stairs'&&f.arc){// vindeltrappe: lige trinlinjer fra væg til væg
      const[cx,cy,r0,r1,a0,a1]=f.arc,n=Math.max(4,Math.round((a1-a0)/7.5));x.save();x.globalCompositeOperation='source-atop';x.lineCap='butt';
      x.strokeStyle='rgba(66,42,20,.75)';x.lineWidth=1.6;for(let i=1;i<n;i++){const an=(a0+(a1-a0)*i/n)*Math.PI/180;x.beginPath();x.moveTo(cx+Math.cos(an)*(r0+1),cy+Math.sin(an)*(r0+1));x.lineTo(cx+Math.cos(an)*(r1+3),cy+Math.sin(an)*(r1+3));x.stroke()}
      x.restore();continue}
    if(f.type==='steps'){const[a,b,c2,d]=f.rect,w=c2-a,h=d-b;x.save();x.globalCompositeOperation='source-atop';
      if(f.mat==='w'){x.restore();continue}// trappe med vand-tekstur (fx Mid stairs på aztec): tegnes af materialet, kun omrids
      const bl=!!f.blend;// blend: samme tone som stenen omkring (fx T-trappen på aztec)
      x.fillStyle=bl?'#8b8371':azt?'#9c9280':'#c4b99c';x.fillRect(a,b,w,h);
      const n=Math.max(3,Math.round((f.dir==='h'?h:w)/6)),rv=!!f.rev,sh=bl?'rgba(78,70,56,.6)':azt?'rgba(60,54,44,.7)':'rgba(70,58,40,.55)',hk=bl?.45:1;
      for(let i=0;i<n;i++){const t=rv?(n-1-i)/n:i/n,s0=i/n;x.fillStyle=`rgba(255,255,255,${(.18-.14*t)*hk})`;
        if(f.dir==='h'){const yy=b+h*s0,sh2=h/n;if(rv){x.fillRect(a,yy+sh2*.55,w,sh2*.45);x.fillStyle=sh;x.fillRect(a,yy,w,1.4)}else{x.fillRect(a,yy,w,sh2*.45);x.fillStyle=sh;x.fillRect(a,yy+sh2-1.4,w,1.4)}}
        else{const xx=a+w*s0,sw=w/n;if(rv){x.fillRect(xx+sw*.55,b,sw*.45,h);x.fillStyle=sh;x.fillRect(xx,b,1.4,h)}else{x.fillRect(xx,b,sw*.45,h);x.fillStyle=sh;x.fillRect(xx+sw-1.4,b,1.4,h)}}}
      if(bl){const X0=Math.max(0,a|0),Y0=Math.max(0,b|0),W0=Math.min(S-X0,Math.ceil(w)),H0=Math.min(S-Y0,Math.ceil(h)),g=x.getImageData(X0,Y0,W0,H0),D2=g.data;
        for(let yy=0;yy<H0;yy++)for(let xx=0;xx<W0;xx++){const o=(yy*W0+xx)*4;if(!D2[o+3])continue;const nz=(hsh(X0+xx,Y0+yy)-.5)*14+(hsh((X0+xx)>>2,(Y0+yy)>>2)-.5)*10;D2[o]+=nz;D2[o+1]+=nz;D2[o+2]+=nz*.9}x.putImageData(g,X0,Y0)}
      x.restore();continue}
    if((f.type==='fence'||(f.type==='wall'&&f.rail))&&f.line){const[a,b,c2,d]=f.line;x.save();x.lineCap='butt';x.strokeStyle='#3a2a18';x.lineWidth=4;x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke();
      x.strokeStyle='#b89464';x.lineWidth=1.4;x.setLineDash([3,3]);x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke();x.setLineDash([]);x.restore();continue}
    if(f.type==='fence'&&f.arc){// hegn rundt om en balkon
      const[cx,cy,r,a0,a1]=f.arc,A0=a0*Math.PI/180,A1=a1*Math.PI/180;x.save();x.lineCap='butt';
      x.strokeStyle='#3a2a18';x.lineWidth=5;x.beginPath();x.arc(cx,cy,r,A0,A1);x.stroke();
      x.strokeStyle='#b89464';x.lineWidth=1.6;x.setLineDash([3,3]);x.beginPath();x.arc(cx,cy,r,A0,A1);x.stroke();x.setLineDash([]);x.restore();continue}
    if(!f.line)continue;const[a,b,c2,d]=f.line;x.lineCap='round';if(f.type==='wall'){x.strokeStyle=mp.J.id==='dust2'?'#5a3a1c':'#33373b';x.lineWidth=3.5;x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke()}
    else if(mp.J.id==='aztec'){// trædør: tyndere, brun med årer
      const L=Math.hypot(c2-a,d-b),ux=(c2-a)/L,uy=(d-b)/L,nx=-uy,ny=ux;x.save();x.lineCap='butt';
      x.strokeStyle='#2e1d0e';x.lineWidth=6;x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke();
      x.strokeStyle='#7a5430';x.lineWidth=4;x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke();
      x.lineWidth=.8;for(const o of[-1,0,1]){x.strokeStyle=o?'rgba(60,36,16,.75)':'rgba(170,128,80,.6)';x.setLineDash(o?[5,2,2,3]:[3,4]);x.beginPath();x.moveTo(a+nx*o*1.1,b+ny*o*1.1);x.lineTo(c2+nx*o*1.1,d+ny*o*1.1);x.stroke()}
      x.setLineDash([]);x.restore()}
    else if(mp.J.id==='dust2'){// brun trædør; hængselenden sættes helt ind til væggen, så der ikke er hul
      const wallAt=(X,Y)=>X<0||Y<0||X>=S||Y>=S||!isF((Y|0)*S+(X|0));
      const near=(X,Y)=>{let best=null,bd=1e9;for(let dy=-14;dy<=14;dy++)for(let dx=-14;dx<=14;dx++){const dd=dx*dx+dy*dy;if(dd<bd&&dd<=196&&wallAt(X+dx,Y+dy)){bd=dd;best=[X+dx,Y+dy]}}return best?[best,bd]:null};
      let P=[a,b],Q=[c2,d];const na=near(a,b),nb=near(c2,d);if(nb&&(!na||nb[1]<na[1])){[P,Q]=[Q,P]}const h=(P===Q)?null:(P[0]===a&&P[1]===b?na:nb);
      if(h){const L=Math.hypot(h[0][0]-P[0],h[0][1]-P[1])||1;P=[h[0][0]+(h[0][0]-P[0])/L*4,h[0][1]+(h[0][1]-P[1])/L*4]}
      x.save();x.globalCompositeOperation='source-atop';x.lineCap='butt';x.strokeStyle='#4a2c12';x.lineWidth=10;x.beginPath();x.moveTo(P[0],P[1]);x.lineTo(Q[0],Q[1]);x.stroke();
      x.strokeStyle='#8b5a2e';x.lineWidth=6.5;x.beginPath();x.moveTo(P[0],P[1]);x.lineTo(Q[0],Q[1]);x.stroke();x.restore()}
    else{x.strokeStyle='#c9a46a';x.lineWidth=2;x.setLineDash([4,3]);x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke();x.setLineDash([])}}
  // omrids om trapper og markerede materialeflader (fx A ramp og Mid stairs på aztec)
  {x.save();x.globalCompositeOperation='source-atop';x.lineJoin='miter';const oc=azt?'#3b3d3f':stone?'#3e4042':'#5c3c1e';
    for(const f of mp.J.features||[])if(f.type==='steps'&&f.mat!=='w'){const[a,b,c2,d]=f.rect,E=f.edges||'nesw',L0=a+.5,R0=c2-.5,T0=b+.5,B0=d-.5;x.strokeStyle=oc;x.lineWidth=2.4;x.lineCap='square';x.beginPath();
      if(E.includes('n')){x.moveTo(L0,T0);x.lineTo(R0,T0)}if(E.includes('e')){x.moveTo(R0,T0);x.lineTo(R0,B0)}if(E.includes('s')){x.moveTo(L0,B0);x.lineTo(R0,B0)}if(E.includes('w')){x.moveTo(L0,T0);x.lineTo(L0,B0)}x.stroke()}// edges: hvilke sider der får omrids
    for(const q of [...(mp.J.matPoly||[]).filter(q=>q.outline),...(mp.J.outlinePolys||[]).map(o=>Array.isArray(o)?{p:o}:o)]){const P=q.p;x.beginPath();x.moveTo(P[0],P[1]);for(let i=2;i<P.length;i+=2)x.lineTo(P[i],P[i+1]);if(!q.open)x.closePath();x.strokeStyle=oc;x.lineWidth=2.4;x.stroke()}
    x.restore()}
  if(BXR){x.save();x.globalCompositeOperation='source-atop';for(const[a,b,c2,d,K]of BXR){const w=c2-a,h=d-b;
    if(!K){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(a+2,b+3,w,h)}// skygge
    if(stone&&K==='f'){const cx=(a+c2)/2,cy=(b+d)/2,r=Math.min(w,h)/2,oct=(rr)=>{x.beginPath();for(let k=0;k<8;k++){const an=Math.PI/8+k*Math.PI/4;x.lineTo(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr)}x.closePath()};
      oct(r);x.fillStyle='#a9b0b4';x.fill();x.strokeStyle='#4a5054';x.lineWidth=2;x.stroke();oct(r*.78);x.fillStyle='#1f6f78';x.fill();x.beginPath();x.arc(cx,cy,r*.38,0,7);x.fillStyle='#7fae3a';x.fill();x.strokeStyle='#4d7a22';x.lineWidth=1.5;x.stroke();continue}
    if(stone&&K==='t'){x.fillStyle='#9aa0a3';x.fillRect(a,b,w,h);x.fillStyle='#1f7480';x.fillRect(a+3,b+3,w-6,h-6);x.strokeStyle='#4a5054';x.lineWidth=2;x.strokeRect(a,b,w,h);continue}
    if(stone&&K==='p'){const cx=(a+c2)/2,cy=(b+d)/2,r=Math.min(w,h)/2;x.beginPath();for(let k=0;k<8;k++){const an=Math.PI/8+k*Math.PI/4;x.lineTo(cx+Math.cos(an)*r,cy+Math.sin(an)*r)}x.closePath();x.fillStyle='#a8a49a';x.fill();x.strokeStyle='#55524c';x.lineWidth=2;x.stroke();continue}
    if(stone&&K==='car'){const hz=w>=h;x.fillStyle='#e9e6dc';x.beginPath();x.roundRect?x.roundRect(a,b,w,h,4):x.rect(a,b,w,h);x.fill();x.strokeStyle='#5d5a52';x.lineWidth=2;x.stroke();
      x.fillStyle='#7d8a96';if(hz){x.fillRect(a+w*.28,b+3,w*.16,h-6);x.fillRect(a+w*.62,b+3,w*.12,h-6)}else{x.fillRect(a+3,b+h*.28,w-6,h*.16);x.fillRect(a+3,b+h*.62,w-6,h*.12)}continue}
    if(azt){const cx=(a+c2)/2,cy=(b+d)/2;x.save();x.translate(cx,cy);if(K==='r')x.rotate(Math.PI/4);const ww=K==='r'?Math.min(w,h)/Math.SQRT2:w,hh2=K==='r'?Math.min(w,h)/Math.SQRT2:h,X0=-ww/2,Y0=-hh2/2,m=Math.min(ww,hh2);
      x.fillStyle='rgba(0,0,0,.25)';x.fillRect(X0+2,Y0+3,ww,hh2);
      if(K==='col'){// søjle: rund top med ringe
        x.fillStyle='#bdb193';x.fillRect(X0,Y0,ww,hh2);x.strokeStyle='#5e5440';x.lineWidth=1.6;x.strokeRect(X0,Y0,ww,hh2);
        const r=m*.46;const gr=x.createRadialGradient(-r*.35,-r*.35,r*.1,0,0,r);gr.addColorStop(0,'#eee5cc');gr.addColorStop(1,'#a99d7f');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,7);x.fill();
        x.strokeStyle='#6b6048';x.lineWidth=1;x.beginPath();x.arc(0,0,r,0,7);x.stroke();x.beginPath();x.arc(0,0,r*.62,0,7);x.stroke();x.fillStyle='#8c8066';x.beginPath();x.arc(0,0,r*.22,0,7);x.fill();x.restore();continue}
      x.fillStyle='#cfc3a2';x.fillRect(X0,Y0,ww,hh2);x.fillStyle='#ddd3b6';x.fillRect(X0+1.5,Y0+1.5,ww-3,hh2*.28);
      if(m>=10){// azteciske udskæringer: indfældet kant, trappe-mønster og et solsymbol i midten
        const ins=Math.max(2,m*.16),iw=ww-ins*2,ih=hh2-ins*2;x.strokeStyle='#8a7d5e';x.lineWidth=1.2;x.strokeRect(X0+ins,Y0+ins,iw,ih);
        if(m>=14){const st=Math.max(2.2,m*.09);x.strokeStyle='#7a6e52';x.lineWidth=1;x.beginPath();
          for(let k=0;k*st*2<iw-st;k++){const px=X0+ins+k*st*2;x.moveTo(px,Y0+ins+st);x.lineTo(px+st,Y0+ins+st);x.lineTo(px+st,Y0+ins+st*2);x.lineTo(px+st*2,Y0+ins+st*2);
            x.moveTo(px,Y0+ins+ih-st);x.lineTo(px+st,Y0+ins+ih-st);x.lineTo(px+st,Y0+ins+ih-st*2);x.lineTo(px+st*2,Y0+ins+ih-st*2)}x.stroke()}
        const r=m*(m>=14?.17:.2);x.fillStyle='#9d906f';x.beginPath();x.moveTo(0,-r*1.5);x.lineTo(r*1.5,0);x.lineTo(0,r*1.5);x.lineTo(-r*1.5,0);x.closePath();x.fill();
        x.fillStyle='#e4dbc0';x.beginPath();x.arc(0,0,r*.6,0,7);x.fill();x.strokeStyle='#6d6248';x.lineWidth=.8;x.stroke()}
      x.strokeStyle='#6d6248';x.lineWidth=2;x.strokeRect(X0,Y0,ww,hh2);x.restore();continue}
    if(stone){x.fillStyle='#d2bf92';x.fillRect(a,b,w,h);x.strokeStyle='#7d6240';x.lineWidth=1.6;const v=w>=h;x.beginPath();
      if(v)for(let k=a+5;k<c2-2;k+=5){x.moveTo(k,b+2);x.lineTo(k,d-2)}else for(let k=b+5;k<d-2;k+=5){x.moveTo(a+2,k);x.lineTo(c2-2,k)}x.stroke();
      x.strokeStyle='#3a2a16';x.lineWidth=2.2;x.strokeRect(a,b,w,h);continue}
    x.fillStyle='#6f9350';x.fillRect(a,b,w,h);x.fillStyle='#86a963';x.fillRect(a+2,b+2,w-4,Math.max(2,h*.35));
    x.strokeStyle='#4c6a34';x.lineWidth=1.5;x.beginPath();x.moveTo(a+2,b+2);x.lineTo(c2-2,d-2);x.moveTo(c2-2,b+2);x.lineTo(a+2,d-2);x.stroke();
    x.strokeStyle='#22301a';x.lineWidth=2.5;x.strokeRect(a,b,w,h)}x.restore()}
  for(const c of mp.J.crossings||[]){if(c.hatch===false)continue;const[a,b,c2,d]=c.rect;x.save();x.beginPath();x.rect(a,b,c2-a,d-b);x.clip();x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=3;for(let k=-200;k<300;k+=14){x.beginPath();x.moveTo(a+k,b);x.lineTo(a+k+(d-b),d);x.stroke()}x.restore();x.strokeStyle='rgba(255,255,255,.45)';x.setLineDash([6,5]);x.lineWidth=1.5;x.strokeRect(a,b,c2-a,d-b);x.setLineDash([])}
  for(const s in mp.J.sites){const r=mp.J.sites[s].rect;x.strokeStyle='#ff7a2e';x.lineWidth=2.5;x.strokeRect(r[0],r[1],r[2]-r[0],r[3]-r[1]);x.fillStyle='#ff7a2e';x.font='700 26px sans-serif';x.fillText(s,r[0]+5,r[1]+24)}
  if($('e2areas')&&$('e2areas').checked){const sum={};for(let k=0;k<W*H;k++){const a=mp.cells[k];if(a==='#')continue;const s=sum[a]||(sum[a]=[0,0,0]);s[0]+=k%W;s[1]+=(k/W)|0;s[2]++}
    x.font='600 13px sans-serif';x.textAlign='center';x.fillStyle='#ffffffcc';x.strokeStyle='#00000088';x.lineWidth=3;x.lineJoin='round';for(const a in sum){const s=sum[a],t=(MAPS[CUR]&&MAPS[CUR].zname[a])||ZNAME[a]||a,lp=mp.J.labelPos&&mp.J.labelPos[a],px=lp?lp[0]:s[0]/s[2]*C+C/2,py=lp?lp[1]:s[1]/s[2]*C+C/2;x.strokeText(t,px,py);x.fillText(t,px,py)}x.textAlign='left'}
  return c}
const mapBg=id=>id==='dust2'?'#bfd5ee':id==='inferno'?'#c4d4ea':id==='aztec'?'#c2d4ec':'#e4e7ea';
/* synsfelt: generisk kegle foran spilleren (viser kun retningen – ikke rækkevidde eller bredde) */
function drawCone(c,mp,x,y,f,h,R,rgb){const H=0.55,L=56;const g=c.createRadialGradient(x,y,6,x,y,L);g.addColorStop(0,`rgba(${rgb},.75)`);g.addColorStop(.6,`rgba(${rgb},.35)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.beginPath();c.moveTo(x,y);c.arc(x,y,L,f-H,f+H);c.closePath();c.fill()}
const CONE_R=0;
function draw2D(){requestAnimationFrame(draw2D);const wrap=$('e2w');if(wrap&&wrap.style&&R&&R.e2)wrap.style.background=mapBg(CUR);
  const show=VIEW==='mv'&&M&&!M.quiet&&R&&R.e2;if(wrap&&wrap.style)wrap.style.display=show?'':'none';if(!show)return;ensureCanvas();if(!cv2)return;
  const R2=R.e2,mp=R2.M;const key=CUR+($('e2areas')&&$('e2areas').checked?'1':'0');if(imgFor!==key){img2=mapImage(mp);imgFor=key}
  const r=cv2.getBoundingClientRect(),dpr=window.devicePixelRatio||1;if(cv2.width!==Math.round(r.width*dpr)){cv2.width=Math.round(r.width*dpr);cv2.height=Math.round(r.height*dpr)}
  const s=cv2.width/1024;ctx2.setTransform(s,0,0,s,0,0);ctx2.clearRect(0,0,1024,1024);ctx2.drawImage(img2,0,0);
  const a=paused||R2.over?1:Math.min(1,(performance.now()-lastTickAt)/TICK_MS);
  for(const t of R2.tracers){const al=1-(R2.t-t.t)/0.25;ctx2.strokeStyle=t.side==='T'?`rgba(255,110,95,${al*.8})`:`rgba(120,190,255,${al*.8})`;ctx2.lineWidth=t.hit?1.6:.8;ctx2.beginPath();ctx2.moveTo(t.a[0],t.a[1]);ctx2.lineTo(t.b[0],t.b[1]);ctx2.stroke()}
  for(const n of R2.nades){ctx2.fillStyle='#9fe870';ctx2.beginPath();ctx2.arc(n.x,n.y,4,0,7);ctx2.fill()}
  for(const b of R2.booms){const al=1-(R2.t-b.t)/0.6;ctx2.fillStyle=`rgba(255,170,60,${al*.45})`;ctx2.beginPath();ctx2.arc(b.x,b.y,E.CFG.heRadius*(1-al*.3),0,7);ctx2.fill()}
  if(R2.bomb){ctx2.fillStyle=(Math.floor(R2.t*2)%2)?'#ff4d40':'#7a1d18';ctx2.fillRect(R2.bomb.x-6,R2.bomb.y-6,12,12)}
  if(R2.dropped){ctx2.fillStyle='#ff8a3d';ctx2.fillRect(R2.dropped.x-5,R2.dropped.y-5,10,10)}
  const me=myIdx(),names=$('e2names')&&$('e2names').checked;
  for(const p of R2.P){if(!p.alive)continue;const x=p.prx+(p.x-p.prx)*a,y=p.pry+(p.y-p.pry)*a;let fd=p.face-(p.prf!=null?p.prf:p.face);fd=Math.atan2(Math.sin(fd),Math.cos(fd));
    ctx2.globalAlpha=p.layer&&p.layer===(mp.lowAx?mp.lowAx[mp.cellOf(p.x,p.y)[1]*mp.W+mp.cellOf(p.x,p.y)[0]]:(mp.J.lowLayer||1))?0.4:1;drawCone(ctx2,mp,x,y,p.face-fd*(1-a),p.fovA||(E.CFG.fov+0.24*60)*Math.PI/180,CONE_R,p.side==='T'?'224,69,58':'88,168,230');ctx2.globalAlpha=1}
  for(const p of R2.P){const x=p.prx+(p.x-p.prx)*a,y=p.pry+(p.y-p.pry)*a;const col=p.side==='T'?'#e0453a':'#58a8e6';
    if(!p.alive){ctx2.strokeStyle=col+'99';ctx2.lineWidth=2;ctx2.beginPath();ctx2.moveTo(x-5,y-5);ctx2.lineTo(x+5,y+5);ctx2.moveTo(x+5,y-5);ctx2.lineTo(x-5,y+5);ctx2.stroke();continue}
    ctx2.globalAlpha=p.layer&&p.layer===(mp.lowAx?mp.lowAx[mp.cellOf(p.x,p.y)[1]*mp.W+mp.cellOf(p.x,p.y)[0]]:(mp.J.lowLayer||1))?0.38:1;// nederste lag i en krydsning (fx CT-tunnelen under Short)
        ctx2.strokeStyle=p.ref&&p.ref.ti===me?'#ffffff':'#0b0e10';ctx2.lineWidth=1.5;ctx2.fillStyle=col;ctx2.beginPath();ctx2.arc(x,y,8,0,7);ctx2.fill();ctx2.stroke();
    ctx2.lineWidth=2;
    ctx2.strokeStyle=p.hp>50?'#5cbf7a':p.hp>25?'#e8c33d':'#e05a4f';ctx2.beginPath();ctx2.arc(x,y,11.5,-Math.PI/2,-Math.PI/2+Math.PI*2*p.hp/100);ctx2.stroke();
    if(p.bomb){ctx2.fillStyle='#ff8a3d';ctx2.fillRect(x+8,y-13,6,6)}
    const pl=R2.plant&&R2.plant.p===p?1-R2.plant.left/E.CFG.plantTime:R2.defuse&&R2.defuse.p===p?1-R2.defuse.left/E.CFG.defuseTime:null;if(pl!=null){ctx2.strokeStyle='#fff';ctx2.lineWidth=3;ctx2.beginPath();ctx2.arc(x,y,16,-Math.PI/2,-Math.PI/2+Math.PI*2*pl);ctx2.stroke()}
    if(names){ctx2.font='700 12px sans-serif';ctx2.textAlign='center';ctx2.textBaseline='top';ctx2.lineWidth=3;ctx2.lineJoin='round';ctx2.strokeStyle='#000000b0';ctx2.strokeText(p.name,x,y+14);ctx2.fillStyle=col;ctx2.fillText(p.name,x,y+14);ctx2.textAlign='left';ctx2.textBaseline='alphabetic'}ctx2.globalAlpha=1}}
// gem positionerne før hvert tick, så visningen kan glide mellem dem
{const _t2=tick2D;tick2D=function(){if(R&&R.e2)R.e2.P.forEach(p=>{p.prx=p.x;p.pry=p.y;p.prf=p.face});lastTickAt=performance.now();return _t2()}}
// første billede af en ny runde
{const _s2=setup2D;setup2D=function(){_s2();R.e2.P.forEach(p=>{p.prx=p.x;p.pry=p.y;p.prf=p.face})}}
requestAnimationFrame(draw2D);

// ---------- rotation uden aztec (indtil aztec har et 2D-kort) ----------
// Sæsonens to maps er altid dust2 og inferno; hvilket der kommer først, skifter fra sæson til sæson. Kampe, der allerede har fået aztec, flyttes.
const noAztec=()=>e2dOn()&&!E2D_MAPS.aztec;
{const _sm=seasonMaps;seasonMaps=function(o){const r=_sm(o);if(!noAztec())return r;const s=WD.season+(o||0);return s%2?['dust2','inferno']:['inferno','dust2']}}
{const _nm=newMatch;newMatch=function(defs,quiet,noDraw,map){if(noAztec()&&map==='aztec'){const sm=seasonMaps();map=sm[Math.floor(rnd()*2)]}return _nm.call(this,defs,quiet,noDraw,map)}}
// ---------- kontakt: 2D-motor til/fra (gemmes i spillet) ----------
{const _rf=renderFaq;renderFaq=function(){_rf();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;
  f.insertAdjacentHTML('afterbegin',`<div class="tm"><h3>2D-motor (de_dust2 og de_inferno)</h3><div style="padding:3px 0">Kampe på de_dust2 og de_inferno spilles i den nye 2D-motor, hvor spillerne bevæger sig rundt på et rigtigt kort. Taktikkernes zone-ruter omregnes automatisk til steder i områderne. Der er ingen automatiske rotationer eller tilbagefald – kun waitpoints styrer, hvornår spillerne går videre. aztec er taget ud af rotationen, indtil mappet får et 2D-kort – sæsonens to maps er dust2 og inferno.</div>
  <div style="padding:3px 0"><label><input type="checkbox" id="e2tog" ${e2dOn()?'checked':''}> Brug 2D-motoren på de_dust2 og de_inferno</label></div></div>`);
  const t=$('e2tog');if(t)t.onchange=()=>{if(WD){WD.e2d=t.checked;try{saveGame()}catch(e){}}}}}
// beskrivelser af de tre ændrede specialer
Object.assign(SPEC.hot,{2:'Swinger altid, når han ser en fjende (stopper ikke op, intet Determination-tjek), men −10% Patience'});
Object.assign(SPEC.team,{2:'Holdkammerater inden for ca. 350 units (2D-motoren) eller i samme zone får +5% Teamplay'});
/* ===== FASE 64: 2D-TAKTIK-BYGGER (de_dust2) =====
 Taktikker tegnes direkte på kortet. Hver rolle har højst 8 punkter: waypoint, syncpoint eller waitpoint, evt. en retning og et tidligste tidspunkt.
 Gemmes i WD.tx[id].r2 som [type, felt-x, felt-y, retning i grader eller null, tidligst afgang i sek.] pr. punkt (type 0 = waypoint, 1 = syncpoint, 2 = waitpoint).
 Zone-ruten (r) laves automatisk ud fra punkternes områder, så rapporter, AI-viden og NY/VARIANT virker som før. */
const PT_N=['Waypoint','Syncpoint','Waitpoint'],PT_S=['W','S','!'],MAXPTS=8,SYNC_OPT=[2,3,4,5,6,7,8,9,10],SYNC_DEF=6;
const syncW=p=>p[0]===1?Math.max(2,Math.min(10,p[5]||SYNC_DEF)):null;
const r2Route=(mp,pts)=>pts.map(([t,cx,cy,d,at,sw,wf,g])=>{const x=cx*mp.C+mp.C/2,y=cy*mp.C+mp.C/2;return{t:['way','sync','wait'][t],x,y,at:t===1?0:(at||0),sw:t===1?Math.max(2,Math.min(10,sw||SYNC_DEF)):undefined,wf:t===1&&wf?wf:undefined,g:t===1&&g?g:undefined,dir:d==null?null:[x+Math.cos(d*Math.PI/180)*120,y+Math.sin(d*Math.PI/180)*120]}});
// zone-rute ud fra punkterne: områderne i rækkefølge (gentagelser slås sammen)
function r2Zones(mp,r2){return r2.map(pts=>{const w=[];for(const[t,cx,cy,d,at]of pts){const z=mp.cells[cy*mp.W+cx];if(z==='#')continue;const a=Math.round((at||0)/.4);if(w.length&&w[w.length-1][0]===z){w[w.length-1][1]=Math.max(w[w.length-1][1],a)}else w.push([z,a])}return w})}
// zone-taktik -> startpunkter til byggeren (samme omregning som i kampene)
function r2FromZones(mp,sd,r){return r.map((w,k)=>{if(!w||!w.length)return[];const gp={wp:w.map(([z,at])=>({z,at:at||0})),jit:0};return convRoute(mp,gp,sd,k).map(o=>{const[cx,cy]=mp.cellOf(o.x,o.y);const d=o.dir?Math.round(Math.atan2(o.dir[1]-o.y,o.dir[0]-o.x)*180/Math.PI):null;return[0,cx,cy,d,Math.round(o.at||0)]})})}
// brug 2D-ruterne i kampene, når taktikken har dem
const r2Ok=(x,mp)=>!!(x&&x.r2&&(x.r2v||1)===(mp.J.version||1));// gamle punkter passer kun til den kortversion, de blev lavet på
{const _s=setup2D;setup2D=function(){_s();try{const R2=R.e2,mp=R2.M;for(const side of['T','CT']){const tm=teamOf(side),x=(WD.tx&&WD.tx[tm.tac])||std2dGet(CUR,tm.tac);if(!r2Ok(x,mp))continue;
  const ps=R2.P.filter(p=>p.side===side);ps.forEach(p=>{const k=side==='T'?p.ref.rt:p.ref.rc,pts=x.r2[k];if(!pts||!pts.length)return;p.route=r2Route(mp,pts);p.ri=0;p.arrivedAt=null;p.goal=null});
  if(side==='T'&&x.st)R2.site=x.st}}catch(e){console.error('2D-ruter',e)}}}

// ---------- bygger-tilstand ----------
const t2On=map=>e2dOn()&&!!E2D_MAPS[map];
{const _o=tbOpen;tbOpen=function(map,sd,src){_o(map,sd,src);if(!TB||!t2On(map))return;const mp=e2dMap(map),x=src&&((WD.tx&&WD.tx[src])||std2dGet(map,src));
  TB.d2=true;TB.r2=r2Ok(x,mp)?JSON.parse(JSON.stringify(x.r2)):r2FromZones(mp,sd,TB.r);while(TB.r2.length<5)TB.r2.push([]);TB.sel=null;TB.tool='add';TB.view={s:1,x:0,y:0};TB.prev=null;renderTactics()}}
const t2Time=(mp,sd,pts)=>{const sp=mp.J.spawns[sd][0];let x=sp[0],y=sp[1],t=0;const v=E.CFG.speed/mp.upx;
  for(const[ty,cx,cy,d,at]of pts){const tx=cx*mp.C+mp.C/2,ty2=cy*mp.C+mp.C/2;t=Math.max(t,at||0);const[sx,sy]=mp.nearestWalk(...mp.cellOf(x,y));const path=E.astar(mp,sx,sy,cx,cy);let L=0,px=x,py=y;if(path)for(const q of path){L+=Math.hypot(q[0]-px,q[1]-py);px=q[0];py=q[1]}else L=Math.hypot(tx-x,ty2-y);t+=L/v;x=tx;y=ty2}return t};
function t2Check(){const B=TB,mp=e2dMap(B.map),out=[];let ok=true;
  B.r2.forEach((w,k)=>{if(!w.length){ok=false;out.push(['x',`${ROLES[B.sd][k]} har ingen punkter.`])}else if(w.length>MAXPTS){ok=false;out.push(['x',`${ROLES[B.sd][k]} har ${w.length} punkter – højst ${MAXPTS}.`])}});
  const waits=B.r2.flatMap((w,k)=>w.filter(p=>p[0]===2).map(()=>k));if(new Set(waits).size>1&&B.r2.some(w=>w.some(p=>p[0]===1&&!p[6])))out.push(['i','⚠ Flere waitpoints: et syncpoint, der "venter på alle waitpoints", går videre, hvis det næste waitpoint ikke er nået endnu. Brug "venter kun på Pos X" for at styre rækkefølgen.']);
  if(waits.length)out.push(['i',`Waitpoint${waits.length>1?'s':''}: når ${[...new Set(waits)].map(k=>ROLES[B.sd][k]).join(' / ')} står på sit waitpoint, venter de andre ved deres næste syncpoint, til han dør (waypoints går de forbi). Flere waitpoints virker efter tur.`]);
  if(B.sd==='T'){const c=B.r2[1];if(waits[0]===1)out.push(['i','Bombebæreren har waitpointet – bomben kommer først frem, hvis han dør, og en anden samler den op.']);
    if(c.length){const l=c[c.length-1],z=mp.cells[l[2]*mp.W+l[1]];if(z!==B.st){ok=false;out.push(['x',`Bombebæreren (${ROLES.T[1]}) skal slutte på ${B.st}-site.`])}else{const a=t2Time(mp,'T',c);if(a>75){ok=false;out.push(['x',`Bomben når først ${B.st} efter ca. ${Math.round(a)} sek. – højst 75 sek.`])}else out.push(['ok',`Bomben når ${B.st}-site efter ca. ${Math.round(a)} sek. (uden ventetid ved syncpoints).`])}}}
  const ns=B.r2.map(w=>w.filter(p=>p[0]===1).length),mx=Math.max(...ns);if(mx>0){out.push(['i','Syncpoints: hver spillers 1., 2. … syncpoint venter på holdkammeraternes tilsvarende i samme gruppe (Fælles, A, B eller C). Sync-tiden tælles først, når alle i gruppen er fremme. Spillere uden syncpoint i gruppen tæller ikke med.']);const lone=[1,2,3,4,5].filter(n=>ns.filter(c=>c>=n).length===1).length;if(lone)out.push(['i','Kun én spiller har et syncpoint nr. '+[1,2,3,4,5].filter(n=>ns.filter(c=>c>=n).length===1).join(', ')+' – han venter bare sync-tiden.'])}
  const nodir=B.r2.reduce((s,w)=>s+w.filter(p=>p[0]===1&&p[3]==null).length,0);if(nodir)out.push(['i',`${nodir} syncpoint${nodir>1?'s':''} uden retning – spilleren kigger, som han kom.`]);
  return{ok,out}}

// ---------- tegning ----------
let T2img=null,T2mp=null;/* kortbilledet huskes pr. map: skift af map (fx fra dust2 til aztec) tegner det rigtige kort */
function t2Draw(){const cv=document.getElementById('t2cv');if(!cv||!TB||!TB.d2)return;const B=TB,mp=e2dMap(B.map);if(!T2img||T2mp!==mp){T2img=mapImage(mp);T2mp=mp}
  const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;if(cv.width!==Math.round(r.width*dpr)){cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.width*dpr)}
  const ctx=cv.getContext('2d'),base=cv.width/1024,V=B.view,s=base*V.s;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.setTransform(s,0,0,s,-V.x*s,-V.y*s);ctx.drawImage(T2img,0,0);
  const C=mp.C,c=(cx,cy)=>[cx*C+C/2,cy*C+C/2];
  // ruter (korteste vej mellem punkterne)
  B.r2.forEach((w,k)=>{if(!w.length)return;const sel=k===B.role;const sp=mp.J.spawns[B.sd][k];let px=sp[0],py=sp[1];ctx.strokeStyle=RCOL[k];ctx.globalAlpha=sel?1:.55;ctx.lineWidth=sel?5:3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(px,py);
    for(const p of w){const[sx,sy]=mp.nearestWalk(...mp.cellOf(px,py)),path=E.astar(mp,sx,sy,p[1],p[2]);if(path)for(const q of path)ctx.lineTo(q[0],q[1]);const[x,y]=c(p[1],p[2]);ctx.lineTo(x,y);px=x;py=y}
    ctx.stroke();ctx.globalAlpha=1});
  // punkter
  B.r2.forEach((w,k)=>{const sel=k===B.role;w.forEach((p,i)=>{const[x,y]=c(p[1],p[2]);const R0=sel?13:9;ctx.globalAlpha=sel?1:.7;
    if(p[3]!=null){// retning vist som synsfelt (bredden svarer til en spiller med Awareness 60)
      const a=p[3]*Math.PI/180,h=(E.CFG.fov+0.24*60)*Math.PI/180,rr=sel?95:60;ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,rr,a-h,a+h);ctx.closePath();
      ctx.fillStyle=RCOL[k];ctx.globalAlpha=sel?.28:.16;ctx.fill();ctx.globalAlpha=sel?.9:.5;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=sel?1:.7}
    ctx.fillStyle=RCOL[k];ctx.strokeStyle=sel&&B.sel===i?'#ffe14d':'#fff';ctx.lineWidth=sel&&B.sel===i?5:2.5;ctx.beginPath();
    if(p[0]===1)ctx.rect(x-R0,y-R0,R0*2,R0*2);else if(p[0]===2){ctx.moveTo(x,y-R0*1.3);ctx.lineTo(x+R0*1.3,y);ctx.lineTo(x,y+R0*1.3);ctx.lineTo(x-R0*1.3,y);ctx.closePath()}else ctx.arc(x,y,R0,0,7);
    ctx.fill();ctx.stroke();if(sel){ctx.fillStyle='#fff';ctx.font='700 15px sans-serif';ctx.textAlign='center';ctx.fillText(String(i+1),x,y+5);ctx.textAlign='left'}ctx.globalAlpha=1})});
  // site-mål
  if(B.sd==='T'){const rc=mp.J.sites[B.st].rect;ctx.strokeStyle='#ffe14d';ctx.lineWidth=4;ctx.setLineDash([8,6]);ctx.strokeRect(rc[0]-4,rc[1]-4,rc[2]-rc[0]+8,rc[3]-rc[1]+8);ctx.setLineDash([])}
  // afspilning
  const P=B.prev;if(P){for(const p of P.R.P){if(p.side!==B.sd)continue;const x=p.px+(p.x-p.px)*P.a,y=p.py+(p.y-p.py)*P.a;if(!p.alive){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-7,y-7);ctx.lineTo(x+7,y+7);ctx.moveTo(x+7,y-7);ctx.lineTo(x-7,y+7);ctx.stroke();continue}
    ctx.globalAlpha=p.layer&&p.layer===(mp.lowAx?mp.lowAx[mp.cellOf(p.x,p.y)[1]*mp.W+mp.cellOf(p.x,p.y)[0]]:(mp.J.lowLayer||1))?0.38:1;    drawCone(ctx,mp,x,y,p.face,p.fovA||(E.CFG.fov+0.24*60)*Math.PI/180,CONE_R,'255,255,255');ctx.fillStyle=RCOL[p.k];ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,10,0,7);ctx.fill();ctx.stroke();ctx.globalAlpha=1}
    if(P.R.bomb){ctx.fillStyle='#ff4d40';ctx.fillRect(P.R.bomb.x-7,P.R.bomb.y-7,14,14)}}}
function t2HTML(){if(TB.lastRole!==TB.role){TB.lastRole=TB.role;TB.sel=null;TB.tool='add'}const B=TB,C=t2Check(),sd=B.sd,w=B.r2[B.role],L=ulGet(B.map,sd),full=L.length>=UL.max&&!B.own,p=B.sel!=null?w[B.sel]:null;
  const secOpt=v=>[0,5,10,15,20,25,30,35,40,45,50,55,60,70,80,90].map(x=>`<option value="${x}" ${Math.round(v||0)===x?'selected':''}>${x?'tidligst efter '+x+' sek.':'ingen ventetid'}</option>`).join('');
  const tl=['add','move','dir'],tn={add:'+ Tilføj punkt',move:'✥ Flyt punkt',dir:'➚ Sæt retning'};
  let h=`<div class="hd"><b>Taktik-bygger – ${mapN(B.map)} · ${sd}-side</b><button style="flex:0 0 auto;padding:6px 12px" data-tb="close|">Annullér</button></div>`;
  h+=`<div class="tm"><div class="mu">${B.own?'Du redigerer din egen taktik.':B.src?`Kopi af <b>${txIsX(B.src)?txName(B.src):B.src}</b> – gemmes som en ny taktik.`:'Ny taktik.'} Vælg en rolle og tryk på kortet for at sætte punkter. Spilleren går ad korteste vej fra punkt til punkt.</div>`;
  h+=`<div style="display:flex;gap:8px;margin:8px 0;align-items:center"><input data-tbn="1" value="${(B.nm||'').replace(/"/g,'&quot;')}" placeholder="Navn (laves automatisk, hvis tomt)" style="flex:1;font:inherit;padding:6px;border:1px solid var(--bd)">${sd==='T'?`<select data-t2site="1" style="width:auto">${['A','B'].map(s=>`<option value="${s}" ${B.st===s?'selected':''}>Mål: ${s}-site</option>`).join('')}</select>`:''}</div>`;
  h+=`<div class="bar sm" style="flex-wrap:wrap">${ROLES[sd].map((r,k)=>`<button data-tb="role|${k}" style="flex:1 1 30%;border-left:6px solid ${RCOL[k]};${k===B.role?'background:var(--tx);color:var(--bg)':''}">${r}${sd==='T'&&k===1?' 💣':''} <span class="mu" style="font-size:11px">${B.r2[k].length}/${MAXPTS}</span></button>`).join('')}</div>`;
  h+=`<div class="bar sm" style="flex-wrap:wrap">${tl.map(t=>`<button data-t2="tool|${t}" style="${B.tool===t?'background:var(--tx);color:var(--bg)':''}">${tn[t]}</button>`).join('')}<button data-t2="zin|" style="flex:0 0 44px">+</button><button data-t2="zout|" style="flex:0 0 44px">−</button></div>`;
  h+=`<div style="position:relative"><canvas id="t2cv" style="width:100%;aspect-ratio:1/1;display:block;background:${mapBg(B.map)};border:1px solid var(--bd);touch-action:none"></canvas></div>`;
  h+=`<div class="mu" style="font-size:11px;margin-top:4px">● waypoint · ■ syncpoint · ◆ waitpoint · pil = retning. Zoom med + og −, to fingre eller musehjulet. Træk for at flytte udsnittet.</div>`;
  h+=`<div class="bar sm"><button data-t2="play|">${B.prev?'⏸ Stop':'▶ Afspil'}</button>${B.prev&&B.prev.R.waitHolder&&B.prev.R.waitHolder.alive?'<button data-t2="kill|">Lad waitpoint-spilleren dø</button>':''}<button data-t2="undo|">↶ Fjern sidste punkt</button></div>`;
  h+=`<div id="t2time" class="mu" style="text-align:center">${B.prev?B.prev.R.t.toFixed(0)+' sek.':'&nbsp;'}</div></div>`;
  // valgt punkt
  h+=`<div class="tm"><h3 style="border-left:6px solid ${RCOL[B.role]};padding-left:6px">${tbRoleName(B.role)}</h3>`;
  if(p){h+=`<div style="padding:6px;border:1px solid var(--bd);margin-bottom:8px"><b>Punkt ${B.sel+1}</b> <span class="mu">${MAPS[B.map].zname[e2dMap(B.map).cells[p[2]*e2dMap(B.map).W+p[1]]]||''}</span>
    <div class="bar sm" style="margin-top:6px">${PT_N.map((n,i)=>`<button data-t2="type|${i}" style="${p[0]===i?'background:var(--tx);color:var(--bg)':''}">${n}</button>`).join('')}</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px">${p[0]===1?`<select data-t2sw="1" style="width:auto">${SYNC_OPT.map(v=>`<option value="${v}" ${syncW(p)===v?'selected':''}>vent ${v} sek.</option>`).join('')}</select><select data-t2wf="1" style="width:auto"><option value="">venter på alle waitpoints</option>${[0,1,2,3,4].filter(k=>k!==B.role).map(k=>`<option value="${k+1}" ${p[6]===k+1?'selected':''}>venter kun på Pos ${k+1}s waitpoint</option>`).join('')}</select><select data-t2g="1" style="width:auto">${['Fælles sync','Gruppe A','Gruppe B','Gruppe C'].map((t,i)=>`<option value="${i}" ${(p[7]||0)===i?'selected':''}>${t}</option>`).join('')}</select>`:`<select data-t2at="1" style="width:auto">${secOpt(p[4])}</select>`}<span class="mu">Retning: ${p[3]==null?'ingen':p[3]+'°'}</span><button data-t2="tool|dir" style="flex:0 0 auto;padding:4px 8px">Sæt retning</button>${p[3]!=null?'<button data-t2="nodir|" style="flex:0 0 auto;padding:4px 8px">Fjern retning</button>':''}<button data-t2="del|${B.sel}" style="flex:0 0 auto;padding:4px 8px">✕ Slet</button></div>
    <div class="mu" style="font-size:11px;margin-top:4px">${p[0]===1?'Syncpoint: venter, til alle holdkammerater med et tilsvarende syncpoint er fremme (spillere uden syncpoint tæller ikke med). Derefter venter han '+syncW(p)+' sek. mere og kigger imens i den valgte retning.':p[0]===2?'Waitpoint: spilleren bliver her. De andre venter ved deres næste syncpoint, til han dør – waypoints går de forbi.':'Waypoint: spilleren går videre med det samme (eller ved det valgte tidspunkt).'}</div></div>`}
  h+=w.length?w.map((q,i)=>`<div class="r" style="grid-template-columns:22px minmax(0,1fr) auto;cursor:pointer;${i===B.sel?'background:#fff6c9':''}" data-t2="sel|${i}"><b>${i+1}</b><div>${PT_N[q[0]]} · ${MAPS[B.map].zname[e2dMap(B.map).cells[q[2]*e2dMap(B.map).W+q[1]]]||''}${q[0]===1?' · vent '+syncW(q)+' sek.':q[4]?' · efter '+q[4]+' sek.':''}${q[3]!=null?' · ➚':''}</div><span class="mu">›</span></div>`).join(''):'<div class="mu">Ingen punkter endnu – tryk på kortet.</div>';
  h+=`<div style="display:flex;gap:8px;margin-top:6px;align-items:center"><span class="mu" style="white-space:nowrap">Samme rute som</span><select data-t2same="1"><option value="">–</option>${ROLES[sd].map((r,k)=>k===B.role?'':`<option value="${k}">${r}</option>`).join('')}</select><button data-t2="clear|" style="flex:0 0 auto;padding:6px 10px">Ryd</button></div></div>`;
  h+=`<div class="tm"><h3>Kontrol</h3>${C.out.map(([k,t])=>`<div style="padding:2px 0">${k==='x'?'✗':k==='ok'?'✓':'ⓘ'} ${t}</div>`).join('')}`;
  if(full){const opts=L.map(n=>`<option value="${n}" ${(B.rep||B.src)===n?'selected':''}>${txIsX(n)?txName(n):n}</option>`).join('');h+=`<div style="margin-top:8px">Biblioteket er fuldt (${L.length}/${UL.max}). Erstat: <select data-tbrep="1"><option value="">– vælg –</option>${opts}</select></div>`}
  if(B.msg)h+=`<div style="margin-top:6px;color:var(--t)">${B.msg}</div>`;
  h+=`<button data-t2="export|" style="width:100%;margin-top:8px">⧉ Kopiér som standardtaktik</button><textarea id="t2exp" readonly style="display:none;width:100%;height:90px;margin-top:6px;font:11px monospace"></textarea><div id="t2expmsg" class="mu" style="font-size:12px"></div>`;
  h+=`<button data-t2="save|" style="width:100%;margin-top:8px;${C.ok?'background:#1b64d6;color:#fff;border-color:#1b64d6':''}" ${C.ok?'':'disabled'}>${B.own?'Gem ændringer':'Gem som ny taktik'}</button></div>`;
  return h}
{const _r=renderTactics;renderTactics=function(){if(TB&&TB.d2){const y=window.scrollY;$('tv').innerHTML=t2HTML();t2Bind();t2Draw();try{window.scrollTo(0,y)}catch(e){}return}return _r.apply(this,arguments)}}

// ---------- kort: tryk, træk og zoom ----------
function t2Bind(){const cv=document.getElementById('t2cv');if(!cv)return;let down=null;const ptr=new Map();let pinch=null;
  const toMap=(cx,cy)=>{const r=cv.getBoundingClientRect(),V=TB.view,u=1024/r.width/V.s;return[(cx-r.left)*u+V.x,(cy-r.top)*u+V.y]};
  const zoomAt=(cx,cy,ns)=>{const V=TB.view,[mx,my]=toMap(cx,cy),r=cv.getBoundingClientRect();ns=Math.max(1,Math.min(5,ns));const u=1024/r.width/ns;V.s=ns;V.x=clV(mx-(cx-r.left)*u);V.y=clV(my-(cy-r.top)*u);t2Draw()};
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,[e.clientX,e.clientY]);
    if(ptr.size===2){const[a,b]=[...ptr.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:TB.view.s};down=null;return}
    down={x:e.clientX,y:e.clientY,vx:TB.view.x,vy:TB.view.y,moved:false}});
  cv.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,[e.clientX,e.clientY]);
    if(pinch&&ptr.size===2){const[a,b]=[...ptr.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);zoomAt((a[0]+b[0])/2,(a[1]+b[1])/2,pinch.s*d/pinch.d);return}
    if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>8)down.moved=true;
    if(down.moved&&TB.view.s>1){const r=cv.getBoundingClientRect(),u=1024/r.width/TB.view.s;TB.view.x=clV(down.vx-dx*u);TB.view.y=clV(down.vy-dy*u);t2Draw()}});
  const up=e=>{ptr.delete(e.pointerId);if(pinch){if(ptr.size<2)pinch=null;down=null;return}const d=down;down=null;if(!d||d.moved||e.type==='pointercancel')return;t2Tap(...toMap(e.clientX,e.clientY))};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,TB.view.s*Math.exp(-e.deltaY*0.0018))},{passive:false})}
const clV=v=>Math.max(0,Math.min(1024-1024/TB.view.s,v));
function t2Zoom(f){const V=TB.view,c=V.x+512/V.s,cy=V.y+512/V.s;V.s=Math.max(1,Math.min(5,V.s*f));V.x=clV(c-512/V.s);V.y=clV(cy-512/V.s);t2Draw()}
function t2Tap(mx,my){const B=TB,mp=e2dMap(B.map),w=B.r2[B.role],C=mp.C;
  if(B.tool==='dir'){if(B.sel==null||!w[B.sel])return;const p=w[B.sel],x=p[1]*C+C/2,y=p[2]*C+C/2;p[3]=Math.round(Math.atan2(my-y,mx-x)*180/Math.PI);B.tool='add';return renderTactics()}
  // tryk på et eksisterende punkt vælger det
  const hit=w.findIndex(p=>Math.hypot(p[1]*C+C/2-mx,p[2]*C+C/2-my)<16/TB.view.s+6);if(hit>=0&&B.tool!=='move'){B.sel=hit;return renderTactics()}
  const[cx,cy]=mp.nearestWalk(...mp.cellOf(mx,my));if(!mp.ok(cx,cy)){B.msg='Punktet skal ligge på gulvet.';return renderTactics()}
  if(B.tool==='move'){if(B.sel==null||!w[B.sel])return;w[B.sel][1]=cx;w[B.sel][2]=cy;B.tool='add';B.msg='';return renderTactics()}
  if(w.length>=MAXPTS){B.msg=`Højst ${MAXPTS} punkter pr. spiller.`;return renderTactics()}
  w.push([0,cx,cy,null,0]);B.sel=w.length-1;B.msg='';
  if(B.sd==='T'&&B.role===1){const z=mp.cells[cy*mp.W+cx];if(z==='A'||z==='B')B.st=z}
  renderTactics()}

// ---------- afspil (kun dine egne spillere, ingen modstandere) ----------
function t2Play(){const B=TB;if(B.prev){cancelAnimationFrame(B.prev.raf);B.prev=null;return renderTactics()}const mp=e2dMap(B.map);
  const routes={T:[0,1,2,3,4].map(k=>[{t:'way',x:mp.J.spawns.T[k][0],y:mp.J.spawns.T[k][1]}]),CT:[0,1,2,3,4].map(k=>[{t:'way',x:mp.J.spawns.CT[k][0],y:mp.J.spawns.CT[k][1]}])};
  routes[B.sd]=B.r2.map((w,k)=>w.length?r2Route(mp,w):[{t:'way',x:mp.J.spawns[B.sd][k][0],y:mp.J.spawns[B.sd][k][1]}]);
  const team=()=>[0,1,2,3,4].map(k=>({name:ROLES[B.sd][k],sk:{aim:60,handling:60,iq:60,quick:60,aware:60,det:60,calm:60,pat:60,pos:60,team:60}}));
  const R2=E.newRound(mp,{seed:1,teamT:team(),teamCT:team(),routes,bomb:1,site:B.st||'A',preview:B.sd,visual:false,fixedSpawns:true});
  R2.P.forEach(p=>{p.prx=p.x;p.pry=p.y});B.prev={R:R2,a:0,last:performance.now(),acc:0};renderTactics();
  const loop=now=>{if(!TB||TB.prev!==B.prev)return;const P=B.prev;P.acc+=Math.min(.1,(now-P.last)/1000)*(250/TICK_MS);/* samme tempo som kampvisningen */P.last=now;
    while(P.acc>=E.CFG.dt){P.R.P.forEach(p=>{p.px=p.x;p.py=p.y});E.step(P.R);P.acc-=E.CFG.dt}
    P.a=P.acc/E.CFG.dt;const tt=document.getElementById('t2time');if(tt)tt.textContent=`${P.R.t.toFixed(0)} sek.${P.R.planted?' · bomben er plantet':''}${P.R.waitHolder&&P.R.waitHolder.alive?' · de andre venter på waitpointet':''}`;
    const kb=document.querySelector('[data-t2="kill|"]');const need=P.R.waitHolder&&P.R.waitHolder.alive;if(need&&!kb){const b=document.querySelector('[data-t2="undo|"]');if(b)b.insertAdjacentHTML('beforebegin','<button data-t2="kill|">Lad waitpoint-spilleren dø</button>')}else if(!need&&kb)kb.remove();
    t2Draw();if(P.R.over||P.R.t>=E.CFG.roundTime){P.a=1;t2Draw();return}P.raf=requestAnimationFrame(loop)};B.prev.raf=requestAnimationFrame(loop)}

// ---------- gem ----------
function t2Save(){const B=TB,C=t2Check();if(!C.ok)return;const mp=e2dMap(B.map),L=ulGet(B.map,B.sd);
  if(!B.own&&L.length>=UL.max&&!(B.rep&&L.includes(B.rep))){B.msg='Vælg hvilken taktik i biblioteket, den nye skal erstatte.';return renderTactics()}
  // zone-ruten laves ud fra punkterne – så virker rapporter, navne og AI som før
  const r=r2Zones(mp,B.r2).map(w=>w.length?w:[[B.sd==='T'?'TS':'CT',0]]),r2=JSON.parse(JSON.stringify(B.r2));
  let tempoS=0;if(B.sd==='T'){const ats=B.r2.filter(w=>w.length).map(w=>Math.max(...w.map(p=>p[4]||0))).sort((a,b)=>a-b);tempoS=ats[Math.floor(ats.length/2)]||0}
  const sy=B.sd==='T'?(tempoS<12?'A':tempoS<35?'M':'P'):'M',sk=r.every(w=>txLast(w)===txLast(r[0]));
  let id;WD.tx=WD.tx||{};WD.txn=WD.txn||0;
  if(B.own){id=B.src;Object.assign(WD.tx[id],{r:txEnc(r),r2,r2v:mp.J.version||1,st:B.sd==='T'?B.st:undefined,ch:undefined,cp:undefined,fb:undefined,sk:sk||undefined,sy});TXRC.delete(id);delete CHASE[id];TXFB.delete(id);TSTACK.delete(id)}
  else{id='x'+(++WD.txn);WD.tx[id]={m:B.map,s:B.sd,r:txEnc(r),r2,r2v:mp.J.version||1,st:B.sd==='T'?B.st:undefined,sk:sk||undefined,sy,p:B.src||undefined,o:'egen',b:WD.season,by:WD.me.li+'-'+WD.me.ti}}
  txReg(id);const M0=MAPS[B.map];delete (B.sd==='T'?M0.tdesc:M0.cdesc)[id];txDescSet(id);
  let nm=(B.nm||'').trim();if(!nm){delete WD.tx[id].nm;nm=txBaseName(id)}
  const used=new Set(tnOf(B.map,B.sd));ulGet(B.map,B.sd).forEach(n=>{if(n!==id&&txIsX(n))used.add(txName(n))});if(used.has(nm)){let i=2;while(used.has(nm+' #'+i))i++;nm+=' #'+i}WD.tx[id].nm=nm;
  if(!B.own){if(L.length>=UL.max){const i=L.indexOf(B.rep);L[i]=id;for(const b of ['pistol','standard','eco']){const o=MGR[B.map][B.sd][b];const j=o.indexOf(B.rep);if(j>=0)o[j]=id}ulClean(B.map,B.sd)}else ulAdd(B.map,B.sd,id)}
  try{saveGame()}catch(e){}const k={map:B.map,sd:B.sd};if(B.prev)cancelAnimationFrame(B.prev.raf);tbClose();TU.map=k.map;TU.side=k.sd;TU.open=id;renderTactics()}

// ---------- knapper ----------
$('tv').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-t2]');if(!b||!TB||!TB.d2)return;e.stopImmediatePropagation();e.preventDefault();
  const B=TB,[a,v]=b.dataset.t2.split('|'),w=B.r2[B.role];
  if(a==='tool'){B.tool=v;if(v!=='add'&&B.sel==null&&w.length)B.sel=w.length-1;return renderTactics()}
  if(a==='zin')return t2Zoom(1.6);if(a==='zout')return t2Zoom(1/1.6);
  if(a==='sel'){B.sel=+v;return renderTactics()}
  if(a==='type'){if(B.sel!=null&&w[B.sel]){w[B.sel][0]=+v;if(+v===1&&!w[B.sel][5])w[B.sel][5]=SYNC_DEF}return renderTactics()}
  if(a==='nodir'){if(B.sel!=null&&w[B.sel])w[B.sel][3]=null;return renderTactics()}
  if(a==='del'){w.splice(+v,1);B.sel=w.length?Math.min(+v,w.length-1):null;return renderTactics()}
  if(a==='undo'){w.pop();B.sel=w.length?w.length-1:null;return renderTactics()}
  if(a==='clear'){B.r2[B.role]=[];B.sel=null;return renderTactics()}
  if(a==='play')return t2Play();
  if(a==='kill'){if(B.prev&&B.prev.R.waitHolder){B.prev.R.waitHolder.alive=false;B.prev.R.waitHolder=null}b.remove();return}
  if(a==='export'){const t=t2Export(),ta=document.getElementById('t2exp'),msg=document.getElementById('t2expmsg');
    const show=ok=>{if(ta){ta.style.display='block';ta.value=t;if(!ok){ta.focus();ta.select()}}if(msg)msg.textContent=ok?'Kopieret – indsæt teksten i chatten, så lægger Claude den ind som standardtaktik.':'Kunne ikke kopiere automatisk – markér teksten herover og kopiér den.'};
    try{navigator.clipboard.writeText(t).then(()=>show(true),()=>show(false))}catch(x){show(false)}return}
  if(a==='save')return t2Save()},true);
// rolleskift i 2D: nulstil valgt punkt
$('tv').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-tb^="role|"]');if(b&&TB&&TB.d2){TB.sel=null;TB.tool='add'}},true);
$('tv').addEventListener('change',e=>{const s=e.target;if(!s||!s.dataset||!TB||!TB.d2)return;const D=s.dataset,B=TB,w=B.r2[B.role];
  if(D.t2at!=null){e.stopImmediatePropagation();if(B.sel!=null&&w[B.sel])w[B.sel][4]=+s.value;return renderTactics()}
  if(D.t2sw!=null){e.stopImmediatePropagation();if(B.sel!=null&&w[B.sel])w[B.sel][5]=+s.value;return renderTactics()}
  if(D.t2g!=null){e.stopImmediatePropagation();if(B.sel!=null&&w[B.sel]){const q=w[B.sel];if(!q[5])q[5]=SYNC_DEF;while(q.length<7)q.push(q.length===6?0:0);q[7]=+s.value||0;if(!q[7]){q.length=7;if(!q[6])q.length=6}}return renderTactics()}
  if(D.t2wf!=null){e.stopImmediatePropagation();if(B.sel!=null&&w[B.sel]){const q=w[B.sel];if(!q[5])q[5]=SYNC_DEF;while(q.length<6)q.push(0);if(s.value)q[6]=+s.value;else{q[6]=0;if(!q[7])q.length=6}}return renderTactics()}
  if(D.t2site){e.stopImmediatePropagation();B.st=s.value;return renderTactics()}
  if(D.t2same){e.stopImmediatePropagation();if(s.value!==''){B.r2[B.role]=JSON.parse(JSON.stringify(B.r2[+s.value]));B.sel=null}return renderTactics()}},true);
window.addEventListener('resize',()=>{if(TB&&TB.d2)t2Draw()});
// FAQ
{const _rf2=renderFaq;renderFaq=function(){_rf2();const f=$('fq');if(!f||typeof f.insertAdjacentHTML!=='function')return;const h=[...f.querySelectorAll('h3')].find(x=>x.textContent==='2D-motor (de_dust2 og de_inferno)');
  if(h&&h.parentElement)h.parentElement.insertAdjacentHTML('beforeend',`<div style="padding:3px 0"><b>Taktik-byggeren på de_dust2</b> tegner ruterne direkte på kortet: højst ${MAXPTS} punkter pr. spiller. Et <b>waypoint</b> går videre med det samme (eller ved et valgt tidspunkt). Et <b>syncpoint</b> venter, til alle holdkammerater med et tilsvarende syncpoint er fremme (spillere uden syncpoint tæller ikke med). Derefter venter han den sync-tid, du vælger (2–10 sek.), og kigger imens i den valgte retning – brug det til at tjekke vinkler. Et <b>waitpoint</b> (højst ét pr. taktik): spilleren bliver der, og de andre går først videre fra deres næste punkt, når han dør. Fordelen ved at holde en vinkel kommer kun fra, hvor spilleren står, og hvilken vej han kigger.</div>`)}}

/* ===== FASE 65: AI-TAKTIKKER I 2D (de_dust2) =====
 Hver ny AI-taktik på et 2D-map får også punkter (r2). Zone-ruten (r) laves bagefter ud fra punkterne, så navne, NY/VARIANT og AI-viden virker som før.
 - Mutation/modsvar af en taktik, der har punkter: punkterne ændres direkte (flyt 3–6 felter, retning, syncpoint/waitpoint, tidspunkt, tilføj/fjern punkt, kopiér en rolle, skift site).
 - Ny taktik fra byggeklodserne, eller mutation af en ren zone-taktik: zone-ruten omregnes til punkter og får tilfældige 2D-detaljer (sted i området, syncpoints med retning før indgangen, af og til et waitpoint).
 Regler som for dig: højst 8 punkter pr. spiller, højst ét waitpoint (aldrig bombebæreren), bombebæreren slutter på mål-sitet. */
const aiR=()=>typeof txR==='function'?txR():Math.random,aiPick=a=>a[Math.floor(aiR()*a.length)];
function aiCellsOf(mp,a){mp._ac=mp._ac||{};if(!mp._ac[a]){const L=[];for(let y=0;y<mp.H;y++)for(let x=0;x<mp.W;x++)if(mp.cells[y*mp.W+x]===a)L.push([x,y]);mp._ac[a]=L}return mp._ac[a]}
const aiZone=(mp,p)=>mp.cells[p[2]*mp.W+p[1]];
function aiNear(mp,cx,cy,r0,r1){const clr=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!mp.ok(x+dx,y+dy))return false;return true};for(let k=0;k<40;k++){const r=r0+aiR()*(r1-r0),a=aiR()*Math.PI*2,x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r);if(clr(x,y))return[x,y]}return[cx,cy]}
const aiDirTo=(p,x,y)=>Math.round(Math.atan2(y-p[2],x-p[1])*180/Math.PI);
// gyldighed: punkter, waitpoint, bombebærer på sitet
function aiFix(mp,sd,r2,st){r2.forEach((w,k)=>{if(w.length>MAXPTS)w.splice(1,w.length-MAXPTS);if(!w.length){const s=mp.J.spawns[sd][k],[x,y]=mp.cellOf(s[0],s[1]);w.push([0,x,y,null,0])}});
  r2.forEach(w=>w.forEach(p=>{if(p[0]===1)p[5]=Math.max(2,Math.min(10,p[5]||SYNC_DEF))}));
  let seen=0;r2.forEach((w,k)=>w.forEach(p=>{if(p[0]===2){if(seen>=2||(sd==='T'&&k===1))p[0]=0;else seen++}}));
  if(sd==='T'){const c=r2[1];if(!c.length||aiZone(mp,c[c.length-1])!==st){const L=aiCellsOf(mp,st),q=aiPick(L);if(c.length>=MAXPTS)c.pop();c.push([0,q[0],q[1],null,0])}}
  return r2}
// 2D-detaljer på en omregnet zone-taktik
function aiEnrich(mp,sd,r2,st){r2.forEach((w,k)=>{w.forEach((p,i)=>{const L=aiCellsOf(mp,aiZone(mp,p));if(L.length&&aiR()<.7){const q=aiPick(L);p[1]=q[0];p[2]=q[1]}});
    if(sd==='T'){// syncpoint med retning lige før indgangen til sitet
      if(w.length>=2&&aiR()<.45){const pre=w[w.length-2],last=w[w.length-1];pre[0]=1;pre[3]=aiDirTo(pre,last[1],last[2]);pre[5]=aiPick([3,4,5,6,8])}}
    else{const last=w[w.length-1];if(last[3]!=null)last[3]=Math.round(last[3]+(aiR()*2-1)*35)}});
  if(sd==='T'&&aiR()<.15){const k=aiPick([0,2,3,4]),w=r2[k];if(w.length){const p=w[w.length-1];p[0]=2;if(p[3]==null){const o=r2[1][r2[1].length-1];p[3]=aiDirTo(p,o[1],o[2])}}}
  return aiFix(mp,sd,r2,st)}
// mutation direkte på punkterne
function aiMut2(mp,sd,src,st){const r2=JSON.parse(JSON.stringify(src));let site=st;const ops=sd==='T'?['flyt','flyt','retning','retning','type','timing','tilføj','fjern','rolle','site']:['flyt','flyt','retning','retning','type','timing','tilføj','fjern','rolle'];
  const op=aiPick(ops),k=aiPick([0,1,2,3,4]),w=r2[k];
  if(op==='flyt'&&w.length){const i=Math.floor(aiR()*w.length),p=w[i],q=aiNear(mp,p[1],p[2],3,6);p[1]=q[0];p[2]=q[1]}
  else if(op==='retning'&&w.length){const p=aiPick(w);if(p[3]==null||aiR()<.3){const o=aiPick(r2.flat());p[3]=aiR()<.5?aiDirTo(p,o[1],o[2]):Math.round(aiR()*360-180)}else p[3]=Math.round(p[3]+aiPick([-90,-45,-30,30,45,90]))}
  else if(op==='type'&&w.length){const i=Math.floor(aiR()*w.length),p=w[i];const has=r2.some(x=>x.some(q=>q[0]===2));
    p[0]=p[0]===1?0:(aiR()<.2&&!has&&!(sd==='T'&&k===1)?2:1);if(p[0]===1&&!p[5])p[5]=aiPick([3,4,5,6,8]);if(p[0]===1&&p[3]==null&&w[i+1])p[3]=aiDirTo(p,w[i+1][1],w[i+1][2])}
  else if(op==='timing'&&w.length){const p=aiPick(w);if(p[0]===1)p[5]=Math.max(2,Math.min(10,(p[5]||SYNC_DEF)+aiPick([-2,-1,1,2])));else p[4]=Math.max(0,Math.min(90,(p[4]||0)+aiPick([-15,-10,-5,5,10,15])))}
  else if(op==='tilføj'&&w.length<MAXPTS){const i=Math.floor(aiR()*w.length),p=w[i],q=aiNear(mp,p[1],p[2],3,8);w.splice(i,0,[0,q[0],q[1],null,0])}
  else if(op==='fjern'&&w.length>1){w.splice(Math.floor(aiR()*(w.length-1)),1)}
  else if(op==='rolle'){const j=aiPick([0,1,2,3,4].filter(x=>x!==k&&!(sd==='T'&&x===1)));r2[j]=JSON.parse(JSON.stringify(r2[k])).map(p=>{const q=aiNear(mp,p[1],p[2],1,3);return[p[0]===2?0:p[0],q[0],q[1],p[3],p[4]]})}
  else if(op==='site'){const o=site==='A'?'B':'A';r2.forEach(x=>{const l=x[x.length-1];if(l&&aiZone(mp,l)===site){const q=aiPick(aiCellsOf(mp,o));l[1]=q[0];l[2]=q[1]}});site=o}
  return{r2:aiFix(mp,sd,r2,site),st:site}}
{const _mk=txMk;txMk=function(map,sd,b,org,parent,d){const id=_mk(map,sd,b,org,parent,d);try{if(!t2On(map))return id;const mp=e2dMap(map),x=WD.tx[id],px=parent&&((WD.tx&&WD.tx[parent])||std2dGet(map,parent));let r2,st=x.st;
    if((org==='mut'||org==='modsvar')&&r2Ok(px,mp)){const m=aiMut2(mp,sd,px.r2,px.st||px.site||st||'A');r2=m.r2;st=sd==='T'?m.st:undefined}
    else r2=aiEnrich(mp,sd,r2FromZones(mp,sd,txDec(x.r)),st||'A');
    x.r2=r2;x.r2v=mp.J.version||1;if(sd==='T')x.st=st;const r=r2Zones(mp,r2).map(w=>w.length?w:[[sd==='T'?'TS':'CT',0]]);x.r=txEnc(r);x.ch=undefined;x.cp=undefined;x.fb=undefined;
    x.sk=r.every(w=>txLast(w)===txLast(r[0]))||undefined;TXRC.delete(id);TXFB.delete(id);delete CHASE[id];txReg(id)}catch(e){console.error('AI 2D',e)}return id}}

/* ===== AI-byggeklodser 2.0 (6. nov.): indgange, holdepladser og tjekpunkter beregnet ud fra kortet ===== */
const AIS={};
function aiSpots(map){if(AIS[map])return AIS[map];let sd=97;const rr=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};const mp=e2dMap(map),W=mp.W,H=mp.H,C=mp.C,E=CSM2D;
  const zone=(x,y)=>mp.cells[y*W+x],ok=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&mp.ok(x,y)&&!mp.cross[y*W+x];
  const plen=(a,b)=>{const P=E.astar(mp,a[0],a[1],b[0],b[1]);if(!P)return 1e9;let s=0,px=a[0]*C+C/2,py=a[1]*C+C/2;for(const q of P){s+=Math.hypot(q[0]-px,q[1]-py);px=q[0];py=q[1]}return s};
  /* samme sigtregler som i kampen (højder, krydsninger, Broen/catwalk) */
  const SR={M:mp},los=(a,b)=>E.canSee(SR,{ci:a[1]*W+a[0],layer:0},{ci:b[1]*W+b[0],layer:0});
  const clear=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!mp.ok(x+dx,y+dy))return false;return true};
  const cover=(x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(!mp.ok(x+dx,y+dy))return true;return false};
  const cs=s=>mp.cellOf(s[0],s[1]),TS=cs(mp.J.spawns.T[0]),CS=cs(mp.J.spawns.CT[0]);
  const SITES=Object.keys(mp.J.sites);
  // afstand fra spawns til alle felter (BFS over gangbare naboer – grov, men hurtig)
  const bfs=s=>{const D=new Float32Array(W*H).fill(1e9),Q=[s[1]*W+s[0]];D[Q[0]]=0;for(let h=0;h<Q.length;h++){const i=Q[h],x=i%W,y=(i/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!mp.ok(nx,ny))continue;const j=ny*W+nx;if(D[j]<1e9)continue;if(Math.abs(mp.height[j]-mp.height[i])>=2&&!mp.cross[i]&&!mp.cross[j])continue;D[j]=D[i]+1;Q.push(j)}}return D};
  const DT=bfs(TS),DC=bfs(CS);
  // grænser mellem zoner: felter i zone a med gangbar nabo i zone b (samme højde ±1)
  const bnd={};for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!ok(x,y))continue;const a=zone(x,y);for(const[dx,dy]of[[1,0],[0,1]]){const nx=x+dx,ny=y+dy;if(!ok(nx,ny))continue;const b=zone(nx,ny);if(a===b)continue;
      if(Math.abs(mp.height[y*W+x]-mp.height[ny*W+nx])>=2)continue;const k=a<b?a+'|'+b:b+'|'+a;(bnd[k]=bnd[k]||[]).push([x,y],[nx,ny])}}
  // klyng grænsefelter (inden for 3 felter) til indgange/chokes
  const chokes=[];for(const k in bnd){const [a,b]=k.split('|'),L=bnd[k],used=new Array(L.length).fill(false);
    for(let i=0;i<L.length;i++){if(used[i])continue;const g=[L[i]];used[i]=true;for(let h=0;h<g.length;h++)for(let j=0;j<L.length;j++)if(!used[j]&&Math.abs(L[j][0]-g[h][0])<=3&&Math.abs(L[j][1]-g[h][1])<=3){used[j]=true;g.push(L[j])}
      let sx=0,sy=0;g.forEach(p=>{sx+=p[0];sy+=p[1]});const c=[Math.round(sx/g.length),Math.round(sy/g.length)],cc=ok(c[0],c[1])?c:g.reduce((m,p)=>Math.hypot(p[0]-c[0],p[1]-c[1])<Math.hypot(m[0]-c[0],m[1]-c[1])?p:m,g[0]);
      const i0=cc[1]*W+cc[0];chokes.push({a,b,c:cc,n:g.length,dT:DT[i0],dC:DC[i0]})}}
  const tz={},cz={};// zoner tættest på T hhv. CT (bruges til hvilken side af en choke, der er "foran")
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!mp.ok(x,y))continue;const z=zone(x,y),i=y*W+x;if(DT[i]>=1e9||DC[i]>=1e9)continue;const o=(tz[z]=tz[z]||[0,0]);o[0]+=DT[i];o[1]+=DC[i]}
  const zT=z=>tz[z]?tz[z][0]/(tz[z][0]+tz[z][1]):.5;// 0 = T's side, 1 = CT's side
  // holdepladser (CT) og tjekpunkter (T) for en choke; "inner" = zonen på CT's side
  const spread=(L,n,md)=>{const out=[];for(const c of L){if(out.length>=n)break;if(out.every(q=>Math.hypot(q[0]-c[0],q[1]-c[1])*C>=md))out.push(c)}return out};
  const holdsFor=(ch,inner,outer,ex)=>{const cand=[];for(let y=Math.max(1,ch.c[1]-30);y<Math.min(H-1,ch.c[1]+30);y++)for(let x=Math.max(1,ch.c[0]-30);x<Math.min(W-1,ch.c[0]+30);x++){
      if(!ok(x,y)||zone(x,y)===outer||(ex&&ex.includes(zone(x,y))))continue;const d=Math.hypot(x-ch.c[0],y-ch.c[1])*C;if(d<48||d>230)continue;if(DC[y*W+x]>=1e9)continue;
      if(zone(x,y)!==inner&&zT(zone(x,y))<zT(outer)-.02)continue;// på sitet eller på CT's side
      if(!clear(x,y)||!cover(x,y)||!los([x,y],ch.c))continue;cand.push([x,y,d])}
    cand.sort(()=>rr()-.5);return spread(cand,8,26).map(([x,y])=>[x,y,Math.round(Math.atan2(ch.c[1]-y,ch.c[0]-x)*180/Math.PI)])};
  const checksFor=(ch,outer,holds)=>{const cand=[];for(let y=Math.max(1,ch.c[1]-14);y<Math.min(H-1,ch.c[1]+14);y++)for(let x=Math.max(1,ch.c[0]-14);x<Math.min(W-1,ch.c[0]+14);x++){
      if(!ok(x,y)||zone(x,y)!==outer)continue;const d=Math.hypot(x-ch.c[0],y-ch.c[1])*C;if(d<20||d>100)continue;if(DT[y*W+x]>=1e9)continue;if(!clear(x,y)||!los([x,y],ch.c))continue;cand.push([x,y])}
    cand.sort(()=>rr()-.5);return spread(cand,4,20).map(([x,y])=>{const vis=holds.filter(h=>los([x,y],h)),t=vis.length?vis[Math.floor(rr()*vis.length)]:ch.c;return[x,y,Math.round(Math.atan2(t[1]-y,t[0]-x)*180/Math.PI)]})};
  const ent={},front=[];
  for(const ch of chokes){const sA=SITES.includes(ch.a),sB=SITES.includes(ch.b);
    if(sA!==sB){const site=sA?ch.a:ch.b,outer=sA?ch.b:ch.a;if(ch.n<2)continue;const e={site,from:outer,c:ch.c,n:ch.n,dT:ch.dT,dC:ch.dC,tSide:zT(outer)<=zT(site)+.05};
      e.holds=holdsFor(ch,site,outer);e.checks=checksFor(ch,outer,e.holds);if(e.holds.length&&e.checks.length)(ent[site]=ent[site]||[]).push(e)}
    else if(!sA&&!sB&&ch.n>=2){const fa=zT(ch.a),fb=zT(ch.b);if(Math.abs(fa-fb)<.08)continue;const outer=fa<fb?ch.a:ch.b,inner=fa<fb?ch.b:ch.a;
      if(['CT'].includes(outer))continue;const f={from:outer,to:inner,c:ch.c,n:ch.n,dT:ch.dT,dC:ch.dC};f.holds=holdsFor(ch,inner,outer,SITES);f.checks=checksFor(ch,outer,f.holds);if(f.holds.length&&f.checks.length)front.push(f)}}
  // T's indgange til sitet: dem, T kan nå før CT (eller tæt på)
  for(const s in ent)ent[s].sort((a,b)=>a.dT-b.dT);
  const plant={};for(const s of SITES){const L=aiCellsOf(mp,s).filter(([x,y])=>clear(x,y));plant[s]=L.length?L:aiCellsOf(mp,s)}
  return AIS[map]={mp,SITES,ent,front,plant,TS,CS,DT,DC,zT}}
const aiMapOf=X=>Object.keys(MAPS).find(k=>MAPS[k]===X.m);
const aiP=a=>a[Math.floor(aiR()*a.length)];
const aiPt=(t,q,dir,at,sw)=>{const p=[t,q[0],q[1],dir==null?(q[2]!=null?q[2]:null):dir,at||0];if(t===1)p.push(sw||SYNC_DEF);return p};
const aiDir=(a,b)=>Math.round(Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI);
/* CT: holdepladser ved sitenes indgange, evt. info-spiller frem (waitpoint) og rotation */
function aiBuildC2(map,opt){const S=aiSpots(map),[A,B]=S.SITES;opt=opt||{};
  const style=opt.style||aiP(['split','split','stack','info','info','rot','anchor','anchor']);
  if(style==='anchor')return aiAnchorC(map,S,opt);let nA,nB;
  if(opt.focus){const f=opt.focus,o=f===A?B:A,n=3+Math.floor(aiR()*2);nA=f===A?n:5-n;nB=5-nA}
  else if(style==='stack'){const f=aiP([A,B]),n=3+Math.floor(aiR()*2);nA=f===A?n:5-n;nB=5-nA}
  else{nA=2;nB=2;if(aiR()<.5)nA++;else nB++}
  const plan=[];for(let i=0;i<nA;i++)plan.push(A);for(let i=0;i<nB;i++)plan.push(B);plan.sort(()=>aiR()-.5);
  const used=new Set(),r2=[];let info=-1,rotK=[];
  if((style==='info'||opt.info)&&S.front.length){// én spiller holder en choke foran (waitpoint) – resten reagerer, når han dør
    const F=opt.infoF?[opt.infoF]:S.front.filter(f=>f.dC<f.dT&&f.dC>15);if(F.length){info=Math.floor(aiR()*5);const V=aiWV(map,'CT'),all=[];F.forEach(f=>f.holds.forEach(h=>all.push([f,h])));const pk=V?aiWP(all,x=>Math.pow(wpVal(V,x[1]),2)):aiP(all);plan[info]={info:pk[0],h:pk[1]}}}
  const hold=s=>{const E=S.ent[s]||[],W=opt.ents&&opt.ents[s];const e=W&&W.length&&aiR()<.85?aiP(W):aiP(E.filter(e=>e.tSide).concat(E));let h=null;const sv=aiSV(map);for(let k=0;k<8&&!h;k++){const c=sv?aiWP(e.holds,q=>{const s=sv[q[0]+','+q[1]];return s?Math.pow((s[0]+1)/(s[1]+2),2):.5}):aiP(e.holds),key=c[0]+','+c[1];if(!used.has(key)){used.add(key);h=c}}return{e,h:h||aiP(e.holds)}};
  plan.forEach((s,k)=>{if(k===info){r2[k]=[aiPt(2,s.h)];return}const{e,h}=hold(s);r2[k]=[aiPt(0,h)];
    if(style==='rot'&&aiR()<.5){const o=s===A?B:A,g=hold(o);r2[k].push(aiPt(0,g.h,null,35+Math.floor(aiR()*30)))}
    else if(info>=0&&aiR()<.45){// reagerer på info: holder som syncpoint, rykker mod det site, info-chokens side fører til
      r2[k][0][0]=1;r2[k][0].push(2,0,1);const f=plan[info].info,tgt=S.SITES.slice().sort((a,b)=>Math.hypot(S.ent[a][0].c[0]-f.c[0],S.ent[a][0].c[1]-f.c[1])-Math.hypot(S.ent[b][0].c[0]-f.c[0],S.ent[b][0].c[1]-f.c[1]))[0];
      if(tgt!==s){const g=hold(tgt);r2[k].push(aiPt(0,g.h))}else r2[k][0][0]=0}});
  return r2}

/* CT-klods: anker og forstærkning – et waitpoint-anker på hvert site; Mid (og evt. én fra det andet site) holder som syncpoint, der kun venter på ankeret på site X, og rykker til X, når han dør */
function aiAnchorC(map,S,opt){const[A,B]=S.SITES,X=opt.focus||aiP([A,B]),Y=X===A?B:A,used=new Set(),V=aiWV(map,'CT'),sv=aiSV(map);
  const pickH=(s,anchor)=>{const E=S.ent[s]||[],W=opt.ents&&opt.ents[s];const e=W&&W.length&&aiR()<.85?aiP(W):aiP(E.filter(e=>e.tSide).concat(E));let h=null;
    for(let k=0;k<8&&!h;k++){const c=anchor&&V?aiWP(e.holds,q=>Math.pow(wpVal(V,q),2)):sv?aiWP(e.holds,q=>{const s2=sv[q[0]+','+q[1]];return s2?Math.pow((s2[0]+1)/(s2[1]+2),2):.5}):aiP(e.holds),key=c[0]+','+c[1];if(!used.has(key)){used.add(key);h=c}}return h||aiP(e.holds)};
  const order=[0,1,2,3,4].sort(()=>aiR()-.5),[kX,kXs,kM,kY,kYs]=order,r2=[];
  r2[kX]=[aiPt(2,pickH(X,true))];r2[kXs]=[aiPt(0,pickH(X))];r2[kY]=[aiPt(2,pickH(Y,true))];
  const F=S.front.filter(f=>f.dC<f.dT&&f.dC>15),mh=F.length?aiP(aiP(F).holds):pickH(Y);
  const reinf=(start)=>{const p=aiPt(1,start,null,0,2);p.push(kX+1,1);return[p,aiPt(0,pickH(X))]};
  r2[kM]=reinf(mh);r2[kYs]=aiR()<.5?reinf(pickH(Y)):[aiPt(0,pickH(Y))];
  return r2}
/* T: eksekvering mod et site via en eller to indgange med syncpoint ved tjekpunktet, evt. fake, lurker eller sent hit */
function aiBuildT2(map,opt){const S=aiSpots(map);opt=opt||{};const site=opt.site||aiP(S.SITES),o=S.SITES.find(s=>s!==site);
  const E=(S.ent[site]||[]).slice().sort((a,b)=>a.dT-b.dT);const near=E.slice(0,Math.min(E.length,3));
  const tempo=opt.tempo||aiP(['rush','exec','exec','exec','late']),split=near.length>1&&aiR()<.4;
  const e1=opt.ent||(aiR()<.65?near[0]:aiP(near)),e2=split?aiP(near.filter(e=>e!==e1)):e1;
  const extra=aiP(['none','none','fake','lurk','lurk']),sw=tempo==='rush'?0:2+Math.floor(aiR()*5);
  const lateAt=tempo==='late'?40+Math.floor(aiR()*25):0;
  const r2=[];const go=(e,k)=>{const ck=aiP(e.checks),inS=aiP(S.plant[site]);const w=[];
    if(tempo==='late'){const f=aiP(S.front.filter(f=>f.dT<f.dC));if(f){w.push(aiPt(0,aiP(f.checks)))}}
    if(tempo==='rush')w.push(aiPt(0,ck));else w.push(aiPt(1,ck,null,0,sw));
    if(lateAt)w[w.length-1][0]===1?(w.splice(w.length-1,0,aiPt(0,ck,null,lateAt))):null;
    w.push(aiPt(0,e.c,aiDir(e.c,inS)));w.push(aiPt(0,inS,null));return w};
  const grp=[0,1,2,3,4];let spec=-1;
  if(extra!=='none'){spec=aiP([0,2,3,4])}
  grp.forEach(k=>{if(k===spec){
      if(extra==='fake'){const fe=aiP(S.ent[o]||[]);if(fe){r2[k]=[aiPt(0,aiP(fe.checks)),aiPt(0,fe.c,aiDir(fe.c,aiP(S.plant[o]))),aiPt(0,aiP(e1.checks),null,45+Math.floor(aiR()*20))];return}}
      if(extra==='lurk'){const F=S.front.filter(f=>f.dT<f.dC*1.3);const f=F.length?aiP(F):null;if(f){r2[k]=[aiPt(0,aiP(f.checks)),aiPt(0,e1.c,null,50+Math.floor(aiR()*20)),aiPt(0,aiP(S.plant[site]))];return}}}
    const e=split&&(k===3||k===4)?e2:e1;r2[k]=go(e,k)});
  return{r2,st:site}}
/* koble på AI'ens byggeklodser: nye taktikker på 2D-maps bygges ud fra pladserne (80 %), resten som før */
{const _bt=txBuildT,_bc=txBuildC,_ctr=txCtrBuild;
 const pack=(map,sd,r2,st)=>{const mp=e2dMap(map);aiFix(mp,sd,r2,st||'A');const r=r2Zones(mp,r2).map(w=>w.length?w:[[sd==='T'?'TS':'CT',0]]);const ends=r.map(txLast);
   return{r,r2,st:sd==='T'?st:undefined,sk:ends.every(z=>z===ends[0])||undefined,sy:'M'}};
 txBuildT=function(X){const map=aiMapOf(X);try{if(map&&t2On(map)&&aiR()<.8){const b=aiBuildT2(map);return pack(map,'T',b.r2,b.st)}}catch(e){console.error('aiBuildT2',e)}return _bt(X)};
 txBuildC=function(X){const map=aiMapOf(X);try{if(map&&t2On(map)&&aiR()<.8)return pack(map,'CT',aiBuildC2(map))}catch(e){console.error('aiBuildC2',e)}return _bc(X)};
 /* modsvar: CT samler 3–4 på det site, T-taktikken går efter, ved de indgange den bruger; T angriber det site, CT-taktikken holder svagest */
 txCtrBuild=function(X,sd,map,tg){try{if(t2On(map)){const os=sd==='T'?'CT':'T',I=txInfo(map,os,tg),x=(WD.tx&&WD.tx[tg])||std2dGet(map,tg),mp=e2dMap(map),S=aiSpots(map);
     if(x&&x.r2&&r2Ok(x,mp)){
       if(sd==='CT'){const st=x.st||I&&I.st||aiP(S.SITES);/* 4) læs T-taktikkens punkter: hvilke indgange bruger den, og hvor går den forbi */
         const pts=[].concat(...x.r2),ents={};for(const s of S.SITES){const L=[];for(const e of S.ent[s]||[]){const n=pts.filter(p=>Math.hypot(p[1]-e.c[0],p[2]-e.c[1])<7).length;for(let i=0;i<n;i++)L.push(e)}if(L.length)ents[s]=L}
         let infoF=null,bd=1e9;for(const f of S.front){if(!(f.dC<f.dT*1.15))continue;const dm=Math.min(...pts.map(p=>Math.hypot(p[1]-f.c[0],p[2]-f.c[1])));if(dm<bd){bd=dm;infoF=f}}
         return pack(map,'CT',aiBuildC2(map,{focus:st,ents,infoF:bd<8?infoF:null,info:bd<8&&aiR()<.5}))}
       const n={};S.SITES.forEach(s=>n[s]=0);x.r2.forEach(w=>{const l=w[w.length-1];if(!l)return;const z=aiZone(mp,l);let s=S.SITES.includes(z)?z:null;if(!s)for(const t of S.SITES)if((S.ent[t]||[]).some(e=>Math.hypot(e.c[0]-l[1],e.c[1]-l[2])<28))s=t;if(s)n[s]++});
       const weak=S.SITES.slice().sort((a,b)=>n[a]-n[b]||aiR()-.5)[0];/* indgangen med færrest CT-holdere */const pts=x.r2.map(w=>w[w.length-1]).filter(Boolean),E=(S.ent[weak]||[]).map(e=>[e,pts.filter(p=>Math.hypot(p[1]-e.c[0],p[2]-e.c[1])<26).length]).sort((a,b)=>a[1]-b[1]||a[0].dT-b[0].dT);const b=aiBuildT2(map,{site:weak,ent:E.length?E[0][0]:undefined});return pack(map,'T',b.r2,b.st)}}}catch(e){console.error('aiCtr2',e)}return _ctr(X,sd,map,tg)};
 const _mk2=txMk;txMk=function(map,sd,b,org,parent,d){const id=_mk2(map,sd,b,org,parent,d);try{if(b&&b.r2&&t2On(map)){const mp=e2dMap(map),x=WD.tx[id];x.r2=JSON.parse(JSON.stringify(b.r2));x.r2v=mp.J.version||1;if(sd==='T')x.st=b.st;
     const r=r2Zones(mp,x.r2).map(w=>w.length?w:[[sd==='T'?'TS':'CT',0]]);x.r=txEnc(r);TXRC.delete(id);TXFB.delete(id);delete CHASE[id];txReg(id)}}catch(e){console.error('AI 2D b',e)}return id}}
/* mutationer på byggeklods-niveau: skift indgang, byt holdeplads, læg info frem / træk den hjem */
{const _m2=aiMut2;aiMut2=function(mp,sd,src,st){try{const map=Object.keys(E2D_MAPS).find(k=>e2dMap(k)===mp);if(map&&aiR()<.5){const S=aiSpots(map),r2=JSON.parse(JSON.stringify(src));
     if(sd==='CT'){const op=aiP(['hold','hold','info','site']),k=Math.floor(aiR()*5),w=r2[k],l=w[w.length-1];
       if(op==='hold'&&l){let best=null;for(const s of S.SITES)for(const e of S.ent[s]||[])for(const h of e.holds){const d=Math.hypot(h[0]-l[1],h[1]-l[2]);if(d>1&&(!best||d<best[0]))best=[d,s]}
         const s=best?best[1]:aiP(S.SITES),e=aiP(S.ent[s]),h=aiP(e.holds);l[1]=h[0];l[2]=h[1];l[3]=h[2]}
       else if(op==='info'){const has=r2.findIndex(w=>w.some(p=>p[0]===2));if(has>=0){const e=aiP(S.ent[aiP(S.SITES)]),h=aiP(e.holds);r2[has]=[aiPt(0,h)]}else{const F=S.front.filter(f=>f.dC<f.dT);if(F.length){const V=aiWV(map,'CT'),all=[];F.forEach(f=>f.holds.forEach(h=>all.push(h)));r2[k]=[aiPt(2,V?aiWP(all,q=>Math.pow(wpVal(V,q),2)):aiP(all))]}}}
       else{const s=aiP(S.SITES),e=aiP(S.ent[s]),h=aiP(e.holds);r2[k]=[aiPt(0,h)]}
       return{r2:aiFix(mp,sd,r2,st),st}}
     else{const op=aiP(['ent','ent','tempo','site']);let site=st;
       if(op==='site'){const b=aiBuildT2(map,{site:S.SITES.find(s=>s!==st)});return{r2:aiFix(mp,sd,b.r2,b.st),st:b.st}}
       if(op==='tempo'){const b=aiBuildT2(map,{site:st,tempo:aiP(['rush','exec','late'])});return{r2:aiFix(mp,sd,b.r2,b.st),st:b.st}}
       const E=S.ent[st]||[];if(E.length>1){const k=aiP([0,1,2,3,4]),w=r2[k];const old=E.find(e=>w.some(p=>Math.hypot(p[1]-e.c[0],p[2]-e.c[1])<3)),ne=aiP(E.filter(e=>e!==old)),inS=aiP(S.plant[st]);
         const sync=w.find(p=>p[0]===1);r2[k]=[sync?aiPt(1,aiP(ne.checks),null,0,sync[5]):aiPt(0,aiP(ne.checks)),aiPt(0,ne.c,aiDir(ne.c,inS)),aiPt(0,inS)];return{r2:aiFix(mp,sd,r2,st),st}}}}}catch(e){console.error('aiMut2b',e)}return _m2(mp,sd,src,st)}}


/* ===== 11. nov.: tidligt stop af dårlige kandidater, T-klodser i flere faser ===== */
const TXE={n:15,gap:.10};
/* 12. nov.: en kopieret kandidat har allerede vist sig hos et andet hold – den testes kun i TXC.evalKopi runder */
TXC.evalKopi=12;
{const _evK=txEval;txEval=function(d,map,sd){const k=d.tch&&d.tch[map]&&d.tch[map][sd]==='kopi'&&d.tc&&d.tc[map]&&d.tc[map][sd];if(!k)return _evK(d,map,sd);const o=TXC.evalN;TXC.evalN=TXC.evalKopi;try{return _evK(d,map,sd)}finally{TXC.evalN=o}}}// 1) kandidat droppes efter TXE.n runder, hvis den vinder TXE.gap under holdets standarder på samme map og side
{const _ev3=txEval;txEval=function(d,map,sd){try{const c=d.tc&&d.tc[map]&&d.tc[map][sd];if(c){const S=d.tst&&d.tst[map]||{},s=S[c]||[0,0];
   if(s[1]>=TXE.n&&s[1]<TXC.evalN){let w=0,k=0;txStdL(map,sd).forEach(x=>{const t=S[x];if(t){w+=t[0];k+=t[1]}});const base=k>=20?w/k:null;
     if(base!=null&&s[0]/s[1]<base-TXE.gap){WD.txStop=(WD.txStop||0)+1;if(d.tct&&d.tct[map])d.tct[map][sd]=null;return txNewCand(d,map,sd)}}}}catch(e){console.error('txEval3',e)}
  return _ev3(d,map,sd)}}
// 2) T i flere faser: 'kontrol' (tag en choke foran, vent, angrib sitet tættest på) og 'fake' (vis dig på ét site, rotér til det andet)
function aiBuildTP(map,opt){const S=aiSpots(map);opt=opt||{};const kind=opt.kind||aiP(['kontrol','kontrol','fake']);
  if(kind==='kontrol'){const F=S.front.filter(f=>f.dT<f.dC*1.1);if(!F.length)return null;const f=aiP(F);
    const site=opt.site||S.SITES.slice().sort((a,b)=>Math.min(...(S.ent[a]||[]).map(e=>Math.hypot(e.c[0]-f.c[0],e.c[1]-f.c[1])))-Math.min(...(S.ent[b]||[]).map(e=>Math.hypot(e.c[0]-f.c[0],e.c[1]-f.c[1]))))[0];
    const E=S.ent[site]||[];if(!E.length)return null;const eF=E.slice().sort((a,b)=>Math.hypot(a.c[0]-f.c[0],a.c[1]-f.c[1])-Math.hypot(b.c[0]-f.c[0],b.c[1]-f.c[1]))[0],eN=E.slice().sort((a,b)=>a.dT-b.dT)[0];
    const hitAt=35+Math.floor(aiR()*30),nC=2+Math.floor(aiR()*2),ks=aiR()<.5?[0,2,3,4]:[2,3,4,0],ctrl=new Set(ks.slice(0,nC)),sw=2+Math.floor(aiR()*4),r2=[];
    for(let k=0;k<5;k++){const inS=aiP(S.plant[site]);
      if(ctrl.has(k)){const ck=aiP(f.checks);r2[k]=[aiPt(0,ck),aiPt(1,aiP(eF.checks),null,hitAt,sw),aiPt(0,eF.c,aiDir(eF.c,inS)),aiPt(0,inS)]}
      else{const e=aiR()<.6?eN:eF;r2[k]=[aiPt(0,aiP(e.checks)),aiPt(1,aiP(e.checks),null,hitAt,sw),aiPt(0,e.c,aiDir(e.c,inS)),aiPt(0,inS)]}}
    return{r2,st:site,ph:'kontrol'}}
  const B=opt.site||aiP(S.SITES),A=S.SITES.find(x=>x!==B),EA=S.ent[A]||[],EB=S.ent[B]||[];if(!EA.length||!EB.length)return null;
  const eA=EA.slice().sort((a,b)=>a.dT-b.dT)[0],eB=aiR()<.6?EB.slice().sort((a,b)=>a.dT-b.dT)[0]:aiP(EB),rotAt=25+Math.floor(aiR()*25),nF=3+Math.floor(aiR()*2),order=[1,0,2,3,4].sort(()=>aiR()-.5),fk=new Set(order.slice(0,nF)),sw=2+Math.floor(aiR()*4),r2=[];
  for(let k=0;k<5;k++){const inS=aiP(S.plant[B]);
    if(fk.has(k))r2[k]=[aiPt(0,aiP(eA.checks)),aiPt(1,aiP(eB.checks),null,rotAt,sw),aiPt(0,eB.c,aiDir(eB.c,inS)),aiPt(0,inS)];
    else r2[k]=[aiPt(1,aiP(eB.checks),null,0,10),aiPt(0,eB.c,aiDir(eB.c,inS),rotAt+12),aiPt(0,inS)]}
  return{r2,st:B,ph:'fake'}}
const TXPH={pNy:.6,pCtr:.35};
function packTP(map,b){const mp=e2dMap(map);aiFix(mp,'T',b.r2,b.st);const r=r2Zones(mp,b.r2).map(w=>w.length?w:[['TS',0]]);const ends=r.map(txLast);return{r,r2:b.r2,st:b.st,sk:ends.every(z=>z===ends[0])||undefined,sy:'M',ph:b.ph}}
{const _bt=txBuildT;txBuildT=function(X){const map=aiMapOf(X);try{if(map&&t2On(map)&&aiR()<TXPH.pNy){const b=aiBuildTP(map);if(b)return packTP(map,b)}}catch(e){console.error('aiBuildTP',e)}return _bt(X)}}
{const _ct=txCtrBuild;txCtrBuild=function(X,sd,map,tg){const b=_ct(X,sd,map,tg);try{if(sd==='T'&&t2On(map)&&aiR()<TXPH.pCtr&&b&&b.st){const p=aiBuildTP(map,{site:b.st});if(p)return packTP(map,p)}}catch(e){console.error('aiCtrTP',e)}return b}}
{const _mk4=txMk;txMk=function(map,sd,b,org,parent,d){const id=_mk4(map,sd,b,org,parent,d);try{const x=WD.tx[id],px=parent&&WD.tx[parent];const ph=(b&&b.ph)||(px&&px.ph);if(ph)x.ph=ph}catch(e){}return id}}

/* ===== 11. nov.: holdstil og innovation styrer generatoren; eco-kandidater ===== */
var TXD=null;// holdet, der lige nu laver en kandidat
const TXS={gen:.5};// andel af byggerier, hvor holdets stil bestemmer tempo (T) eller opstilling (CT)
{const _b=aiBuildT2;aiBuildT2=function(map,opt){opt=opt||{};try{const st=TXD&&txSty(TXD);if(st&&!opt.tempo&&aiR()<TXS.gen)opt=Object.assign({},opt,{tempo:st.top==='A'?'rush':st.top==='P'?'late':'exec'})}catch(e){}return _b(map,opt)}}
{const _c=aiBuildC2;aiBuildC2=function(map,opt){opt=opt||{};try{const st=TXD&&txSty(TXD);if(st&&!opt.style&&!opt.focus&&aiR()<TXS.gen)opt=Object.assign({},opt,{style:st.top==='A'?'info':st.top==='P'?aiP(['anchor','stack']):aiP(['split','rot'])})}catch(e){}return _c(map,opt)}}
var txIs2D=map=>{try{return t2On(map)}catch(e){return false}};
var txR2Of=(map,n)=>{try{const x=(WD.tx&&WD.tx[n])||std2dGet(map,n);return x&&x.r2}catch(e){return null}};
var txSetPh=v=>{const o=TXPH.pNy;TXPH.pNy=v;return o};
var txEcoBuild=function(map,sd){const mp=e2dMap(map);let r2,st;if(sd==='T'){const b=aiBuildT2(map,{tempo:aiR()<.6?'rush':'exec'});r2=b.r2;st=b.st}else r2=aiBuildC2(map,{style:'stack'});
  aiFix(mp,sd,r2,st||'A');const r=r2Zones(mp,r2).map(w=>w.length?w:[[sd==='T'?'TS':'CT',0]]);const ends=r.map(txLast);return{r,r2,st:sd==='T'?st:undefined,sk:ends.every(z=>z===ends[0])||undefined,sy:sd==='T'?'A':'M'}};
/* ===== Målrettet AI (6. nov.): problemtaktik, specialister, hurtigere test, modsvar efter indgang, målrettet kopiering ===== */
/* 1) ligaens problemtaktik på modstanderens side: bruges meget og vinder meget → tryk (0–1) */
function txProb(li,map,os){const U=WD.tu&&WD.tu[li]&&WD.tu[li][map]&&WD.tu[li][map][os],K=WD.tk&&WD.tk[li]&&WD.tk[li][map];if(!U||!K)return null;
  const tot=Object.values(U).reduce((a,b)=>a+b,0);if(tot<60)return null;const W={};
  for(const k in K){const[t,c]=k.split('|'),e=K[k],n=os==='T'?t:c;const o=W[n]=W[n]||[0,0];o[0]+=os==='T'?e[1]-e[0]:e[0];o[1]+=e[1]}
  let best=null;for(const n in U){const w=W[n];if(!w||w[1]<20)continue;const u=U[n]/tot,wr=w[0]/w[1],p=Math.max(0,Math.min(1,(wr-.5)*4))*Math.min(1,u*4);if(!best||p>best.p)best={n,u,wr,p}}
  return best&&best.p>.05?best:null}
/* parstatistik: sd-taktikken n mod modstanderens tg (andel sejre for sd, antal runder) */
function txPair(li,map,sd,n,tg){const K=WD.tk&&WD.tk[li]&&WD.tk[li][map];const e=K&&K[sd==='T'?n+'|'+tg:tg+'|'+n];if(!e||!e[1])return[txEst(li,map,sd==='T'?n:tg,sd==='T'?tg:n)[0]*(sd==='T'?-1:1)+(sd==='T'?1:0),0];return[sd==='T'?1-e[0]/e[1]:e[0]/e[1],e[1]]}
const txSp=(d,map,sd)=>(((d.tsp=d.tsp||{})[map]=d.tsp[map]||{T:{},CT:{}})[sd]);
{const _nc=txNewCand;txNewCand=function(d,map,sd){try{const li=txLiOf(d)[0],os=sd==='T'?'CT':'T',P=txProb(li,map,os);d.tct=d.tct||{};(d.tct[map]=d.tct[map]||{})[sd]=null;
   if(P&&P.n&&txInfo(map,os,P.n)&&txR()<.6*P.p){// målrettet modsvar mod problemtaktikken
     const X=txMap(map),q=tcq(d),nC=1+Math.round(q*4),tg=P.n;
     const pool=txPool(d,map,sd).map(n=>[n,txPair(li,map,sd,n,tg)[0]+txG()*.04*(1.2-q)]).sort((a,b)=>b[1]-a[1]);// 5) kopiér det, der slår problemtaktikken
     const cur=Math.max(0,...d.tl[map][sd].map(n=>txPair(li,map,sd,n,tg)[0]));let id=null;
     if(pool.length&&pool[0][1]>cur+.04&&!d.tl[map][sd].includes(pool[0][0]))id=pool[0][0];
     else{let best=null;for(let c=0;c<nC;c++){const nid=txMk(map,sd,txCtrBuild(X,sd,map,tg),'modsvar',null,d),v=txBl(li,map,sd,nid,tg)+txG()*.03;if(!best||v>best[1])best=[nid,v]}id=best[0]}
     d.tc[map][sd]=id;d.tch[map][sd]='modsvar';d.tct[map][sd]=tg;d.tst=d.tst||{};const S=d.tst[map]=d.tst[map]||{};S[id]=[0,0];return}}catch(e){console.error('txNewCand+',e)}
  const r=_nc(d,map,sd);try{if(d.tch[map][sd]==='modsvar'&&!d.tct[map][sd]){const lost=d.tls&&d.tls[map]&&d.tls[map][sd]||{},lt=Object.entries(lost).sort((a,b)=>b[1]-a[1])[0];if(lt)d.tct[map][sd]=lt[0]}}catch(e){}return r}}
/* 2) et modsvar bedømmes mod sin måltaktik og bliver som specialist, hvis det slår den */
{const _ev=txEval;txEval=function(d,map,sd){try{const c=d.tc&&d.tc[map]&&d.tc[map][sd],tg=d.tct&&d.tct[map]&&d.tct[map][sd];
   if(c&&tg&&d.tch[map][sd]==='modsvar'){const li=txLiOf(d)[0],s=(d.tst[map]||{})[c]||[0,0];if(s[1]<TXC.evalN)return;const pr=txPair(li,map,sd,c,tg);
     const L=d.tl[map][sd],base=Math.max(0,...L.map(n=>txPair(li,map,sd,n,tg)[0]));
     if(pr[1]>=12&&pr[0]>Math.max(base+.08,.4)&&!L.includes(c)&&txScore(d,map,sd,c,txMeta(li,map,sd==='T'?'CT':'T'))>=txStdMed(d,map,sd,txMeta(li,map,sd==='T'?'CT':'T'))-txMarg(d,map,c)*.5){const SP=txSp(d,map,sd),own=L.filter(n=>!txIsStd(map,sd,n));
       if(own.length<TXC.lib)L.push(c);else{const O=txMeta(li,map,sd==='T'?'CT':'T'),rep=own.filter(n=>!SP[n]).map(n=>[n,txScore(d,map,sd,n,O)]).sort((a,b)=>a[1]-b[1])[0]||own.map(n=>[n,0])[0];L[L.indexOf(rep[0])]=c;delete SP[rep[0]]}
       SP[c]=tg;d.tct[map][sd]=null;return txNewCand(d,map,sd)}}}catch(e){console.error('txEval+',e)}
  /* beskyt specialister mod at blive erstattet af den almindelige bedømmelse */
  const SP=txSp(d,map,sd),L=d.tl&&d.tl[map]&&d.tl[map][sd];const keep=L?L.filter(n=>SP[n]):[];const r=_ev(d,map,sd);
  if(L)for(const n of keep)if(!L.includes(n)){const i=L.findIndex(x=>!txIsStd(map,sd,x)&&!SP[x]&&!keep.includes(x));if(i>=0)L[i]=n}return r}}
/* specialist vælges, når modstanderen har måltaktikken (eller den er ligaens problemtaktik); 3) flere testrunder til en side, der taber */
{const _ch=txChoose;txChoose=function(d,map,sd,opp){const L=_ch(d,map,sd,opp);try{const li=txLiOf(d)[0],os=sd==='T'?'CT':'T',SP=txSp(d,map,sd),P=txProb(li,map,os),O=opp&&opp.length?opp:(P?[P.n]:[]);
   for(const n in SP){if(!d.tl[map][sd].includes(n)||!txInfo(map,sd,n)){delete SP[n];continue}if(O.includes(SP[n])&&!L.includes(n)){const i=L.length>=TXC.sel?L.length-1:L.length;L[i]=n}}
   const c=d.tc&&d.tc[map]&&d.tc[map][sd];if(c&&L.includes(c)){const S=d.tst&&d.tst[map]||{};let w=0,n=0;for(const x of d.tl[map][sd]){const s=S[x];if(s){w+=s[0];n+=s[1]}}
     if(n>=40&&w/n<.35&&L.length>=3){const j=L.findIndex(x=>x!==c&&!SP[x]);if(j>=0)L[j]=c}}}catch(e){console.error('txChoose+',e)}return L}}
/* sæsonskifte: specialister mod taktikker, ligaen ikke længere bruger, bliver almindelige */
{const _se=txSeason;txSeason=function(){const r=_se.apply(this,arguments);try{WD.lg.forEach((g,li)=>g.teams.forEach(t=>{const d=t.def;if(!d.tsp)return;for(const map in d.tsp)for(const sd in d.tsp[map]){const os=sd==='T'?'CT':'T',U=WD.tu&&WD.tu[li]&&WD.tu[li][map]&&WD.tu[li][map][os]||{},tot=Object.values(U).reduce((a,b)=>a+b,0)||1;
   for(const n in d.tsp[map][sd])if((U[d.tsp[map][sd][n]]||0)/tot<.04)delete d.tsp[map][sd][n]}}))}catch(e){console.error(e)}return r}}


/* holdepladsernes værdi lært fra rigtige kampe (pr. liga og map): drab og dødsfald for CT, der står på pladsen */
let AICTX=null;
const aiWP=(L,wf)=>{const w=L.map(wf),s=w.reduce((a,b)=>a+b,0);let r=aiR()*s;for(let i=0;i<L.length;i++){r-=w[i];if(r<=0)return L[i]}return L[L.length-1]};
function aiSV(map){if(!AICTX||AICTX.li==null||!WD.sv)return null;return WD.sv[AICTX.li]&&WD.sv[AICTX.li][map]||null}
function aiNearMap(map){const S=aiSpots(map);if(S.near)return S.near;const mp=S.mp,W=mp.W,N=new Array(W*mp.H).fill(null),D=new Float32Array(W*mp.H).fill(99);
  const all=[];for(const s in S.ent)for(const e of S.ent[s])all.push(...e.holds);for(const f of S.front)all.push(...f.holds);
  for(const h of all)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=h[0]+dx,y=h[1]+dy;if(x<0||y<0||x>=W||y>=mp.H)continue;const d=Math.hypot(dx,dy),i=y*W+x;if(d<D[i]){D[i]=d;N[i]=h[0]+','+h[1]}}
  return S.near=N}
{const _st=CSM2D.step;CSM2D.step=function(R){const n0=R.events.length,o=_st.apply(this,arguments);try{if(R.events.length>n0&&!R.opt.preview&&typeof M!=='undefined'&&M&&M.defs&&WD){const map=M.map||CUR;if(E2D_MAPS[map]){
   const li=txLiOf(M.defs[0])[0];if(li!=null){const N=aiNearMap(map),mp=R.M,sv=((WD.sv=WD.sv||{})[li]=WD.sv[li]||{})[map]=WD.sv[li][map]||{};
    for(let i=n0;i<R.events.length;i++){const e=R.events[i];if(e.type!=='kill'||!e.k)continue;for(const[p,j]of[[e.k,0],[e.v,1]]){if(p.side!=='CT')continue;const c=mp.cellOf(p.x,p.y),key=N[c[1]*mp.W+c[0]];if(!key)continue;const a=sv[key]=sv[key]||[0,0];a[j]++}}}}}}catch(err){}return o}}
{const _se2=txSeason;txSeason=function(){const r=_se2.apply(this,arguments);try{if(WD.sv)for(const li in WD.sv)for(const m in WD.sv[li])for(const k in WD.sv[li][m]){const a=WD.sv[li][m][k];a[0]=Math.round(a[0]*.5);a[1]=Math.round(a[1]*.5);if(!a[0]&&!a[1])delete WD.sv[li][m][k]}}catch(e){}return r}}
{const _nc2=txNewCand;txNewCand=function(d,map,sd){const pv=AICTX;AICTX={li:txLiOf(d)[0]};try{return _nc2(d,map,sd)}finally{AICTX=pv}}}

/* waitpoints lært fra kampe (pr. liga, map og side): hvor længe waitpoint-spilleren overlever, hvor mange han dræber, og om holdet vinder */
const wpKey=(mp,p)=>{const c=mp.cellOf(p.x,p.y);return (c[0]/3|0)+','+(c[1]/3|0)};
function aiWV(map,sd){if(!AICTX||AICTX.li==null||!WD.wv)return null;const a=WD.wv[AICTX.li]&&WD.wv[AICTX.li][map];return a&&a[sd]||null}
function wpVal(V,q){if(!V)return .5;const s=V[(q[0]/3|0)+','+(q[1]/3|0)];if(!s)return .5;const[n,k,al,w]=s;return (k+.5*w+.02*al+.5)/(n+1)}
{const _st2=CSM2D.step;CSM2D.step=function(R){const n0=R.events.length,o=_st2.apply(this,arguments);try{if(!R.opt.preview&&typeof M!=='undefined'&&M&&M.defs&&WD&&R.waitH){const map=M.map||CUR;if(E2D_MAPS[map]){
   const L=R.__wl=R.__wl||[];for(const sd of ['T','CT'])for(const p of R.waitH[sd])if(!L.some(e=>e.p===p))L.push({p,sd,key:wpKey(R.M,p),t0:R.t,k:0,t1:null});
   for(let i=n0;i<R.events.length;i++){const e=R.events[i];if(e.type!=='kill'||!e.k)continue;for(const w of L){if(w.p===e.k&&w.t1==null)w.k++;if(w.p===e.v&&w.t1==null)w.t1=R.t}}
   if(R.over&&!R.__wd&&L.length){R.__wd=1;const li=txLiOf(M.defs[0])[0];if(li!=null){const A=((WD.wv=WD.wv||{})[li]=WD.wv[li]||{})[map]=WD.wv[li][map]||{T:{},CT:{}};
     for(const w of L){const s=A[w.sd][w.key]=A[w.sd][w.key]||[0,0,0,0];s[0]++;s[1]+=w.k;s[2]+=Math.round((w.t1!=null?w.t1:R.t)-w.t0);if(R.winner===w.sd)s[3]++}}}}}}catch(err){}return o}}
{const _se3=txSeason;txSeason=function(){const r=_se3.apply(this,arguments);try{if(WD.wv)for(const li in WD.wv)for(const m in WD.wv[li])for(const sd in WD.wv[li][m])for(const k in WD.wv[li][m][sd]){const a=WD.wv[li][m][sd][k];for(let i=0;i<4;i++)a[i]=Math.round(a[i]*.5);if(!a[0])delete WD.wv[li][m][sd][k]}}catch(e){}return r}}

/* robusthed (7. nov.): står et site med få CT (1–2) og det andet med mange, bliver én på det svage site et anker (waitpoint),
   og 3–4 fra det stærke site holder med et syncpoint, der kun venter på ankeret, og rykker til hans site, når han dør */
function aiSiteOf(S,mp,l){const z=aiZone(mp,l);if(S.SITES.includes(z))return z;let best=null;for(const s of S.SITES)for(const e of S.ent[s]||[]){const d=Math.min(Math.hypot(e.c[0]-l[1],e.c[1]-l[2]),...e.holds.map(h=>Math.hypot(h[0]-l[1],h[1]-l[2])+4));if(d<22&&(!best||d<best[0]))best=[d,s]}return best?best[1]:null}
function aiRobustC(map,r2){const S=aiSpots(map),mp=S.mp;if(S.SITES.length<2)return r2;const at={};S.SITES.forEach(s=>at[s]=[]);
  r2.forEach((w,k)=>{const l=w[w.length-1];if(!l)return;const s=aiSiteOf(S,mp,l);if(s)at[s].push(k)});
  const[A,B]=S.SITES,weak=at[A].length<=at[B].length?A:B,strong=weak===A?B:A;if(!at[weak].length||at[weak].length>2||at[strong].length<3)return r2;
  const nW=r2.reduce((a,w)=>a+w.filter(p=>p[0]===2).length,0);let anc=at[weak].find(k=>r2[k][r2[k].length-1][0]===2);
  if(anc==null){if(nW>=2)return r2;anc=aiP(at[weak]);const l=r2[anc][r2[anc].length-1];l[0]=2;l.length=5}
  const cand=at[strong].filter(k=>!r2[k].some(p=>p[0]===2)).sort(()=>aiR()-.5).slice(0,3+(aiR()<.5?1:0)),E=S.ent[weak]||[];/* 3–4 roterer */
  for(const k of cand){const w=r2[k];if(w.length>=MAXPTS)continue;const l=w[w.length-1];l[0]=1;l.length=5;l.push(2,anc+1,2);
    const e=aiP(E.filter(e=>e.tSide).concat(E)),h=aiP(e.holds);w.push(aiPt(0,h))}
  return r2}
{const _mk3=txMk;txMk=function(map,sd,b,org,parent,d){const id=_mk3(map,sd,b,org,parent,d);try{const x=WD.tx[id];if(sd==='CT'&&x&&x.r2&&t2On(map)&&aiR()<.5){const mp=e2dMap(map);aiRobustC(map,x.r2);
   const r=r2Zones(mp,x.r2).map(w=>w.length?w:[['CT',0]]);x.r=txEnc(r);TXRC.delete(id);TXFB.delete(id);delete CHASE[id];txReg(id)}}catch(e){console.error('aiRobustC',e)}return id}}
// standardtaktik som tekst: map, side, navn, mål-site og punkterne pr. rolle
function t2Export(){const B=TB,mp=e2dMap(B.map);const nm=(B.nm||'').trim()||(B.src&&txIsX(B.src)?txName(B.src):'')||'Uden navn';
  return JSON.stringify({csm:'std2d',v:1,map:B.map,side:B.sd,name:nm,site:B.sd==='T'?B.st:undefined,roles:ROLES[B.sd],r2:B.r2,zones:r2Zones(mp,B.r2).map(w=>w.map(([z,a])=>a?z+'@'+a:z).join(','))})}

}
