# Conflictos de datos: index.html vs productos/*.html

Se procesaron 239 cards de index.html y 239 páginas de productos/.

Regla aplicada: en cada conflicto se usó el valor de la página de producto (columna "usado"), tal como pidió el usuario.

## Conflictos de valores (2)

| slug | campo | valor en card | valor en página | usado |
|---|---|---|---|---|
| odyssey-femme-80ml-edp | genero | "Unisex" | "Mujer" | "Mujer" |
| odyssey-candee-100ml-edp | genero | "Unisex" | "Mujer" | "Mujer" |

## ⚠ Marca placeholder, no un mismatch entre fuentes (43)

Estos productos tienen `data-brand` en la card Y `brand.name` en el JSON-LD de la página
coincidiendo en el mismo valor — por eso no aparecen como "conflicto" — pero ese valor
no es una casa de perfumes real: es un placeholder ya erróneo en el sitio original
("Oud" es una nota olfativa; "Otra" es el fallback por defecto de `obtenerMarca()` en
script.js cuando no reconocía la marca). Se dejó tal cual viene de la fuente — no se
adivinó la marca real — para que se corrija a mano en productos.json revisando el nombre completo.

| slug | marca actual | nombreCompleto (pista de la marca real) |
|---|---|---|
| dolce-gabbana-light-blue-100ml-edt | Otra | "DOLCE & GABBANA LIGHT BLUE 100ML EDT" |
| dolce-gabbana-light-blue-200ml-edt | Otra | "DOLCE & GABBANA LIGHT BLUE 200ML EDT" |
| dolce-gabbana-the-one-150ml-edt | Otra | "DOLCE & GABBANA THE ONE 150ML EDT" |
| dolce-gabbana-light-blue-love-is-love-125ml-edt | Otra | "DOLCE & GABBANA LIGHT BLUE LOVE IS LOVE 125ML EDT" |
| dolce-gabbana-light-blue-summer-vibes-125ml-edt | Otra | "DOLCE & GABBANA LIGHT BLUE SUMMER VIBES 125ML EDT" |
| dolce-gabbana-intenso-125ml-edp | Otra | "DOLCE & GABBANA INTENSO 125ML EDP" |
| dolce-gabbana-king-100ml-edt | Otra | "DOLCE & GABBANA KING 100ML EDT" |
| dolce-gabbana-king-100ml-edp | Otra | "DOLCE & GABBANA KING 100ML EDP" |
| dolce-gabbana-the-one-gold-100ml-edp-intense | Otra | "DOLCE & GABBANA THE ONE GOLD 100ML EDP INTENSE" |
| hawas-for-him-100ml-edp | Otra | "HAWAS FOR HIM 100ML EDP" |
| moschino-toy-2-bubble-gum-100ml-edp | Otra | "MOSCHINO TOY 2 BUBBLE GUM 100ML EDP" |
| moschino-toy-2-100ml-edp-version-tester | Otra | "MOSCHINO TOY 2 100ML EDP VERSION TESTER" |
| moschino-fresh-couture-100ml-edt | Otra | "MOSCHINO FRESH COUTURE 100ML EDT" |
| moschino-pink-fresh-couture-100ml-edt | Otra | "MOSCHINO PINK FRESH COUTURE 100ML EDT" |
| moschino-fresh-gold-couture-100ml-edp | Otra | "MOSCHINO FRESH GOLD COUTURE 100ML EDP" |
| rave-now-intense-100ml-edp | Otra | "RAVE NOW INTENSE 100ML EDP" |
| rave-now-rouge-100ml-edp | Otra | "RAVE NOW ROUGE 100ML EDP" |
| rave-now-white-100ml-edp | Otra | "RAVE NOW WHITE 100ML EDP" |
| maison-alhambra-bright-peach-80ml-edp | Otra | "MAISON ALHAMBRA BRIGHT PEACH 80ML EDP" |
| maison-alhambra-porto-neroli-80ml-edp | Otra | "MAISON ALHAMBRA PORTO NEROLI 80ML EDP" |
| maison-alhambra-toscano-leather-80ml-edp | Otra | "MAISON ALHAMBRA TOSCANO LEATHER 80ML EDP" |
| maison-alhambra-woody-oud-80ml-edp | Oud | "MAISON ALHAMBRA WOODY OUD 80ML EDP" |
| maison-alhambra-hercules-100ml-edp | Otra | "MAISON ALHAMBRA HERCULES 100ML EDP" |
| maison-alhambra-la-rouge-baroque-540-100ml-edp | Otra | "MAISON ALHAMBRA LA ROUGE BAROQUE 540 100ML EDP" |
| moschino-toy-2-pearl-100ml-edp | Otra | "MOSCHINO TOY 2 PEARL 100ML EDP" |
| afnan-9am-dive-100ml-edp | Otra | "AFNAN 9AM DIVE 100ML EDP" |
| afnan-9pm-rebel-100ml-edp | Otra | "AFNAN 9PM REBEL 100ML EDP" |
| afnan-supremacy-gold-100ml-edp | Otra | "AFNAN SUPREMACY GOLD 100ML EDP" |
| al-haramain-amber-oud-aqua-dubai-100ml-edp | Oud | "AL HARAMAIN AMBER OUD AQUA DUBAI 100ML EDP" |
| al-haramain-amber-oud-gold-edition-120ml-edp | Oud | "AL HARAMAIN AMBER OUD GOLD EDITION 120ML EDP" |
| al-haramain-amber-oud-rouge-60ml-edp | Oud | "AL HARAMAIN AMBER OUD ROUGE 60ML EDP" |
| al-haramain-amber-oud-ruby-edition-200ml-edp | Oud | "AL HARAMAIN AMBER OUD RUBY EDITION 200ML EDP" |
| al-haramain-amber-oud-tobacco-edition-60ml-edp | Oud | "AL HARAMAIN AMBER OUD TOBACCO EDITION 60ML EDP" |
| al-haramain-amber-oud-ultra-violet-120ml-edp | Oud | "AL HARAMAIN AMBER OUD ULTRA VIOLET 120ML EDP" |
| armaf-beach-party-100ml-edp | Otra | "ARMAF BEACH PARTY 100ML EDP" |
| armaf-club-de-nuit-milestone-105ml-edp | Otra | "ARMAF CLUB DE NUIT MILESTONE 105ML EDP" |
| armaf-club-de-nuit-oud-parfum-105ml-edp | Oud | "ARMAF CLUB DE NUIT OUD PARFUM 105ML EDP" |
| armaf-club-de-nuit-sillage-105ml-edp | Otra | "ARMAF CLUB DE NUIT SILLAGE 105ML EDP" |
| armaf-club-de-nuit-untold-105ml-edp | Otra | "ARMAF CLUB DE NUIT UNTOLD 105ML EDP" |
| armaf-island-breeze-100ml-edp | Otra | "ARMAF ISLAND BREEZE 100ML EDP" |
| armaf-ventana-marine-100ml-edp | Otra | "ARMAF VENTANA MARINE 100ML EDP" |
| emper-le-chameu-stallion-53-100ml-edp | Otra | "EMPER LE CHAMEU STALLION 53 100ML EDP" |
| jo-milano-paris-game-of-spades-wildcard-100ml-parfum | Otra | "JO MILANO PARIS GAME OF SPADES WILDCARD 100ML PARFUM" |

## Sin nombre de línea de producto en ninguna fuente (2)

En estos productos ni el título de la página, ni el JSON-LD, ni el título de index.html
incluyen un nombre de línea (solo marca + tamaño + concentración). No se inventó un nombre;
queda `null` en productos.json. El nombre del archivo de imagen se lista solo como pista para revisión manual.

| slug | marca | nombreCompleto (texto crudo de la página) | imagen (pista) |
|---|---|---|---|
| tommy-hilfiger-100ml-edt | Tommy Hilfiger | "100ML EDT" | img/TOMMYNOW.png |
| paco-rabanne-100ml-edt | Paco Rabanne | "100ML EDT" | img/Rabanne PACO .png |

## Campos no derivables automáticamente (4)

No se inventó ningún valor: donde el texto fuente no permitía derivar el dato de forma mecánica, el campo quedó en null.

| slug | tamaño | concentracion | categoria | precio |
|---|---|---|---|---|
| jean-paul-gaultier-le-beau-le-parfum | null | PARFUM | orientales | 65000 |
| jean-paul-gaultier-le-beau-edt | null | EDT | orientales | 55000 |
| paco-rabanne-one-million-edt | null | EDT | amaderados | 46000 |
| carolina-herrera-212-sexy-men-100ml | 100ml | null | florales | 41000 |
