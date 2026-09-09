// bot/lib/notify.js
//
// Avisa por Telegram (token gratis vía @BotFather, sin trámites de
// verificación de negocio como pide WhatsApp/Meta).

async function notify(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Notificación no enviada: faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });
}

module.exports = { notify };
