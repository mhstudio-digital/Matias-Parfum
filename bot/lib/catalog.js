// bot/lib/catalog.js
//
// Lee productos.json directo — es la MISMA fuente que usa build.js para
// generar el sitio, así que siempre está sincronizado con el catálogo real.

const path = require("path");

function getCatalog() {
  // require con ruta absoluta para que funcione sin importar desde dónde se corra el script
  const productos = require(path.join(__dirname, "..", "..", "productos.json"));

  return productos.map((p) => ({
    slug: p.slug,
    brand: p.marca,
    name: p.tituloCard,
    family: p.familia,
    notes: p.notas || [],
    priceCRC: p.precio,
    imageUrl: `https://matiasparfum.com/${p.imagen.replace(/^\/+/, "")}`,
    url: `https://matiasparfum.com/productos/${p.slug}.html`,
  }));
}

module.exports = { getCatalog };
