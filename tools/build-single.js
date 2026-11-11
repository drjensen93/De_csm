// Samler spillet til én HTML-fil (dist/de_csm.html), fx til at lægge op som Claude-artefakt.
// Brug: node tools/build-single.js
const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/,(m,f)=>`<style>\n${fs.readFileSync(path.join(root,f),'utf8')}</style>`);
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>\n?/g)].map(m=>m[1]);
html=html.replace(/<!-- Scripts indlæses[^>]*-->\n/,'').replace(/<script src="[^"]+"><\/script>\n?/g,'');
const js=files.map(f=>`/* ---- ${f} ---- */\n`+fs.readFileSync(path.join(root,f),'utf8')).join('\n');
html=html.replace('</body>',()=>`<script>\n${js.replace(/<\/script/gi,'<\\/script')}</script>\n</body>`);// funktion som erstatning, så $-tegn i koden ikke tolkes
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist','de_csm.html'),html);
console.log(`dist/de_csm.html (${Math.round(html.length/1024)} KB, ${files.length} filer samlet)`);
