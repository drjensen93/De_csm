// Fælles hjælpere til tests: indlæser spillet uden browser (jsdom) og simulerer dage i én liga.
const {JSDOM,VirtualConsole}=require('jsdom');const path=require('path');
function seeded(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
async function loadGame({file=path.join(__dirname,'..','index.html'),seed=null}={}){
  const vc=new VirtualConsole(),errors=[];
  vc.on('jsdomError',e=>errors.push(String(e.message||e).slice(0,300)));
  vc.on('error',(...a)=>errors.push(a.map(x=>String(x&&x.stack||x).split('\n')[0]).join(' ').slice(0,300)));
  const dom=await JSDOM.fromFile(file,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){if(seed!=null)w.Math.random=seeded(seed);
      // file://-sider har ikke localStorage i jsdom: brug et lager i hukommelsen, så gem/indlæs kan testes
      const m=new Map();Object.defineProperty(w,'localStorage',{configurable:true,value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v))},removeItem:k=>{m.delete(k)},clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size}}})}});
  await new Promise(r=>dom.window.addEventListener('load',r));
  const w=dom.window;
  // Simuleringsopsætning: alle 16 hold i den valgte liga er AI-hold (dit eget hold flyttes til en liga, der ikke simuleres).
  // CL-kampe får et tilfældigt resultat uden at blive spillet, så kun ligaens egne kampe påvirker metaen.
  w.eval(`var SIM={li:0,maps:null};WD.needSp=false;WD.needName=false;WD.me={li:23,ti:0};TEAMS[0]=WD.lg[23].teams[0].def;TXLI=null;
   function simForceMaps(){if(SIM.maps)WD.rotOver={s:WD.season,m:SIM.maps}}
   function simDayRun(){const r=dayRound(WD.day),g=WD.lg[SIM.li];KC=!!r;CLM=false;
    if(r)for(const [h,a] of g.fix[r-1]){const s=simMatch([g.teams[h].def,g.teams[a].def],false,lgMap(r));g.res.push({h,a,hs:s[0],as:s[1],rd:r})}
    for(const x of clList(WD.day))if(!x.m.res)x.m.res=rnd()<.5?[13,8]:[8,13];
    const s0=WD.season;endDay();if(WD.season!==s0)simForceMaps();return r}`);
  return{w,errors,close:()=>w.close()};
}
module.exports={loadGame,seeded};
