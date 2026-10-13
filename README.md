# Basttle!

Offline webová hra na čtverečkovaném papíře a samostatný editor levelů. Projekt nepoužívá framework ani externí knihovny.

## Spuštění

Není potřeba nic instalovat ani spouštět na serveru. Otevři v prohlížeči soubor `index.html`; samostatný editor otevřeš souborem `editor.html`. Obě stránky jsou statické a jejich základní funkce běží přímo z disku.

Service worker, offline cache hostované verze a instalace jako PWA vyžadují HTTPS nebo `localhost`. Pokud chceš tyto funkce lokálně vyzkoušet, můžeš použít libovolný statický HTTP server; není to ale podmínka pro spuštění hry. Projekt lze také nasadit na GitHub Pages.

## Co lze aktuálně hrát

Hra se při otevření zobrazí přes hlavní menu. Aktuálně lze spustit **Puzzle – level 1 „První let“**. Ostatních devět puzzle levelů je zatím pouze v nabídce. Arcade, Campaign a Multiplayer mají obrazovky s návrhem nastavení, ale jejich tlačítka pro spuštění jsou vypnutá; jejich vlastní herní pravidla, nepřátelská AI, větvení kampaně a multiplayer ještě nejsou implementované.

### Pohyb, vzlet a přistání

- Letadlo začíná uprostřed pět polí dlouhé vodorovné dráhy. Před prvním tahem lze změnit její orientaci.
- Obrys možností pohybu má rozměr 2 × 2 polí. Kliknutím nebo klepnutím lze zvolit jeden z devíti průsečíků kolem předpokládaného bodu dalšího tahu. Vektor tahu se přenáší na aktuální pozici; letadlo za sebou kreslí stopu.
- V BASICu se výška nemění. V ADVANCE lze při podržení a tažení na vybraném bodu změnit výšku o jeden stupeň nahoru nebo dolů. Výška je omezena na 0 až 10; výška 0 mimo letiště znamená havárii.
- Vzlet probíhá z letiště zrychlením. Let rychlostí 1 mimo bezpečné přistání znamená havárii. Přistání vyžaduje zpomalení z rychlosti 2 na 1 ve směru dráhy a následné zastavení na dráze.
- Pohyb letadla je animovaný a kamera jej sleduje. Ovládání funguje myší i dotykem; plochu lze posouvat a přibližovat. Tlačítko **Celá cesta** zobrazí trasu.
- Hranice mapy jsou na souřadnicích −15 až +15. Jejich překročení znamená konec hry.

### Střelba, cíle a kolize

- Tlačítko **FIRE** přepne do režimu střelby. Útočná výseč má dostřel 3 pole a šířku 3 pole na konci. Výběr cíle zároveň posune letadlo vpřed podle předchozího vektoru.
- Domek má hodnotu 1 bod; auta, nákladní auta a loď jsou pohyblivé cíle za 2 body. Pohyblivé cíle se po tahu posunou podle svého vektoru. V aktuálním levelu jejich opuštění mapy samo o sobě neukončuje hru.
- Hora má výšku 5, mrakodrap 3 a větrná elektrárna 2. Letadlo havaruje, když jeho dráha narazí do grafiky překážky, která dosahuje do jeho letové výšky. Domek má výšku 0. Strategické cíle za 10 bodů a zásah jiného letadla za 3 body jsou připravené hodnoty; takové cíle zatím nejsou součástí hratelného levelu.
- Level začíná s 999 palivovými jednotkami a 999 kusy munice. Každý tah spotřebuje jedno palivo; po jeho vyčerpání letadlo havaruje. Při nulové munici nelze střílet.

### Počasí

Počasí lze zvolit před prvním tahem. Výchozí je **Slunečno**.

- **Noc:** viditelnost tvoří výseč před letadlem, dlouhá 5 polí a široká 3 pole na konci.
- **Bouřka:** viditelnost je omezena na kruh o poloměru 5 polí.
- **Vítr:** cíl tahu se náhodně posune o jedno políčko v jednom z osmi směrů. Vítr se neuplatní, pokud tah začíná na dráze nebo na ní končí, aby nenarušil vzlet či přistání.

### Ovládání a ukládání

- **Zpět** vrátí poslední tah včetně spotřeby paliva, munice, skóre a stavu pohyblivých cílů.
- **↻** otevře potvrzení restartu levelu; tlačítko ☰ otevře hlavní menu.
- Rozpracovaná hra i volby se ukládají v `localStorage` prohlížeče na daném zařízení.

## Editor levelů

Editor je samostatná stránka `editor.html`; lze ji používat bez připojení po načtení aplikace. Změny se průběžně ukládají do lokálního úložiště prohlížeče.

V editoru lze:

- Nastavit název levelu, rozměry mřížky (liché hodnoty od 9 do 101), počet hráčů a libovolnou kombinaci režimů Puzzle, Arcade a Multiplayer.
- Umisťovat doplňkovou grafiku: vodní plochy, lesy, vesnice, města, řeky a mosty.
- Vkládat objekty: domky, hory, mrakodrapy, větrné elektrárny, letiště s nastavitelným směrem a délkou, letadlové lodě, nepřátelská letadla, vozidla, lodě a strategické cíle. Objekt lze vybrat klepnutím a odstranit tlačítkem nebo gumou.
- Přidávat typy letadel s vlastním názvem, rozměrem obrysu, změnou výšky za tah, dostřelem, municí a pohyblivostí. Výchozí typ je F-16.
- Generovat náhodnou mapu. Hustota určuje přibližný počet překážek na 100 polí. Generátor vytvoří letiště uprostřed mapy, náhodné překážky a terén a nastavený počet nepřátelských letadel.
- Exportovat level do JSON, zkopírovat jeho JSON do schránky nebo načíst JSON ze souboru.

Exportovaná data obsahují verzi schématu, rozměry mřížky, počet hráčů, režimy, objekty, typy letadel a nastavení generátoru. **Herní aplikace zatím exportované levely nenačítá**; editor tedy slouží k tvorbě a ukládání dat, která bude potřeba následně propojit s herním runtime.

## Co lze ručně vyzkoušet

1. Otevři hlavní menu, vyber Puzzle → level 1 a proveď vzlet z vodorovné dráhy.
2. Vyzkoušej výběr bodů myší nebo dotykem, posun a přiblížení mapy, vrácení tahu a restart.
3. Přepni mezi BASIC a ADVANCE ještě před prvním tahem; v ADVANCE podrž bod a táhni nahoru nebo dolů.
4. Změň počasí před prvním tahem a porovnej viditelnost. Ve větru ověř, že tah z dráhy nebo na dráhu není odkloněn.
5. Zapni střelbu, přibliž se k cíli a zkus zasáhnout objekt v útočné výseči.
6. Otevři `editor.html`, změň velikost mapy, umísti objekty, vytvoř typ letadla, vygeneruj mapu a exportuj JSON.

## Soubory

- `index.html`, `style.css`, `app.js` – hra a její hlavní menu.
- `editor.html`, `editor.css`, `editor.js` – samostatný editor a generátor levelů.
- `manifest.webmanifest`, `sw.js` – instalace jako webová aplikace a offline cache.

## Licence

Projekt je šířen pod licencí **GNU General Public License v2.0 nebo, dle volby příjemce, jakoukoli pozdější verzí** (`GPL-2.0-or-later`). Úplné znění licence je v souboru [`LICENSE`](LICENSE). Licence umožňuje software používat, upravovat a dále šířit za podmínek GPL.
