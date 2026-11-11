// Røgtest: spillet indlæses uden fejl, og et antal kampdage kan simuleres på alle maps.
// Brug: node test/smoke.js [dage]   (standard 8)
const {loadGame}=require('./lib');
(async()=>{const days=+process.argv[2]||8;const g=await loadGame({seed:1});
  g.w.eval(`{const _e=console.error;console.error=(...a)=>{window.__ERR=(window.__ERR||[]);window.__ERR.push(a.map(x=>String(x&&x.stack||x).split('\\n')[0]).join(' '));_e(...a)}}`);
  let matches=0;for(let d=0;d<days;d++){if(g.w.eval('simDayRun()'))matches+=8}
  // et par kampe på hvert map
  for(const m of ['dust2','aztec','inferno'])g.w.eval(`simMatch([WD.lg[0].teams[0].def,WD.lg[0].teams[1].def],false,'${m}')`);
  for(const f of ['renderLeague','renderTactics','renderFaq'])try{g.w.eval(f+'()')}catch(e){g.errors.push(f+': '+e.message)}
  const errs=g.errors.concat(g.w.eval('window.__ERR||[]'));
  console.log(`${days} dage, ${matches+3} kampe, ${errs.length} fejl`);errs.slice(0,10).forEach(e=>console.log('  '+e));
  g.close();process.exit(errs.length?1:0)})();
