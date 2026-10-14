export default async function handler(req, res) {
  try {
    const { msisdn } = req.query;

    if (!msisdn) {
      return res.status(400).json({
        status: false,
        message: "Nomor MSISDN wajib diisi"
      });
    }

    const nomor = String(msisdn).replace(/\D/g, "");

    if (!/^62\d{8,15}$/.test(nomor)) {
      return res.status(400).json({
        status: false,
        message: "Format nomor tidak valid. Gunakan format 628xxxx"
      });
    }

    const response = await fetch(
      `https://api.dns-server.biz.id/api/cekxl?msisdn=${encodeURIComponent(nomor)}`,
      {
        method: "GET",
        headers: {
          "x-proxy-token": "bakul_paket"
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      message: "Server API sedang tidak dapat dihubungi"
    });
  }
}
