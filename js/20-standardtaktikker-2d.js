const std2dGet=(map,n)=>{const S=STD2D[map];if(!S)return null;for(const sd in S){const x=S[sd].find(t=>t.name===n);if(x)return x}return null};
/* dust2: dine taktikker erstatter de gamle standarder; andre maps: tilføjes til de gamle, indtil sættet er komplet */
const STD2D_REPL={dust2:1,aztec:1,inferno:1};/* 1 = dine standarder erstatter de gamle på begge sider; {CT:1} = kun den side */
for(const map in STD2D)for(const sd in STD2D[map]){const m=MAPS[map],L=STD2D[map][sd],D=sd==='T'?m.tdesc:m.cdesc;m.tn[sd]=(STD2D_REPL[map]===1||(STD2D_REPL[map]&&STD2D_REPL[map][sd]))?L.map(t=>t.name):(m.tn[sd]||[]).filter(n=>!L.some(t=>t.name===n)).concat(L.map(t=>t.name));
  L.forEach(t=>{const R=t.zones.map(w=>w.split(',').map(z=>{const[a,at]=z.split('@');return at?['='+a,+at]:['='+a]}));m.tac[t.name]=()=>JSON.parse(JSON.stringify(R));
    if(sd==='T')TSITE[t.name]=t.site;STYLE[t.name]=t.style||'M';
    D[t.name]=t.zones.map((w,k)=>{const zs=w.split(',').map(z=>z.split('@')[0]).filter((z,i,a)=>z!==a[i-1]),nm=z=>(m.zname&&m.zname[z])||z,via=zs.slice(0,-1).map(nm),to=nm(zs[zs.length-1]);
      return (via.length?'Går via '+via.join(', ').replace(/, ([^,]*)$/,' og $1')+' til '+to+'.':'Går til '+to+'.')+(sd==='T'&&k===1?' Bærer bomben og planter på '+(t.site||'A')+'-site.':'')})})}
/* gemte biblioteker/udvalg med de gamle standardnavne ryddes op; mappets standardtaktikker lægges i biblioteket én gang */
for(const map in STD2D)delete TXM[map];
try{if(typeof WD!=='undefined'&&WD)for(const map in STD2D)for(const sd in STD2D[map]){WD.ulib=WD.ulib||{};const U=WD.ulib[map]=WD.ulib[map]||{};const f='std2d_'+sd;const done=Array.isArray(U[f])?U[f]:(U[f]?STD2D[map][sd].slice(0,5).map(t=>t.name):[]);const nw=STD2D[map][sd].filter(t=>!done.includes(t.name));if(!nw.length)continue;U[f]=done.concat(nw.map(t=>t.name));const L=ulGet(map,sd);for(const t of nw)if(!L.includes(t.name)&&L.length<UL.max)L.push(t.name);ulClean(map,sd)}}catch(e){console.error('std2d',e)}

/* 11. nov.: målrettet afprøvning – et modsvar testes kun, når holdet forventer, at modstanderen spiller måltaktikken (modstanderens planlagte liste, ellers ligaens meta). Gode taktikere genkender det oftere. */
{const _chT=txChoose;txChoose=function(d,map,sd,opp){const L=_chT(d,map,sd,opp);try{const c=d.tc&&d.tc[map]&&d.tc[map][sd],tg=d.tct&&d.tct[map]&&d.tct[map][sd];
   if(c&&tg){const li=txLiOf(d)[0],os=sd==='T'?'CT':'T',q=tcq(d),exp=opp&&opp.length?opp:txMeta(li,map,os),hit=exp.includes(tg),sees=txR()<.5+.5*q;
     const i=L.indexOf(c);
     if(sees&&!hit&&i>=0){const alt=d.tl[map][sd].filter(n=>!L.includes(n)&&n!==c&&txInfo(map,sd,n));if(alt.length)L[i]=alt[0];else L.splice(i,1);WD.txSkip=(WD.txSkip||0)+1}
     else if(sees&&hit&&i<0){const SP=(d.tsp&&d.tsp[map]&&d.tsp[map][sd])||{};if(L.length>=TXC.sel){let j=-1;for(let k=L.length-1;k>=0;k--)if(!SP[L[k]]){j=k;break}if(j>=0)L[j]=c}else L.push(c)}}}catch(e){console.error('txChooseT',e)}return L}}
