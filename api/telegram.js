// api/telegram.js

export default async function handler(req, res) {

  // ==================================================
  // METHOD
  // ==================================================

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


    // ==================================================
    // BODY
    // ==================================================

    const body =
      req.body || {};


    // ==================================================
    // CEK APAKAH INI WEBHOOK TELEGRAM
    // ==================================================

    const telegramMessage =
      body?.message;

    if (
      telegramMessage &&
      telegramMessage.chat &&
      telegramMessage.text
    ) {

      const userChatId =
        telegramMessage.chat.id;

      const text =
        String(
          telegramMessage.text
        ).trim();


      // ==================================================
      // /START
      // ==================================================

      if (
        text === "/start" ||
        text.startsWith("/start ")
      ) {

        await sendTelegram(
          token,
          userChatId,

`📱 <b>XL &amp; AXIS NUMBER CHECKER</b>

Selamat datang 👋

Bot ini dapat digunakan untuk mengecek informasi nomor XL / AXIS.

━━━━━━━━━━━━━━

🔎 <b>Cara menggunakan</b>

Kirim:

<code>/cek 083843750924</code>

Atau:

<code>/cek 6283843750924</code>

━━━━━━━━━━━━━━

📊 <b>Informasi yang tersedia</b>

• Prefix
• Status 4G
• Dukcapil
• Status kartu
• Status VoLTE
• Masa aktif
• Masa tenggang
• Paket
• Benefit
• Total kuota
• Sisa kuota
• Expired paket

━━━━━━━━━━━━━━

⚡ <b>XL &amp; AXIS CHECKER</b>`
        );

        return res.status(200).json({
          success: true
        });
      }


      // ==================================================
      // /HELP
      // ==================================================

      if (
        text === "/help"
      ) {

        await sendTelegram(
          token,
          userChatId,

`ℹ️ <b>BANTUAN</b>

Gunakan perintah:

<code>/cek 083843750924</code>

Contoh:

<code>/cek 083843750924</code>

atau:

<code>/cek 6283843750924</code>

━━━━━━━━━━━━━━

📱 <b>XL &amp; AXIS NUMBER CHECKER</b>`
        );

        return res.status(200).json({
          success: true
        });
      }


      // ==================================================
      // /CEK
      // ==================================================

      if (
        text === "/cek" ||
        text.startsWith("/cek ")
      ) {

        const parts =
          text
            .trim()
            .split(/\s+/);


        if (!parts[1]) {

          await sendTelegram(
            token,
            userChatId,

`❌ <b>Nomor belum dimasukkan</b>

Contoh:

<code>/cek 083843750924</code>`
          );

          return res.status(200).json({
            success: true
          });
        }


        // ==================================================
        // NORMALISASI NOMOR
        // ==================================================

        let number =
          String(parts[1])
            .replace(/\D/g, "");


        // 08xxxx → 628xxxx

        if (
          number.startsWith("0")
        ) {

          number =
            "62" +
            number.slice(1);

        }


        // 8xxxx → 628xxxx

        else if (
          number.startsWith("8")
        ) {

          number =
            "62" +
            number;

        }


        // ==================================================
        // VALIDASI
        // ==================================================

        if (
          !number.startsWith("62") ||
          number.length < 10 ||
          number.length > 15
        ) {

          await sendTelegram(
            token,
            userChatId,

`❌ <b>Nomor tidak valid</b>

Gunakan nomor XL / AXIS Indonesia.

Contoh:

<code>/cek 083843750924</code>`
          );

          return res.status(200).json({
            success: true
          });
        }


        // ==================================================
        // LOADING
        // ==================================================

        const loading =
          await sendTelegram(
            token,
            userChatId,

`🔎 <b>SEDANG MENGECEK</b>

📱 Nomor:
<code>${escapeHTML(number)}</code>

⏳ Mohon tunggu...`
          );


        // ==================================================
        // API XL / AXIS
        // ==================================================

        const apiUrl =
          "https://api.dns-server.biz.id/api/cekxl?msisdn=" +
          encodeURIComponent(number);


        const apiResponse =
          await fetch(
            apiUrl,
            {
              method: "GET",
              headers: {
                "x-proxy-token":
                  "bakul_paket"
              },
              cache: "no-store"
            }
          );


        const raw =
          await apiResponse.text();


        let data;

        try {

          data =
            JSON.parse(raw);

        } catch {

          throw new Error(
            "API utama mengembalikan response bukan JSON."
          );

        }


        // ==================================================
        // RESPONSE ERROR
        // ==================================================

        if (
          !apiResponse.ok ||
          data?.status !== true
        ) {

          throw new Error(
            data?.message ||
            "Data nomor tidak ditemukan."
          );

        }


        // ==================================================
        // DATA
        // ==================================================

        const result =
          data?.data || {};

        const dataSp =
          result?.data_sp || {};


        // ==================================================
        // VOLTE
        // ==================================================

        const volte =
          dataSp?.status_volte?.value || {};


        // ==================================================
        // QUOTA
        // ==================================================

        const quota =
          getQuota(dataSp);


        const benefit =
          quota?.benefits?.[0] || {};


        const packages =
          quota?.packages || {};


        // ==================================================
        // FORMAT
        // ==================================================

        const resultNumber =
          result?.msisdn ||
          number;


        const prefix =
          getValue(
            dataSp?.prefix?.value
          );


        const status4g =
          getValue(
            dataSp?.status_4g?.value
          );


        const dukcapil =
          getValue(
            dataSp?.dukcapil?.value
          );


        const activeCard =
          getValue(
            dataSp?.active_card?.value
          );


        const volteDevice =
          statusIcon(
            volte?.device
          );


        const volteArea =
          statusIcon(
            volte?.area
          );


        const volteSimcard =
          statusIcon(
            volte?.simcard
          );


        const activePeriod =
          getValue(
            dataSp?.active_period?.value
          );


        const gracePeriod =
          getValue(
            dataSp?.grace_period?.value
          );


        const packageName =
          getValue(
            packages?.name
          );


        const quotaExp =
          formatDate(
            packages?.expDate
          );


        const benefitName =
          getValue(
            benefit?.bname
          );


        const quotaType =
          getValue(
            benefit?.type
          );


        const quotaTotal =
          getValue(
            benefit?.quota
          );


        const quotaRemaining =
          getValue(
            benefit?.remaining
          );


        // ==================================================
        // HASIL TELEGRAM
        // ==================================================

        const resultText =

`🔎 <b>HASIL CEK XL &amp; AXIS</b>

━━━━━━━━━━━━━━

📱 <b>INFORMASI NOMOR</b>

📞 Nomor: <code>${escapeHTML(resultNumber)}</code>
📌 Prefix: ${escapeHTML(prefix)}
📡 4G: ${escapeHTML(status4g)}
🪪 Dukcapil: ${escapeHTML(dukcapil)}
📱 Kartu: ${escapeHTML(activeCard)}

━━━━━━━━━━━━━━

📶 <b>VoLTE</b>

• Device: ${escapeHTML(volteDevice)}
• Area: ${escapeHTML(volteArea)}
• SIM: ${escapeHTML(volteSimcard)}

━━━━━━━━━━━━━━

📅 <b>MASA KARTU</b>

• Aktif: ${escapeHTML(activePeriod)}
• Masa Tenggang: ${escapeHTML(gracePeriod)}

━━━━━━━━━━━━━━

📦 <b>PAKET &amp; KUOTA</b>

📦 Paket: ${escapeHTML(packageName)}
🎁 Benefit: ${escapeHTML(benefitName)}
📊 Tipe: ${escapeHTML(quotaType)}
📈 Kuota: ${escapeHTML(quotaTotal)}
💾 Sisa: ${escapeHTML(quotaRemaining)}
⏰ Expired: ${escapeHTML(quotaExp)}

━━━━━━━━━━━━━━

⚡ <b>XL &amp; AXIS NUMBER CHECKER</b>`;


        // ==================================================
        // HAPUS LOADING
        // ==================================================

        if (
          loading?.ok &&
          loading?.result?.message_id
        ) {

          await deleteTelegramMessage(
            token,
            userChatId,
            loading.result.message_id
          );

        }


        // ==================================================
        // KIRIM HASIL
        // ==================================================

        await sendTelegram(
          token,
          userChatId,
          resultText
        );


        return res.status(200).json({
          success: true
        });
      }


      // ==================================================
      // COMMAND TIDAK DIKENAL
      // ==================================================

      await sendTelegram(
        token,
        userChatId,

`❓ <b>Perintah tidak dikenal</b>

Gunakan:

<code>/cek 083843750924</code>

atau:

<code>/help</code>`
      );


      return res.status(200).json({
        success: true
      });

    }


    // ==================================================
    // NOTIFIKASI WEBSITE
    // ==================================================

    const type =
      body.type;


    let message = "";


    // ==================================================
    // WEBSITE DIKUNJUNGI
    // ==================================================

    if (
      type === "visit"
    ) {

      message =

`🌐 <b>WEBSITE DIKUNJUNGI</b>

👤 Ada pengunjung membuka website
🕐 Waktu: ${new Date().toLocaleString(
  "id-ID",
  {
    timeZone: "Asia/Jakarta"
  }
)}

━━━━━━━━━━━━━━
📱 <b>XL &amp; AXIS CHECKER</b>`;

    }


    // ==================================================
    // CEK NOMOR DARI WEBSITE
    // ==================================================

    else if (
      type === "check"
    ) {

      const number =
        String(
          body.number || "-"
        );


      // ==================================================
      // MASKING NOMOR
      // ==================================================

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

📱 Nomor: <code>${escapeHTML(
  maskedNumber
)}</code>

━━━━━━━━━━━━━━
📊 <b>INFORMASI</b>

📌 Prefix: ${escapeHTML(
  result.prefix || "-"
)}
📡 4G: ${escapeHTML(
  result.status4g || "-"
)}
🪪 Dukcapil: ${escapeHTML(
  result.dukcapil || "-"
)}
📱 Kartu: ${escapeHTML(
  result.activeCard || "-"
)}

━━━━━━━━━━━━━━
📶 <b>VoLTE</b>

• Device: ${escapeHTML(
  result.volteDevice || "-"
)}
• Area: ${escapeHTML(
  result.volteArea || "-"
)}
• SIM: ${escapeHTML(
  result.volteSimcard || "-"
)}

━━━━━━━━━━━━━━
📅 Masa Aktif: ${escapeHTML(
  result.activePeriod || "-"
)}
⚠️ Masa Tenggang: ${escapeHTML(
  result.gracePeriod || "-"
)}

━━━━━━━━━━━━━━
📦 <b>PAKET &amp; KUOTA</b>

📦 Paket: ${escapeHTML(
  result.packageName || "-"
)}
🎁 Benefit: ${escapeHTML(
  result.benefit || "-"
)}
📊 Tipe: ${escapeHTML(
  result.quotaType || "-"
)}
📈 Kuota: ${escapeHTML(
  result.quotaTotal || "-"
)}
💾 Sisa: ${escapeHTML(
  result.quotaRemaining || "-"
)}
⏰ Expired: ${escapeHTML(
  result.quotaExp || "-"
)}

━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString(
  "id-ID",
  {
    timeZone: "Asia/Jakarta"
  }
)}`;

    }


    // ==================================================
    // TYPE TIDAK VALID
    // ==================================================

    else {

      return res.status(400).json({
        success: false,
        message:
          "Tipe notifikasi tidak valid"
      });

    }


    // ==================================================
    // KIRIM TELEGRAM
    // ==================================================

    const telegramUrl =
      `https://api.telegram.org/bot${token}/sendMessage`;


    const response =
      await fetch(
        telegramUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            chat_id:
              chatId,

            text:
              message,

            parse_mode:
              "HTML"
          })
        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.ok
    ) {

      console.error(
        "Telegram API:",
        data
      );

      return res.status(502).json({
        success: false,
        message:
          "Gagal mengirim notifikasi Telegram"
      });

    }


    // ==================================================
    // SUCCESS
    // ==================================================

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
      message:
        "Terjadi kesalahan server",
      error:
        error?.message || "-"
    });

  }

}


// ==================================================
// GET QUOTA
// ==================================================

function getQuota(dataSp) {

  const quotas =
    dataSp?.quotas?.value;


  if (
    !Array.isArray(quotas)
  ) {
    return null;
  }


  for (
    const group of quotas
  ) {

    // Bentuk:
    // [
    //   [
    //     { benefits, packages }
    //   ]
    // ]

    if (
      Array.isArray(group)
    ) {

      for (
        const item of group
      ) {

        if (
          item &&
          (
            Array.isArray(
              item.benefits
            ) ||
            item.packages
          )
        ) {

          return item;
        }

      }

    }


    // Bentuk:
    // [
    //   { benefits, packages }
    // ]

    else if (
      group &&
      (
        Array.isArray(
          group.benefits
        ) ||
        group.packages
      )
    ) {

      return group;

    }

  }


  return null;
}


// ==================================================
// GET VALUE
// ==================================================

function getValue(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return "-";
  }


  return String(value);
}


// ==================================================
// STATUS ICON
// ==================================================

function statusIcon(value) {

  if (value === true) {
    return "✅ Aktif";
  }

  if (value === false) {
    return "❌ Tidak";
  }

  return "-";
}


// ==================================================
// FORMAT DATE
// ==================================================

function formatDate(value) {

  if (!value) {
    return "-";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);
  }


  return date.toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


// ==================================================
// ESCAPE HTML TELEGRAM
// ==================================================

function escapeHTML(value) {

  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// ==================================================
// SEND TELEGRAM
// ==================================================

async function sendTelegram(
  token,
  chatId,
  message
) {

  const telegramUrl =
    `https://api.telegram.org/bot${token}/sendMessage`;


  const response =
    await fetch(
      telegramUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          chat_id:
            chatId,

          text:
            message,

          parse_mode:
            "HTML"
        })
      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data.ok
  ) {

    console.error(
      "Telegram sendMessage:",
      data
    );

  }


  return data;
}


// ==================================================
// DELETE MESSAGE
// ==================================================

async function deleteTelegramMessage(
  token,
  chatId,
  messageId
) {

  try {

    const url =
      `https://api.telegram.org/bot${token}/deleteMessage`;


    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          chat_id:
            chatId,

          message_id:
            messageId
        })
      }
    );

  } catch (error) {

    console.error(
      "DELETE TELEGRAM ERROR:",
      error
    );

  }
}
