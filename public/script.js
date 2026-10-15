const API = "/api/cekxl";
const TELEGRAM_API = "/api/telegram";

const input = document.getElementById("msisdn");
const button = document.getElementById("checkBtn");

const result = document.getElementById("result");
const errorBox = document.getElementById("error");

const buttonText = document.getElementById("buttonText");
const loading = document.getElementById("loading");


/* ================================
   HELPER
================================ */

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
    loading.classList.toggle(
      "hidden",
      !state
    );
  }

  if (buttonText) {
    buttonText.classList.toggle(
      "hidden",
      state
    );
  }
}


/* ================================
   TELEGRAM
================================ */

async function sendTelegram(type, data = {}) {

  try {

    await fetch(
      TELEGRAM_API,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          type,
          ...data
        })
      }
    );

  } catch (error) {

    console.error(
      "TELEGRAM ERROR:",
      error
    );

  }
}


/* ================================
   NORMALISASI NOMOR
================================ */

function normalizeNumber(value) {

  let number =
    String(value || "")
      .replace(/\D/g, "");

  // 08xxxx -> 628xxxx
  if (number.startsWith("0")) {

    number =
      "62" + number.slice(1);

  }

  // 8xxxx -> 628xxxx
  else if (number.startsWith("8")) {

    number =
      "62" + number;

  }

  return number;
}


/* ================================
   FORMAT TANGGAL
================================ */

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
    return value;
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


/* ================================
   STATUS BOOLEAN
================================ */

function statusIcon(value) {

  if (value === true) {
    return "✅ Aktif";
  }

  if (value === false) {
    return "❌ Tidak";
  }

  return "-";
}


/* ================================
   AMBIL DATA KUOTA
================================ */

function getQuota(dataSp) {

  let value =
    dataSp?.quotas?.value;


  if (!value) {
    return null;
  }


  /*
    Kalau API mengirim value
    sebagai JSON string
  */

  if (typeof value === "string") {

    try {

      value =
        JSON.parse(value);

    } catch (error) {

      console.error(
        "QUOTA JSON ERROR:",
        error
      );

      return null;

    }

  }


  /*
    Struktur yang biasa:

    quotas
      └── value
           └── [
                [
                  {
                    benefits: [],
                    packages: {}
                  }
                ]
              ]
  */

  if (Array.isArray(value)) {

    for (const group of value) {

      /*
        Group pertama
      */

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


      /*
        Jika langsung object
      */

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


  /*
    Fallback jika struktur API
    berbeda sedikit.
  */

  function searchQuota(data) {

    if (!data) {
      return null;
    }


    if (Array.isArray(data)) {

      for (const item of data) {

        const found =
          searchQuota(item);

        if (found) {
          return found;
        }

      }

      return null;
    }


    if (
      typeof data === "object"
    ) {

      /*
        Prioritas object dengan
        packages + benefits
      */

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


      for (
        const key of Object.keys(data)
      ) {

        const found =
          searchQuota(data[key]);

        if (found) {
          return found;
        }

      }

    }

    return null;
  }


  return searchQuota(value);
}


/* ================================
   AMBIL BENEFIT
================================ */

function getQuotaBenefit(quota) {

  if (!quota) {
    return {};
  }


  if (
    Array.isArray(
      quota.benefits
    ) &&
    quota.benefits.length > 0
  ) {

    return quota.benefits[0];

  }


  return {};
}


/* ================================
   AMBIL PACKAGE
================================ */

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


/* ================================
   TAMPILKAN HASIL
================================ */

function renderResult(
  response,
  number
) {

  /*
    API:

    response
      └── data
           ├── msisdn
           ├── hasil
           └── data_sp
  */

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


  /* ================================
     NOMOR
  ================================ */

  setText(
    "resultNumber",
    data.msisdn || number
  );


  /* ================================
     INFORMASI UTAMA
  ================================ */

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


  /* ================================
     VOLTE
  ================================ */

  const volte =
    dataSp?.status_volte?.value || {};


  setText(
    "volteDevice",
    statusIcon(
      volte.device
    )
  );


  setText(
    "volteArea",
    statusIcon(
      volte.area
    )
  );


  setText(
    "volteSimcard",
    statusIcon(
      volte.simcard
    )
  );


  /* ================================
     MASA KARTU
  ================================ */

  setText(
    "activePeriod",
    dataSp?.active_period?.value
  );


  setText(
    "gracePeriod",
    dataSp?.grace_period?.value
  );


  /* ================================
     KUOTA
  ================================ */

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
    getQuotaBenefit(
      quota
    );


  const packages =
    getQuotaPackage(
      quota
    );


  /* ================================
     NAMA PAKET
  ================================ */

  setText(
    "packageName",
    packages?.name ||
    quota?.name ||
    "Paket aktif"
  );


  /* ================================
     EXPIRED
  ================================ */

  setText(
    "quotaExp",
    formatDate(
      packages?.expDate ||
      packages?.expireDate ||
      quota?.expDate
    )
  );


  /* ================================
     BENEFIT
  ================================ */

  setText(
    "benefit",
    benefit?.bname ||
    benefit?.name ||
    benefit?.benefit
  );


  /* ================================
     TIPE
  ================================ */

  setText(
    "quotaType",
    benefit?.type ||
    benefit?.quotaType
  );


  /* ================================
     TOTAL KUOTA
  ================================ */

  setText(
    "quotaTotal",
    benefit?.quota ||
    benefit?.total ||
    benefit?.totalQuota
  );


  /* ================================
     SISA KUOTA
  ================================ */

  setText(
    "quotaRemaining",
    benefit?.remaining ||
    benefit?.remain ||
    benefit?.remainingQuota
  );

}


/* ================================
   DATA HASIL UNTUK TELEGRAM
================================ */

function getTelegramResult(
  response
) {

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
      statusIcon(
        volte.device
      ),

    volteArea:
      statusIcon(
        volte.area
      ),

    volteSimcard:
      statusIcon(
        volte.simcard
      ),

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


/* ================================
   CEK NOMOR
================================ */

async function checkNumber() {

  hideError();


  const number =
    normalizeNumber(
      input?.value
    );


  /* ================================
     VALIDASI
  ================================ */

  if (!number) {

    showError(
      "Masukkan nomor XL atau AXIS."
    );

    return;

  }


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


    /* ================================
       REQUEST API
    ================================ */

    const url =
      `${API}?msisdn=${encodeURIComponent(number)}`;


    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    /* ================================
       RESPONSE
    ================================ */

    const data =
      await response.json();


    /* ================================
       HTTP ERROR
    ================================ */

    if (!response.ok) {

      throw new Error(
        data?.message ||
        `HTTP Error ${response.status}`
      );

    }


    /* ================================
       API ERROR
    ================================ */

    if (
      !data ||
      data.status !== true
    ) {

      throw new Error(
        data?.message ||
        "Data tidak ditemukan"
      );

    }


    /* ================================
       RENDER HASIL
    ================================ */

    renderResult(
      data,
      number
    );


    /* ================================
       TELEGRAM
    ================================ */

    sendTelegram(
      "check",
      {
        number,
        result:
          getTelegramResult(
            data
          )
      }
    );


    /* ================================
       TAMPILKAN RESULT
    ================================ */

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


/* ================================
   BUTTON CEK
================================ */

if (button) {

  button.addEventListener(
    "click",
    checkNumber
  );

}


/* ================================
   ENTER
================================ */

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


/* ================================
   RESET
================================ */

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


/* ================================
   PASTE
================================ */

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


        const cleaned =
          text.replace(
            /\D/g,
            ""
          );


        if (!cleaned) {

          showError(
            "Clipboard tidak berisi nomor."
          );

          return;

        }


        if (input) {

          input.value =
            cleaned;

          input.focus();

        }


        hideError();


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


/* ================================
   NOTIFIKASI WEBSITE
================================ */

sendTelegram(
  "visit"
);
