# de_csm – Match Engine (2D)

Counter-Strike-manager i browseren: 24 nationale ligaer, Champions League, transfers, økonomi, landshold og en 2D-kampmotor. AI-holdene udvikler selv deres taktikker, så metaen på hvert map ændrer sig over sæsonerne.

Spillet er ren HTML, CSS og JavaScript uden build-trin og uden afhængigheder i browseren.

## Kør spillet

- **Lokalt:** åbn `index.html` i en browser.
- **GitHub Pages:** Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. Spillet ligger derefter på `https://<bruger>.github.io/<repo>/`.

Spillet gemmes i browserens `localStorage` (nøglen `csm_save_v1`). Gemte spil hører til den adresse og browser, spillet køres fra. Andre, der åbner siden, får deres eget spil og kan ikke se eller ændre dit.

**Flyt eller sikkerhedskopiér et spil:** tryk *Eksport* i menuen → *Gem og lav eksport* → kopiér koden eller hent den som fil. Indlæs den samme sted under *Import* (fx på GitHub Pages, i en anden browser eller efter en opdatering, der gik galt). Import overskriver det spil, der er gemt på stedet.

## Struktur

```
index.html                 siden og rækkefølgen, scripts indlæses i
css/style.css              al styling
js/01-…22-*.js             spillet, i den rækkefølge koden er bygget op
js/engine/csm2d.js         2D-kampmotoren (bevægelse, sigtelinjer, skud)
data/maps/*.js             kortdata for dust2, inferno og aztec (fra map-værktøjet)
data/std2d.js              standardtaktikkerne i 2D (STD2D)
test/                      tests, der kører spillet uden browser
tools/build-single.js      samler alt til én HTML-fil
```

### Vigtigt: rækkefølgen

Koden er bygget lag på lag i faser. Senere filer bygger videre på tidligere filer og pakker ofte deres funktioner ind:

```js
{const _gammel=renderLeague;renderLeague=function(){_gammel();/* … mere … */}}
```

Derfor skal filerne indlæses i den rækkefølge, de står i `index.html`. En ny fil, der ændrer eksisterende adfærd, lægges efter de filer, den bygger på, typisk sidst. Alle filer deler det samme globale navnerum (almindelige `<script>`-tags, ikke moduler).

| Fil | Indhold |
|---|---|
| 01-grundlag | konfiguration, de_csm-mappet, våben, grundtaktikker, hjælpere |
| 02-zonemotor | den oprindelige zonebaserede kampmotor (runder, ticks, kampe) |
| 03-ui-taktik-liga | grund-UI, taktikfane, navigation, liga |
| 04-ligaer-og-champions-league | 24 ligaer, kalender, koefficienter, CL |
| 05-hold-traening-oekonomi | nationalitet, lederskab, træning, tryouts, økonomi, AI-lineup |
| 06-specialiteter | spillerspecialiteter m.m. (fase 6) |
| 07-spillervaerdi-personligheder-navne | spillerværdi, personligheder, navnemotor |
| 08-ai-holdbygning-transfer-loen | AI-holdbygning, transfermarked, løn og præmier |
| 09-maps-og-zonekarakter | flere maps, zonernes karakter |
| 10-ranking-teamplay-rapport | power ranking, teamplay, AI's taktiske evne, kamprapport |
| 11-agent-lancamp-flanker | spilleragenter, LAN-camp, flanker |
| 12-taktiklister-og-maps | taktiklister pr. map, map-justeringer |
| 13-ui-media-vaaben | kampvisning, scouts, Hall of Fame, sponsorer, våbenkøb |
| 14-indbakke-spillermodel-landshold | indbakke, aldring, komprimeret gemning, landshold |
| 15-taktik-og-map-justeringer | nye taktikker, defuse kit, opsamling af våben, transit |
| 16-ai-taktikbibliotek | AI-hold med egne taktikbiblioteker, mødte taktikker, taktikbyggeren |
| 17-ui-og-map-finjustering | UI-oprydning, finere zoner, flere modsvar |
| 18-inferno-finere-zoner | inferno-zoner |
| engine/csm2d | 2D-motoren |
| 19-2d-motor-integration-og-ai | kobling af 2D-motoren, AI-byggeklodser, målrettet AI |
| 20-standardtaktikker-2d | indlæsning af standardtaktikkerne i 2D |
| 21-ai-personlighed | holdstil, innovatører/forfinere, pistol- og eco-lister |
| 22-arkiv | arkiv over gamle taktikker |
| 23-eksport-import | eksport og import af gemte spil |

## Tests

Kræver Node 20+.

```
npm install
npm test                         # røgtest: indlæser spillet og spiller nogle kampdage på alle maps
npm run meta -- 6 dust2,dust2    # metasimulering: 6 sæsoner kun på dust2
npm run meta -- 3 dust2,aztec 42 # 3 sæsoner, dust2 og aztec, fast tilfældighedsfrø 42
```

Metasimuleringen kører én liga, hvor alle 16 hold er AI-hold. CL-kampe får et tilfældigt resultat uden at blive spillet. For hver sæson, map og side skrives:

- andelen af runder med nye taktikker, og hvor mange af dem der kommer fra holdenes biblioteker,
- hvor mange runder siden vinder,
- de mest brugte taktikker,
- nye taktikker med mindst 5 % af runderne.

Rådata gemmes i `out/`. En sæson tager 1-2 minutter.

GitHub Actions kører røgtesten ved hvert push (`.github/workflows/test.yml`).

## Én fil

```
npm run build    # → dist/de_csm.html
```

Samler CSS og alle scripts i én HTML-fil, fx til at lægge op som Claude-artefakt. Den samlede fil opfører sig identisk med den opdelte version.
