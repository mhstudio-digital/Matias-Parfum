const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const ROOT = __dirname;
const productos = require(path.join(ROOT, 'productos.json'));

const cardTemplate = fs.readFileSync(path.join(ROOT, 'templates', 'card.ejs'), 'utf8');
const productoTemplate = fs.readFileSync(path.join(ROOT, 'templates', 'producto.ejs'), 'utf8');

function escAmp(s) {
  return (s || '').replace(/&/g, '&amp;');
}
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function conMiles(n, separador) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separador);
}
function urlImagenAbsoluta(imagenRelativa) {
  const archivo = imagenRelativa.replace(/^img\//, '');
  return 'https://matiasparfum.com/img/' + encodeURIComponent(archivo);
}
function horasDe(duracionTexto) {
  const m = (duracionTexto || '').match(/\d+/);
  return m ? m[0] : '';
}
function sizeParaMensaje(tamano) {
  return tamano ? tamano.replace(/ml/i, '').trim() : '100';
}

// ---------- Preparar view-model de cada card ----------
function viewCard(p) {
  return {
    tituloCard: p.tituloCard,
    dataTipo: capitalize(p.genero),
    marca: p.marca,
    familia: p.familia,
    intensidad: p.intensidad,
    duracionHoras: horasDe(p.duracion),
    imagen: p.imagen,
    notasTexto: p.notas.join(' · '),
    precioTexto: (p.precioDesde ? 'Desde ' : '') + '₡' + conMiles(p.precio, ','),
    hrefProducto: 'productos/' + p.slug + '.html',
  };
}

// ---------- Preparar view-model de cada página de producto ----------
function viewProducto(p) {
  // OJO: el <title>/meta/og/JSON-LD "name"/alt de imagen/mensaje de WhatsApp
  // usan el texto de la CARD (tituloCard, marca en Title Case) — NO el texto
  // de pp-title (nombreCompleto, todo en mayúsculas). Son dos strings
  // distintos en casi todas las páginas (232/239); pp-title y el breadcrumb
  // son los únicos que usan nombreCompleto/breadcrumbFinal.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.tituloCard,
    brand: { '@type': 'Brand', name: p.marca },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CRC',
      price: String(p.precio),
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Matías Parfum' },
    },
    image: urlImagenAbsoluta(p.imagen),
    description: p.descripcion,
  };
  return {
    slug: p.slug,
    tituloCard: p.tituloCard,
    tituloEscapado: escAmp(p.tituloCard),
    nombreCompleto: p.nombreCompleto,
    imagenSrc: '/' + p.imagen,
    imagenAbsUrl: urlImagenAbsoluta(p.imagen),
    jsonLdString: JSON.stringify(jsonLd),
    generoLower: p.genero,
    generoCap: capitalize(p.genero),
    marca: p.marca,
    marcaUpper: p.marca.toUpperCase(),
    breadcrumbFinal: escAmp(p.breadcrumbFinal),
    familia: p.familia,
    precio: p.precio,
    precioPeriodo: conMiles(p.precio, '.'),
    notas: p.notas,
    intensidad: p.intensidad,
    duracionHoras: horasDe(p.duracion),
    sizeParaMensaje: sizeParaMensaje(p['tamaño']),
  };
}

// ---------- Generar productos/{slug}.html ----------
const productosDir = path.join(ROOT, 'productos');
let paginasGeneradas = 0;
for (const p of productos) {
  const html = ejs.render(productoTemplate, { p: viewProducto(p) });
  fs.writeFileSync(path.join(productosDir, p.slug + '.html'), html, 'utf8');
  paginasGeneradas++;
}

// ---------- Generar el bloque de cards e inyectarlo en index.html ----------
const indexPath = path.join(ROOT, 'index.html');
// Normaliza a LF puro: el archivo en disco puede tener CRLF (checkout de Windows/
// autocrlf) y mezclarlo con el LF de las cards generadas rompería el diff línea
// por línea. git ya se encarga de la conversión CRLF/LF al hacer checkout/commit.
let indexHtml = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');

const cardsHtml = productos
  .map(p => ejs.render(cardTemplate, { p: viewCard(p) }).trim())
  .join('\n');

const inicioMarcador = '<!-- CARDS:START -->';
const finMarcador = '<!-- CARDS:END -->';
const inicioIdx = indexHtml.indexOf(inicioMarcador);
const finIdx = indexHtml.indexOf(finMarcador);
if (inicioIdx === -1 || finIdx === -1) {
  throw new Error('No se encontraron los marcadores CARDS:START / CARDS:END en index.html');
}
indexHtml =
  indexHtml.slice(0, inicioIdx + inicioMarcador.length) +
  '\n' + cardsHtml + '\n' +
  indexHtml.slice(finIdx);

// ---------- Actualizar el contador de fragancias ("230" -> productos.length) ----------
// El contador vive como texto plano ("Más de 230 fragancias", stat-num "230+")
// fuera del bloque de cards, así que se reemplaza ANTES de haber insertado las
// cards nuevas para no tocar por accidente un precio que contenga "230".
const antesDeCards = indexHtml.slice(0, indexHtml.indexOf(inicioMarcador));
const desdeCardsEnAdelante = indexHtml.slice(indexHtml.indexOf(inicioMarcador));
const antesActualizado = antesDeCards.split('230').join(String(productos.length));
indexHtml = antesActualizado + desdeCardsEnAdelante;

fs.writeFileSync(indexPath, indexHtml, 'utf8');

console.log(`Productos procesados: ${productos.length}`);
console.log(`Páginas generadas en productos/: ${paginasGeneradas}`);
console.log(`Cards inyectadas en index.html: ${productos.length}`);
console.log(`Contador de fragancias actualizado a: ${productos.length}`);
