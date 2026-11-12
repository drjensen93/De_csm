/* ===== 24: kampvisning – beskeder og pause-stats som overlay i 2D-visningen (12. nov.) =====
   Tekstboksen under kortet bruges ikke. Beskederne (drab, plant, defuse …) vises i øverste højre hjørne af 2D-visningen
   og forsvinder efter 4 sekunder (rigtig tid) eller ved ny runde. Står kampen på pause, vises stats som et gennemsigtigt overlay. */
(function(){
  const FEED_MS=4000;
  const css=document.createElement('style');
  css.textContent=`#e2feed{position:absolute;top:6px;right:6px;max-width:72%;display:flex;flex-direction:column;align-items:flex-end;gap:3px;pointer-events:none;z-index:2}
#e2feed div{background:rgba(12,15,20,.72);color:#fff;font-size:12px;line-height:1.3;padding:3px 7px;border-radius:3px;text-align:right;transition:opacity .4s}
#e2feed div.ct b,#e2feed div.ct .k{color:#7cc0ff}#e2feed div.t b,#e2feed div.t .k{color:#ffc76a}
#e2feed .ct{color:#7cc0ff}#e2feed .t{color:#ffc76a}
#e2stats{position:absolute;inset:0;display:none;background:rgba(12,15,20,.72);color:#fff;font-size:12px;padding:10px;overflow:auto;z-index:3}
#e2stats h4{margin:0 0 8px;font-size:15px;text-align:center}
#e2stats table{width:100%;border-collapse:collapse;margin-bottom:10px}
#e2stats th,#e2stats td{padding:3px 4px;text-align:right;border-bottom:1px solid rgba(255,255,255,.15);white-space:nowrap}
#e2stats th:first-child,#e2stats td:first-child{text-align:left}
#e2stats .tn{font-weight:700;font-size:13px;text-align:left}
#e2stats .dead{opacity:.45}`;
  document.head.appendChild(css);
  const wrapEl=()=>document.getElementById('e2w');
  function els(){const w=wrapEl();if(!w)return null;let f=document.getElementById('e2feed'),s=document.getElementById('e2stats');
    if(!f){f=document.createElement('div');f.id='e2feed';w.appendChild(f)}
    if(!s){s=document.createElement('div');s.id='e2stats';w.appendChild(s)}
    return{f,s}}
  function clearFeed(){const f=document.getElementById('e2feed');if(f)f.innerHTML=''}
  function addFeed(c,h){const e=els();if(!e)return;const d=document.createElement('div');d.className=c||'';
    d.innerHTML=String(h).replace(/ \(\d+\/\d+\/\d+\)/g,'');e.f.appendChild(d);while(e.f.children.length>6)e.f.firstChild.remove();
    setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),420)},FEED_MS)}
  // log: beskeder, der kommer igennem feed-filteret, vises også i overlayet
  {const _lg=log;log=function(c,h){const r=_lg.apply(this,arguments);try{if(M&&!M.quiet&&typeof FEEDOK!=='undefined'&&FEEDOK.test(String(h)))addFeed(c,h)}catch(e){}return r}}
  // ny runde / ny kamp: teksten forsvinder
  {const _sr=startRound;startRound=function(){clearFeed();return _sr.apply(this,arguments)}}
  {const _nm=newMatch;newMatch=function(){clearFeed();return _nm.apply(this,arguments)}}
  // pause: stats som overlay
  let lastKey='';
  function statsHTML(){const pr=(R&&R.e2&&R.e2.P)||[],hp=p=>{const e=pr.find(q=>q.ref===p);return e?Math.max(0,Math.round(e.hp)):(p.alive?100:0)};
    const[a,b]=M.score;let h=`<h4>${M.teams[0].name} ${a} – ${b} ${M.teams[1].name}</h4>`;
    for(const t of M.teams){const col=t.side==='CT'?'#7cc0ff':'#ffc76a';
      h+=`<table><tr><th class="tn" style="color:${col}">${t.name} · ${t.side}</th><th>K</th><th>D</th><th>A</th><th>HP</th><th>$</th></tr>`;
      for(const p of t.ps.slice().sort((x,y)=>y.k-x.k||x.d-y.d)){const v=hp(p);h+=`<tr class="${v>0?'':'dead'}"><td>${p.name}</td><td>${p.k}</td><td>${p.d}</td><td>${p.a}</td><td>${v}</td><td>${p.money}</td></tr>`}
      h+='</table>'}
    return h}
  setInterval(()=>{const e=els();if(!e)return;const on=typeof paused!=='undefined'&&paused&&M&&!M.quiet&&VIEW==='mv';
    if(!on){if(e.s.style.display!=='none')e.s.style.display='none';lastKey='';return}
    const h=statsHTML();if(h!==lastKey){e.s.innerHTML=h;lastKey=h}if(e.s.style.display!=='block')e.s.style.display='block'},250);
})();
