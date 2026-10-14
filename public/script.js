const API = "/api/cekxl";
const TELEGRAM_API = "/api/telegram";

const input = document.getElementById("msisdn");
const button = document.getElementById("checkBtn");

const result = document.getElementById("result");
const errorBox = document.getElementById("error");

const buttonText = document.getElementById("buttonText");
const loading = document.getElementById("loading");


/* =========================================================
   HELPER
========================================================= */

function setText(id, value) {
  const el = document.getElementById(id);

  if (!el) return;

  el.textContent =
    value === undefined ||
    value === null ||
    value === ""
      ? "-"
      : String(value);
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

  if (button) {
    button.disabled = state;
  }

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


/* =========================================================
   TELEGRAM NOTIFICATION
========================================================= */

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

    console.error(
      "Telegram notification:",
      error
    );

  }
}


/* =========================================================
   NORMALISASI NOMOR
========================================================= */

function normalizeNumber(value) {

  let number =
    String(value || "")
      .replace(/\D/g, "");

  /*
    08xxxxxxxx
    menjadi
    628xxxxxxxx
  */

  if (number.startsWith("0")) {

    number =
      "62" + number.slice(1);

  }

  /*
    8xxxxxxxx
    menjadi
    628xxxxxxxx
  */

  else if (number.startsWith("8")) {

    number =
      "62" + number;

  }

  return number;
}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

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


/* =========================================================
   STATUS BOOLEAN
========================================================= */

function statusIcon(value) {

  if (value === true) {
    return "✅ Aktif";
  }

  if (value === false) {
    return "❌ Tidak";
  }

  return "-";
}


/* =========================================================
   CARI DATA SECARA REKURSIF
========================================================= */

function findObjectWithBenefits(data) {

  if (!data) {
    return null;
  }


  /*
    Kalau array
  */

  if (Array.isArray(data)) {

    for (const item of data) {

      const found =
        findObjectWithBenefits(item);

      if (found) {
        return found;
      }

    }

    return null;
  }


  /*
    Kalau object
  */

  if (
    typeof data === "object"
  ) {

    /*
      Prioritas object yang mempunyai
      benefits.
    */

    if (
      Array.isArray(data.benefits) &&
      data.benefits.length > 0
    ) {

      return data;

    }


    /*
      Cari ke dalam object.
    */

    for (
      const key of Object.keys(data)
    ) {

      const found =
        findObjectWithBenefits(
          data[key]
        );

      if (found) {
        return found;
      }

    }

  }

  return null;
}


/* =========================================================
   AMBIL DATA KUOTA
========================================================= */

function getQuota(dataSp) {

  const quotas =
    dataSp?.quotas;

  if (!quotas) {
    return null;
  }


  /*
    Struktur normal:

    data_sp
      └── quotas
           └── value
  */

  const value =
    quotas?.value;


  if (value) {

    const found =
      findObjectWithBenefits(value);

    if (found) {
      return found;
    }

  }


  /*
    Fallback:
    cari langsung dari object quotas.
  */

  return findObjectWithBenefits(
    quotas
  );
}


/* =========================================================
   AMBIL BENEFIT
========================================================= */

function getBenefit(quota) {

  if (!quota) {
    return null;
  }


  /*
    Format normal
  */

  if (
    Array.isArray(
      quota.benefits
    ) &&
    quota.benefits.length > 0
  ) {

    return quota.benefits[0];

  }


  return null;
}


/* =========================================================
   AMBIL PACKAGE
========================================================= */

function getPackage(quota) {

  if (!quota) {
    return {};
  }


  /*
    Format normal
  */

  if (
    quota.packages &&
    typeof quota.packages === "object"
  ) {

    return quota.packages;

  }


  /*
    Beberapa response API bisa
    menggunakan package.
  */

  if (
    quota.package &&
    typeof quota.package === "object"
  ) {

    return quota.package;

  }


  return {};
}


/* =========================================================
   TAMPILKAN HASIL
========================================================= */

function renderResult(
  response,
  number
) {

  /*
    Response API:

    {
      status: true,
      data: {
        msisdn,
        hasil,
        data_sp
      }
    }
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


  /* =======================================================
     NOMOR
  ======================================================= */

  setText(
    "resultNumber",
    data.msisdn || number
  );


  /* =======================================================
     INFORMASI UTAMA
  ======================================================= */

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


  /* =======================================================
     VOLTE
  ======================================================= */

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


  /* =======================================================
     MASA KARTU
  ======================================================= */

  setText(
    "activePeriod",
    dataSp?.active_period?.value
  );


  setText(
    "gracePeriod",
    dataSp?.grace_period?.value
  );


  /* =======================================================
     DATA KUOTA
  ======================================================= */

  const quota =
    getQuota(dataSp);


  /*
    Tidak ada paket
  */

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


  /* =======================================================
     BENEFIT
  ======================================================= */

  const benefit =
    getBenefit(quota) || {};


  /* =======================================================
     PACKAGE
  ======================================================= */

  const packages =
    getPackage(quota);


  /* =======================================================
     NAMA PAKET
  ======================================================= */

  setText(
    "packageName",
    packages?.name ||
    quota?.name ||
    "Paket aktif"
  );


  /* =======================================================
     EXP DATE
  ======================================================= */

  setText(
    "quotaExp",
    formatDate(
      packages?.expDate ||
      packages?.expireDate ||
      quota?.expDate
    )
  );


  /* =======================================================
     BENEFIT NAME
  ======================================================= */

  setText(
    "benefit",
    benefit?.bname ||
    benefit?.name ||
    benefit?.benefit
  );


  /* =======================================================
     TIPE KUOTA
  ======================================================= */

  setText(
    "quotaType",
    benefit?.type ||
    benefit?.quotaType
  );


  /* =======================================================
     TOTAL KUOTA
  ======================================================= */

  setText(
    "quotaTotal",
    benefit?.quota ||
    benefit?.total ||
    benefit?.totalQuota
  );


  /* =======================================================
     SISA KUOTA
  ======================================================= */

  setText(
    "quotaRemaining",
    benefit?.remaining ||
    benefit?.remain ||
    benefit?.remainingQuota
  );

}


/* =========================================================
   DATA UNTUK TELEGRAM
========================================================= */

function buildTelegramResult(dataSp) {

  const quota =
    getQuota(dataSp);


  const benefit =
    getBenefit(quota) || {};


  const packages =
    getPackage(quota);


  const volte =
    dataSp?.status_volte?.value || {};


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


/* =========================================================
   CEK NOMOR
========================================================= */

async function checkNumber() {

  hideError();


  const number =
    normalizeNumber(
      input?.value
    );


  /* =======================================================
     VALIDASI KOSONG
  ======================================================= */

  if (!number) {

    showError(
      "Masukkan nomor XL atau AXIS."
    );

    return;

  }


  /* =======================================================
     VALIDASI PANJANG
  ======================================================= */

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


    /* =====================================================
       REQUEST API
    ===================================================== */

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


    /* =====================================================
       PARSE RESPONSE
    ===================================================== */

    const data =
      await response.json();


    /* =====================================================
       CEK HTTP
    ===================================================== */

    if (!response.ok) {

      throw new Error(
        data?.message ||
        `HTTP Error ${response.status}`
      );

    }


    /* =====================================================
       CEK STATUS API
    ===================================================== */

    if (
      !data ||
      data.status !== true
    ) {

      throw new Error(
        data?.message ||
        "Data nomor tidak ditemukan."
      );

    }


    /* =====================================================
       TAMPILKAN HASIL
    ===================================================== */

    renderResult(
      data,
      number
    );


    /* =====================================================
       TELEGRAM
    ===================================================== */

    const dataSp =
      data?.data?.data_sp || {};


    sendTelegram(
      "check",
      {
        number,
        result:
          buildTelegramResult(
            dataSp
          )
      }
    );


    /* =====================================================
       TAMPILKAN RESULT CARD
    ===================================================== */

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
      "CEKXL ERROR:",
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


/* =========================================================
   BUTTON CEK
========================================================= */

if (button) {

  button.addEventListener(
    "click",
    checkNumber
  );

}


/* =========================================================
   ENTER
========================================================= */

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


/* =========================================================
   RESET
========================================================= */

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


/* =========================================================
   PASTE
========================================================= */

const pasteBtn =
  document.getElementById(
    "pasteBtn"
  );


if (pasteBtn) {

  pasteBtn.addEventListener(
    "click",
    async () => {

      try {


        /* =================================================
           AMBIL CLIPBOARD
        ================================================= */

        const text =
          await navigator.clipboard.readText();


        if (!text) {

          showError(
            "Clipboard kosong."
          );

          return;

        }


        /* =================================================
           AMBIL ANGKA SAJA
        ================================================= */

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


        /* =================================================
           MASUKKAN KE INPUT
        ================================================= */

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


/* =========================================================
   NOTIFIKASI WEBSITE DIKUNJUNGI
========================================================= */

sendTelegram(
  "visit"
);
