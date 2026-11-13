/* de_csm 2D-motor – prototype v0
   Ren logik uden DOM, så den kan køre både i siden og hurtigt i baggrunden.
   Koordinater: kortpixel (0–1024). Gitter: MAP.cell px pr. felt. Tid: sekunder. */
(function(root){
'use strict';
const CFG={
  dt:0.125, turnRate:90, turnFight:180, roundTime:115, bombTime:40, plantTime:3.2, defuseTime:10,
  speed:215,            // u/s med riffel
  hp:100, reload:2,
  heRadius:80, heDmg:70, heThrow:0.9, // HE: radius i px (ca. 350 u), maks. skade, kastetid
  hearR:250,            // fodtrin høres inden for ca. 1.100 u
  fov:40,               // halv synsvinkel i grader ved Awareness 0 (+0,24° pr. point)
  syncMax:8,            // højeste ventetid ved et syncpoint (sek.)
  maxPoints:8,          // højst 8 punkter pr. spiller
  arrive:4              // px
};
// ---------- våben (fra den gamle motor) ----------
// rate = skud pr. sek. · rec = rekyl · ap = rustningsgennemtrængning (standard 0,9) · hk = headshot dræber uden hjelm · fall/acc = SMG-afstandstab · d1 = ekstra forsinkelse før første skud (sek.)
const SMGV={dmg:26,rate:7,rec:.75,fall:.45,acc:.4};
const W={glock:{n:'Glock',c:'pistol',s:'T',ap:.6,dmg:23,mag:20,mags:6,rate:3.2,rec:.4},p2000:{n:'P2000',c:'pistol',s:'CT',ap:.6,dmg:25,mag:13,mags:4,rate:2.6,rec:.4},deagle:{n:'Desert Eagle',c:'pistol',dmg:55,mag:7,mags:5,rate:2,rec:1.8,hs1:1.5},
 ak47:{n:'AK-47',c:'rifle',s:'T',hk:1,dmg:40,mag:30,mags:3,rate:5,rec:1},m4a4:{n:'M4A4',c:'rifle',s:'CT',hk:1,dmg:38,mag:30,mags:3,rate:5,rec:.9},galil:{n:'Galil',c:'rifle',s:'T',hk:1,dmg:34,mag:35,mags:3,rate:5,rec:1},famas:{n:'FAMAS',c:'rifle',s:'CT',hk:1,dmg:30,mag:25,mags:4,rate:5,rec:.85},
 smg:{n:'SMG',c:'smg',dmg:SMGV.dmg,mag:30,mags:4,rate:SMGV.rate,rec:SMGV.rec,fall:SMGV.fall,acc:SMGV.acc},sniper:{n:'AWP',c:'sniper',d1:.25,dmg:115,mag:5,mags:4,rate:.8333,rec:0}};
const PRICE={deagle:700,smg:1250,galil:1800,famas:2000,ak47:2700,m4a4:2900,sniper:5000,he:300,kevlar:500,helm:300};
const SIDEW={T:{R1:'ak47',R2:'galil',P:'glock'},CT:{R1:'m4a4',R2:'famas',P:'p2000'}};
const ECON={win:3250,loss:[1400,1900,2400,2900,3400],kill:300,start:800,max:16000,half:12,rounds:24};
const PR=[['sniper',1,1,1],['R1',1,1,1],['sniper',1,1,0],['R1',1,1,0],['sniper',1,0,0],['R1',1,0,0],['R2',1,1,1],['R2',1,1,0],['R2',1,0,0],['R1',0,0,1],['R1',0,0,0],['R2',0,0,1],['R2',0,0,0],['smg',1,1,0],['smg',1,0,0]];
const mkGun=t=>t?{type:t,mag:W[t].mag,res:W[t].mag*W[t].mags}:null;
const hsD=(w,t,b)=>t.helm?b*1.5:w.hk?Math.max(b*2.5,100):b*2.5;

// ---------- tilfældighed med frø (så runder kan gentages) ----------
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

// ---------- kort ----------
function parseRows(rows){const out=[];for(const r of rows)for(const tok of r.split(' ')){const[v,n]=tok.split('*');for(let i=0;i<(n?+n:1);i++)out.push(v)}return out}
function makeMap(J){
  const W=J.cols,H=J.rows,C=J.cell,cells=parseRows(J.grid);
  const walk=new Uint8Array(W*H);for(let i=0;i<W*H;i++)walk[i]=cells[i]!=='#'?1:0;
  const height=new Uint8Array(W*H);(J.height||[]).forEach((r,y)=>{for(let x=0;x<W;x++){const c=r[x];height[y*W+x]=c>='0'&&c<='9'?+c:0}});
  const M={J,W,H,C,cells,walk,height,upx:J.meta.unitsPerPx,pathCache:new Map()};
  // krydsninger: to lag oven på hinanden (fx CT-spawn-tunnelen under Short). Vandret = nederste lag, lodret = øverste lag. Man kan ikke dreje inde i feltet.
  M.cross=new Uint8Array(W*H);M.crossIx=new Int16Array(W*H).fill(-1);M.lowAx=new Uint8Array(W*H).fill(J.lowLayer||1);/* nederste lags akse pr. krydsning (c.low), ellers mappets lowLayer */for(const[ci,c]of(J.crossings||[]).entries()){const[x0,y0,x1,y1]=c.rect;for(let y=Math.floor(y0/C);y<=Math.floor(y1/C);y++)for(let x=Math.floor(x0/C);x<=Math.floor(x1/C);x++)if(x>=0&&y>=0&&x<W&&y<H&&walk[y*W+x]){M.cross[y*W+x]=c.open?2:1;M.crossIx[y*W+x]=ci;if(c.low)M.lowAx[y*W+x]=c.low}}
  M.hasCross=M.cross.some(v=>v);
  M.cliff=J.cliff||0;// kanter: man kan ikke gå mellem nabofelter med så mange højdetrin imellem
  // balkoner o.l.: strengere grænse i bestemte felter (man kan se og skyde ud over kanten, men ikke gå ned)
  M.cliffT=new Uint8Array(W*H).fill(M.cliff||99);for(const L of J.ledges||[]){const[x0,y0,x1,y1]=L.rect;for(let y=Math.floor(y0/C);y<=Math.floor(y1/C);y++)for(let x=Math.floor(x0/C);x<=Math.floor(x1/C);x++)if(x>=0&&y>=0&&x<W&&y<H)M.cliffT[y*W+x]=Math.min(M.cliffT[y*W+x],L.cliff||2)}
  if(!M.cliff&&(J.ledges||[]).length)M.cliff=99;
  // trapper: ingen kant-regel i feltet
  for(const L of J.stairs||[]){const[x0,y0,x1,y1]=L.rect;for(let y=Math.floor(y0/C);y<=Math.floor(y1/C);y++)for(let x=Math.floor(x0/C);x<=Math.floor(x1/C);x++)if(x>=0&&y>=0&&x<W&&y<H)M.cliffT[y*W+x]=99}
  M.ok=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&walk[y*W+x]===1;
  M.blind=new Uint8Array(W*H);M.blindR=new Uint8Array(W*H);M.blindAx=new Uint8Array(W*H);for(const B of J.blind||[]){const[x0,y0,x1,y1]=B.rect;for(let y=Math.floor(y0/C);y<=Math.floor(y1/C);y++)for(let x=Math.floor(x0/C);x<=Math.floor(x1/C);x++)if(x>=0&&y>=0&&x<W&&y<H&&walk[y*W+x]&&(!B.areas||B.areas.includes(cells[y*W+x]))&&height[y*W+x]>=(B.minH||0)){M.blind[y*W+x]=1;M.blindR[y*W+x]=B.r||6;M.blindAx[y*W+x]=B.axis==='h'?1:B.axis==='v'?2:0}}
  /* noSee: fra felterne i "from" kan man ikke se ind i eller igennem felterne i "to" (og omvendt). Til knæk, gangen ikke har i gitteret */
  M.ns=(J.noSee||[]).map(N=>{const mk=S=>{const m=new Uint8Array(W*H);for(let i=0;i<W*H;i++){if(!walk[i])continue;const x=i%W,y=(i/W)|0;let ok=!S.areas||S.areas.includes(cells[i]);if(ok&&S.rect){const[x0,y0,x1,y1]=S.rect;ok=x>=Math.floor(x0/C)&&x<=Math.floor(x1/C)&&y>=Math.floor(y0/C)&&y<=Math.floor(y1/C)}if(ok)m[i]=1}return m};return{A:mk(N.from),R:mk(N.to)}});
  /* hegn/kanter med "see": spærrer for passage, men ikke for sigt (fx B's hævede bagende på dust2). Kasser langs hegnet blokerer stadig. */
  M.glass=new Uint8Array(W*H);for(const f of J.features||[]){if(!f.see||!(f.line||f.arc))continue;const A=f.arc,[x0,y0,x1,y1]=f.line||[0,0,0,0],n=A?Math.ceil(A[2]*Math.PI*Math.abs(A[4]-A[3])/180/(C/4))+1:Math.ceil(Math.hypot(x1-x0,y1-y0)/(C/4))+1;
    for(let k=0;k<=n;k++){const an=A?(A[3]+(A[4]-A[3])*k/n)*Math.PI/180:0;for(const dr of A?[0,-4,-7]:[0]){if(A&&dr&&(k<n*.08||k>n*.92))continue;const px=A?A[0]+(A[2]+dr)*Math.cos(an):x0+(x1-x0)*k/n,py=A?A[1]+(A[2]+dr)*Math.sin(an):y0+(y1-y0)*k/n,cx=Math.floor(px/C),cy=Math.floor(py/C);if(cx<0||cy<0||cx>=W||cy>=H)continue;const ci=cy*W+cx;if(walk[ci])continue;
      if((J.boxes||[]).some(b=>Math.min(b[2],cx*C+C)-Math.max(b[0],cx*C)>2&&Math.min(b[3],cy*C+C)-Math.max(b[1],cy*C)>2))continue;M.glass[ci]=1}}}
  /* seeRects: vægfelter, man kan se hen over (lave hegn, rækværk, tynde søjler), men ikke gå igennem. minH: kun når begge ender står i mindst den højde (fx kanten om Pit) */
  for(const B of J.seeRects||[]){const[x0,y0,x1,y1]=B.rect;for(let y=Math.floor(y0/C);y<=Math.floor(y1/C);y++)for(let x=Math.floor(x0/C);x<=Math.floor(x1/C);x++)if(x>=0&&y>=0&&x<W&&y<H&&!walk[y*W+x]){M.glass[y*W+x]=1;if(B.minH){M.seeH=M.seeH||new Uint8Array(W*H);M.seeN=M.seeN||new Uint8Array(W*H);M.seeH[y*W+x]=B.minH;M.seeN[y*W+x]=B.near||0;if(B.low){M.seeL=M.seeL||[];M.seeL[y*W+x]=B.low}}}}
  M.okL=(x,y)=>M.ok(x,y)||(x>=0&&y>=0&&x<W&&y<H&&M.glass[y*W+x]===1);
  M.cellOf=(px,py)=>[Math.min(W-1,Math.max(0,Math.floor(px/C))),Math.min(H-1,Math.max(0,Math.floor(py/C)))];
  M.areaAt=(px,py)=>{let x=Math.floor(px/C),y=Math.floor(py/C);x=x>W-1?W-1:x<0?0:x;y=y>H-1?H-1:y<0?0:y;return cells[y*W+x]};// uden array (hurtigere)
  M.siteAt=(px,py)=>{for(const s in J.sites){const r=J.sites[s].rect;if(px>=r[0]&&px<=r[2]&&py>=r[1]&&py<=r[3])return s}return null};
  M.siteRegion=(px,py)=>{const a=M.areaAt(px,py);return a&&J.areas[a]?J.areas[a].site:null};
  M.nearestWalk=(cx,cy)=>{if(M.ok(cx,cy))return[cx,cy];for(let r=1;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(M.ok(cx+dx,cy+dy))return[cx+dx,cy+dy];return[cx,cy]};
  return M;
}
const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];
function astar(M,sx,sy,tx,ty,L0){
  /* L0: lag i en krydsning (1 vandret, 2 lodret); ukendt = øverste lag */
  const s00=sy*M.W+sx,Ls=M.cross[s00]?(L0===1||L0===2?L0:3-M.lowAx[s00]):0;
  const key=((sy*M.W+sx)*65536+(ty*M.W+tx))*4+Ls;const hit=M.pathCache.get(key);if(hit!==undefined)return hit;
  const W=M.W,N=W*M.H,X=M.cross,S=N*3;
  // arrays genbruges mellem kald (stempel i stedet for at nulstille)
  if(!M._g){M._g=new Float32Array(S);M._from=new Int32Array(S);M._st=new Uint32Array(S);M._cl=new Uint32Array(S);M._gen=0;M._hf=[];M._hi=[]}
  const g=M._g,from=M._from,stp=M._st,cl=M._cl,gen=++M._gen,hf=M._hf,hi=M._hi;hf.length=0;hi.length=0;
  const push=(f,i)=>{hf.push(f);hi.push(i);let k=hf.length-1;while(k>0){const p=(k-1)>>1;if(hf[p]<=hf[k])break;const a=hf[p];hf[p]=hf[k];hf[k]=a;const b=hi[p];hi[p]=hi[k];hi[k]=b;k=p}};
  const pop=()=>{const top=hi[0],lf=hf.pop(),li=hi.pop();if(hf.length){hf[0]=lf;hi[0]=li;let k=0;const n=hf.length;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<n&&hf[l]<hf[m])m=l;if(r<n&&hf[r]<hf[m])m=r;if(m===k)break;const a=hf[m];hf[m]=hf[k];hf[k]=a;const b=hi[m];hi[m]=hi[k];hi[k]=b;k=m}}return top};
  const h=(x,y)=>{const dx=x>tx?x-tx:tx-x,dy=y>ty?y-ty:ty-y;return dx>dy?dx+0.4142*dy:dy+0.4142*dx};
  const ok=M.walk,H=M.H;const okc=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&ok[y*W+x]===1;
  const s0=sy*W+sx,t=ty*W+tx,st0=s0*3+Ls;g[st0]=0;stp[st0]=gen;from[st0]=-1;push(h(sx,sy),st0);let end=-1;
  while(hf.length){const st=pop();if(cl[st]===gen)continue;cl[st]=gen;const i=(st/3)|0,m=st%3;if(i===t){end=st;break}const x=i%W,y=(i/W)|0,gi=g[st];
    for(let q=0;q<8;q++){const d=NB[q],dx=d[0],dy=d[1],w=d[2],nx=x+dx,ny=y+dy;if(!okc(nx,ny))continue;if(dx&&dy&&!(okc(x+dx,y)&&okc(x,y+dy)))continue;const j=ny*W+nx;
      if(M.cliff){const T=M.cliffT,low=(X[i]||X[j])&&!(dx&&dy)&&(dx?1:2)===M.lowAx[X[i]?i:j]&&M.J.lowLayerH!=null;
        if(low){/* krydsning: nederste lag (fx vandet under Catwalk) har sin egen højde */const LH=M.J.lowLayerH,a=X[i]?LH:M.height[i],b=X[j]?LH:M.height[j];if(Math.abs(a-b)>=Math.min(T[i],T[j]))continue}
        else{const hc=M.height[i],ti=T[i];if(Math.abs(M.height[j]-hc)>=Math.min(ti,T[j]))continue;if(dx&&dy){const a=y*W+x+dx,b=(y+dy)*W+x;if(Math.abs(M.height[a]-hc)>=Math.min(ti,T[a])||Math.abs(M.height[b]-hc)>=Math.min(ti,T[b]))continue}}}
      let nm=0;if(X[i]||X[j]){if(dx&&dy)continue;const ax=dx?1:2;if(X[i]&&m&&m!==ax)continue;if(X[j])nm=ax}
      const sj=j*3+nm,ng=gi+w;if(stp[sj]!==gen||ng<g[sj]){stp[sj]=gen;g[sj]=ng;from[sj]=st;push(ng+h(nx,ny),sj)}}}
  let res=null;if(end>=0){const p=[];for(let k=end;k!==-1;k=from[k])p.push((k/3)|0);p.reverse();res=smooth(M,p)}
  if(M.pathCache.size>20000)M.pathCache.clear();M.pathCache.set(key,res);return res;
}
// genvej: spring mellemfelter over, når der er fri bane (fremad-søgning, så det ikke bliver kvadratisk)
function smooth(M,p){const W=M.W,out=[p[0]];let i=0;while(i<p.length-1){let j=i+1;const ax=p[i]%W,ay=(p[i]/W)|0;
    while(j+1<p.length&&j-i<40&&losCells(M,ax,ay,p[j+1]%W,(p[j+1]/W)|0,true))j++;out.push(p[j]);i=j}
  return out.map(c=>[(c%W)*M.C+M.C/2,((c/W)|0)*M.C+M.C/2])}
// sigtelinje i gitteret (supercover). strict: også ingen hjørner (bruges til gang)
function losCells(M,ax,ay,bx,by,strict){let x=ax,y=ay,pi=ay*M.W+ax;const bE=!strict&&M.blind&&(M.blind[ay*M.W+ax]||M.blind[by*M.W+bx]),bR=bE?Math.max(M.blindR[ay*M.W+ax],M.blindR[by*M.W+bx]):0;let hitB=false;let nsR=null;if(!strict&&M.ns&&M.ns.length){const ia=ay*M.W+ax,ib=by*M.W+bx;for(const r of M.ns){if((r.A[ia]&&r.R[ib])||(r.A[ib]&&r.R[ia]))return false;if(r.A[ia]||r.A[ib])(nsR=nsR||[]).push(r.R)}}const dx=Math.abs(bx-ax),dy=Math.abs(by-ay),sx=bx>ax?1:-1,sy=by>ay?1:-1;let ix=0,iy=0;
  while(ix<dx||iy<dy){const a=(0.5+ix)/dx,b=(0.5+iy)/dy;
    const ok=strict||!M.okL?M.ok:M.okL;
    if(dx&&(!dy||a<b)){x+=sx;ix++}else if(dy&&(!dx||b<a)){y+=sy;iy++}else{if(!ok(x+sx,y)||!ok(x,y+sy))return false;x+=sx;y+=sy;ix++;iy++}
    if(!ok(x,y))return false;
    if(nsR){const ci=y*M.W+x;for(const m of nsR)if(m[ci])return false}
    if(!strict&&M.seeH&&M.seeH[y*M.W+x]&&Math.min(M.height[ay*M.W+ax],M.height[by*M.W+bx])<M.seeH[y*M.W+x]&&(!M.seeL||!M.seeL[y*M.W+x]||[ay*M.W+ax,by*M.W+bx].some(k=>M.height[k]<M.seeH[y*M.W+x]&&M.seeL[y*M.W+x].includes(M.cells[k])))){/* low: kun når den lave spiller står i et af de områder *//* lav kant: kun til at se hen over oppefra, og kun når den, der står oppe, er højst near felter fra kanten */
      const ci=y*M.W+x,hA=M.height[ay*M.W+ax]>=M.seeH[ci],hB=M.height[by*M.W+bx]>=M.seeH[ci],n=M.seeN[ci],nr=(px,py)=>Math.max(Math.abs(px-x),Math.abs(py-y))<=n;
      if(!n||!((hA&&nr(ax,ay))||(hB&&nr(bx,by))))return false}
    if(!strict&&M.blind&&M.blind[y*M.W+x]&&(x!==bx||y!==by)&&(!M.blindAx[y*M.W+x]||(M.blindAx[y*M.W+x]===1?dx>=dy:dy>=dx))){if(!bE)return false;hitB=true}/* blinde felter (fx vindeltrappen): kan gås igennem, men ikke ses igennem. Står man selv på dem, ser man kort ud (blindR felter) */
    if(strict&&M.cross&&M.cross[y*M.W+x])return false;
    if(strict&&M.cliff){const ci=y*M.W+x;if(Math.abs(M.height[ci]-M.height[pi])>=Math.min(M.cliffT[ci],M.cliffT[pi]))return false;pi=ci}}
  if(hitB&&(bx-ax)*(bx-ax)+(by-ay)*(by-ay)>bR*bR)return false;
  return true}

// ---------- hold og taktikker ----------
const SK=['aim','handling','iq','quick','aware','det','calm','pat','pos','team'];
function randomTeam(r,side,base){const N=side==='T'?['Kaxro','Zeno','Rovi','Mofe','Trisk']:['Nyba','Draxl','Felu','Skoro','Bavi'];
  return N.map(n=>{const s={};for(const k of SK)s[k]=Math.round(Math.max(30,Math.min(98,base+(r()*2-1)*14)));return{name:n,sk:s}})}
const way=(x,y,dir)=>({t:'way',x,y,dir}),sync=(x,y,dir)=>({t:'sync',x,y,dir}),wait=(x,y,dir)=>({t:'wait',x,y,dir});
const TACT={
 T:{
  'B-rush med sync i Upper tunnels':{site:'B',bomb:0,routes:[
    [way(185,690),way(200,470),sync(118,420,[112,320]),way(112,320),way(185,160)],
    [way(170,700),way(190,480),sync(100,440,[112,320]),way(108,330),way(150,230)],
    [way(195,680),way(210,470),sync(135,440,[112,320]),way(115,315),way(210,250)],
    [way(165,690),way(180,490),sync(90,420,[112,320]),way(110,330),way(125,175)],
    [way(205,700),way(230,470),sync(150,450,[300,410]),way(118,330),way(215,130)]]},
  'A-split: Long + Catwalk':{site:'A',bomb:0,routes:[
    [way(640,745),sync(706,660,[712,590]),way(790,520),way(885,400),way(815,175)],
    [way(630,760),sync(712,672,[712,590]),way(800,530),way(890,420),way(860,190)],
    [way(650,730),sync(700,676,[712,590]),way(780,515),way(880,380),way(900,170)],
    [way(470,690),way(470,580),sync(520,500,[520,400]),way(600,405),way(648,300),way(720,180)],
    [way(460,700),way(465,590),sync(518,520,[470,420]),way(590,410),way(645,320),way(690,240)]]},
  'Long-bait: entry venter på Long (waitpoint)':{site:'A',bomb:1,routes:[
    [way(640,745),way(712,600),wait(790,520,[880,380])],
    [way(630,760),way(705,668),way(790,520),way(885,400),way(815,175)],
    [way(650,730),way(700,676),way(790,525),way(880,380),way(870,200)],
    [way(470,690),way(470,580),way(518,520),way(600,405),way(648,300),way(720,180)],
    [way(185,690),way(200,470,[112,330])]]}
 },
 CT:{
  'Standard 2-1-2':{routes:[
    [way(860,215,[885,450])],[way(700,235,[648,340])],[way(462,300,[470,600])],[way(160,165,[112,330])],[way(250,250,[112,330])]]},
  'B-stak 1-1-3':{routes:[
    [way(860,215,[885,450])],[way(462,300,[470,600])],[way(160,165,[112,330])],[way(250,250,[112,330])],[way(200,120,[112,330])]]},
  'Long-push':{routes:[
    [way(790,520,[712,600])],[way(800,505,[712,600])],[way(700,235,[648,340])],[way(462,300,[470,600])],[way(160,165,[112,330])]]}
 }
};

// ---------- runde ----------
function newRound(M,opt){
  const r=rng(opt.seed||1);const J=M.J;
  const teams={T:opt.teamT||randomTeam(r,'T',opt.baseT||70),CT:opt.teamCT||randomTeam(r,'CT',opt.baseCT||70)};
  const tt=opt.routes?{site:opt.site,bomb:opt.bomb,routes:opt.routes.T}:TACT.T[opt.tTac],ct=opt.routes?{routes:opt.routes.CT}:TACT.CT[opt.ctTac];
  S_=opt.skill||((p,k)=>p.sk[k]);
  const P=[];
  // spawn: 5 tilfældige punkter fra kortets spawnPool (ca. 10 pr. side); taktik-byggerens afspilning bruger de faste spawns
  const SPW={};{const rs=rng(((opt.seed||1)*7919+13)>>>0);for(const s of['T','CT']){const pool=J.spawnPool&&J.spawnPool[s];
    if(opt.fixedSpawns||!pool||pool.length<5){SPW[s]=J.spawns[s];continue}const p=pool.slice();for(let i=p.length-1;i>0;i--){const j=Math.floor(rs()*(i+1));[p[i],p[j]]=[p[j],p[i]]}SPW[s]=p.slice(0,5)}}
  for(const side of['T','CT']){const tac=side==='T'?tt:ct;teams[side].forEach((pl,k)=>{const sp=SPW[side][k];
    P.push({id:P.length,side,k,name:pl.name,sk:pl.sk,x:sp[0],y:sp[1],px:sp[0],py:sp[1],hp:CFG.hp,armor:100,alive:true,
      route:tac.routes[k].map(o=>({...o})),ri:0,path:null,pi:0,face:side==='T'?-Math.PI/2:Math.PI/2,
      seen:{},target:null,readyAt:0,row:0,lastShot:-9,shotAcc:0,reloadUntil:0,heard:null,heT:0,
      ...loadout(opt,side,k),hurtAt:-9,still:0,arrivedAt:null,
      syncSince:null,layer:0,bomb:side==='T'&&k===tac.bomb,ref:pl.ref||null,dmgBy:{},swing:null,duel0:null,kills:0,goal:null,mode:'route'})})}
  const R={M,r,P,t:0,site:tt.site,opt,events:[],planted:false,bomb:null,bombLeft:0,plant:null,defuse:null,over:false,winner:null,why:'',
    feed:[],tracers:[],nades:[],booms:[],call:null,waitH:{T:[],CT:[]},dropped:null,stats:{shots:0,hits:0}};
  /* waitpoints: pr. side, flere tilladt; waitHolder = første levende (bruges af byggerens visning) */
  Object.defineProperty(R,'waitHolder',{get(){return R.waitH.T.concat(R.waitH.CT).find(h=>h.alive)||null},set(v){},enumerable:false});
  return R;
}
function loadout(opt,side,k){const L=opt.loadout&&opt.loadout[side]&&opt.loadout[side][k];
  if(L)return{gun:L.gun?mkGun(L.gun):null,pis:mkGun(L.pis||SIDEW[side].P),armor:L.armor||0,helm:!!L.helm,he:L.he?1:0,hp:CFG.hp};
  return{gun:mkGun(k===0&&side==='CT'?'sniper':SIDEW[side].R1),pis:mkGun(SIDEW[side].P),armor:100,helm:true,he:1,hp:CFG.hp}}
let S_=(p,k)=>p.sk[k];
const isMoving=(R,p)=>R.t-(p.mvT??-9)<=CFG.dt*1.5;
// kurve for spot/reaktion: høj skill skærer stadig tiden markant ned, men hele duellen sker hurtigere
const kCurve=s=>Math.pow(Math.max(0,Math.min(100,100-s))/100,1.5);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angTo=(a,bx,by)=>Math.atan2(by-a.y,bx-a.x);
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return Math.abs(d)};

function cellIdx(M,p){let x=Math.floor(p.x/M.C),y=Math.floor(p.y/M.C);if(x<0)x=0;else if(x>=M.W)x=M.W-1;if(y<0)y=0;else if(y>=M.H)y=M.H-1;return y*M.W+x}
function crossThrough(M,ax,ay,bx,by){const dx=Math.abs(bx-ax),dy=Math.abs(by-ay);if(Math.min(dx,dy)<=0.5*Math.max(dx,dy))return false;const n=Math.max(dx,dy);
  const op=M.cross[ay*M.W+ax]===2||M.cross[by*M.W+bx]===2;/* åben bro/catwalk: sigt fra dækket og ned i vandet (og omvendt) */
  for(let k=1;k<n;k++){const cx=Math.round(ax+(bx-ax)*k/n),cy=Math.round(ay+(by-ay)*k/n),c=M.cross[cy*M.W+cx];if(c&&!(op&&c===2))return true}return false}
/* åbent dæk med "see": man ser kun ned i vandet på den side (fx Catwalk: kun nord) */
function deckSide(M,i,j){const c=(M.J.crossings||[])[M.crossIx[i]];if(!c||!c.see)return true;const C=M.C,W=M.W,x=j%W,y=(j/W)|0,[x0,y0,x1,y1]=c.rect.map(v=>Math.floor(v/C));
  return c.see==='N'?y<y0:c.see==='S'?y>y1:c.see==='W'?x<x0:x>x1}
/* fra et åbent dæk (øverste lag): andre krydsninger skjuler det bag sig, og "hide"-områder kan ikke ses */
function deckBlock(M,i,j){const c=(M.J.crossings||[])[M.crossIx[i]];if(!c)return false;if(c.hide&&c.hide.includes(M.cells[j]))return true;
  const W=M.W,ax=i%W,ay=(i/W)|0,bx=j%W,by=(j/W)|0,n=Math.max(Math.abs(bx-ax),Math.abs(by-ay));
  for(let k=1;k<n;k++){const ci=Math.round(ay+(by-ay)*k/n)*W+Math.round(ax+(bx-ax)*k/n);if(M.cross[ci]&&M.crossIx[ci]!==M.crossIx[i])return true}return false}
/* lukket krydsning med "sides" (fx Short over tunnelen på dust2): sigtelinjen følger det lag, den kom ind i. Tunnelen (nederste lag) har åbninger i sine ender,
   dækket (øverste lag) i sine ender. Fra dækket ser man kun ud til siden, hvis feltet ved siden af ligger højere end tunnelen (lowLayerH) – aldrig ned i tunnelens gang */
const csd=(M,k)=>M.cross[k]===1&&!!((M.J.crossings||[])[M.crossIx[k]]||{}).sides;
function crossSide(M,ax,ay,bx,by,La,Lb){const W=M.W,LH=M.J.lowLayerH,dx=Math.abs(bx-ax),dy=Math.abs(by-ay),sx=bx>ax?1:-1,sy=by>ay?1:-1,bit=s=>s===1?1:2;
  let x=ax,y=ay,ix=0,iy=0,prev=ay*W+ax,mask=csd(M,prev)?bit(La||3-M.lowAx[prev]):0;
  while(ix<dx||iy<dy){const a=(0.5+ix)/dx,b=(0.5+iy)/dy;let s;if(dx&&(!dy||a<b)){x+=sx;ix++;s=1}else if(dy&&(!dx||b<a)){y+=sy;iy++;s=2}else{x+=sx;y+=sy;ix++;iy++;s=3}
    const ci=y*W+x,inP=csd(M,prev),inC=csd(M,ci);
    if(inP&&!inC){const low=M.lowAx[prev],up=3-low,ok=st=>!!(mask&bit(st))||(!!(mask&bit(up))&&st===low&&LH!=null&&M.height[ci]>LH);if(!(s===3?ok(1)&&ok(2):ok(s)))return false;mask=0}
    else if(!inP&&inC){const low=M.lowAx[ci],up=3-low,en=(st,from)=>bit(st)|(st===low&&LH!=null&&M.height[from]>LH?bit(up):0);
      if(s===3){const nA=prev+sx,nB=prev+sy*W,mA=csd(M,nA)?en(1,prev):en(2,nA),mB=csd(M,nB)?en(2,prev):en(1,nB);mask=mA&mB}else mask=en(s,prev)}/* skråt ind gennem et hjørne: kun de lag, begge veje rundt om hjørnet giver */
    prev=ci}
  if(csd(M,prev)&&Lb&&!(mask&bit(Lb)))return false;
  return true}
function canSee(R,a,b){const M=R.M,i=a.ci,j=b.ci,r=canSee0(R,a,b);if(i!==j&&!M.cross[i]&&!M.cross[j]){const key=i<j?i*16384+j:j*16384+i,hk=(Math.imul(key,0x9E3779B1)>>>12)&0xFFFFF;if(M.losK[hk]===key)(i<j?M.losF:M.losR)[hk]=r?2:1}return r}
function canSee0(R,a,b){const M=R.M;const i=a.ci,j=b.ci;if(i===j)return!(M.cross[i]&&a.layer&&b.layer&&a.layer!==b.layer);
  // sigt-cache: hashtabel i typede arrays (hurtigere end Map). Kollisioner overskriver bare.
  if(!M.losK){M.losK=new Int32Array(1<<20).fill(-1);M.losV=new Uint8Array(1<<20);M.losF=new Uint8Array(1<<20);M.losR=new Uint8Array(1<<20)}
  const key=i<j?i*16384+j:j*16384+i,hk=(Math.imul(key,0x9E3779B1)>>>12)&0xFFFFF;let v;const plain=!M.cross[i]&&!M.cross[j],FA=i<j?M.losF:M.losR;
  if(plain&&M.losK[hk]===key&&FA[hk])return FA[hk]===2;
  if(M.losK[hk]===key)v=M.losV[hk]===1;else{M.losF[hk]=0;M.losR[hk]=0;const W=M.W,ax=i%W,ay=(i/W)|0,bx=j%W,by=(j/W)|0;v=losCells(M,ax,ay,bx,by,false)&&!(M.hasCross&&crossThrough(M,ax,ay,bx,by))&&(!M.hasCross||csd(M,i)||csd(M,j)||crossSide(M,ax,ay,bx,by,0,0));M.losK[hk]=key;M.losV[hk]=v?1:0}
  if(!v)return false;
  if(M.hasCross&&(csd(M,i)||csd(M,j))){const W=M.W;if(!crossSide(M,i%W,(i/W)|0,j%W,(j/W)|0,csd(M,i)?(a.layer||3-M.lowAx[i]):0,csd(M,j)?(b.layer||3-M.lowAx[j]):0))return false}
  if(M.hasCross&&(M.cross[i]||M.cross[j])){const W=M.W,dx=Math.abs(j%W-i%W),dy=Math.abs(((j/W)|0)-((i/W)|0)),axis=dx>=dy?1:2;
    const La=M.cross[i]?(a.layer||3-M.lowAx[i]):0,Lb=M.cross[j]?(b.layer||3-M.lowAx[j]):0;
    if(La&&Lb&&La!==Lb)return false;/* dækket skjuler den, der står lige under */
    if(La&&M.cross[i]===2&&La!==M.lowAx[i]&&deckBlock(M,i,j))return false;if(Lb&&M.cross[j]===2&&Lb!==M.lowAx[j]&&deckBlock(M,j,i))return false;
    {const LH=M.J.lowLayerH;/* dæk med "see": vandet på de andre sider kan ikke ses (heller ikke på skrå) */
     if(La&&!Lb&&La!==M.lowAx[i]&&LH!=null&&Math.abs(M.height[j]-LH)<=1&&!deckSide(M,i,j))return false;
     if(Lb&&!La&&Lb!==M.lowAx[j]&&LH!=null&&Math.abs(M.height[i]-LH)<=1&&!deckSide(M,j,i))return false}
    /* åben bro/catwalk (cross=2): fra dækket ser man til alle sider ned i vandet; under dækket kun langs vandet */
    /* lukket krydsning (fx Short over tunnelen): fra det øverste lag ser man til siden, bare ikke ned i det nederste lags gange */
    const LHo=M.J.lowLayerH,upOk=(c,L,o)=>M.cross[c]===1&&L!==M.lowAx[c]&&LHo!=null&&!M.cross[o]&&M.height[o]>LHo;
    if(La&&La!==axis&&!(M.cross[i]===2&&La!==M.lowAx[i]&&!Lb&&deckSide(M,i,j))&&!upOk(i,La,j))return false;if(Lb&&Lb!==axis&&!(M.cross[j]===2&&Lb!==M.lowAx[j]&&!La&&deckSide(M,j,i))&&!upOk(j,Lb,i))return false}
  /* sigt langs det nederste lag gennem en krydsning: et endepunkt uden for krydsningen skal ligge i det nederste lags højde (fx ikke fra Short ned gennem tunnelen) */
  if(M.hasCross&&M.J.lowLayerH!=null){const W=M.W,ax=i%W,ay=(i/W)|0,bx=j%W,by=(j/W)|0,dx=Math.abs(bx-ax),dy=Math.abs(by-ay),axis=dx>=dy?1:2;
    {const n=Math.max(dx,dy);let thr=false;for(let k=1;k<n;k++){const cx=Math.round(ax+(bx-ax)*k/n),cy=Math.round(ay+(by-ay)*k/n),ci=cy*W+cx;if(M.cross[ci]&&M.lowAx[ci]===axis){thr=true;break}}
      if(thr){const LH=M.J.lowLayerH;if(!M.cross[i]&&Math.abs(M.height[i]-LH)>2)return false;if(!M.cross[j]&&Math.abs(M.height[j]-LH)>2)return false}}
    /* hen over et dæk med "see" (fx Catwalk) fra et sted uden for dækket: man ser ikke ned i vandet på den anden side (fx fra Mid gennem Catwalk) (12. nov.) */
    if(!M.cross[i]&&!M.cross[j]){const LH=M.J.lowLayerH,hi=M.height[i],hj=M.height[j];if(Math.min(hi,hj)<=LH&&Math.abs(hi-hj)>=2){const n=Math.max(dx,dy);
      for(let k=1;k<n;k++){const cx=Math.round(ax+(bx-ax)*k/n),cy=Math.round(ay+(by-ay)*k/n),ci=cy*W+cx;if(M.cross[ci]&&((M.J.crossings||[])[M.crossIx[ci]]||{}).see)return false}}}}
  return true}


function setGoal(R,p,x,y){const M=R.M;const ox=x,oy=y;const[sx,sy]=M.nearestWalk(...M.cellOf(p.x,p.y)),[tx,ty]=M.nearestWalk(...M.cellOf(x,y));
  {const[cx,cy]=M.cellOf(x,y);if(!M.ok(cx,cy)){x=tx*M.C+M.C/2;y=ty*M.C+M.C/2}}// mål inde i en væg/kasse: brug nærmeste gulvfelt
  const path=astar(M,sx,sy,tx,ty,p.layer);p.path=path?path.slice(1).concat([[x,y]]):[[x,y]];p.pi=0;p.goal=[ox,oy]}

function teamOf(R,s){const c=R._tc;if(c&&c.t===R.t)return c[s]||(c[s]=R.P.filter(p=>p.side===s&&p.alive));R._tc={t:R.t,v:R._ver};return R._tc[s]=R.P.filter(p=>p.side===s&&p.alive)}
function syncReady(R,p){// alle levende holdkammerater med et syncpoint nr. k står i det → tidspunktet, hvor den sidste kom frem (ellers false)
  /* sync-grupper: et syncpoint venter kun på syncpoints i samme gruppe (g); nummereringen tælles inden for gruppen */
  const g=p.route[p.ri].g||0,k=p.route.slice(0,p.ri+1).filter(o=>o.t==='sync'&&(o.g||0)===g).length;let last=p.arrivedAt||R.t;
  for(const q of teamOf(R,p.side)){if(q===p)continue;let n=0,idx=-1;for(let i=0;i<q.route.length;i++)if(q.route[i].t==='sync'&&(q.route[i].g||0)===g&&++n===k){idx=i;break}
    if(idx<0)continue;if(q.ri<idx)return false;if(q.ri===idx){if(!q.arrivedAt)return false;last=Math.max(last,q.arrivedAt)}}
  return last}

function step(R){
  if(R.over)return;const M=R.M,dt=CFG.dt,r=R.r;R.t+=dt;
  if(R.opt.preview){// forhåndsvisning i taktik-byggeren: kun bevægelse, ingen modstandere
    for(const p of R.P){p.px=p.x;p.py=p.y}for(const p of R.P)if(p.alive&&p.side===R.opt.preview){move(R,p);turn(p,dt)}
    if(R.plant&&(R.plant.left-=dt)<=0){R.planted=true;R.bombLeft=CFG.bombTime;R.bomb={x:R.plant.p.x,y:R.plant.p.y,site:M.siteAt(R.plant.p.x,R.plant.p.y)};R.plant.p.bomb=false;R.plant=null}
    if(R.t>=CFG.roundTime)end(R,'CT','Tiden løb ud');return}
  const P=R.P,alive=P.filter(p=>p.alive);
  for(const p of P){p.px=p.x;p.py=p.y;p.ci=cellIdx(M,p)}
  if(R.tracers.length)R.tracers=R.tracers.filter(t=>R.t-t.t<0.3);

  // 1) syn og opdagelse
  for(const p of alive){
    const fov=(CFG.fov+0.24*S_(p,'aware'))*Math.PI/180;p.fovA=fov;
    for(const e of alive){if(e.side===p.side)continue;
      const dx=p.x-e.x,dy=p.y-e.y,d2=dx*dx+dy*dy,lim=128*M.C;const vis=d2<lim*lim&&canSee(R,p,e);const s=p.seen[e.id];const d=vis||!s?Math.sqrt(d2)/M.C:0;
      if(!vis){if(s&&R.t-s.last>1.0)delete p.seen[e.id];else if(s)s.vis=false;continue}
      if(s){s.vis=true;s.last=R.t;continue}
      const inF=angDiff(p.face,angTo(p,e.x,e.y))<fov;
      const moving=isMoving(R,e);
      let delay=inF?0.05+0.25*kCurve(S_(p,'aware')):(d<22&&moving?0.3+0.6*kCurve(S_(p,'aware')):99);
      // Playing IQ: står fjenden der, hvor man forventede (holdretning), ser man ham hurtigere
      if(inF&&p.holdDir!=null&&angDiff(p.holdDir,angTo(p,e.x,e.y))<0.35)delay*=1-0.4*S_(p,'iq')/100;
      else if(inF&&p.heard&&R.t-p.heard.t<2.5&&angDiff(angTo(p,p.heard.x,p.heard.y),angTo(p,e.x,e.y))<0.45)delay*=0.7;
      if(delay<50)p.seen[e.id]={at:R.t+delay,last:R.t,vis:true};
    }
  }
  // lyd: fodtrin høres gennem vægge. Awareness afgør, om man opfanger dem; en spiller, der holder stille, vender sig mod lyden
  if(((R.t/dt)|0)%2===0)for(const p of alive){if(p.fighting)continue;
    for(const e of alive){if(e.side===p.side)continue;const ex=p.x-e.x,ey=p.y-e.y;if(ex*ex+ey*ey>CFG.hearR*CFG.hearR)continue;if(!isMoving(R,e))continue;const d=Math.sqrt(ex*ex+ey*ey);
      if(p.seen[e.id]&&p.seen[e.id].vis)continue;
      if(r()<S_(p,'aware')/100*0.6*dt*2*(1-d/CFG.hearR*0.6)){p.heard={x:e.x,y:e.y,t:R.t};break}}}
  // 2) beslutninger og skud
  const hits=[];
  for(const p of alive){
    const vis=[];for(const e of alive){if(e.side===p.side)continue;const q=p.seen[e.id];if(q&&q.vis&&R.t>=q.at)vis.push(e)}
    if(vis.length){
      // mål: den nærmeste; Teamplay: drabsmanden på en holdkammerat går forud
      let tg=vis.reduce((a,b)=>dist(p,a)<dist(p,b)?a:b);if(p.trade&&R.t<p.trade.until){const k=vis.find(e=>e.id===p.trade.id);if(k)tg=k}
      if(p.target!==tg.id){p.target=tg.id;p.row=0;p.duel0=R.t;
        let react=0.08+0.25*kCurve(S_(p,'quick'));if(p.trade&&p.trade.id===tg.id&&R.t<p.trade.until)react*=1-0.5*S_(p,'team')/100;
        {const sq=p.seen[tg.id];p.readyAt=Math.max(p.readyAt,Math.max(sq?sq.at:R.t,R.t-dt)+react)}// reaktionen tæller fra det øjeblik, han blev set (også midt i et skridt)
        // Determination: går videre (swinger) i stedet for at stoppe
        p.swing=p.mode==='route'&&(R.opt.alwaysSwing&&R.opt.alwaysSwing(p)||r()*100<S_(p,'det')*0.6)}
      p.faceT=angTo(p,tg.x,tg.y);p.fighting=true;
      // Determination: planter/desarmerer man videre under beskydning, eller stopper man og skyder?
      const busy=(R.defuse&&R.defuse.p===p)||(R.plant&&R.plant.p===p);
      if(busy){if(p.busyKeep==null)p.busyKeep=r()*100<S_(p,'det');if(p.busyKeep)continue;if(R.defuse&&R.defuse.p===p)R.defuse=null;if(R.plant&&R.plant.p===p)R.plant=null}
      if(R.t<p.reloadUntil||R.t<p.readyAt||R.t<p.heT)continue;
      // Playing IQ: HE-granat mod en fjende, der er tæt på (og helst flere sammen)
      if(p.he&&!p.thrown&&dist(p,tg)<CFG.heRadius*3.2&&r()<S_(p,'iq')/100*0.15*dt*4){p.he=0;p.thrown=true;p.heT=R.t+CFG.heThrow;
        const err=(1-S_(p,'iq')/100)*55+10,ang=r()*Math.PI*2,rr=r()*err;R.nades.push({x:tg.x+Math.cos(ang)*rr,y:tg.y+Math.sin(ang)*rr,at:R.t+CFG.heThrow,by:p});continue}
      let g=p.gun&&(p.gun.mag+p.gun.res>0)?p.gun:p.pis;const w=W[g.type];
      if(g.mag<=0){if(g.res>0){p.reloadUntil=R.t+CFG.reload;const f=Math.min(w.mag,g.res);g.mag=f;g.res-=f;p.row=0}continue}
      if(p.row===0&&w.d1&&!p.d1done){p.d1done=true;p.readyAt=R.t+w.d1;continue}
      {const t0=Math.max(p.readyAt||0,p.reloadUntil||0,p.heT||0),fr=Math.max(0,Math.min(dt,R.t-t0));// mid-tick: første skud kommer, så snart han er klar; derefter kun skud for den del af skridtet, han har været klar
        if(p.row===0&&p.shotAcc<1)p.shotAcc=1+w.rate*fr;else p.shotAcc+=w.rate*fr}
      while(p.shotAcc>=1&&g.mag>0){p.shotAcc-=1;g.mag--;p.row++;R.stats.shots++;
        const du=dist(p,tg)*M.upx;
        const moving=isMoving(R,p);
        let ch=0.06+0.5*S_(p,'aim')/100*(1-0.45*Math.min(1,du/2200));
        ch-=Math.min(0.32,p.row*0.018*w.rec*(1.4-S_(p,'handling')/100));       // Handling: rekyl i spray
        if(moving)ch-=(w.c==='sniper'?0.45:0.22)*(1.25-S_(p,'handling')/100);    // Handling: skud i bevægelse
        if(R.t-p.duel0<1)ch-=(100-S_(p,'calm'))/100*0.14;                        // Calmness: første sekund
        if(R.t-p.hurtAt<1)ch-=(100-S_(p,'calm'))/100*0.10;                       // Calmness: under beskydning
        if(p.still>2)ch+=0.08*(S_(p,'pat')-50)/50;                               // Patience: holder vinklen
        if(tg.still>1)ch-=0.06*(S_(tg,'pos')-50)/50;                             // Positioning (målets): dækning
        if(M.height[p.ci]-M.height[tg.ci]>=3)ch+=0.04;// højde
        if(w.c==='sniper')ch+=0.1;
        const rf=w.fall?Math.max(0,Math.min(1,(du-500)/1500)):0;if(rf)ch*=1-w.acc*rf;
        if(R.opt.luck)ch*=1+R.opt.luck(p);
        ch=Math.max(0.02,Math.min(0.9,ch));
        const hit=r()<ch;(R.opt.visual!==false)&&R.tracers.push({t:R.t,a:[p.x,p.y],b:[tg.x,tg.y],hit,side:p.side});
        if(hit){R.stats.hits++;const f1=p.row===1&&w.hs1?w.hs1:1,hd=(0.03+0.15*S_(p,'aim')/100)*f1,x=r(),head=x<hd,b=w.dmg*(1-(w.fall||0)*rf);
          hits.push({s:p,t:tg,dmg:head?hsD(w,tg,b):b*(x<hd+0.5?1:0.5),head,w:g.type})}
      }
      p.lastShot=R.t;
    }else{p.target=null;p.fighting=false;p.row=0;p.shotAcc=0;p.busyKeep=null;p.d1done=false}
  }
  // HE-granater, der lander
  for(const n of R.nades.filter(n=>R.t>=n.at)){for(const q of R.P){if(!q.alive)continue;const d=Math.hypot(q.x-n.x,q.y-n.y);if(d>CFG.heRadius)continue;
      const[ax,ay]=M.cellOf(n.x,n.y),[bx,by]=M.cellOf(q.x,q.y);if(!losCells(M,ax,ay,bx,by,false))continue;
      let dm=CFG.heDmg*(1-d/CFG.heRadius);if(q.armor>0)dm*=0.57;if(q.side!==n.by.side)hits.push({s:n.by,t:q,dmg:dm,head:false,w:null,he:true})}
    R.booms.push({x:n.x,y:n.y,t:R.t})}
  if(R.nades.length)R.nades=R.nades.filter(n=>R.t<n.at);if(R.booms.length)R.booms=R.booms.filter(b=>R.t-b.t<0.6);
  // 3) skade og drab
  for(const h of hits){const t=h.t;if(!t.alive)continue;let d=h.dmg;
    if(!h.head&&t.armor>0&&h.w){const ap=(W[h.w]&&W[h.w].ap)??0.9,red=Math.min(d*(1-ap),t.armor);t.armor=Math.max(0,t.armor-Math.min(d*0.1,t.armor)*3.5);d-=red}
    const hp0=t.hp;t.hp-=d;t.hurtAt=R.t;t.dmgBy[h.s.id]=(t.dmgBy[h.s.id]||0)+Math.min(d,Math.max(0,hp0));
    /* ramt: man ved, hvor skuddet kom fra, og vender sig hurtigt mod skytten (også mens man går) */
    if(t.hp>0&&!h.he&&!t.fighting){t.hurtBy={x:h.s.x,y:h.s.y,until:R.t+2.5};t.faceT=angTo(t,h.s.x,h.s.y)}
    if(t.hp<=0){t.alive=false;t.hp=0;R._tc=null;h.s.kills++;R.feed.push({t:R.t,k:h.s.name,ks:h.s.side,v:t.name,vs:t.side,head:h.head,w:h.w?W[h.w].n:'HE-granat'});
      for(const q of teamOf(R,t.side))if(dist(q,t)<R.M.C*40)q.trade={id:h.s.id,until:R.t+3};
      R.events.push({type:'kill',k:h.s,v:t,w:h.w,head:h.head,he:!!h.he,assist:Object.keys(t.dmgBy).map(Number).filter(id=>id!==h.s.id&&t.dmgBy[id]>=25).map(id=>R.P[id]).filter(a=>a.side!==t.side)});
      if(t.bomb){t.bomb=false;R.dropped={x:t.x,y:t.y}}
      if(t.defuse){R.defuse=null}if(R.plant&&R.plant.p===t)R.plant=null}}
  // 4) bevægelse og rutelogik
  for(const p of P)if(p.alive)move(R,p);
  for(const p of P)if(p.alive){if(p.hurtBy&&R.t>=p.hurtBy.until)p.hurtBy=null;turn(p,dt)}
  // 5) bombe
  if(R.planted){R.bombLeft-=dt;if(R.defuse){const d=R.defuse;if(!d.p.alive)R.defuse=null;else if((d.left-=dt)<=0){R.events.push({type:'defuse',p:d.p});return end(R,'CT','Bomben er desarmeret')}}
    if(R.bombLeft<=0)return end(R,'T','Bomben sprang')}
  else if(R.plant){const pl=R.plant;if(!pl.p.alive)R.plant=null;else if((pl.left-=dt)<=0){R.planted=true;R.bombLeft=CFG.bombTime;R.bomb={x:pl.p.x,y:pl.p.y,site:M.siteAt(pl.p.x,pl.p.y)};pl.p.bomb=false;R.plant=null;R.feed.push({t:R.t,msg:`Bomben er plantet på ${R.bomb.site}`});R.events.push({type:'plant',p:pl.p,site:R.bomb.site})}}
  // 6) slut
  const nT=teamOf(R,'T').length,nC=teamOf(R,'CT').length;
  if(!nC)return end(R,'T','CT er døde');
  if(!nT&&!R.planted)return end(R,'CT','T er døde');
  if(!R.planted&&R.t>=CFG.roundTime)return end(R,'CT','Tiden løb ud');
}
function end(R,w,why){R.over=true;R.winner=w;R.why=why}

/* synsfeltet drejer gradvist mod p.faceT (grader/sek.) */
function turn(p,dt){if(p.faceT==null)return;let d=p.faceT-p.face;d=Math.atan2(Math.sin(d),Math.cos(d));const m=(p.fighting||p.hurtBy?CFG.turnFight:CFG.turnRate)*Math.PI/180*dt;p.face=Math.abs(d)<=m?p.faceT:p.face+Math.sign(d)*m}
/* afterplant: hver T får en tilfældig, unik position blandt sitets 10 (postPlant i kortet) */
function ppSpot(R,p){const L=R.M.J.postPlant&&R.bomb&&R.M.J.postPlant[R.bomb.site];if(!L||!L.length)return null;if(!R.ppA){R.ppA=new Map();const ix=L.map((_,i)=>i);for(let i=ix.length-1;i>0;i--){const j=Math.floor(R.r()*(i+1));const t=ix[i];ix[i]=ix[j];ix[j]=t}R.ppIx=ix}if(!R.ppA.has(p))R.ppA.set(p,L[R.ppIx[R.ppA.size%L.length]]);return R.ppA.get(p)}
/* CT rydder sitet før defuse: afterplant-pladserne (hvor T typisk står) skal have været set af en CT, før han går hen til bomben – medmindre tiden er ved at løbe ud */
function ctClear(R,p,spd){if(!teamOf(R,'T').length)return null;/* alle T er døde: gå direkte til bomben */const M=R.M,L=M.J.postPlant&&R.bomb&&M.J.postPlant[R.bomb.site];if(!L||!L.length)return null;
  const W=M.W,ci=c=>Math.floor(c[1]/M.C)*W+Math.floor(c[0]/M.C);if(!R.ppClr)R.ppClr=new Set();
  const pc={ci:ci([p.x,p.y]),layer:p.layer||0};
  for(const t of teamOf(R,'CT'))if(t.alive){const tc={ci:ci([t.x,t.y]),layer:t.layer||0};for(let i=0;i<L.length;i++)if(!R.ppClr.has(i)&&canSee(R,tc,{ci:ci(L[i]),layer:0}))R.ppClr.add(i)}
  /* beslutningen genberegnes højst én gang i sekundet (eller når den valgte plads er set) */
  if(p._cc&&R.t-p._cc.t<1&&(p._cc.i<0||!R.ppClr.has(p._cc.i)))return p._cc.b;
  let bi=-1,bd=1e9;for(let i=0;i<L.length;i++){if(R.ppClr.has(i))continue;const d=Math.hypot(p.x-L[i][0],p.y-L[i][1]);if(d<bd){bd=d;bi=i}}
  let b=bi<0?null:L[bi];
  /* tid: den rigtige gåvej (rundt om vægge) fra spilleren til pladsen og videre til bomben + desarmering (kit = halv tid) + 2 sek. margen */
  if(b){const v=spd/CFG.dt,L2=pathLen(M,b[0],b[1],R.bomb.x,R.bomb.y,0),nd=L1=>(L1+L2)/v*1.15+CFG.defuseTime*(p.ref&&p.ref.kit?0.5:1)+2;
    /* samme beslutning som med A*, men A* køres kun, når grænserne ikke afgør det: luftlinjen er en nedre grænse, afstandskortet en øvre */
    let ok;if(R.bombLeft<nd(Math.hypot(b[0]-p.x,b[1]-p.y)))ok=false;else{const hi=pathHi(M,p.x,p.y,b[0],b[1],p.layer);ok=hi!=null&&R.bombLeft>=nd(hi)?true:!(R.bombLeft<nd(pathLen(M,p.x,p.y,b[0],b[1],p.layer)))}
    if(!ok){b=null;bi=-1}}
  p._cc={t:R.t,b,i:bi};return b}
/* længden af gåvejen mellem to punkter (px), målt langs den vej spillerne faktisk går */
/* øvre grænse for pathLen: korteste vej i gitteret (afstandskort mod målfeltet, samme kanter som A*). A*'s udglattede vej er aldrig længere */
function revGraph(M){if(M._rv)return M._rv;const W=M.W,H=M.H,N=W*H,X=M.cross,ok=M.walk,okc=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&ok[y*W+x]===1,E=[];
  for(let i=0;i<N;i++){if(ok[i]!==1)continue;const x=i%W,y=(i/W)|0;for(const m of X[i]?[1,2]:[0]){const st=i*3+m;
    for(let q=0;q<8;q++){const d=NB[q],dx=d[0],dy=d[1],w=d[2],nx=x+dx,ny=y+dy;if(!okc(nx,ny))continue;if(dx&&dy&&!(okc(x+dx,y)&&okc(x,y+dy)))continue;const j=ny*W+nx;
      if(M.cliff){const T=M.cliffT,low=(X[i]||X[j])&&!(dx&&dy)&&(dx?1:2)===M.lowAx[X[i]?i:j]&&M.J.lowLayerH!=null;
        if(low){const LH=M.J.lowLayerH,a=X[i]?LH:M.height[i],b=X[j]?LH:M.height[j];if(Math.abs(a-b)>=Math.min(T[i],T[j]))continue}
        else{const hc=M.height[i],ti=T[i];if(Math.abs(M.height[j]-hc)>=Math.min(ti,T[j]))continue;if(dx&&dy){const a=y*W+x+dx,b=(y+dy)*W+x;if(Math.abs(M.height[a]-hc)>=Math.min(ti,T[a])||Math.abs(M.height[b]-hc)>=Math.min(ti,T[b]))continue}}}
      let nm=0;if(X[i]||X[j]){if(dx&&dy)continue;const ax=dx?1:2;if(X[i]&&m&&m!==ax)continue;if(X[j])nm=ax}
      E.push(j*3+nm,st,w)}}}
  const S=N*3,cnt=new Int32Array(S+1);for(let k=0;k<E.length;k+=3)cnt[E[k]+1]++;for(let k=0;k<S;k++)cnt[k+1]+=cnt[k];
  const to=new Int32Array(E.length/3),wt=new Float64Array(E.length/3),pos=cnt.slice(0,S);for(let k=0;k<E.length;k+=3){const e=pos[E[k]]++;to[e]=E[k+1];wt[e]=E[k+2]}
  return M._rv={off:cnt,to,wt,S}}
function distField(M,t){M._df=M._df||new Map();let D=M._df.get(t);if(D)return D;const G=revGraph(M);D=new Float64Array(G.S).fill(Infinity);
  const hf=[],hi=[],push=(f,i)=>{hf.push(f);hi.push(i);let k=hf.length-1;while(k>0){const p=(k-1)>>1;if(hf[p]<=hf[k])break;[hf[p],hf[k]]=[hf[k],hf[p]];[hi[p],hi[k]]=[hi[k],hi[p]];k=p}},
    pop=()=>{const top=hi[0],tf=hf[0],lf=hf.pop(),li=hi.pop();if(hf.length){hf[0]=lf;hi[0]=li;let k=0;const n=hf.length;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<n&&hf[l]<hf[m])m=l;if(r<n&&hf[r]<hf[m])m=r;if(m===k)break;[hf[m],hf[k]]=[hf[k],hf[m]];[hi[m],hi[k]]=[hi[k],hi[m]];k=m}}return[top,tf]};
  for(let m=0;m<3;m++){D[t*3+m]=0;push(0,t*3+m)}
  while(hf.length){const[u,du]=pop();if(du>D[u])continue;for(let e=G.off[u];e<G.off[u+1];e++){const v=G.to[e],nd=du+G.wt[e];if(nd<D[v]){D[v]=nd;push(nd,v)}}}
  if(M._df.size>64)M._df.clear();M._df.set(t,D);return D}
function pathHi(M,ax,ay,bx,by,layer){const[sx,sy]=M.nearestWalk(...M.cellOf(ax,ay)),[tx,ty]=M.nearestWalk(...M.cellOf(bx,by)),s=sy*M.W+sx;
  const Ls=M.cross[s]?(layer===1||layer===2?layer:3-M.lowAx[s]):0,d=distField(M,ty*M.W+tx)[s*3+Ls];if(!isFinite(d))return null;
  return (Math.hypot(sx*M.C+M.C/2-ax,sy*M.C+M.C/2-ay)+d*M.C+Math.hypot(bx-(tx*M.C+M.C/2),by-(ty*M.C+M.C/2)))*(1+1e-4)+1}
function pathLen(M,ax,ay,bx,by,layer){const[sx,sy]=M.nearestWalk(...M.cellOf(ax,ay)),[tx,ty]=M.nearestWalk(...M.cellOf(bx,by)),P=astar(M,sx,sy,tx,ty,layer);
  if(!P)return Math.hypot(bx-ax,by-ay)*1.5;let L=0,x=ax,y=ay;for(const q of P){L+=Math.hypot(q[0]-x,q[1]-y);x=q[0];y=q[1]}return L+Math.hypot(bx-x,by-y)}
function move(R,p){
  const M=R.M,dt=CFG.dt;const spd=CFG.speed/M.upx*dt;
  const still0=p.x,still1=p.y;
  // stop for at skyde (medmindre swing eller defuse)
  if(p.fighting&&!p.swing){p.still+=dt;return}
  if(R.plant&&R.plant.p===p){p.still+=dt;return}
  if(R.defuse&&R.defuse.p===p){p.still+=dt;return}
  // særlige mål
  if(p.side==='T'){
    if(R.dropped&&!R.planted&&!p.bomb){const c=teamOf(R,'T').filter(q=>!R.waitH.T.includes(q)).sort((a,b)=>dist(a,R.dropped)-dist(b,R.dropped))[0];
      if(c===p){if(dist(p,R.dropped)<M.C){p.bomb=true;R.dropped=null;p.mode='bomb'}else return walkTo(R,p,R.dropped.x,R.dropped.y,spd)}}
    if(p.bomb&&!R.planted){const s=M.siteAt(p.x,p.y);if(s===R.site){if(!R.plant&&!p.fighting){R.plant={p,left:CFG.plantTime}}return}
      if(p.mode==='bomb'||p.ri>=p.route.length){p.mode='bomb';const rc=M.J.sites[R.site].rect;return walkTo(R,p,(rc[0]+rc[2])/2,(rc[1]+rc[3])/2,spd)}}
    /* CT desarmerer: T hører det og går mod den, der desarmerer, for at stoppe ham (gælder også gemte T) */
    if(R.planted&&R.defuse&&R.defuse.p.alive){const d=R.defuse.p;p.holdDir=angTo(p,d.x,d.y);p.heard={x:d.x,y:d.y,t:R.t};
      /* går kun frem, til han kan se bomben – derfra skyder han på den, der desarmerer, i stedet for at løbe hen på bomben */
      const bc=Math.floor(R.bomb.y/M.C)*M.W+Math.floor(R.bomb.x/M.C);if(!canSee(R,{ci:cellIdx(M,p),layer:p.layer||0},{ci:bc,layer:0}))walkTo(R,p,d.x,d.y,spd);else p.still+=dt;
      if(!p.fighting)p.faceT=angTo(p,d.x,d.y);return}
    if(R.planted){p.holdDir=angTo(p,R.bomb.x,R.bomb.y);if(p.ri>=p.route.length||dist(p,R.bomb)>M.C*28){const pt=ppSpot(R,p);if(pt){if(Math.hypot(p.x-pt[0],p.y-pt[1])>M.C*0.8)return walkTo(R,p,pt[0],pt[1],spd)}else if(dist(p,R.bomb)>M.C*10)return walkTo(R,p,R.bomb.x+(p.k-2)*14,R.bomb.y+(p.k%2?18:-18),spd)}}
  }else{
    if(R.planted){/* tæt nok på bomben: under 0,9 felt, eller fremme ved nærmeste gangbare felt, hvis bomben ligger, hvor man ikke kan gå (kant/kasse) */const atB=dist(p,R.bomb)<M.C*0.9||(dist(p,R.bomb)<M.C*3&&p.goal&&p.goal[0]===R.bomb.x&&p.goal[1]===R.bomb.y&&p.pi>=p.path.length);
      if(atB&&!(R.defuse&&R.defuse.p!==p)){if(!R.defuse&&!p.fighting){const dt0=CFG.defuseTime*(p.ref&&p.ref.kit?0.5:1);R.defuse={p,left:dt0,tot:dt0}}return}// kit halverer desarmeringstiden
      const cs=ctClear(R,p,spd);if(cs){walkTo(R,p,cs[0],cs[1],spd);if(!p.fighting)p.faceT=angTo(p,cs[0],cs[1]);return}
      /* kun én CT går hen til bomben, mens der er T tilbage: de andre stopper ca. 6 felter fra bomben og dækker ham (kigger udad) */
      if(teamOf(R,'T').length){const me=R.defuse?R.defuse.p:teamOf(R,'CT').reduce((a,b)=>dist(a,R.bomb)<=dist(b,R.bomb)?a:b);
        if(me!==p){if(dist(p,R.bomb)>M.C*6)return walkTo(R,p,R.bomb.x,R.bomb.y,spd);p.still+=dt;p.holdDir=angTo(R.bomb,p.x,p.y);faceHold(R,p);return}}
      return walkTo(R,p,R.bomb.x,R.bomb.y,spd)}
  }
  // rute
  if(p.ri>=p.route.length){p.still+=dt;faceHold(R,p);return}
  const o=p.route[p.ri];
  if(!p.arrivedAt&&o.at&&R.t<o.at){p.still+=dt;if(o.dir)p.holdDir=angTo(p,o.dir[0],o.dir[1]);faceHold(R,p);return}
  if(!p.arrivedAt){if(walkTo(R,p,o.x,o.y,spd)){p.arrivedAt=R.t;p.still=0;if(o.dir)p.holdDir=angTo(p,o.dir[0],o.dir[1]);
      if(o.t==='wait'&&!R.waitH[p.side].includes(p))R.waitH[p.side].push(p)}return}
  // står i punktet
  p.still+=dt;faceHold(R,p);
  if(o.t==='wait')return;// waitpoint-spilleren bliver, til han dør
  if(o.t==='sync'&&!R.waitH[p.side].includes(p)){if(o.wf){const h=R.P.find(q=>q.side===p.side&&q.k===o.wf-1);if(h&&h.alive&&(R.waitH[p.side].includes(h)||h.route.slice(h.ri).some(z=>z.t==='wait')))return}else if(R.waitH[p.side].some(h=>h.alive))return}/* wf: syncpointet venter kun på waitpoint-spilleren med den position */// de andre venter ved deres syncpoints (ikke waypoints), så længe en waitpoint-spiller på holdet lever
  // syncpoint: venter, til alle holdkammerater med et tilsvarende syncpoint er fremme (spillere uden syncpoint ignoreres, døde tæller ikke).
  // Først derefter tælles sync-tiden – alle tæller fra samme øjeblik og går videre, når deres egen tid er gået.
  if(o.t==='sync'){const all=syncReady(R,p);if(all===false)return;if(R.t-all<(o.sw||0)-1e-6)return}
  p.ri++;p.arrivedAt=null;p.goal=null;p.syncAllAt=null;
  if(p.ri>=p.route.length&&o.dir==null)p.holdDir=p.faceT!=null?p.faceT:p.face;
}
function faceHold(R,p){if(p.fighting)return;if(p.hurtBy&&R.t<p.hurtBy.until){p.faceT=angTo(p,p.hurtBy.x,p.hurtBy.y);return}if(p.heard&&R.t-p.heard.t<2.5){p.faceT=angTo(p,p.heard.x,p.heard.y);return}if(p.holdDir!=null)p.faceT=p.holdDir}
function walkTo(R,p,x,y,spd){
  if(!p.goal||p.goal[0]!==x||p.goal[1]!==y)setGoal(R,p,x,y);
  let left=spd;p.still=0;p.mvT=R.t;
  while(left>0&&p.pi<p.path.length){const[tx,ty]=p.path[p.pi];const d=Math.hypot(tx-p.x,ty-p.y);
    if(d<=left){p.x=tx;p.y=ty;left-=d;p.pi++}else{p.x+=(tx-p.x)/d*left;p.y+=(ty-p.y)/d*left;left=0}}
  if(p.hurtBy&&!p.fighting)p.faceT=angTo(p,p.hurtBy.x,p.hurtBy.y);else if(!p.fighting){const nx=p.x-p.px,ny=p.y-p.py;if(nx||ny)p.faceT=Math.atan2(ny,nx)}
  {const M=R.M;if(M.hasCross){const k=Math.floor(p.y/M.C)*M.W+Math.floor(p.x/M.C);if(M.cross[k]){const nx=p.x-p.px,ny=p.y-p.py;if(nx||ny)p.layer=Math.abs(nx)>=Math.abs(ny)?1:2}else p.layer=0}}
  return p.pi>=p.path.length;
}
const _step=step;
// ingen automatiske rotationer eller site-skift: kun taktikkens waitpoints styrer, hvornår spillerne går videre
function stepAll(R){_step(R)}
function simulate(M,opt){const R=newRound(M,opt);let n=0;while(!R.over&&n<20000){stepAll(R);n++}return R}

// ---------- kamp: 24 runder, sideskift efter 12, økonomi som i den gamle motor ----------
function newMatch(M,opt){const r=rng(opt.seed||1);
  const teams=[{name:opt.nameA||'Hold A',pl:opt.teamA||randomTeam(r,'T',70)},{name:opt.nameB||'Hold B',pl:opt.teamB||randomTeam(r,'CT',70)}];
  teams.forEach(t=>{t.money=t.pl.map(()=>ECON.start);t.eq=t.pl.map(()=>({gun:null,pis:null,armor:0,helm:false,he:0}));t.ls=0;
    t.snip=t.pl.map((p,i)=>i).sort((a,b)=>t.pl[b].sk.aim-t.pl[a].sk.aim)});
  return{M,r,teams,round:0,score:[0,0],log:[],seed:opt.seed||1,over:false}}
const sideOf=(m,ti)=>(m.round<ECON.half)===(ti===0)?'T':'CT';
function buyTeam(m,ti){const t=m.teams[ti],side=sideOf(m,ti),SW=SIDEW[side],R1=SW.R1,R2=SW.R2;const P=t.eq,$=t.money;
  if(m.round===0||m.round===ECON.half){P.forEach((e,i)=>{if($[i]>=PRICE.kevlar){$[i]-=PRICE.kevlar;e.armor=100}});return'pistol'}
  const has=i=>P[i].gun;
  if(!P.every((e,i)=>has(i)||$[i]>=PRICE[R2])){
    const need=i=>PRICE.smg+(P[i].armor?0:PRICE.kevlar);if(!P.every((e,i)=>has(i)||$[i]>=need(i)))return'eco';
    P.forEach((e,i)=>{if(e.gun)return;const k=e.armor?0:PRICE.kevlar,g=$[i]>=PRICE[R1]+k?R1:$[i]>=PRICE[R2]+k?R2:'smg';$[i]-=PRICE[g]+k;e.gun=g;e.armor=100;if($[i]>=PRICE.helm&&!e.helm){$[i]-=PRICE.helm;e.helm=true}});return'force'}
  P.forEach((e,i)=>{if(!e.gun)return;const full=PRICE[R1]+(e.armor?0:PRICE.kevlar)+(e.helm?0:PRICE.helm);if(e.gun==='smg'&&$[i]>=PRICE[R1]||e.gun===R2&&$[i]>=full)e.gun=null});
  let sn=P.some(e=>e.gun==='sniper');
  for(const i of t.snip){const e=P[i];for(const[g0,k,h,he]of PR){const g=g0==='R1'?R1:g0==='R2'?R2:g0;
      if(e.gun?e.gun!==g:(g==='smg'||g==='sniper'&&sn))continue;
      const c=(e.gun?0:PRICE[g])+(k&&e.armor<100?PRICE.kevlar:0)+(h&&!e.helm?PRICE.helm:0)+(he&&!e.he?PRICE.he:0);if($[i]<c)continue;
      $[i]-=c;if(!e.gun){e.gun=g;if(g==='sniper')sn=true}if(k)e.armor=100;if(h)e.helm=true;if(he)e.he=1;break}}
  return'standard'}
// sidens våben skifter ved sideskift (AK ↔ M4 osv.)
const SWAP={ak47:'m4a4',m4a4:'ak47',galil:'famas',famas:'galil',glock:'p2000',p2000:'glock'};
function startMatchRound(m,tTac,ctTac){
  if(m.round===ECON.half)m.teams.forEach(t=>{t.money=t.pl.map(()=>ECON.start);t.eq.forEach(e=>{e.gun=null;e.pis=null;e.armor=0;e.helm=false;e.he=0});t.ls=0});
  const buys=[buyTeam(m,0),buyTeam(m,1)];const tI=sideOf(m,0)==='T'?0:1,cI=1-tI;
  const lo=ti=>m.teams[ti].eq.map(e=>({gun:e.gun,pis:e.pis,armor:e.armor,helm:e.helm,he:e.he}));
  const R=newRound(m.M,{seed:m.seed*1000+m.round+1,tTac,ctTac,teamT:m.teams[tI].pl,teamCT:m.teams[cI].pl,loadout:{T:lo(tI),CT:lo(cI)}});
  R.match={tI,cI,buys:{T:buys[tI],CT:buys[cI]}};return R}
function endMatchRound(m,R){const{tI,cI}=R.match,wI=R.winner==='T'?tI:cI;m.score[wI]++;m.log.push({round:m.round+1,winner:R.winner,why:R.why,buys:R.match.buys});
  for(const ti of[tI,cI]){const t=m.teams[ti],side=ti===tI?'T':'CT',won=ti===wI;
    if(won)t.ls=Math.max(0,t.ls-1);else t.ls=Math.min(ECON.loss.length-1,t.ls+1);
    const lb=ECON.loss[Math.max(0,t.ls-1)];
    R.P.filter(p=>p.side===side).forEach(p=>{const e=t.eq[p.k];t.money[p.k]=Math.min(ECON.max,t.money[p.k]+(won?ECON.win:lb)+p.kills*ECON.kill);
      if(p.alive){e.gun=p.gun?p.gun.type:null;e.pis=p.pis&&p.pis.type!==SIDEW[side].P?p.pis.type:null;e.armor=Math.round(p.armor);e.helm=p.helm&&p.armor>0;e.he=p.he}
      else{e.gun=null;e.pis=null;e.armor=0;e.helm=false;e.he=0}})}
  m.round++;
  if(m.round===ECON.half)m.teams.forEach(t=>t.eq.forEach(e=>{if(e.gun&&SWAP[e.gun])e.gun=SWAP[e.gun]}));
  if(m.score[0]>ECON.half||m.score[1]>ECON.half||m.round>=ECON.rounds)m.over=true}
function simulateMatch(M,opt){const m=newMatch(M,opt);const tl=Object.keys(TACT.T),cl=Object.keys(TACT.CT);
  while(!m.over){const tt=opt.tTac||tl[Math.floor(m.r()*tl.length)],ct=opt.ctTac||cl[Math.floor(m.r()*cl.length)];const R=startMatchRound(m,tt,ct);let n=0;while(!R.over&&n<20000){stepAll(R);n++}endMatchRound(m,R)}return m}

root.CSM2D={W,PRICE,ECON,newMatch,startMatchRound,endMatchRound,simulateMatch,sideOf,CFG,makeMap,newRound,step:stepAll,simulate,TACT,SK,rng,astar,canSee};
})(typeof window!=='undefined'?window:globalThis);
