// Integers → Spanish words.

const UNITS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
  'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno',
  'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos',
  'setecientos', 'ochocientos', 'novecientos'];

function below1000(n) {
  if (n === 100) return 'cien';
  const parts = [];
  if (n >= 100) parts.push(HUNDREDS[Math.floor(n / 100)]);
  const r = n % 100;
  if (r >= 30) parts.push(TENS[Math.floor(r / 10)] + (r % 10 ? ` y ${UNITS[r % 10]}` : ''));
  else if (r) parts.push(UNITS[r]);
  return parts.join(' ');
}

export function numberToWords(digits) {
  if (digits.length > 12) return digits.split('').map((d) => numberToWords(d)).join(' ');
  let n = Number(digits);
  if (n === 0) return 'cero';
  const parts = [];
  const millions = Math.floor(n / 1e6);
  if (millions) { parts.push(millions === 1 ? 'un millón' : `${below1000(millions).replace(/uno$/, 'un')} millones`); n %= 1e6; }
  const thousands = Math.floor(n / 1e3);
  if (thousands) { parts.push(thousands === 1 ? 'mil' : `${below1000(thousands).replace(/uno$/, 'ún')} mil`); n %= 1e3; }
  if (n) parts.push(below1000(n));
  return parts.join(' ');
}
