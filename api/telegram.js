// api/telegram.js

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

    // ==================================================
    // TELEGRAM WEBHOOK
    // ==================================================

    if (body.message) {

      const message =
        body.message;

      const userChatId =
        message?.chat?.id;

      const text =
        String(message?.text || "").trim();

      if (!userChatId) {
        return res.status(200).json({
          success: true
        });
      }

      // ==================================================
      // /START
      // ==================================================

      if (
        text === "/start" ||
        text.startsWith("/start ")
      ) {

        await sendMessage(
          token,
          userChatId,

`📱 <b>XL &amp; AXIS CHECKER</b>

Selamat datang 👋

Silakan pilih menu di bawah.

━━━━━━━━━━━━━━
⚡ Cepat
🔒 Aman
📡 XL &amp; AXIS`,
          {
            inline_keyboard: [
              [
                {
                  text: "🔍 CEK NOMOR",
                  callback_data: "cek_nomor"
                }
              ],
              [
                {
                  text: "📊 CARA PAKAI",
                  callback_data: "cara_pakai"
                }
              ],
              [
                {
                  text: "🌐 WEBSITE",
                  url: "https://cekkuota-xl-axis.vercel.app"
                }
              ]
            ]
          }
        );

        return res.status(200).json({
          success: true
        });
      }

      // ==================================================
      // PESAN NOMOR LANGSUNG
      // ==================================================

      if (
        !text.startsWith("/") &&
        text.replace(/\D/g, "").length >= 10
      ) {

        await cekNomor(
          token,
          userChatId,
          text
        );

        return res.status(200).json({
          success: true
        });
      }

      // ==================================================
      // COMMAND /CEK
      // ==================================================

      if (
        text === "/cek" ||
        text.startsWith("/cek ")
      ) {

        const parts =
          text.split(/\s+/);

        if (!parts[1]) {

          await sendMessage(
            token,
            userChatId,

`📱 <b>CEK NOMOR</b>

Silakan kirim nomor XL / AXIS.

Contoh:

<code>083843750924</code>`,
            {
              inline_keyboard: [
                [
                  {
                    text: "🔙 KEMBALI",
                    callback_data: "menu"
                  }
                ]
              ]
            }
          );

          return res.status(200).json({
            success: true
          });
        }

        await cekNomor(
          token,
          userChatId,
          parts[1]
        );

        return res.status(200).json({
          success: true
        });
      }

      // ==================================================
      // CALLBACK BUTTON
      // ==================================================

      if (body.callback_query) {

        const callback =
          body.callback_query;

        const callbackId =
          callback.id;

        const callbackChatId =
          callback.message?.chat?.id;

        const callbackData =
          callback.data;

        // Hilangkan loading tombol
        await answerCallback(
          token,
          callbackId
        );

        // ==============================
        // MENU
        // ==============================

        if (
          callbackData === "menu"
        ) {

          await editMessage(
            token,
            callbackChatId,
            callback.message.message_id,

`📱 <b>XL &amp; AXIS CHECKER</b>

Silakan pilih menu di bawah.`,
            {
              inline_keyboard: [
                [
                  {
                    text: "🔍 CEK NOMOR",
                    callback_data: "cek_nomor"
                  }
                ],
                [
                  {
                    text: "📊 CARA PAKAI",
                    callback_data: "cara_pakai"
                  }
                ],
                [
                  {
                    text: "🌐 WEBSITE",
                    url: "https://cekkuota-xl-axis.vercel.app"
                  }
                ]
              ]
            }
          );

          return res.status(200).json({
            success: true
          });
        }

        // ==============================
        // CEK NOMOR
        // ==============================

        if (
          callbackData === "cek_nomor"
        ) {

          await editMessage(
            token,
            callbackChatId,
            callback.message.message_id,

`🔍 <b>CEK NOMOR XL / AXIS</b>

Silakan kirim nomor XL / AXIS kamu.

Contoh:

<code>083843750924</code>

atau:

<code>6283843750924</code>

━━━━━━━━━━━━━━

📱 Kirim nomor sekarang.`,
            {
              inline_keyboard: [
                [
                  {
                    text: "🔙 KEMBALI",
                    callback_data: "menu"
                  }
                ]
              ]
            }
          );

          return res.status(200).json({
            success: true
          });
        }

        // ==============================
        // CARA PAKAI
        // ==============================

        if (
          callbackData === "cara_pakai"
        ) {

          await editMessage(
            token,
            callbackChatId,
            callback.message.message_id,

`📊 <b>CARA MENGGUNAKAN</b>

1️⃣ Tekan tombol <b>CEK NOMOR</b>

2️⃣ Kirim nomor XL / AXIS.

Contoh:

<code>083843750924</code>

3️⃣ Tunggu proses pengecekan.

4️⃣ Hasil informasi nomor akan dikirim otomatis.

━━━━━━━━━━━━━━

📱 XL &amp; AXIS NUMBER CHECKER`,
            {
              inline_keyboard: [
                [
                  {
                    text: "🔍 CEK NOMOR",
                    callback_data: "cek_nomor"
                  }
                ],
                [
                  {
                    text: "🔙 KEMBALI",
                    callback_data: "menu"
                  }
                ]
              ]
            }
          );

          return res.status(200).json({
            success: true
          });
        }

        return res.status(200).json({
          success: true
        });
      }

      // ==================================================
      // PERINTAH TIDAK DIKENAL
      // ==================================================

      await sendMessage(
        token,
        userChatId,

`❓ <b>Perintah tidak dikenal</b>

Tekan tombol di bawah untuk membuka menu.`,
        {
          inline_keyboard: [
            [
              {
                text: "🏠 MENU",
                callback_data: "menu"
              }
            ]
          ]
        }
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

    let notificationMessage = "";

    // ==================================================
    // WEBSITE DIKUNJUNGI
    // ==================================================

    if (type === "visit") {

      notificationMessage =
`🌐 <b>WEBSITE DIKUNJUNGI</b>

👤 Ada pengunjung membuka website
🕐 Waktu: ${getTime()}

━━━━━━━━━━━━━━
📱 <b>XL &amp; AXIS CHECKER</b>`;

    }

    // ==================================================
    // CEK DARI WEBSITE
    // ==================================================

    else if (type === "check") {

      const number =
        String(body.number || "-");

      const maskedNumber =
        maskNumber(number);

      const result =
        body.result || {};

      notificationMessage =
`🔎 <b>CEK KUOTA</b>

📱 Nomor: <code>${escapeHTML(maskedNumber)}</code>

━━━━━━━━━━━━━━
📊 <b>INFORMASI</b>

📌 Prefix: ${escapeHTML(result.prefix || "-")}
📡 4G: ${escapeHTML(result.status4g || "-")}
🪪 Dukcapil: ${escapeHTML(result.dukcapil || "-")}
📱 Kartu: ${escapeHTML(result.activeCard || "-")}

━━━━━━━━━━━━━━
📶 <b>VoLTE</b>

• Device: ${escapeHTML(result.volteDevice || "-")}
• Area: ${escapeHTML(result.volteArea || "-")}
• SIM: ${escapeHTML(result.volteSimcard || "-")}

━━━━━━━━━━━━━━
📅 Masa Aktif: ${escapeHTML(result.activePeriod || "-")}
⚠️ Masa Tenggang: ${escapeHTML(result.gracePeriod || "-")}

━━━━━━━━━━━━━━
📦 <b>PAKET &amp; KUOTA</b>

📦 Paket: ${escapeHTML(result.packageName || "-")}
🎁 Benefit: ${escapeHTML(result.benefit || "-")}
📊 Tipe: ${escapeHTML(result.quotaType || "-")}
📈 Kuota: ${escapeHTML(result.quotaTotal || "-")}
💾 Sisa: ${escapeHTML(result.quotaRemaining || "-")}
⏰ Expired: ${escapeHTML(result.quotaExp || "-")}

━━━━━━━━━━━━━━
🕐 ${getTime()}`;

    }

    else {

      return res.status(400).json({
        success: false,
        message: "Tipe notifikasi tidak valid"
      });

    }

    // ==================================================
    // KIRIM NOTIFIKASI
    // ==================================================

    const result =
      await sendMessage(
        token,
        chatId,
        notificationMessage
      );

    if (!result?.ok) {

      return res.status(502).json({
        success: false,
        message:
          "Gagal mengirim notifikasi Telegram"
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


// ==================================================
// CEK NOMOR
// ==================================================

async function cekNomor(
  token,
  chatId,
  inputNumber
) {

  let number =
    String(inputNumber || "")
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

    await sendMessage(
      token,
      chatId,

`❌ <b>NOMOR TIDAK VALID</b>

Gunakan nomor XL / AXIS Indonesia.

Contoh:

<code>083843750924</code>`
    );

    return;
  }

  // ==================================================
  // LOADING
  // ==================================================

  const loading =
    await sendMessage(
      token,
      chatId,

`🔍 <b>SEDANG MENGECEK...</b>

📱 Nomor:
<code>${escapeHTML(number)}</code>

⏳ Mohon tunggu...`
    );

  try {

    // ==================================================
    // API
    // ==================================================

    const apiUrl =
      "https://api.dns-server.biz.id/api/cekxl?msisdn=" +
      encodeURIComponent(number);

    const response =
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
      await response.text();

    let data;

    try {

      data =
        JSON.parse(raw);

    } catch {

      throw new Error(
        "API mengembalikan response bukan JSON"
      );
    }

    if (
      !response.ok ||
      data?.status !== true
    ) {

      throw new Error(
        data?.message ||
        "Data nomor tidak ditemukan"
      );
    }

    // ==================================================
    // DATA
    // ==================================================

    const result =
      data?.data || {};

    const dataSp =
      result?.data_sp || {};

    const volte =
      dataSp?.status_volte?.value || {};

    const quota =
      getQuota(dataSp);

    const benefit =
      quota?.benefits?.[0] || {};

    const packages =
      quota?.packages || {};

    // ==================================================
    // HASIL
    // ==================================================

    const resultText =
`🔎 <b>HASIL CEK XL &amp; AXIS</b>

━━━━━━━━━━━━━━

📱 <b>INFORMASI NOMOR</b>

📞 Nomor: <code>${escapeHTML(result.msisdn || number)}</code>
📌 Prefix: ${escapeHTML(getValue(dataSp?.prefix?.value))}
📡 4G: ${escapeHTML(getValue(dataSp?.status_4g?.value))}
🪪 Dukcapil: ${escapeHTML(getValue(dataSp?.dukcapil?.value))}
📱 Kartu: ${escapeHTML(getValue(dataSp?.active_card?.value))}

━━━━━━━━━━━━━━

📶 <b>VoLTE</b>

• Device: ${escapeHTML(statusIcon(volte.device))}
• Area: ${escapeHTML(statusIcon(volte.area))}
• SIM: ${escapeHTML(statusIcon(volte.simcard))}

━━━━━━━━━━━━━━

📅 <b>MASA KARTU</b>

• Aktif: ${escapeHTML(getValue(dataSp?.active_period?.value))}
• Masa Tenggang: ${escapeHTML(getValue(dataSp?.grace_period?.value))}

━━━━━━━━━━━━━━

📦 <b>PAKET &amp; KUOTA</b>

📦 Paket: ${escapeHTML(getValue(packages.name))}
🎁 Benefit: ${escapeHTML(getValue(benefit.bname))}
📊 Tipe: ${escapeHTML(getValue(benefit.type))}
📈 Kuota: ${escapeHTML(getValue(benefit.quota))}
💾 Sisa: ${escapeHTML(getValue(benefit.remaining))}
⏰ Expired: ${escapeHTML(formatDate(packages.expDate))}

━━━━━━━━━━━━━━

⚡ <b>XL &amp; AXIS CHECKER</b>`;

    // ==================================================
    // HAPUS LOADING
    // ==================================================

    if (
      loading?.result?.message_id
    ) {

      await deleteMessage(
        token,
        chatId,
        loading.result.message_id
      );
    }

    // ==================================================
    // KIRIM HASIL
    // ==================================================

    await sendMessage(
      token,
      chatId,
      resultText,
      {
        inline_keyboard: [
          [
            {
              text: "🔍 CEK NOMOR LAGI",
              callback_data: "cek_nomor"
            }
          ],
          [
            {
              text: "🏠 MENU",
              callback_data: "menu"
            }
          ]
        ]
      }
    );

  } catch (error) {

    if (
      loading?.result?.message_id
    ) {

      await deleteMessage(
        token,
        chatId,
        loading.result.message_id
      );
    }

    await sendMessage(
      token,
      chatId,

`❌ <b>GAGAL MENGECEK</b>

${escapeHTML(
  error?.message ||
  "Terjadi kesalahan saat mengambil data."
)}`,

      {
        inline_keyboard: [
          [
            {
              text: "🔄 COBA LAGI",
              callback_data: "cek_nomor"
            }
          ],
          [
            {
              text: "🏠 MENU",
              callback_data: "menu"
            }
          ]
        ]
      }
    );
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

    if (
      Array.isArray(group)
    ) {

      for (
        const item of group
      ) {

        if (
          item &&
          (
            Array.isArray(item.benefits) ||
            item.packages
          )
        ) {

          return item;
        }
      }

    } else if (
      group &&
      (
        Array.isArray(group.benefits) ||
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
// STATUS
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
    Number.isNaN(date.getTime())
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
// MASK NUMBER
// ==================================================

function maskNumber(number) {

  const value =
    String(number || "");

  if (
    value.length <= 7
  ) {

    return "******";
  }

  return (
    value.slice(0, 4) +
    "******" +
    value.slice(-3)
  );
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

  return new Date()
    .toLocaleString(
      "id-ID",
      {
        timeZone:
          "Asia/Jakarta"
      }
    );
}


// ==================================================
// SEND MESSAGE
// ==================================================

async function sendMessage(
  token,
  chatId,
  text,
  keyboard = null
) {

  const url =
    `https://api.telegram.org/bot${token}/sendMessage`;

  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };

  if (keyboard) {

    body.reply_markup = {
      inline_keyboard: keyboard.inline_keyboard
    };
  }

  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)
      }
    );

  return response.json();
}


// ==================================================
// EDIT MESSAGE
// ==================================================

async function editMessage(
  token,
  chatId,
  messageId,
  text,
  keyboard = null
) {

  const url =
    `https://api.telegram.org/bot${token}/editMessageText`;

  const body = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: "HTML"
  };

  if (keyboard) {

    body.reply_markup = {
      inline_keyboard:
        keyboard.inline_keyboard
    };
  }

  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)
      }
    );

  return response.json();
}


// ==================================================
// CALLBACK ANSWER
// ==================================================

async function answerCallback(
  token,
  callbackId
) {

  const url =
    `https://api.telegram.org/bot${token}/answerCallbackQuery`;

  await fetch(
    url,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        callback_query_id:
          callbackId
      })
    }
  );
}


// ==================================================
// DELETE MESSAGE
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
          chat_id:
            chatId,
          message_id:
            messageId
        })
      }
    );

  } catch (error) {

    console.error(
      "DELETE MESSAGE:",
      error
    );
  }
}
