// bot/lib/instagram.js
//
// Publica directo en Instagram usando la API oficial de Meta (Instagram
// Graph API / Content Publishing API) — gratis para cuentas Business o
// Creator. Usa la MISMA app de Meta que se crea para WhatsApp
// (developers.facebook.com), así que no hace falta un registro aparte.
//
// Requiere:
//   - La cuenta de Instagram (@matias_parfum) convertida a Business o
//     Creator y vinculada a una Página de Facebook.
//   - Un token de acceso de larga duración con permisos:
//     instagram_basic, instagram_content_publish, pages_read_engagement.
//   - El "Instagram Business Account ID" (se obtiene desde la Página
//     de Facebook vinculada, vía Graph API Explorer o el propio setup
//     de la app).

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function publishToInstagram({ imageUrl, caption }) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !igUserId) {
    throw new Error("Faltan INSTAGRAM_ACCESS_TOKEN o INSTAGRAM_ACCOUNT_ID (secrets del repo)");
  }

  // Paso 1: crear el "container" con la imagen y el caption
  const createRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Instagram (crear container) respondió ${createRes.status}: ${body}`);
  }

  const { id: creationId } = await createRes.json();

  // Paso 2: publicar el container creado
  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken,
    }),
  });

  if (!publishRes.ok) {
    const body = await publishRes.text();
    throw new Error(`Instagram (publicar) respondió ${publishRes.status}: ${body}`);
  }

  const { id: mediaId } = await publishRes.json();
  return mediaId;
}

/**
 * Reemplaza al "mejor horario" que daba Metricool. Sin esa analítica,
 * usamos una hora fija razonable (mediodía Costa Rica), que en los datos
 * que vimos antes estaba entre las mejores franjas del día.
 */
async function getBestTimeToday() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return now;
}

module.exports = { publishToInstagram, getBestTimeToday };
