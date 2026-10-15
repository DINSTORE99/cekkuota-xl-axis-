// api/telegram.js

export default async function handler(req, res) {
  // Hanya menerima POST dari website
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak diizinkan"
    });
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({
        success: false,
        message: "Telegram belum dikonfigurasi"
      });
    }

    const body = req.body || {};
    const type = body.type;

    let message = "";

    // ==================================================
    // WEBSITE DIKUNJUNGI
    // ==================================================

    if (type === "visit") {
      message = `🌐 <b>WEBSITE DIKUNJUNGI</b>

👤 Ada pengunjung membuka website
🕐 Waktu: ${getTime()}

━━━━━━━━━━━━━━
📱 <b>XL &amp; AXIS CHECKER</b>`;
    }

    // ==================================================
    // CEK NOMOR DARI WEBSITE
    // ==================================================

    else if (type === "check") {
      const number = String(body.number || "-");

      
      const displayNumber = escapeHTML(number);

      const result = body.result || {};

      message = `🔎 <b>CEK KUOTA</b>

📱 Nomor: <code>${displayNumber}</code>

━━━━━━━━━━━━━━
📊 <b>INFORMASI</b>

📌 Prefix: ${escapeHTML(result.prefix)}
📡 4G: ${escapeHTML(result.status4g)}
🪪 Dukcapil: ${escapeHTML(result.dukcapil)}
📱 Kartu: ${escapeHTML(result.activeCard)}

━━━━━━━━━━━━━━
📶 <b>VoLTE</b>

• Device: ${escapeHTML(result.volteDevice)}
• Area: ${escapeHTML(result.volteArea)}
• SIM: ${escapeHTML(result.volteSimcard)}

━━━━━━━━━━━━━━
📅 Masa Aktif: ${escapeHTML(result.activePeriod)}
⚠️ Masa Tenggang: ${escapeHTML(result.gracePeriod)}

━━━━━━━━━━━━━━
📦 <b>PAKET &amp; KUOTA</b>

📦 Paket: ${escapeHTML(result.packageName)}
🎁 Benefit: ${escapeHTML(result.benefit)}
📊 Tipe: ${escapeHTML(result.quotaType)}
📈 Kuota: ${escapeHTML(result.quotaTotal)}
💾 Sisa: ${escapeHTML(result.quotaRemaining)}
⏰ Expired: ${escapeHTML(result.quotaExp)}

━━━━━━━━━━━━━━
🕐 ${getTime()}`;
    }

    // ==================================================
    // TIPE TIDAK VALID
    // ==================================================

    else {
      return res.status(400).json({
        success: false,
        message: "Tipe notifikasi tidak valid"
      });
    }

    // ==================================================
    // KIRIM NOTIFIKASI KE TELEGRAM
    // ==================================================

    const telegramUrl =
      `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("TELEGRAM API ERROR:", data);

      return res.status(502).json({
        success: false,
        message: "Gagal mengirim notifikasi Telegram"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notifikasi berhasil dikirim"
    });

  } catch (error) {
    console.error("TELEGRAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHTML(value) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// ==================================================
// WAKTU JAKARTA
// ==================================================

function getTime() {
  return new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta"
  });
}
