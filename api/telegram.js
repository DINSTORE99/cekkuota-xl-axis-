// api/telegram.js

export default async function handler(req, res) {

  // ==========================================
  // METHOD
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      status: false,
      message: "Method tidak diizinkan"
    });
  }

  try {

    // ==========================================
    // TELEGRAM TOKEN
    // ==========================================

    const token =
      process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error(
        "TELEGRAM_BOT_TOKEN belum disetting"
      );

      return res.status(500).json({
        status: false,
        message:
          "TELEGRAM_BOT_TOKEN belum disetting"
      });
    }


    // ==========================================
    // UPDATE TELEGRAM
    // ==========================================

    const update = req.body;

    const message =
      update?.message;

    if (!message) {
      return res.status(200).json({
        status: true
      });
    }


    const chatId =
      message?.chat?.id;

    const text =
      message?.text || "";


    if (!chatId) {
      return res.status(200).json({
        status: true
      });
    }


    // ==========================================
    // /START
    // ==========================================

    if (
      text === "/start" ||
      text.startsWith("/start ")
    ) {

      await sendMessage(
        token,
        chatId,
        `📱 *XL & AXIS NUMBER CHECKER*

Selamat datang 👋

Bot ini digunakan untuk mengecek informasi nomor XL / AXIS.

━━━━━━━━━━━━━━━━━━

🔍 *Cara menggunakan*

Kirim:

\`/cek 083843750924\`

atau:

\`/cek 6283843750924\`

━━━━━━━━━━━━━━━━━━

📊 *Informasi yang tersedia*

• Prefix
• Status 4G
• Dukcapil
• Status kartu
• Status VoLTE
• Masa aktif
• Grace period
• Paket
• Masa berlaku
• Benefit
• Total kuota
• Sisa kuota

━━━━━━━━━━━━━━━━━━

⚡ *XL & AXIS NUMBER CHECKER*`
      );

      return res.status(200).json({
        status: true
      });
    }


    // ==========================================
    // /HELP
    // ==========================================

    if (
      text === "/help" ||
      text === "/bantuan"
    ) {

      await sendMessage(
        token,
        chatId,
        `ℹ️ *BANTUAN*

Gunakan perintah:

🔍 /cek 083843750924

Contoh:

\`/cek 083843750924\`

Nomor juga bisa menggunakan format:

\`083843750924\`

atau:

\`6283843750924\`

━━━━━━━━━━━━━━━━━━

📱 XL & AXIS NUMBER CHECKER`
      );

      return res.status(200).json({
        status: true
      });
    }


    // ==========================================
    // CEK NOMOR
    // ==========================================

    if (
      text === "/cek" ||
      text.startsWith("/cek ")
    ) {

      const parts =
        text.trim().split(/\s+/);

      // Tidak ada nomor
      if (!parts[1]) {

        await sendMessage(
          token,
          chatId,
          `❌ *Nomor belum dimasukkan.*

Contoh:

\`/cek 083843750924\``
        );

        return res.status(200).json({
          status: true
        });
      }


      // ========================================
      // NORMALISASI NOMOR
      // ========================================

      let number =
        String(parts[1])
          .replace(/\D/g, "");


      // 08xxxx
      if (
        number.startsWith("0")
      ) {

        number =
          "62" +
          number.slice(1);
      }


      // 8xxxx
      else if (
        number.startsWith("8")
      ) {

        number =
          "62" +
          number;
      }


      // ========================================
      // VALIDASI
      // ========================================

      if (
        !number.startsWith("62")
      ) {

        await sendMessage(
          token,
          chatId,
          `❌ *Nomor tidak valid.*

Gunakan nomor XL / AXIS Indonesia.

Contoh:

\`/cek 083843750924\``
        );

        return res.status(200).json({
          status: true
        });
      }


      if (
        number.length < 10 ||
        number.length > 15
      ) {

        await sendMessage(
          token,
          chatId,
          `❌ *Nomor tidak valid.*

Panjang nomor tidak sesuai.`
        );

        return res.status(200).json({
          status: true
        });
      }


      // ========================================
      // PESAN LOADING
      // ========================================

      const loadingMessage =
        await sendMessage(
          token,
          chatId,
          `🔍 *SEDANG MENGECEK*

📱 Nomor:
\`${number}\`

⏳ Mohon tunggu...`
        );


      // ========================================
      // API XL / AXIS
      // ========================================

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
          "API mengembalikan response bukan JSON."
        );
      }


      // ========================================
      // CEK RESPONSE
      // ========================================

      if (
        !apiResponse.ok ||
        data?.status !== true
      ) {

        throw new Error(
          data?.message ||
          "Data nomor tidak ditemukan."
        );
      }


      // ========================================
      // DATA UTAMA
      // ========================================

      const result =
        data?.data || {};

      const dataSp =
        result?.data_sp || {};


      // ========================================
      // VOLTE
      // ========================================

      const volte =
        dataSp?.status_volte?.value || {};


      // ========================================
      // QUOTA
      // ========================================

      const quota =
        getQuota(dataSp);


      const benefit =
        quota?.benefits?.[0] || {};


      const packages =
        quota?.packages || {};


      // ========================================
      // FORMAT DATA
      // ========================================

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


      // ========================================
      // HASIL
      // ========================================

      const resultText = `
📱 *HASIL CEK XL & AXIS*

━━━━━━━━━━━━━━━━━━

📞 *INFORMASI NOMOR*

Nomor        : \`${resultNumber}\`
Prefix       : ${prefix}
Status 4G    : ${status4g}
Dukcapil     : ${dukcapil}
Status Kartu : ${activeCard}

━━━━━━━━━━━━━━━━━━

📶 *STATUS VoLTE*

Device       : ${volteDevice}
Area         : ${volteArea}
SIM Card     : ${volteSimcard}

━━━━━━━━━━━━━━━━━━

📅 *MASA KARTU*

Aktif        : ${activePeriod}
Grace Period : ${gracePeriod}

━━━━━━━━━━━━━━━━━━

📦 *PAKET & KUOTA*

Paket        : ${packageName}
Masa Berlaku : ${quotaExp}

Benefit      : ${benefitName}
Tipe Kuota   : ${quotaType}
Total Kuota  : ${quotaTotal}
Sisa Kuota   : ${quotaRemaining}

━━━━━━━━━━━━━━━━━━

⚡ *XL & AXIS NUMBER CHECKER*
`.trim();


      // ========================================
      // HAPUS PESAN LOADING
      // ========================================

      if (
        loadingMessage?.result?.message_id
      ) {

        await deleteMessage(
          token,
          chatId,
          loadingMessage.result.message_id
        );

      }


      // ========================================
      // KIRIM HASIL
      // ========================================

      await sendMessage(
        token,
        chatId,
        resultText
      );


      return res.status(200).json({
        status: true
      });
    }


    // ==========================================
    // NOMOR LANGSUNG
    // ==========================================

    const directNumber =
      text.replace(/\D/g, "");

    if (
      text &&
      directNumber.length >= 10 &&
      directNumber.length <= 15
    ) {

      let number =
        directNumber;


      if (
        number.startsWith("0")
      ) {

        number =
          "62" +
          number.slice(1);

      } else if (
        number.startsWith("8")
      ) {

        number =
          "62" +
          number;

      }


      await sendMessage(
        token,
        chatId,
        `💡 Untuk mengecek nomor, gunakan:

\`/cek ${number}\``
      );

      return res.status(200).json({
        status: true
      });
    }


    // ==========================================
    // PERINTAH TIDAK DIKENAL
    // ==========================================

    await sendMessage(
      token,
      chatId,
      `❓ *Perintah tidak dikenal.*

Gunakan:

\`/cek 083843750924\`

atau:

/help`
    );


    return res.status(200).json({
      status: true
    });


  } catch (error) {

    console.error(
      "TELEGRAM BOT ERROR:",
      error
    );


    // ========================================
    // ERROR KE USER
    // ========================================

    try {

      const token =
        process.env.TELEGRAM_BOT_TOKEN;

      const chatId =
        req.body?.message?.chat?.id;

      if (
        token &&
        chatId
      ) {

        await sendMessage(
          token,
          chatId,
          `❌ *GAGAL MELAKUKAN PENGECEKAN*

${escapeMarkdown(
  error?.message ||
  "Terjadi kesalahan."
)}`
        );

      }

    } catch (sendError) {

      console.error(
        "SEND ERROR:",
        sendError
      );

    }


    return res.status(200).json({
      status: false,
      message:
        error?.message ||
        "Terjadi kesalahan."
    });
  }
}


// ==================================================
// GET QUOTA
// ==================================================

function getQuota(dataSp) {

  const quotas =
    dataSp?.quotas?.value;


  if (!Array.isArray(quotas)) {
    return null;
  }


  /*
    Struktur yang diharapkan:

    quotas.value
    [
      [
        {
          benefits: [],
          packages: {}
        }
      ]
    ]
  */


  for (
    const group of quotas
  ) {

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

    } else if (
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
// VALUE
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
// ESCAPE MARKDOWN
// ==================================================

function escapeMarkdown(text) {

  return String(text)
    .replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}


// ==================================================
// SEND TELEGRAM MESSAGE
// ==================================================

async function sendMessage(
  token,
  chatId,
  text
) {

  const url =
    `https://api.telegram.org/bot${token}/sendMessage`;


  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown"
        })
      }
    );


  const result =
    await response.json();


  if (!response.ok) {

    console.error(
      "Telegram sendMessage error:",
      result
    );

  }


  return result;
}


// ==================================================
// DELETE TELEGRAM MESSAGE
// ==================================================

async function deleteMessage(
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
          chat_id: chatId,
          message_id: messageId
        })
      }
    );

  } catch (error) {

    console.error(
      "Delete message error:",
      error
    );

  }
}
