// bot/lib/metricool.js
//
// Publica directo vía la API REST de Metricool. La API key es distinta
// de la conexión que se usó en el chat de Claude — se saca en:
// app.metricool.com → Configuración → API.

const METRICOOL_BASE = "https://app.metricool.com/api";
const BRAND_ID = "6895905"; // marca "Matías Parfum" en Metricool

async function publishToInstagram({ imageUrl, caption, publishAt }) {
  const apiKey = process.env.METRICOOL_API_KEY;
  const userId = process.env.METRICOOL_USER_ID;

  if (!apiKey || !userId) {
    throw new Error("Faltan METRICOOL_API_KEY o METRICOOL_USER_ID (secrets del repo)");
  }

  const res = await fetch(
    `${METRICOOL_BASE}/v2/scheduler/posts?blogId=${BRAND_ID}&userId=${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mc-Auth": apiKey,
      },
      body: JSON.stringify({
        providers: [{ network: "instagram" }],
        text: caption,
        media: [imageUrl],
        publicationDate: {
          dateTime: publishAt.toISOString(),
          timezone: "America/Costa_Rica",
        },
        autoPublish: true,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Metricool respondió ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Mejor hora para publicar hoy según el histórico de la cuenta.
 * Si falla o no hay datos, usa mediodía como default.
 */
async function getBestTimeToday() {
  const apiKey = process.env.METRICOOL_API_KEY;
  const userId = process.env.METRICOOL_USER_ID;

  const today = new Date();
  const fallback = new Date(today);
  fallback.setHours(12, 0, 0, 0);

  if (!apiKey || !userId) return fallback;

  try {
    const res = await fetch(
      `${METRICOOL_BASE}/v2/analytics/besttimetopost?blogId=${BRAND_ID}&userId=${userId}&network=instagram`,
      { headers: { "X-Mc-Auth": apiKey } }
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const todayData = data?.data?.find((d) => d.dayOfWeek === dayOfWeek);
    if (!todayData) return fallback;

    const best = todayData.bestTimesByHour.reduce((a, b) => (b.value > a.value ? b : a));
    const result = new Date(today);
    result.setHours(best.hourOfDay, 0, 0, 0);
    return result;
  } catch {
    return fallback;
  }
}

module.exports = { publishToInstagram, getBestTimeToday };
