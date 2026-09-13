// bot/lib/tracker.js
//
// En vez de una base de datos externa (Firebase), el tracking de qué se
// publicó vive en bot/published.json, versionado en el propio repo. El
// workflow de GitHub Actions hace commit de este archivo después de cada
// corrida, así que queda como historial normal de git.

const fs = require("fs");
const path = require("path");

const TRACKER_PATH = path.join(__dirname, "..", "published.json");

function readTracker() {
  if (!fs.existsSync(TRACKER_PATH)) return [];
  return JSON.parse(fs.readFileSync(TRACKER_PATH, "utf8"));
}

function writeTracker(entries) {
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

/**
 * Devuelve el siguiente producto no publicado. Si ya se publicó todo el
 * catálogo, reinicia el ciclo (vuelve a empezar desde el primero).
 */
function getNextUnpublished(catalog) {
  const published = new Set(
    readTracker()
      .filter((e) => e.status === "published")
      .map((e) => e.slug)
  );
  const next = catalog.find((p) => !published.has(p.slug));
  if (next) return next;

  // Se publicó todo: reiniciar el ciclo.
  writeTracker([]);
  return catalog[0];
}

function markPublished(product, metricoolPostId) {
  const entries = readTracker();
  entries.push({
    slug: product.slug,
    publishedAt: new Date().toISOString(),
    metricoolPostId,
    status: "published",
  });
  writeTracker(entries);
}

function markFailed(product, error) {
  const entries = readTracker();
  entries.push({
    slug: product.slug,
    failedAt: new Date().toISOString(),
    error: String(error),
    status: "failed",
  });
  writeTracker(entries);
}

module.exports = { getNextUnpublished, markPublished, markFailed };
