// Metasimulering: kører en liga i flere sæsoner og skriver, hvordan taktikmetaen udvikler sig pr. map og side.
// Brug: node test/meta.js [sæsoner] [map1,map2] [frø]
//   fx  node test/meta.js 6 dust2,dust2     (kun dust2 i 6 sæsoner)
//       node test/meta.js 3 dust2,aztec 42
// Udskriver pr. sæson: andel runder med nye taktikker, heraf fra holdenes biblioteker, sidens vundne runder,
// og nye taktikker, der bruges i mindst 5 % af runderne. Gemmer rådata i out/meta-<tid>.json.
const {loadGame}=require('./lib');const fs=require('fs'),path=require('path');
(async()=>{const NS=+process.argv[2]||3,maps=(process.argv[3]||'dust2,aztec').split(','),seed=process.argv[4]!=null?+process.argv[4]:null;
  const g=await loadGame({seed});const w=g.w;
  w.eval(`SIM.maps=${JSON.stringify(maps)};simForceMaps();var OUT={seasons:[]};
   {const _se=seasonEnd;seasonEnd=function(){const L=SIM.li,o={season:WD.season,maps:{}};
     for(const m of new Set(SIM.maps)){o.maps[m]={};for(const sd of ['T','CT']){const U=Object.assign({},WD.tu&&WD.tu[L]&&WD.tu[L][m]&&WD.tu[L][m][sd]),K=WD.tk&&WD.tk[L]&&WD.tk[L][m]||{};
       let sw=0,sn=0;for(const k in K){const e=K[k];sw+=sd==='T'?e[1]-e[0]:e[0];sn+=e[1]}
       const lib=new Set();WD.lg[L].teams.forEach(t=>{const Lb=t.def.tl&&t.def.tl[m]&&t.def.tl[m][sd]||[];Lb.forEach(n=>{if(WD.tx[n])lib.add(n)})});
       o.maps[m][sd]={U,side:sn?sw/sn:null,lib:[...lib],tx:Object.fromEntries(Object.keys(U).filter(n=>WD.tx[n]).map(n=>[n,{o:WD.tx[n].o,ph:WD.tx[n].ph||null}]))}}}
     OUT.seasons.push(o);return _se.apply(this,arguments)}}`);
  const t0=Date.now();while(w.eval('WD.season')<=NS)w.eval('simDayRun()');
  const O=JSON.parse(w.eval('JSON.stringify(OUT)'));
  for(const m of Object.keys(O.seasons[0].maps))for(const sd of ['T','CT']){console.log(`\n${m} ${sd}`);
    for(const S of O.seasons){const x=S.maps[m][sd],tot=Object.values(x.U).reduce((a,b)=>a+b,0)||1;let nye=0,bib=0;
      for(const n in x.U)if(x.tx[n]){nye+=x.U[n];if(x.lib.includes(n))bib+=x.U[n]}
      const big=Object.entries(x.U).filter(([n,v])=>x.tx[n]&&v/tot>=.05).map(([n,v])=>`${n}(${x.tx[n].o}${x.tx[n].ph?','+x.tx[n].ph:''}) ${Math.round(100*v/tot)}%`);
      const top=Object.entries(x.U).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,v])=>`${n} ${Math.round(100*v/tot)}%`);
      console.log(`  S${S.season}: nye ${Math.round(100*nye/tot)}% (bibliotek ${Math.round(100*bib/tot)}%) · ${sd} vinder ${x.side==null?'-':Math.round(100*x.side)+'%'} · top: ${top.join(', ')} · ≥5%: ${big.join(', ')||'ingen'}`)}}
  fs.mkdirSync(path.join(__dirname,'..','out'),{recursive:true});const f=path.join(__dirname,'..','out',`meta-${Date.now()}.json`);fs.writeFileSync(f,JSON.stringify(O));
  console.log(`\n${NS} sæsoner på ${((Date.now()-t0)/1000).toFixed(0)} sek. Rådata: ${path.relative(process.cwd(),f)}`);g.close();process.exit(0)})();
