// bot/lib/email.js
//
// Manda el post ya armado (foto + caption) por Gmail para que lo
// publiques vos a mano. Usa el SMTP de Gmail con una "contraseña de
// aplicación" (no tu contraseña normal) — se genera en:
// myaccount.google.com/apppasswords (requiere 2FA activado en la cuenta).
//
// Cuando la verificación de Meta se resuelva, este módulo se puede dejar
// de usar y volver a bot/lib/instagram.js + bot/lib/notify.js (ya están
// en el repo, listos) para que el bot publique 100% solo.

const nodemailer = require("nodemailer");

function buildTransport() {
  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!user || !appPassword) {
    throw new Error("Faltan GMAIL_USER o GMAIL_APP_PASSWORD (secrets del repo)");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: appPassword },
  });
}

async function sendDraft(product, imageUrl, caption) {
  const transport = buildTransport();
  const to = process.env.GMAIL_TO || process.env.GMAIL_USER;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2>📸 Post listo para publicar hoy</h2>
      <p><b>${product.name}</b></p>
      <img src="${imageUrl}" alt="${product.name}" style="width:100%; border-radius:8px;" />
      <p style="white-space: pre-wrap; margin-top: 16px;">${caption}</p>
      <p style="color:#888; font-size: 13px; margin-top: 24px;">
        Descargá la imagen y pegá el texto de arriba en un post nuevo de Instagram.
      </p>
    </div>
  `;

  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: `Post de hoy: ${product.name}`,
    html,
    text: `${product.name}\n\n${caption}\n\nImagen: ${imageUrl}`,
  });
}

async function sendError(product, errorMessage) {
  try {
    const transport = buildTransport();
    const to = process.env.GMAIL_TO || process.env.GMAIL_USER;
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: `❌ Falló la preparación del post de ${product.name}`,
      text: errorMessage,
    });
  } catch {
    // Si ni el correo de error se puede mandar, no hay nada más que hacer acá.
  }
}

module.exports = { sendDraft, sendError };
