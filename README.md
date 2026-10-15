# Basttle!

Offline webová hra na čtverečkovaném papíře a samostatný editor levelů. Projekt nepoužívá framework ani externí knihovny.

## Spuštění

Není potřeba nic instalovat ani spouštět na serveru. Otevři v prohlížeči soubor `index.html`; samostatný editor otevřeš souborem `editor.html`. Obě stránky jsou statické a jejich základní funkce běží přímo z disku.

Service worker, offline cache hostované verze a instalace jako PWA vyžadují HTTPS nebo `localhost`. Pokud chceš tyto funkce lokálně vyzkoušet, můžeš použít libovolný statický HTTP server; není to ale podmínka pro spuštění hry. Projekt lze také nasadit na GitHub Pages.

## Co lze aktuálně hrát

Hra se při otevření zobrazí přes hlavní menu. Režim **Tutorial** obsahuje tři lekce: vzlet a přistání, střelbu na statický cíl a střelbu na pohyblivý cíl. Všechny mají 999 paliva, dostatek munice a žádné překážky. V režimu **Puzzle** lze hrát levely 1 až 10, ve kterých je třeba zničit povinné cíle a přistát. Levely 3 až 9 přidávají pohyblivé cíle; desátý level má osm statických cílů v husté síti překážek. **Arcade** je hratelné: každá hra vygeneruje náhodnou mapu, hráč sestřeluje nepřátelská letadla a sbírá skóre. Campaign a Multiplayer mají zatím jen obrazovky s návrhem nastavení; jejich spuštění, větvení kampaně a multiplayer nejsou implementované.

Levely jsou definované v `levels/*.yaml`. Tři výcvikové levely mají 999 jednotek paliva, žádné překážky a první z nich neobsahuje cíle. Každý z prvních sedmi puzzle levelů obsahuje o 10 % více paliva než původní zásoba (zaokrouhleno nahoru): postupně 18, 27, 18, 22, 26, 25 a 29 jednotek. Osmý level má 36 jednotek paliva a čtyři cíle na mapě 25 × 25. Devátý má mapu 31 × 31, 38 jednotek paliva, šest cílů a další překážky. Desátý používá stejně velkou mapu, 70 jednotek paliva, osm statických cílů rozmístěných po dvou u každého rohu a hustou síť 61 překážek, kterou je třeba prolétat. Při úspěšném přistání se zbývající palivo přičte ke skóre; nejlepší skóre každého puzzle levelu se ukládá v prohlížeči a zobrazuje v nabídce Puzzle. První mise má horské štíty tvořící průletový koridor severně od letiště. Druhý level má dva sklady na opačných stranách mapy a překážky v podobě hor, mrakodrapů a větrných elektráren. Levely 3 až 5 procvičují sestřelování pohyblivých aut. Šestý level má mapu 25 × 25 s jezerem na severovýchodě a lodí, která je obkružuje po osmi bodech. Sedmý level zachovává velikost mapy, přesouvá jezero na západ a vyžaduje zničení domu, lodi a auta jedoucího na sever. Osmý rozmísťuje čtyři cíle do různých částí mapy a rozšiřuje počet překážek; devátý tuto sestavu zrcadlí a přidává dvě statické lokace v jihovýchodním rohu. Arcade mapy se vytvářejí při startu hry, obsahují až 36 náhodně rozmístěných překážek a čtyři nepřátelská letadla. AI má tři úrovně: lehká manévruje náhodně, střední pronásleduje hráče a těžká předvídá jeho směr. Stíhačky se samy nestřílí; zničení jedné přidá 3 body a po krátké prodlevě se objeví náhradní. Nejvyšší arcade skóre se ukládá v prohlížeči. Při nasazení na GitHub Pages hra načítá YAML soubory. Při přímém otevření `index.html` z disku použije výchozí definice vložené v aplikaci, protože prohlížeče přes `file://` nedovolují stránce načítat další soubory. Soubor `yaml.js` zajišťuje čtení a export běžné blokové YAML syntaxe bez externích knihoven.

### Arcade

- Každý běh má mapu určenou seedem. Seed zadej v nabídce Arcade; stejné znaky vytvoří stejné překážky a rozložení cílů. Necháš-li pole prázdné, hra vygeneruje seed automaticky a zobrazí ho i během hry.
- Běh končí havárií. Tlačítko **Zpět** se v Arcade nezobrazuje. Zásoby se spotřebovávají během letu; po přistání se doplní na 50 paliva a 10 kusů munice, takže lze pokračovat v témže běhu.
- Skóre se sbírá za statické cíle, projíždějící auta a nákladní vůz, člun i nepřátelská letadla. Nejvyšší skóre se ukládá v tomto prohlížeči.
- Čtyři stíhačky řízené AI manévrují podle zvolené obtížnosti. Mohou havarovat o překážky, opustit mapu nebo se srazit s hráčem; zničené či havarované stíhačky se průběžně nahrazují.

### Pohyb, vzlet a přistání

- Letadlo začíná uprostřed pět polí dlouhé vodorovné dráhy.
- Obrys možností pohybu má rozměr 2 × 2 polí a je vystředěný na předpokládaném bodě dalšího tahu. Kliknutím nebo klepnutím vyber jeden z devíti průsečíků: střed pokračuje stejným vektorem jako minule, okolní body kurz upraví. Vybraný bod je cílová pozice letadla, ne změna vektoru. Letadlo se plynule přesune a za sebou kreslí stopu.
- V BASICu se výška nemění. V ADVANCE lze při podržení a tažení na vybraném bodu změnit výšku o jeden stupeň nahoru nebo dolů. Výška je omezena na 0 až 10; výška 0 mimo letiště znamená havárii.
- Vzlet probíhá z letiště zrychlením. Let rychlostí 1 mimo bezpečné přistání znamená havárii. Přistání má dva tahy: při rychlosti 2 na dráze zpomal na rychlost 1 ve směru dráhy, v dalším tahu zastav na dráze. I zastavení je tah a spotřebuje palivo.
- Pohyb letadla je animovaný a kamera jej sleduje. Ovládání funguje myší i dotykem; plochu lze posouvat a přibližovat. Tlačítko **Celá cesta** zobrazí trasu.
- Hranice mapy jsou definované v YAML levelu. Jejich překročení znamená konec hry.

### Střelba, cíle a kolize

- Tlačítko **FIRE** přepne do režimu střelby. Útočná výseč má dostřel 3 pole a šířku 3 pole na konci. Výběr cíle zároveň posune letadlo vpřed podle předchozího vektoru.
- Cíle a jejich bodové hodnoty určuje YAML levelu. Pohyblivé cíle se po tahu posunou podle svého vektoru; povinné cíle musí být zničeny před přistáním. Pokud level nastaví pro útěk cílů prohru, opuštění mapy kterýmkoli aktivním pohyblivým cílem okamžitě ukončí misi.
- Hora má výšku 5, mrakodrap 3 a větrná elektrárna 2. Letadlo havaruje, když jeho dráha narazí do grafiky překážky, která dosahuje do jeho letové výšky. Domek má výšku 0. První mise obsahuje sklad znázorněný grafikou domku, který se počítá jako strategický cíl za 10 bodů. V Arcade se objevují nepřátelská letadla za 3 body.
- Každý tah spotřebuje jedno palivo; po jeho vyčerpání letadlo havaruje. Při nulové munici nelze střílet.

### Počasí

Pokud to level dovoluje, lze počasí zvolit před prvním tahem. Výchozí je **Slunečno**. První puzzle počasí zamyká.

- **Noc:** viditelnost tvoří výseč před letadlem, dlouhá 5 polí a široká 3 pole na konci.
- **Bouřka:** viditelnost je omezena na kruh o poloměru 5 polí.
- **Vítr:** cíl tahu se náhodně posune o jedno políčko v jednom z osmi směrů. Vítr se neuplatní, pokud tah začíná na dráze nebo na ní končí, aby nenarušil vzlet či přistání.

### Ovládání a ukládání

- **Zpět** vrátí poslední tah včetně spotřeby paliva, munice, skóre a stavu pohyblivých cílů.
- **↻** otevře potvrzení restartu levelu. Tlačítko ☰ zruší rozehranou hru a otevře hlavní menu.
- Po havárii nebo selhání mise se zobrazí přímá volba restartu nebo návratu do submenu aktuálního režimu. Nové otevření stránky začne vždy v menu.

## Editor levelů

Editor je samostatná stránka `editor.html`; lze ji používat bez připojení po načtení aplikace. Změny se průběžně ukládají do lokálního úložiště prohlížeče.

V editoru lze:

- Nastavit název levelu, rozměry mřížky (liché hodnoty od 9 do 101), počet hráčů a libovolnou kombinaci režimů Puzzle, Arcade a Multiplayer.
- Umisťovat doplňkovou grafiku: vodní plochy, lesy, vesnice, města, řeky a mosty.
- Vkládat objekty: domky, hory, mrakodrapy, větrné elektrárny, letiště s nastavitelným směrem a délkou, letadlové lodě, nepřátelská letadla, vozidla, lodě a strategické cíle. Objekt lze vybrat klepnutím a odstranit tlačítkem nebo gumou.
- Přidávat typy letadel s vlastním názvem, rozměrem obrysu, změnou výšky za tah, dostřelem, municí a pohyblivostí. Výchozí typ je F-16.
- Generovat náhodnou mapu. Hustota určuje přibližný počet překážek na 100 polí. Generátor vytvoří letiště uprostřed mapy, náhodné překážky a terén a nastavený počet nepřátelských letadel.
- Exportovat level do YAML, zkopírovat jej do schránky nebo načíst YAML ze souboru.

Exportovaná data editoru obsahují verzi schématu, rozměry mřížky, počet hráčů, režimy, objekty, typy letadel a nastavení generátoru. Jejich struktura se zatím liší od runtime formátu `levels/*.yaml`, takže export editoru zatím nelze rovnou spustit ve hře.

## Co lze ručně vyzkoušet

1. Otevři hlavní menu, vyber Puzzle → level 1 a proveď vzlet z vodorovné dráhy.
2. Obleť horu, znič sklad paliva ve střeleckém režimu a vrať se přistát.
3. Vyzkoušej výběr bodů myší nebo dotykem, posun a přiblížení mapy, vrácení tahu a restart.
4. Otevři `editor.html`, změň velikost mapy, umísti objekty, vytvoř typ letadla, vygeneruj mapu a exportuj YAML.

## Soubory

- `index.html`, `style.css`, `app.js`, `yaml.js` – hra, hlavní menu a práce s YAML.
- `editor.html`, `editor.css`, `editor.js` – samostatný editor a generátor levelů.
- `manifest.webmanifest`, `sw.js` – instalace jako webová aplikace a offline cache.

## Licence

Projekt je šířen pod licencí **GNU General Public License v2.0 nebo, dle volby příjemce, jakoukoli pozdější verzí** (`GPL-2.0-or-later`). Úplné znění licence je v souboru [`LICENSE`](LICENSE). Licence umožňuje software používat, upravovat a dále šířit za podmínek GPL.
