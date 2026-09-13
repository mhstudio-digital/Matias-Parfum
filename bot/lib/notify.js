// bot/lib/notify.js
//
// Avisa por WhatsApp real (API de Meta / Cloud API). Como el bot es quien
// inicia la conversación (vos nunca le escribís primero), WhatsApp exige
// usar una plantilla de mensaje pre-aprobada — no se puede mandar texto
// libre como en Telegram.
//
// La plantilla se crea una sola vez en Meta Business Manager → WhatsApp
// Manager → Message templates, con 2 variables de texto, por ejemplo:
//   "✅ Se publicó automáticamente: {{1}} — ₡{{2}}"

const WHATSAPP_API_VERSION = "v21.0";

async function notify(product, publishAt) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const toNumber = process.env.WHATSAPP_TO_NUMBER; // tu celular, formato internacional sin "+", ej: 50683674466
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "post_publicado";

  if (!token || !phoneNumberId || !toNumber) {
    console.warn(
      "Notificación no enviada: faltan WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TO_NUMBER"
    );
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: product.name },
                { type: "text", text: product.priceCRC.toLocaleString("es-CR") },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`WhatsApp respondió ${res.status}: ${body}`);
  }
}

/**
 * Versión simple para avisar errores (usa la misma plantilla, con el
 * mensaje de error en vez del precio — si preferís una plantilla
 * dedicada a errores, se puede separar más adelante).
 */
async function notifyError(product, errorMessage) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const toNumber = process.env.WHATSAPP_TO_NUMBER;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "post_publicado";

  if (!token || !phoneNumberId || !toNumber) return;

  await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: templateName,
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: `❌ Falló: ${product.name}` },
              { type: "text", text: errorMessage.slice(0, 60) },
            ],
          },
        ],
      },
    }),
  }).catch(() => {});
}

module.exports = { notify, notifyError };
