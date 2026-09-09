// bot/daily-post.js
//
// Corrido por GitHub Actions una vez al día (ver .github/workflows/daily-post.yml).
// No depende de Vercel, Firebase, Metricool, ni de este chat — corre 100%
// solo dentro del repo, publicando directo a Instagram vía la API de Meta.

const { getCatalog } = require("./lib/catalog");
const { getNextUnpublished, markPublished, markFailed } = require("./lib/tracker");
const { generateImage, generateCaption } = require("./lib/ai");
const { publishToInstagram, getBestTimeToday } = require("./lib/instagram");
const { notify, notifyError } = require("./lib/notify");

async function main() {
  const catalog = getCatalog();
  if (!catalog.length) throw new Error("productos.json está vacío o no se pudo leer");

  const product = getNextUnpublished(catalog);

  try {
    const [imageUrl, caption, publishAt] = await Promise.all([
      generateImage(product),
      generateCaption(product),
      getBestTimeToday(),
    ]);

    const postId = await publishToInstagram({ imageUrl, caption });

    markPublished(product, postId);

    await notify(product, publishAt);

    console.log(`Publicado: ${product.slug} (post ${postId})`);
  } catch (err) {
    markFailed(product, err.message);
    await notifyError(product, err.message);
    console.error("Error en daily-post:", err);
    process.exit(1);
  }
}

main();
