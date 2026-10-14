export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method tidak diizinkan"
    });
  }

  try {
    const { msisdn } = req.query;

    if (!msisdn) {
      return res.status(400).json({
        status: false,
        message: "Nomor MSISDN wajib diisi"
      });
    }

    const number = String(msisdn).replace(/\D/g, "");

    if (!number) {
      return res.status(400).json({
        status: false,
        message: "Nomor tidak valid"
      });
    }

    const apiUrl =
      "https://api.dns-server.biz.id/api/cekxl?msisdn=" +
      encodeURIComponent(number);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-proxy-token": "bakul_paket"
      }
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        status: false,
        message: "API utama mengembalikan response bukan JSON"
      });
    }

    return res.status(response.status).json(data);

  } catch (error) {

    console.error("CEKXL ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Gagal menghubungi API cek XL/AXIS"
    });
  }
}
