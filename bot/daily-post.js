// bot/daily-post.js
//
// Corrido por GitHub Actions una vez al día (ver .github/workflows/daily-post.yml).
// No depende de Vercel, Firebase, ni de este chat — corre 100% solo dentro del repo.

const { getCatalog } = require("./lib/catalog");
const { getNextUnpublished, markPublished, markFailed } = require("./lib/tracker");
const { generateImage, generateCaption } = require("./lib/ai");
const { publishToInstagram, getBestTimeToday } = require("./lib/metricool");
const { notify } = require("./lib/notify");

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

    const postId = await publishToInstagram({ imageUrl, caption, publishAt });

    markPublished(product, postId);

    await notify(
      `✅ Se publicó automáticamente:\n<b>${product.name}</b>\n₡${product.priceCRC.toLocaleString(
        "es-CR"
      )}\n\nProgramado para las ${publishAt.toLocaleTimeString("es-CR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    );

    console.log(`Publicado: ${product.slug} (post ${postId})`);
  } catch (err) {
    markFailed(product, err.message);
    await notify(`❌ Falló la publicación automática de <b>${product.name}</b>:\n${err.message}`);
    console.error("Error en daily-post:", err);
    process.exit(1);
  }
}

main();
