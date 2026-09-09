// bot/lib/ai.js
//
// Por ahora usa la foto real del producto y un caption de plantilla.
// Cuando tengamos la API key gratis de NVIDIA NIM (build.nvidia.com),
// se completan estas dos funciones — el resto del bot no cambia.

/**
 * Genera (o mejora) la imagen del post.
 * TODO NVIDIA NIM (Stable Diffusion):
 *   POST https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium
 *   Header: Authorization: Bearer ${process.env.NVIDIA_API_KEY}
 */
async function generateImage(product) {
  return product.imageUrl;
}

/**
 * Genera el caption + hashtags.
 * TODO NVIDIA NIM (Llama 3 / Nemotron):
 *   POST https://integrate.api.nvidia.com/v1/chat/completions
 *   Header: Authorization: Bearer ${process.env.NVIDIA_API_KEY}
 *   Body: { model: "meta/llama3-70b-instruct", messages: [...] }
 */
async function generateCaption(product) {
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
