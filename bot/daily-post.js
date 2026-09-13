// bot/daily-post.js
//
// Corrido por GitHub Actions una vez al día (ver .github/workflows/daily-post.yml).
//
// Versión actual: el bot NO publica solo — genera el post (foto real del
// catálogo + caption con IA) y te lo manda por correo (Gmail), listo para
// que lo subas vos mismo a Instagram. Esto evita depender de la
// verificación de Meta mientras se resuelve.
//
// Para volver a publicación 100% automática más adelante: cambiar el
// require de "./lib/email" por "./lib/instagram" + "./lib/notify"
// (el código de esos dos ya está listo en el repo).

const { getCatalog } = require("./lib/catalog");
const { getNextUnpublished, markPublished, markFailed } = require("./lib/tracker");
const { generateImage, generateCaption } = require("./lib/ai");
const { sendDraft, sendError } = require("./lib/email");

async function main() {
  const catalog = getCatalog();
  if (!catalog.length) throw new Error("productos.json está vacío o no se pudo leer");

  const product = getNextUnpublished(catalog);

  try {
    const [imageUrl, caption] = await Promise.all([
      generateImage(product),
      generateCaption(product),
    ]);

    await sendDraft(product, imageUrl, caption);

    markPublished(product, "draft-emailed");

    console.log(`Draft enviado por correo: ${product.slug}`);
  } catch (err) {
    markFailed(product, err.message);
    await sendError(product, err.message);
    console.error("Error en daily-post:", err);
    process.exit(1);
  }
}

main();
