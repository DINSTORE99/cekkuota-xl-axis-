const msisdnInput = document.getElementById("msisdn");
const checkBtn = document.getElementById("checkBtn");
const btnText = document.getElementById("btnText");
const loading = document.getElementById("loading");

const errorBox = document.getElementById("error");
const result = document.getElementById("result");

const year = document.getElementById("year");

year.textContent = new Date().getFullYear();

function normalizeNumber(value) {
  let number = String(value || "")
    .replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = "62" + number.substring(1);
  }

  if (number.startsWith("8")) {
    number = "62" + number;
  }

  return number;
}

function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setLoading(state) {
  checkBtn.disabled = state;

  if (state) {
    btnText.classList.add("hidden");
    loading.classList.remove("hidden");
  } else {
    btnText.classList.remove("hidden");
    loading.classList.add("hidden");
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

function setText(id, value) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent =
      value === undefined ||
      value === null ||
      value === ""
        ? "-"
        : value;
  }
}

function renderResult(data, number) {

  const sp = data?.data_sp || {};

  const prefix =
    sp.prefix?.value ||
    "-";

  const dukcapil =
    sp.dukcapil?.value ||
    "-";

  const volte =
    sp.status_volte?.value || {};

  const status4g =
    sp.status_4g?.value ||
    "-";

  const cardAge =
    sp.active_card?.value ||
    "-";

  const activePeriod =
    sp.active_period?.value ||
    "-";

  const gracePeriod =
    sp.grace_period?.value ||
    "-";

  setText("resultNumber", number);
  setText("prefix", prefix);
  setText("status4g", status4g);
  setText("dukcapil", dukcapil);
  setText("cardAge", cardAge);

  setText(
    "volteDevice",
    volte.device ? "✅ Aktif" : "❌ Tidak"
  );

  setText(
    "volteArea",
    volte.area ? "✅ Aktif" : "❌ Tidak"
  );

  setText(
    "volteSim",
    volte.simcard ? "✅ Aktif" : "❌ Tidak"
  );

  setText("activePeriod", activePeriod);
  setText("gracePeriod", gracePeriod);

  const quotaGroups =
    sp.quotas?.value || [];

  let quotaData = null;

  if (
    quotaGroups.length &&
    Array.isArray(quotaGroups[0])
  ) {
    const group = quotaGroups[0];

    const item = group[0];

    if (item) {
      quotaData = item;
    }
  }

  if (quotaData) {

    const benefits =
      quotaData.benefits?.[0] || {};

    const packageInfo =
      quotaData.packages || {};

    setText(
      "packageName",
      packageInfo.name || "-"
    );

    setText(
      "quotaExp",
      formatDate(packageInfo.expDate)
    );

    setText(
      "benefit",
      benefits.bname || "-"
    );

    setText(
      "quotaType",
      benefits.type || "-"
    );

    setText(
      "quotaTotal",
      benefits.quota || "-"
    );

    setText(
      "quotaRemaining",
      benefits.remaining || "-"
    );

  } else {

    setText("packageName", "Tidak ada paket");
    setText("quotaExp", "-");
    setText("benefit", "-");
    setText("quotaType", "-");
    setText("quotaTotal", "-");
    setText("quotaRemaining", "-");

  }

  result.classList.remove("hidden");

  result.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function checkNumber() {

  hideError();

  const raw = msisdnInput.value.trim();

  if (!raw) {
    showError("Masukkan nomor XL atau AXIS terlebih dahulu.");
    return;
  }

  const number = normalizeNumber(raw);

  if (!/^62\d{8,15}$/.test(number)) {
    showError(
      "Nomor tidak valid. Contoh: 6283843750924"
    );
    return;
  }

  setLoading(true);

  try {

    const response = await fetch(
      `/api/cekxl?msisdn=${encodeURIComponent(number)}`
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(
        data.message ||
        "Gagal mengambil informasi nomor."
      );
    }

    renderResult(data, number);

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "Terjadi kesalahan saat mengecek nomor."
    );

  } finally {

    setLoading(false);

  }
}

checkBtn.addEventListener(
  "click",
  checkNumber
);

msisdnInput.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      checkNumber();
    }
  }
);

document
  .getElementById("resetBtn")
  .addEventListener("click", () => {

    result.classList.add("hidden");

    msisdnInput.value = "";

    msisdnInput.focus();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });
