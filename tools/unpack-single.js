// Det omvendte af build-single.js: deler en samlet HTML-fil (fx hentet fra Claude-artefaktet) ud i repoets filer igen.
// Kræver, at filen er lavet med build-single.js, så markeringerne /* ---- <fil> ---- */ er bevaret.
// Brug: node tools/unpack-single.js <samlet.html>
// Bagefter tjekkes, at build-single.js giver præcis den samme fil tilbage.
const fs=require('fs'),path=require('path'),cp=require('child_process');const root=path.join(__dirname,'..');
const src=process.argv[2];if(!src){console.error('Brug: node tools/unpack-single.js <samlet.html>');process.exit(1)}
const html=fs.readFileSync(src,'utf8');
const idx=fs.readFileSync(path.join(root,'index.html'),'utf8');
const files=[...idx.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
// CSS
const cssFile=(idx.match(/<link rel="stylesheet" href="([^"]+)">/)||[])[1];
const st=html.match(/<style>\n([\s\S]*?)<\/style>/);if(!st)throw new Error('Fandt ingen <style> i filen');
// scripts
const a=html.indexOf('<script>\n'),b=html.lastIndexOf('</script>');if(a<0||b<0)throw new Error('Fandt intet <script>');
const js=html.slice(a+9,b).replace(/<\\\/script/gi,'</script');
const parts=js.split(/^\/\* ---- (.+?) ---- \*\/\n/m);if(parts[0].trim())throw new Error('Kode før første filmarkering');
const got={};for(let i=1;i<parts.length;i+=2){let t=parts[i+1];if(i+2<parts.length)t=t.replace(/\n$/,'');got[parts[i]]=t}
const miss=files.filter(f=>!(f in got)),extra=Object.keys(got).filter(f=>!files.includes(f));
if(miss.length||extra.length)throw new Error(`Filerne passer ikke med index.html. Mangler: ${miss.join(', ')||'-'}. Ekstra: ${extra.join(', ')||'-'}`);
// sidens øvrige HTML (alt uden for style og script) skal være uændret
// <title> holdes i trit med artefaktets titel af Claude, så den ignoreres
const shell=h=>h.replace(/<title>[^<]*<\/title>/,'').replace(/<style>\n[\s\S]*?<\/style>/,'<style></style>').replace(/<script>\n[\s\S]*<\/script>/,'<script></script>');
const built=path.join(root,'dist','de_csm.html');cp.execFileSync('node',[path.join(__dirname,'build-single.js')],{stdio:'ignore'});
if(shell(fs.readFileSync(built,'utf8'))!==shell(html))console.warn('ADVARSEL: sidens HTML uden for <style>/<script> er ændret – index.html skal opdateres i hånden.');
let n=0;if(cssFile&&fs.readFileSync(path.join(root,cssFile),'utf8')!==st[1]){fs.writeFileSync(path.join(root,cssFile),st[1]);console.log('ændret:',cssFile);n++}
for(const f of files){const p=path.join(root,f);if(fs.readFileSync(p,'utf8')!==got[f]){fs.writeFileSync(p,got[f]);console.log('ændret:',f);n++}}
cp.execFileSync('node',[path.join(__dirname,'build-single.js')],{stdio:'ignore'});
const noT=h=>h.replace(/<title>[^<]*<\/title>/,'');const same=noT(fs.readFileSync(built,'utf8'))===noT(html);
console.log(`${n} fil(er) ændret. Genbygget fil ${same?'er identisk med':'AFVIGER fra'} ${path.basename(src)} (titlen undtaget).`);process.exit(same?0:2);
