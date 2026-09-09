/*
 * Script de migración (uso único): extrae los 239 productos de index.html
 * y de productos/*.html, los cruza y produce productos.json + _conflictos.md
 * en la raíz del repo. La página de producto es la fuente de verdad en
 * caso de conflicto (indicado por el usuario). No inventa datos: donde un
 * campo no puede derivarse mecánicamente del texto existente, queda null
 * y se lista en _conflictos.md bajo "Campos no derivables".
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const productosDir = path.join(ROOT, 'productos');

// ---------- 1) Extraer cards de index.html (depth-aware, no regex naive) ----------
function extractCards(html) {
  const marker = '<div class="card" data-nombre="';
  const cards = [];
  let searchFrom = 0;
  while (true) {
    const start = html.indexOf(marker, searchFrom);
    if (start === -1) break;
    // avanzar hasta el cierre del div raíz contando profundidad de <div ...> / </div>
    let i = start;
    let depth = 0;
    let end = -1;
    const openRe = /<div\b/g;
    const closeStr = '</div>';
    // recorrido manual carácter a carácter buscando <div y </div>
    let pos = start;
    while (pos < html.length) {
      const nextOpen = html.indexOf('<div', pos);
      const nextClose = html.indexOf('</div>', pos);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + 4;
      } else {
        depth--;
        pos = nextClose + 6;
        if (depth === 0) { end = pos; break; }
      }
    }
    if (end === -1) throw new Error('No se pudo cerrar el div .card en offset ' + start);
    cards.push(html.slice(start, end));
    searchFrom = end;
  }
  return cards;
}

function attr(block, name) {
  const m = block.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}

const cardBlocks = extractCards(indexHtml);

const cardsData = cardBlocks.map(block => {
  const hrefMatch = block.match(/href="productos\/([^"]+)\.html"/);
  const imgMatch = block.match(/<img[^>]*src="([^"]+)"/);
  const familiaSpan = block.match(/<span class="card-familia">([^<]*)<\/span>/);
  const notasSpan = block.match(/<span class="card-notas">([^<]*)<\/span>/);
  const precioP = block.match(/<p class="precio">([^<]*)<\/p>/);
  return {
    slug: hrefMatch ? hrefMatch[1] : null,
    data_nombre: attr(block, 'data-nombre'),
    data_tipo: attr(block, 'data-tipo'),
    data_brand: attr(block, 'data-brand'),
    data_familia: attr(block, 'data-familia'),
    data_intensidad: attr(block, 'data-intensidad'),
    data_duracion: attr(block, 'data-duracion'),
    img: imgMatch ? imgMatch[1] : null,
    familia_visible: familiaSpan ? familiaSpan[1].trim() : null,
    notas: notasSpan ? notasSpan[1].split('·').map(s => s.trim()).filter(Boolean) : [],
    precio: precioP ? precioP[1].trim() : null,
    precioDesde: precioP ? /^Desde\s/.test(precioP[1].trim()) : false,
  };
});

// ---------- 2) Extraer páginas de productos/ ----------
const productFiles = fs.readdirSync(productosDir).filter(f => f.endsWith('.html'));

function parsePage(file) {
  const html = fs.readFileSync(path.join(productosDir, file), 'utf8');
  const slug = file.replace(/\.html$/, '');

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || null;
  const canonical = (html.match(/rel="canonical" href="([^"]*)"/) || [])[1] || null;

  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let jsonLd = null;
  if (jsonLdMatch) {
    try { jsonLd = JSON.parse(jsonLdMatch[1]); }
    catch (e) { jsonLd = { _parseError: e.message }; }
  }

  const ppBrand = (html.match(/<p class="pp-brand"[^>]*>([^<]*)<\/p>/) || [])[1] || null;
  const ppTitle = (html.match(/<h1 class="pp-title">([^<]*)<\/h1>/) || [])[1] || null;

  const tagMatches = [...html.matchAll(/<span class="pp-tag">([^<]*)<\/span>/g)].map(m => m[1]);
  const genero = tagMatches[0] || null;
  const familiaTag = tagMatches[1] || null;

  const priceMatch = html.match(/id="priceDisplay" data-price="([^"]*)"/);
  const precio = priceMatch ? parseInt(priceMatch[1], 10) : null;

  const pills = [...html.matchAll(/<span class="pp-pill">([^<]*)<\/span>/g)].map(m => m[1]);

  const litCountMatch = html.match(/<div class="pp-dots"[^>]*>([\s\S]*?)<\/div>/);
  const intensidad = litCountMatch ? (litCountMatch[1].match(/pp-dot lit/g) || []).length : null;

  const specVals = [...html.matchAll(/<span class="pp-spec-val">([^<]*)<\/span>/g)].map(m => m[1]);
  const duracionTxt = specVals[0] || null;   // ~9h
  const familiaSpec = specVals[1] || null;   // Fresco Amaderado

  const imgMatch = html.match(/<img class="pp-img"[^>]*src="([^"]+)"/);

  const breadcrumbGenero = (html.match(/href="\/index\.html#(\w+)"/) || [])[1] || null;
  // El generador original del sitio arma el último segmento del breadcrumb
  // (marca+nombre sin tamaño/concentración) con una lógica inconsistente entre
  // productos (a veces recorta "PARFUM"/"ELIXIR", a veces no, sin un patrón
  // único). En vez de adivinar esa lógica, se extrae el texto YA EXISTENTE en
  // cada página tal cual está — fidelidad real en lugar de una fórmula inventada.
  const breadcrumbNav = (html.match(/<nav class="pp-bread"[\s\S]*?<\/nav>/) || [])[0] || '';
  const breadcrumbSpans = [...breadcrumbNav.matchAll(/<span>([^<]*)<\/span>/g)].map(m => m[1]);
  const breadcrumbFinal = breadcrumbSpans.length ? breadcrumbSpans[breadcrumbSpans.length - 1] : null;

  return {
    slug, title, canonical, jsonLd, ppBrand, ppTitle, genero, familiaTag,
    precio, pills, intensidad, duracionTxt, familiaSpec,
    img: imgMatch ? imgMatch[1] : null,
    breadcrumbFinal,
  };
}

const pagesData = productFiles.map(parsePage);
const pagesBySlug = new Map(pagesData.map(p => [p.slug, p]));
const cardsBySlug = new Map(cardsData.map(c => [c.slug, c]));

// ---------- 3) Categorías coarse (misma lógica que _matchCat en index.html) ----------
function normalizar(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function categoriaDe(familia) {
  const f = normalizar(familia);
  if (f.includes('fresco') || f.includes('acuatico') || f.includes('citrico') || f.includes('marino')) return 'frescos';
  if (f.includes('floral')) return 'florales';
  if (f.includes('oriental') || f.includes('ambarado') || f.includes('gourmand') || f.includes('especiado')) return 'orientales';
  if (f.includes('amadera') || f.includes('woody') || f.includes('chypre') || f.includes('musgo') || f.includes('cipre')) return 'amaderados';
  return null;
}

// ---------- 4) Tamaño / concentración desde el texto ya existente ----------
const CONC_TOKENS = ['EAU DE PARFUM', 'EAU DE TOILETTE', 'EXTRAIT DE PARFUM', 'PARFUM', 'EDP', 'EDT', 'EDC', 'ELIXIR', 'COLOGNE', 'EXTRAIT'];
function derivarDeTexto(texto) {
  if (!texto) return { tamano: null, concentracion: null };
  const tamanoMatch = texto.match(/(\d+)\s*ML/i);
  const tamano = tamanoMatch ? tamanoMatch[1] + 'ml' : null;
  let concentracion = null;
  const upper = texto.toUpperCase();
  for (const tok of CONC_TOKENS) {
    if (upper.includes(tok)) { concentracion = tok; break; }
  }
  return { tamano, concentracion };
}
// Deriva tamaño/concentración del título de la página; si falta algo, cae al
// slug del archivo (mismo texto, solo con guiones) antes de dejarlo en null.
function derivarTamanoConcentracion(texto, slug) {
  const deTitulo = derivarDeTexto(texto);
  if (deTitulo.tamano && deTitulo.concentracion) return deTitulo;
  const deSlug = derivarDeTexto((slug || '').replace(/-/g, ' '));
  return {
    tamano: deTitulo.tamano || deSlug.tamano,
    concentracion: deTitulo.concentracion || deSlug.concentracion,
  };
}

// ---------- 5) Derivar nombre corto (quitar marca + tamaño/concentración del título completo) ----------
// El título de la página a veces trae 1-2 palabras extra antes de la marca
// (p.ej. "Christian Dior…", "Paris Montale…", "Armaf Odyssey…"). Solo es
// seguro descartarlas cuando ese mismo prefijo se repite en más de un
// producto de la misma marca (evidencia de que es una variante formal del
// nombre de marca, no parte del nombre específico de ESE producto — como
// "Baby Tous", donde "Baby" aparece una sola vez y es parte del nombre).
// Ese conteo de frecuencia se hace en runtime a partir de los 239 productos
// reales, no es una lista fija adivinada a mano.
function detectarPrefijoMarca(fullTitle, marca) {
  if (!fullTitle || !marca) return null;
  const marcaEsc = marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = fullTitle.trim().match(new RegExp('^(\\S+(?:\\s+\\S+)?)\\s+' + marcaEsc + '\\b', 'i'));
  return m ? m[1].toUpperCase() : null;
}

function quitarTamanoConcentracion(texto) {
  let n = texto.replace(/\b\d+\s*ML\b/gi, '');
  for (const tok of CONC_TOKENS) {
    n = n.replace(new RegExp('\\b' + tok.replace(/ /g, '\\s+') + '\\b', 'gi'), '');
  }
  return n.replace(/\s{2,}/g, ' ').trim();
}

function derivarNombreCorto(fullTitle, marca, prefijosSeguros) {
  if (!fullTitle) return null;
  let n = fullTitle.trim();
  if (marca) {
    const marcaEsc = marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefijo = detectarPrefijoMarca(fullTitle, marca);
    const marcaRe = (prefijo && prefijosSeguros.has(marca + '|' + prefijo))
      ? new RegExp('^\\S+\\s+' + marcaEsc + '\\b', 'i')  // "Christian Dior" completo
      : new RegExp('^' + marcaEsc + '\\b', 'i');          // solo la marca, sin arrastrar la palabra previa
    n = n.replace(marcaRe, '').trim();
  }
  n = quitarTamanoConcentracion(n);
  return n || null; // sin nombre de línea detectable en el texto fuente: no se inventa, queda null
}

// ---------- 6) Cruce + detección de conflictos (pasada 1: todo menos nombre/tamaño/concentración) ----------
const crudos = [];
const conflictos = [];
const sinCard = [];
const sinPagina = [];

// Se recorre en el ORDEN de las cards de index.html (no alfabético de
// productos/), para que productos.json — y por lo tanto el sitio generado —
// preserve el orden de catálogo curado a mano que tiene hoy el sitio.
for (const card of cardsData) {
  const slug = card.slug;
  const page = pagesBySlug.get(slug);
  if (!page) { sinPagina.push(slug); continue; }

  // --- marca: prioriza JSON-LD (más limpio), fallback a card ---
  const marca = (page.jsonLd && page.jsonLd.brand && page.jsonLd.brand.name) || card.data_brand;
  if (card.data_brand && marca && normalizar(card.data_brand) !== normalizar(marca)) {
    conflictos.push({ slug, campo: 'marca', card: card.data_brand, pagina: marca, usado: marca });
  }

  // --- genero ---
  const generoPagina = (page.genero || '').toLowerCase();
  const generoCard = (card.data_tipo || '').toLowerCase();
  if (generoCard && generoPagina && generoCard !== generoPagina) {
    conflictos.push({ slug, campo: 'genero', card: card.data_tipo, pagina: page.genero, usado: page.genero });
  }
  const genero = generoPagina || generoCard || null;

  // --- familia (específica) ---
  const familiaPagina = page.familiaSpec || page.familiaTag;
  if (card.data_familia && familiaPagina && normalizar(card.data_familia) !== normalizar(familiaPagina)) {
    // solo es conflicto real si además cae en un bucket distinto
    if (categoriaDe(card.data_familia) !== categoriaDe(familiaPagina)) {
      conflictos.push({ slug, campo: 'familia', card: card.data_familia, pagina: familiaPagina, usado: familiaPagina });
    }
  }
  const familia = familiaPagina || card.data_familia || null;
  const categoria = categoriaDe(familia);

  // --- precio: pagina (data-price) vs card (texto ₡) ---
  const precioCardNum = card.precio ? parseInt(card.precio.replace(/[^\d]/g, ''), 10) : null;
  if (precioCardNum && page.precio && precioCardNum !== page.precio) {
    conflictos.push({ slug, campo: 'precio', card: precioCardNum, pagina: page.precio, usado: page.precio });
  }
  const precio = (page.precio != null ? page.precio : precioCardNum);
  const precioDesde = !!card.precioDesde; // p.ej. "Desde ₡46,000": el precio cubre varias presentaciones bajo una sola card

  // --- notas: pagina (pills) vs card (card-notas) ---
  const notasPagina = page.pills || [];
  const notasCard = card.notas || [];
  const setPagina = notasPagina.map(normalizar).sort().join('|');
  const setCard = notasCard.map(normalizar).sort().join('|');
  if (notasPagina.length && notasCard.length && setPagina !== setCard) {
    conflictos.push({ slug, campo: 'notas', card: notasCard.join(' · '), pagina: notasPagina.join(' · '), usado: notasPagina.join(' · ') });
  }
  const notas = notasPagina.length ? notasPagina : notasCard;

  // --- intensidad: pagina (conteo de dots) vs card (data-intensidad) ---
  const intensidadCard = card.data_intensidad ? parseInt(card.data_intensidad, 10) : null;
  if (intensidadCard != null && page.intensidad != null && intensidadCard !== page.intensidad) {
    conflictos.push({ slug, campo: 'intensidad', card: intensidadCard, pagina: page.intensidad, usado: page.intensidad });
  }
  const intensidad = (page.intensidad != null ? page.intensidad : intensidadCard);

  // --- duracion: pagina ("~9h") vs card (data-duracion, horas numéricas) ---
  const duracionCardNum = card.data_duracion ? parseInt(card.data_duracion, 10) : null;
  const duracionPaginaNum = page.duracionTxt ? parseInt(page.duracionTxt.replace(/[^\d]/g, ''), 10) : null;
  if (duracionCardNum != null && duracionPaginaNum != null && duracionCardNum !== duracionPaginaNum) {
    conflictos.push({ slug, campo: 'duracion', card: duracionCardNum + 'h', pagina: page.duracionTxt, usado: page.duracionTxt });
  }
  const duracionNum = (duracionPaginaNum != null ? duracionPaginaNum : duracionCardNum);
  const duracion = duracionNum != null ? duracionNum + ' horas' : null;

  // --- imagen: mismo archivo, solo difiere el prefijo "/img/" vs "img/" ---
  const imgPaginaNorm = (page.img || '').replace(/^\//, '');
  const imgCardNorm = (card.img || '').replace(/^\//, '');
  if (imgPaginaNorm && imgCardNorm && imgPaginaNorm !== imgCardNorm) {
    conflictos.push({ slug, campo: 'imagen', card: card.img, pagina: page.img, usado: card.img });
  }
  const imagen = imgCardNorm || imgPaginaNorm; // se guarda relativa ("img/...") tal como la usa index.html

  // --- nombre completo (sin derivar nombre corto todavía, ver pasada 2) ---
  // La card SIEMPRE incluye la marca al inicio del nombre y la página NUNCA la
  // incluye (es una convención de cada plantilla, no un conflicto de datos).
  // Por eso comparamos ambos ya sin marca antes de decidir si hay un conflicto real.
  const nombreCompleto = page.ppTitle || card.data_nombre;
  // Texto EXACTO que usa hoy la card de index.html (data-nombre, alt, aria-label,
  // texto del título y el argumento de consultarPerfume): título/mayúsculas
  // inconsistentes por ser carga manual histórica, no se normaliza — se preserva
  // tal cual para poder regenerar la card sin perder ni alterar texto visible.
  const tituloCard = card.data_nombre;
  const cardNombreComparable = normalizar((card.data_nombre || '').replace(new RegExp('^' + (marca || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trim());
  const paginaNombreComparable = normalizar(page.ppTitle || '');
  if (card.data_nombre && page.ppTitle && cardNombreComparable !== paginaNombreComparable) {
    conflictos.push({ slug, campo: 'nombre', card: card.data_nombre, pagina: page.ppTitle, usado: page.ppTitle });
  }

  const descripcion = (page.jsonLd && page.jsonLd.description) || null;
  const breadcrumbFinal = page.breadcrumbFinal ? page.breadcrumbFinal.replace(/&amp;/g, '&') : null;

  crudos.push({
    slug,
    nombreCompleto,
    tituloCard,
    breadcrumbFinal,
    marca,
    genero,
    familia,
    categoria,
    precio,
    precioDesde,
    imagen,
    notas,
    intensidad,
    duracion,
    descripcion,
  });
}

for (const file of productFiles) {
  const slug = file.replace(/\.html$/, '');
  if (!cardsBySlug.has(slug)) sinCard.push(slug);
}

// ---------- 6b) Pasada 2: frecuencia de "palabra-previa + marca" para saber
// qué prefijos son variantes formales de marca vs. parte del nombre del producto ----------
const frecuenciaPrefijos = new Map();
for (const c of crudos) {
  const prefijo = detectarPrefijoMarca(c.nombreCompleto, c.marca);
  if (prefijo) {
    const key = c.marca + '|' + prefijo;
    frecuenciaPrefijos.set(key, (frecuenciaPrefijos.get(key) || 0) + 1);
  }
}
const prefijosSeguros = new Set([...frecuenciaPrefijos.entries()].filter(([, n]) => n > 1).map(([k]) => k));

const productos = crudos.map(c => {
  const { tamano, concentracion } = derivarTamanoConcentracion(c.nombreCompleto || c.slug, c.slug);
  const nombre = derivarNombreCorto(c.nombreCompleto, c.marca, prefijosSeguros);
  return {
    slug: c.slug,
    nombre,
    nombreCompleto: c.nombreCompleto,
    tituloCard: c.tituloCard,
    breadcrumbFinal: c.breadcrumbFinal,
    marca: c.marca,
    genero: c.genero,
    familia: c.familia,
    categoria: c.categoria,
    'tamaño': tamano,
    concentracion,
    precio: c.precio,
    precioDesde: c.precioDesde,
    imagen: c.imagen,
    notas: c.notas,
    intensidad: c.intensidad,
    duracion: c.duracion,
    descripcion: c.descripcion,
  };
});

const sinNombre = productos.filter(p => !p.nombre);

// Marcas placeholder detectadas: no son conflictos card-vs-página (ambas
// fuentes coinciden en el mismo valor), sino un valor ya erróneo en el sitio
// original. "Oud" es una nota olfativa, no una casa; "Otra" es literalmente
// el fallback por defecto que usa la función obtenerMarca() de script.js
// cuando no reconoce la marca. No se corrige a mano: se deja el valor tal
// cual viene de la fuente y se lista para que un humano lo revise.
const MARCAS_PLACEHOLDER = ['Oud', 'Otra'];
const marcasSospechosas = productos.filter(p => MARCAS_PLACEHOLDER.includes(p.marca));

// ---------- 7) Escribir productos.json ----------
fs.writeFileSync(path.join(ROOT, 'productos.json'), JSON.stringify(productos, null, 2) + '\n', 'utf8');

// ---------- 8) Escribir _conflictos.md ----------
const gaps = productos.filter(p => !p['tamaño'] || !p.concentracion || !p.categoria || p.precio == null);

let md = '# Conflictos de datos: index.html vs productos/*.html\n\n';
md += `Se procesaron ${cardBlocks.length} cards de index.html y ${productFiles.length} páginas de productos/.\n\n`;
md += 'Regla aplicada: en cada conflicto se usó el valor de la página de producto (columna "usado"), tal como pidió el usuario.\n\n';

if (sinCard.length) {
  md += `## Páginas sin card correspondiente en index.html (${sinCard.length})\n\n`;
  sinCard.forEach(s => md += `- ${s}\n`);
  md += '\n';
}
if (sinPagina.length) {
  md += `## Cards sin página correspondiente en productos/ (${sinPagina.length})\n\n`;
  sinPagina.forEach(s => md += `- ${s}\n`);
  md += '\n';
}

md += `## Conflictos de valores (${conflictos.length})\n\n`;
if (!conflictos.length) {
  md += 'Ninguno.\n\n';
} else {
  md += '| slug | campo | valor en card | valor en página | usado |\n|---|---|---|---|---|\n';
  for (const c of conflictos) {
    md += `| ${c.slug} | ${c.campo} | ${JSON.stringify(c.card)} | ${JSON.stringify(c.pagina)} | ${JSON.stringify(c.usado)} |\n`;
  }
  md += '\n';
}

md += `## ⚠ Marca placeholder, no un mismatch entre fuentes (${marcasSospechosas.length})\n\n`;
md += 'Estos productos tienen `data-brand` en la card Y `brand.name` en el JSON-LD de la página\n';
md += 'coincidiendo en el mismo valor — por eso no aparecen como "conflicto" — pero ese valor\n';
md += 'no es una casa de perfumes real: es un placeholder ya erróneo en el sitio original\n';
md += '("Oud" es una nota olfativa; "Otra" es el fallback por defecto de `obtenerMarca()` en\n';
md += 'script.js cuando no reconocía la marca). Se dejó tal cual viene de la fuente — no se\n';
md += 'adivinó la marca real — para que se corrija a mano en productos.json revisando el nombre completo.\n\n';
if (!marcasSospechosas.length) {
  md += 'Ninguno.\n\n';
} else {
  md += '| slug | marca actual | nombreCompleto (pista de la marca real) |\n|---|---|---|\n';
  for (const p of marcasSospechosas) {
    md += `| ${p.slug} | ${p.marca} | ${JSON.stringify(p.nombreCompleto)} |\n`;
  }
  md += '\n';
}

md += `## Sin nombre de línea de producto en ninguna fuente (${sinNombre.length})\n\n`;
md += 'En estos productos ni el título de la página, ni el JSON-LD, ni el título de index.html\n';
md += 'incluyen un nombre de línea (solo marca + tamaño + concentración). No se inventó un nombre;\n';
md += 'queda `null` en productos.json. El nombre del archivo de imagen se lista solo como pista para revisión manual.\n\n';
if (!sinNombre.length) {
  md += 'Ninguno.\n\n';
} else {
  md += '| slug | marca | nombreCompleto (texto crudo de la página) | imagen (pista) |\n|---|---|---|---|\n';
  for (const p of sinNombre) {
    md += `| ${p.slug} | ${p.marca} | ${JSON.stringify(p.nombreCompleto)} | ${p.imagen} |\n`;
  }
  md += '\n';
}

md += `## Campos no derivables automáticamente (${gaps.length})\n\n`;
md += 'No se inventó ningún valor: donde el texto fuente no permitía derivar el dato de forma mecánica, el campo quedó en null.\n\n';
if (!gaps.length) {
  md += 'Ninguno.\n';
} else {
  md += '| slug | tamaño | concentracion | categoria | precio |\n|---|---|---|---|---|\n';
  for (const p of gaps) {
    md += `| ${p.slug} | ${p['tamaño'] ?? 'null'} | ${p.concentracion ?? 'null'} | ${p.categoria ?? 'null'} | ${p.precio ?? 'null'} |\n`;
  }
}

fs.writeFileSync(path.join(ROOT, '_conflictos.md'), md, 'utf8');

console.log(`Cards en index.html: ${cardBlocks.length}`);
console.log(`Páginas en productos/: ${productFiles.length}`);
console.log(`Productos en productos.json: ${productos.length}`);
console.log(`Conflictos detectados: ${conflictos.length}`);
console.log(`Sin card correspondiente: ${sinCard.length}`);
console.log(`Sin página correspondiente: ${sinPagina.length}`);
console.log(`Campos no derivables (gaps): ${gaps.length}`);
console.log(`Sin nombre de línea en ninguna fuente: ${sinNombre.length}`);
console.log(`Marcas placeholder (Oud/Otra) a revisar: ${marcasSospechosas.length}`);
