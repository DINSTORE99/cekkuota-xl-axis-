const API = "/api/cekxl";
const TELEGRAM_API = "/api/telegram";

const input = document.getElementById("msisdn");
const button = document.getElementById("checkBtn");

const result = document.getElementById("result");
const errorBox = document.getElementById("error");

const buttonText = document.getElementById("buttonText");
const loading = document.getElementById("loading");

// ==========================================
// HELPER
// ==========================================

function setText(id, value) {
  const el = document.getElementById(id);

  if (!el) return;

  el.textContent =
    value === undefined ||
    value === null ||
    value === ""
      ? "-"
      : value;
}

function showError(message) {
  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  if (!errorBox) return;

  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function loadingState(state) {
  if (!button) return;

  button.disabled = state;

  if (loading) {
    loading.classList.toggle("hidden", !state);
  }

  if (buttonText) {
    buttonText.classList.toggle("hidden", state);
  }
}

// ==========================================
// TELEGRAM NOTIFICATION
// ==========================================

async function sendTelegram(type, data = {}) {
  try {
    await fetch(TELEGRAM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type,
        ...data
      })
    });
  } catch (error) {
    console.error("TELEGRAM ERROR:", error);
  }
}

// ==========================================
// NORMALIZE NOMOR
// Support:
// +62 877-7658-1216
// +6287776581216
// 6287776581216
// 0877-7658-1216
// 087776581216
// 87776581216
// ==========================================

function normalizeNumber(value) {
  let number = String(value || "")
    .replace(/\D/g, "");

  // 6287776581216
  if (number.startsWith("62")) {
    return number;
  }

  // 087776581216
  if (number.startsWith("0")) {
    return "62" + number.slice(1);
  }

  // 87776581216
  if (number.startsWith("8")) {
    return "62" + number;
  }

  return number;
}

// ==========================================
// DETECT OPERATOR
// ==========================================

function detectOperator(value) {
  let number = String(value || "")
    .replace(/\D/g, "");

  if (number.startsWith("62")) {
    number = "0" + number.slice(2);
  } else if (number.startsWith("8")) {
    number = "0" + number;
  }

  const prefix = number.slice(0, 4);

  const operators = {
    XL: [
      "0817",
      "0818",
      "0819",
      "0859",
      "0877",
      "0878",
      "0879"
    ],

    AXIS: [
      "0831",
      "0832",
      "0833",
      "0838",
      "0839"
    ],

    TELKOMSEL: [
      "0811",
      "0812",
      "0813",
      "0821",
      "0822",
      "0823",
      "0851",
      "0852",
      "0853"
    ],

    INDOSAT: [
      "0814",
      "0815",
      "0816",
      "0855",
      "0856",
      "0857",
      "0858"
    ],

    TRI: [
      "0895",
      "0896",
      "0897",
      "0898",
      "0899"
    ],

    SMARTFREN: [
      "0881",
      "0882",
      "0883",
      "0884",
      "0885",
      "0886",
      "0887",
      "0888",
      "0889"
    ]
  };

  for (const [operator, prefixes] of Object.entries(operators)) {
    if (prefixes.includes(prefix)) {
      return operator;
    }
  }

  return "UNKNOWN";
}

// ==========================================
// OPERATOR NAME
// ==========================================

function operatorName(operator) {
  const names = {
    XL: "XL",
    AXIS: "AXIS",
    TELKOMSEL: "Telkomsel",
    INDOSAT: "Indosat",
    TRI: "Tri",
    SMARTFREN: "Smartfren",
    UNKNOWN: "Operator tidak dikenal"
  };

  return names[operator] || operator;
}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ==========================================
// STATUS ICON
// ==========================================

function statusIcon(value) {
  if (value === true) {
    return "✅ Aktif";
  }

  if (value === false) {
    return "❌ Tidak";
  }

  return "-";
}

// ==========================================
// GET QUOTA
// ==========================================

function getQuota(dataSp) {
  let value = dataSp?.quotas?.value;

  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (error) {
      console.error("QUOTA JSON ERROR:", error);
      return null;
    }
  }

  if (Array.isArray(value)) {
    for (const group of value) {

      if (Array.isArray(group)) {
        for (const item of group) {
          if (
            item &&
            typeof item === "object" &&
            (
              item.benefits ||
              item.packages
            )
          ) {
            return item;
          }
        }
      }

      if (
        group &&
        typeof group === "object" &&
        (
          group.benefits ||
          group.packages
        )
      ) {
        return group;
      }
    }
  }

  function searchQuota(data) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      for (const item of data) {
        const found = searchQuota(item);

        if (found) {
          return found;
        }
      }

      return null;
    }

    if (typeof data === "object") {

      if (
        data.packages &&
        typeof data.packages === "object"
      ) {
        return data;
      }

      if (
        Array.isArray(data.benefits) &&
        data.benefits.length > 0
      ) {
        return data;
      }

      for (const key of Object.keys(data)) {
        const found = searchQuota(data[key]);

        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  return searchQuota(value);
}

// ==========================================
// GET QUOTA BENEFIT
// ==========================================

function getQuotaBenefit(quota) {
  if (!quota) {
    return {};
  }

  if (
    Array.isArray(quota.benefits) &&
    quota.benefits.length > 0
  ) {
    return quota.benefits[0];
  }

  return {};
}

// ==========================================
// GET QUOTA PACKAGE
// ==========================================

function getQuotaPackage(quota) {
  if (!quota) {
    return {};
  }

  if (
    quota.packages &&
    typeof quota.packages === "object"
  ) {
    return quota.packages;
  }

  return {};
}

// ==========================================
// RENDER RESULT
// ==========================================

function renderResult(response, number) {
  if (
    !response ||
    response.status !== true
  ) {
    throw new Error(
      response?.message ||
      "Data tidak ditemukan"
    );
  }

  const data =
    response.data || {};

  const dataSp =
    data.data_sp || {};

  setText(
    "resultNumber",
    data.msisdn || number
  );

  setText(
    "prefix",
    dataSp?.prefix?.value
  );

  setText(
    "status4g",
    dataSp?.status_4g?.value
  );

  setText(
    "dukcapil",
    dataSp?.dukcapil?.value
  );

  setText(
    "activeCard",
    dataSp?.active_card?.value
  );

  // ========================================
  // VOLTE
  // ========================================

  const volte =
    dataSp?.status_volte?.value || {};

  setText(
    "volteDevice",
    statusIcon(volte.device)
  );

  setText(
    "volteArea",
    statusIcon(volte.area)
  );

  setText(
    "volteSimcard",
    statusIcon(volte.simcard)
  );

  // ========================================
  // PERIOD
  // ========================================

  setText(
    "activePeriod",
    dataSp?.active_period?.value
  );

  setText(
    "gracePeriod",
    dataSp?.grace_period?.value
  );

  // ========================================
  // QUOTA
  // ========================================

  const quota =
    getQuota(dataSp);

  console.log(
    "DATA QUOTAS:",
    dataSp?.quotas
  );

  console.log(
    "QUOTA FOUND:",
    quota
  );

  if (!quota) {

    setText(
      "packageName",
      "Tidak ada paket"
    );

    setText(
      "quotaExp",
      "-"
    );

    setText(
      "benefit",
      "-"
    );

    setText(
      "quotaType",
      "-"
    );

    setText(
      "quotaTotal",
      "-"
    );

    setText(
      "quotaRemaining",
      "-"
    );

    return;
  }

  const benefit =
    getQuotaBenefit(quota);

  const packages =
    getQuotaPackage(quota);

  setText(
    "packageName",
    packages?.name ||
    quota?.name ||
    "Paket aktif"
  );

  setText(
    "quotaExp",
    formatDate(
      packages?.expDate ||
      packages?.expireDate ||
      quota?.expDate
    )
  );

  setText(
    "benefit",
    benefit?.bname ||
    benefit?.name ||
    benefit?.benefit
  );

  setText(
    "quotaType",
    benefit?.type ||
    benefit?.quotaType
  );

  setText(
    "quotaTotal",
    benefit?.quota ||
    benefit?.total ||
    benefit?.totalQuota
  );

  setText(
    "quotaRemaining",
    benefit?.remaining ||
    benefit?.remain ||
    benefit?.remainingQuota
  );
}

// ==========================================
// TELEGRAM RESULT
// ==========================================

function getTelegramResult(response) {
  const data =
    response?.data || {};

  const dataSp =
    data?.data_sp || {};

  const volte =
    dataSp?.status_volte?.value || {};

  const quota =
    getQuota(dataSp);

  const benefit =
    getQuotaBenefit(quota);

  const packages =
    getQuotaPackage(quota);

  return {

    prefix:
      dataSp?.prefix?.value || "-",

    status4g:
      dataSp?.status_4g?.value || "-",

    dukcapil:
      dataSp?.dukcapil?.value || "-",

    activeCard:
      dataSp?.active_card?.value || "-",

    volteDevice:
      statusIcon(volte.device),

    volteArea:
      statusIcon(volte.area),

    volteSimcard:
      statusIcon(volte.simcard),

    activePeriod:
      dataSp?.active_period?.value || "-",

    gracePeriod:
      dataSp?.grace_period?.value || "-",

    packageName:
      packages?.name ||
      quota?.name ||
      "Tidak ada paket",

    quotaExp:
      formatDate(
        packages?.expDate ||
        packages?.expireDate ||
        quota?.expDate
      ),

    benefit:
      benefit?.bname ||
      benefit?.name ||
      "-",

    quotaType:
      benefit?.type ||
      benefit?.quotaType ||
      "-",

    quotaTotal:
      benefit?.quota ||
      benefit?.total ||
      benefit?.totalQuota ||
      "-",

    quotaRemaining:
      benefit?.remaining ||
      benefit?.remain ||
      benefit?.remainingQuota ||
      "-"
  };
}

// ==========================================
// CEK NOMOR
// ==========================================

async function checkNumber() {
  hideError();

  const rawInput =
    String(input?.value || "").trim();

  if (!rawInput) {
    showError(
      "Masukkan nomor XL atau AXIS."
    );

    return;
  }

  // Deteksi operator dari nomor yang dimasukkan.
  // Tetap support:
  // +62 877-7658-1216
  // 0877-7658-1216
  // 87776581216

  const operator =
    detectOperator(rawInput);

  console.log(
    "OPERATOR:",
    operator
  );

  // ========================================
  // HANYA XL / AXIS
  // ========================================

  if (
    operator !== "XL" &&
    operator !== "AXIS"
  ) {

    if (operator === "UNKNOWN") {

      showError(
        "Nomor tidak dikenali. Masukkan nomor XL atau AXIS."
      );

    } else {

      showError(
        `Nomor terdeteksi sebagai ${operatorName(operator)}. Checker ini hanya mendukung XL dan AXIS.`
      );
    }

    return;
  }

  // ========================================
  // NORMALIZE NOMOR
  // ========================================

  const number =
    normalizeNumber(rawInput);

  console.log(
    "NUMBER API:",
    number
  );

  if (!number) {
    showError(
      "Nomor tidak valid."
    );

    return;
  }

  // Panjang nomor Indonesia
  if (
    number.length < 10 ||
    number.length > 15
  ) {

    showError(
      "Nomor tidak valid."
    );

    return;
  }

  loadingState(true);

  try {

    const url =
      `${API}?msisdn=${encodeURIComponent(number)}`;

    console.log(
      "REQUEST:",
      url
    );

    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data?.message ||
        `HTTP Error ${response.status}`
      );
    }

    if (
      !data ||
      data.status !== true
    ) {

      throw new Error(
        data?.message ||
        "Data nomor tidak ditemukan"
      );
    }

    // ======================================
    // TAMPILKAN HASIL
    // ======================================

    renderResult(
      data,
      number
    );

    // ======================================
    // KIRIM HASIL KE TELEGRAM
    // NOMOR TIDAK DIMASK
    // ======================================

    sendTelegram(
      "check",
      {
        number: number,

        result:
          getTelegramResult(data)
      }
    );

    // ======================================
    // TAMPILKAN RESULT CARD
    // ======================================

    if (result) {

      result.classList.remove(
        "hidden"
      );

      result.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  } catch (error) {

    console.error(
      "CEKXL:",
      error
    );

    if (result) {
      result.classList.add(
        "hidden"
      );
    }

    showError(
      error?.message ||
      "Gagal mengambil data."
    );

  } finally {

    loadingState(false);
  }
}

// ==========================================
// BUTTON CEK
// ==========================================

if (button) {

  button.addEventListener(
    "click",
    checkNumber
  );
}

// ==========================================
// ENTER
// ==========================================

if (input) {

  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        checkNumber();
      }
    }
  );
}

// ==========================================
// RESET
// ==========================================

const resetBtn =
  document.getElementById(
    "resetBtn"
  );

if (resetBtn) {

  resetBtn.addEventListener(
    "click",
    () => {

      if (input) {
        input.value = "";
        input.focus();
      }

      if (result) {
        result.classList.add(
          "hidden"
        );
      }

      hideError();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  );
}

// ==========================================
// PASTE
// ==========================================

const pasteBtn =
  document.getElementById(
    "pasteBtn"
  );

if (pasteBtn) {

  pasteBtn.addEventListener(
    "click",
    async () => {

      try {

        const text =
          await navigator.clipboard.readText();

        if (!text) {

          showError(
            "Clipboard kosong."
          );

          return;
        }

        let number =
          text.replace(/\D/g, "");

        if (!number) {

          showError(
            "Clipboard tidak berisi nomor."
          );

          return;
        }

        // +62 877-7658-1216
        // -> 6287776581216
        //
        // 0877-7658-1216
        // -> 87776581216
        //
        // 87776581216
        // -> 87776581216

        if (number.startsWith("62")) {
          number = number.slice(2);
        }

        if (number.startsWith("0")) {
          number = number.slice(1);
        }

        if (input) {

          input.value =
            number;

          input.focus();
        }

        hideError();

        const oldText =
          pasteBtn.textContent;

        pasteBtn.textContent =
          "✓ OK";

        setTimeout(() => {

          pasteBtn.textContent =
            oldText;

        }, 1000);

      } catch (error) {

        console.error(
          "PASTE ERROR:",
          error
        );

        showError(
          "Tidak dapat mengambil nomor dari clipboard."
        );
      }
    }
  );
}

// ==========================================
// NOTIFIKASI WEBSITE DIKUNJUNGI
// ==========================================

sendTelegram("visit");
