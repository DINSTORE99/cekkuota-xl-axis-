export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak diizinkan"
    });
  }

  try {

    const token =
      process.env.TELEGRAM_BOT_TOKEN;

    const chatId =
      process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({
        success: false,
        message: "Telegram belum dikonfigurasi"
      });
    }

    const body = req.body || {};

    const type = body.type;

    let message = "";

    /* ================================
       WEBSITE DIKUNJUNGI
    ================================= */

    if (type === "visit") {

      message =
`🌐 <b>WEBSITE DIKUNJUNGI</b>

👤 Ada pengunjung membuka website
🕐 Waktu: ${new Date().toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta"
})}

━━━━━━━━━━━━━━
📱 <b>XL & AXIS CHECKER</b>`;

    }

    /* ================================
       CEK NOMOR
    ================================= */

    else if (type === "check") {

      const number =
        String(body.number || "-");

      /*
        Nomor disamarkan agar tidak
        mengirim nomor lengkap ke Telegram.
      */

      const maskedNumber =
        number.length > 7
          ? number.slice(0, 4) +
            "******" +
            number.slice(-3)
          : "******";

      const result =
        body.result || {};

      message =
`🔎 <b>CEK KUOTA</b>

📱 Nomor: <code>${maskedNumber}</code>

━━━━━━━━━━━━━━
📊 <b>INFORMASI</b>

📌 Prefix: ${result.prefix || "-"}
📡 4G: ${result.status4g || "-"}
🪪 Dukcapil: ${result.dukcapil || "-"}
📱 Kartu: ${result.activeCard || "-"}

━━━━━━━━━━━━━━
📶 <b>VoLTE</b>

• Device: ${result.volteDevice || "-"}
• Area: ${result.volteArea || "-"}
• SIM: ${result.volteSimcard || "-"}

━━━━━━━━━━━━━━
📅 Masa Aktif: ${result.activePeriod || "-"}
⚠️ Masa Tenggang: ${result.gracePeriod || "-"}

━━━━━━━━━━━━━━
📦 <b>PAKET & KUOTA</b>

📦 Paket: ${result.packageName || "-"}
🎁 Benefit: ${result.benefit || "-"}
📊 Tipe: ${result.quotaType || "-"}
📈 Kuota: ${result.quotaTotal || "-"}
💾 Sisa: ${result.quotaRemaining || "-"}
⏰ Expired: ${result.quotaExp || "-"}

━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta"
})}`;

    }

    else {

      return res.status(400).json({
        success: false,
        message: "Tipe notifikasi tidak valid"
      });

    }

    const telegramUrl =
      `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(
      telegramUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data.ok) {

      return res.status(502).json({
        success: false,
        message: "Gagal mengirim notifikasi Telegram"
      });

    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {

    console.error(
      "TELEGRAM ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });

  }
}
