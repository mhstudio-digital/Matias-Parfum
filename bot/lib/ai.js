// bot/lib/ai.js
//
// Genera el caption del post con NVIDIA NIM (gratis con NVIDIA_API_KEY).
// La imagen usa la foto real del producto del catálogo — generar una
// imagen nueva con IA (Stable Diffusion) es posible pero necesitaría
// subir el resultado a algún lugar público antes de poder usarla en
// Instagram (que exige una URL pública, no la imagen en sí), así que
// queda como mejora futura.

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// NVIDIA rota/retira modelos con frecuencia, y algunos son modelos de
// "razonamiento" que a veces filtran su pensamiento interno en vez de
// dar la respuesta final. Probamos varios en orden y validamos cada
// respuesta antes de usarla — si una no pasa, probamos la siguiente.
const CANDIDATE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b",
  "qwen/qwen3.5-122b-a10b",
  "mistralai/mistral-small-4-119b-2603",
  "meta/llama-3.3-70b-instruct",
];

/**
 * Devuelve la imagen del producto tal cual está en el catálogo.
 */
async function generateImage(product) {
  return product.imageUrl;
}

/**
 * Chequeo básico de que la respuesta se vea como un caption real y no
 * como razonamiento interno filtrado, un rechazo, o basura.
 */
function looksLikeValidCaption(text) {
  if (!text) return false;
  if (text.length > 900) return false; // un caption real es corto
  if (!text.includes("#")) return false; // debe traer hashtags
  // Frases típicas de razonamiento en inglés filtrado por error
  if (/\bwe need\b|\blet'?s\b|\bline\s*1\b|<think>/i.test(text)) return false;
  return true;
}

/**
 * Genera el caption + hashtags con IA (NVIDIA NIM).
 * Si no hay NVIDIA_API_KEY configurada, o ningún modelo candidato da
 * una respuesta válida, cae en el caption de plantilla — el bot nunca
 * se cae ni manda algo roto por esto.
 */
async function generateCaption(product) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return templateCaption(product);

  const notes = product.notes.join(", ");
  const prompt = `Escribí un caption para Instagram en español (Costa Rica) para vender este perfume:
Marca: ${product.brand}
Nombre: ${product.name}
Familia olfativa: ${product.family}
Notas: ${notes}
Precio: ₡${product.priceCRC.toLocaleString("es-CR")}

Reglas:
- Tono cercano, elegante, no genérico. Máximo 4 líneas de texto antes de los hashtags.
- Incluí el precio.
- Cerrá invitando a escribir por WhatsApp o ver el catálogo (link en bio).
- Terminá con 6-8 hashtags relevantes en español (sin espacios, con #).
- No uses comillas ni markdown, solo el texto plano del post final — sin explicar tu razonamiento, sin mostrar borradores.`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await fetch(NVIDIA_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 400,
          // Nemotron es un modelo de "razonamiento": sin esto, a veces
          // devuelve su pensamiento interno en vez de la respuesta final.
          ...(model.startsWith("nvidia/nemotron")
            ? { chat_template_kwargs: { enable_thinking: false } }
            : {}),
        }),
      });

      if (!res.ok) {
        console.warn(`NVIDIA NIM (${model}) respondió ${res.status}, probando siguiente modelo`);
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (looksLikeValidCaption(text)) return text;

      console.warn(`NVIDIA NIM (${model}) dio una respuesta no válida, probando siguiente modelo`);
    } catch (err) {
      console.warn(`Error llamando a NVIDIA NIM (${model}):`, err.message);
    }
  }

  console.warn("Ningún modelo de NVIDIA NIM dio un caption válido, usando plantilla");
  return templateCaption(product);
}

function templateCaption(product) {
  const notes = product.notes.join(" · ");
  return [
    `${product.name} — ${product.family}`,
    "",
    `Notas: ${notes}`,
    "",
    `100% original · ₡${product.priceCRC.toLocaleString("es-CR")}`,
    "📲 Escribinos por WhatsApp o mirá el catálogo completo (link en bio)",
    "",
    `#${product.brand.replace(/\s+/g, "")} #PerfumesCR #PerfumesOriginales #FraganciasCR #CostaRica #MatiasParfum`,
  ].join("\n");
}

module.exports = { generateImage, generateCaption };
