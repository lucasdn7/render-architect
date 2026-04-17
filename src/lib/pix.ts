const PIX_MERCHANT_NAME = "PROMPTRENDER";
const PIX_MERCHANT_CITY = "SAO PAULO";

function onlyAscii(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitizeTxid(orderId: string): string {
  return orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "PROMPTRENDER";
}

export function generatePixPayload(params: {
  pixKey: string;
  amountBrl: number;
  description: string;
  orderId: string;
}): string {
  const key = params.pixKey.trim();
  const description = onlyAscii(params.description).slice(0, 72);
  const txid = sanitizeTxid(params.orderId);

  const merchantAccountInfo = formatField(
    "26",
    formatField("00", "br.gov.bcb.pix") + formatField("01", key) + (description ? formatField("02", description) : ""),
  );

  const amount = params.amountBrl.toFixed(2);

  const payloadWithoutCrc =
    formatField("00", "01") +
    formatField("01", "12") +
    merchantAccountInfo +
    formatField("52", "0000") +
    formatField("53", "986") +
    formatField("54", amount) +
    formatField("58", "BR") +
    formatField("59", PIX_MERCHANT_NAME) +
    formatField("60", PIX_MERCHANT_CITY) +
    formatField("62", formatField("05", txid)) +
    "6304";

  return payloadWithoutCrc + crc16(payloadWithoutCrc);
}

export function buildPixQrCodeUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(payload)}`;
}
