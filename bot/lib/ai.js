// bot/lib/ai.js
//
// Genera el caption del post con NVIDIA NIM (gratis con NVIDIA_API_KEY).
// La imagen usa la foto real del producto del catálogo — generar una
// imagen nueva con IA (Stable Diffusion) es posible pero necesitaría
// subir el resultado a algún lugar público antes de poder usarla en
// Instagram (que exige una URL pública, no la imagen en sí), así que
// queda como mejora futura.

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// NVIDIA rota/retira modelos con frecuencia. Probamos estos en orden
// hasta que uno responda bien — así una baja de un modelo puntual no
// rompe el bot. (Si en el futuro todos fallan, revisar modelos vigentes
// en build.nvidia.com y actualizar esta lista.)
const CANDIDATE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b",
  "meta/llama-3.3-70b-instruct",
  "qwen/qwen3.5-122b-a10b",
];

/**
 * Devuelve la imagen del producto tal cual está en el catálogo.
 */
async function generateImage(product) {
  return product.imageUrl;
}

/**
 * Genera el caption + hashtags con IA (NVIDIA NIM).
 * Si no hay NVIDIA_API_KEY configurada, o todos los modelos candidatos
 * fallan, cae en el caption de plantilla — el bot nunca se cae por esto.
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
- No uses comillas ni markdown, solo el texto plano del post.`;

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
        }),
      });

      if (!res.ok) {
        console.warn(`NVIDIA NIM (${model}) respondió ${res.status}, probando siguiente modelo`);
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      console.warn(`Error llamando a NVIDIA NIM (${model}):`, err.message);
    }
  }

  console.warn("Ningún modelo de NVIDIA NIM respondió bien, usando caption de plantilla");
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
