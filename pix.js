import QRCode from 'qrcode';

// Formata campos no padrão TLV (Tag-Length-Value) exigido pelo Banco Central do Brasil
function formatTLV(id, value) {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

// Calcula CRC-16/CCITT-FALSE
function calculateCRC16(payload) {
  let crc = 0xFFFF;
  for (let c = 0; c < payload.length; c++) {
    crc ^= payload.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera a string Pix Copia e Cola no padrão oficial do Banco Central
 */
export function generatePixBRCode({
  key,
  name = 'Transcritor do Will',
  city = 'SAO PAULO',
  amount = 0,
  txId = '***'
}) {
  const cleanKey = String(key).trim();
  const cleanName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25);
  const cleanCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15);
  const formattedAmount = Number(amount).toFixed(2);
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';

  const merchantAccountInfo = [
    formatTLV('00', 'br.gov.bcb.pix'),
    formatTLV('01', cleanKey)
  ].join('');

  const additionalData = [
    formatTLV('05', cleanTxId)
  ].join('');

  const parts = [
    formatTLV('00', '01'),
    formatTLV('26', merchantAccountInfo),
    formatTLV('52', '0000'),
    formatTLV('53', '986'),
    formatTLV('54', formattedAmount),
    formatTLV('58', 'BR'),
    formatTLV('59', cleanName),
    formatTLV('60', cleanCity),
    formatTLV('62', additionalData),
    '6304'
  ];

  const payloadWithoutCRC = parts.join('');
  const crc = calculateCRC16(payloadWithoutCRC);

  return payloadWithoutCRC + crc;
}

/**
 * Gera tanto o código Pix Copia e Cola quanto a imagem QR Code em Base64
 */
export async function createPixPayment({
  key,
  name,
  city,
  amount,
  txId
}) {
  const pixCode = generatePixBRCode({ key, name, city, amount, txId });
  const qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
    width: 320,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  return {
    pixCode,
    qrCodeDataUrl,
    amount: Number(amount).toFixed(2)
  };
}
