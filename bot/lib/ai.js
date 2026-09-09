// bot/lib/ai.js
//
// Genera el caption del post con NVIDIA NIM (modelo Llama 3, gratis con
// NVIDIA_API_KEY). La imagen usa la foto real del producto del catálogo
// — generar una imagen nueva con IA (Stable Diffusion) es posible pero
// necesitaría subir el resultado a algún lugar público antes de poder
// usarla en Instagram (que exige una URL pública, no la imagen en sí),
// así que queda como mejora futura.

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

/**
 * Devuelve la imagen del producto tal cual está en el catálogo.
 */
async function generateImage(product) {
  return product.imageUrl;
}

/**
 * Genera el caption + hashtags con IA (NVIDIA NIM / Llama 3).
 * Si no hay NVIDIA_API_KEY configurada, o la llamada falla, cae en el
 * caption de plantilla — el bot nunca se cae por esto.
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

  try {
    const res = await fetch(NVIDIA_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      console.warn(`NVIDIA NIM respondió ${res.status}, usando caption de plantilla`);
      return templateCaption(product);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || templateCaption(product);
  } catch (err) {
    console.warn("Error llamando a NVIDIA NIM, usando caption de plantilla:", err.message);
    return templateCaption(product);
  }
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
