// Integers → Brazilian Portuguese words, so digits can be transcribed.

const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const HUNDREDS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos',
  'setecentos', 'oitocentos', 'novecentos'];
const GROUPS = [[1e9, 'bilhão', 'bilhões'], [1e6, 'milhão', 'milhões'], [1e3, 'mil', 'mil']];

function below1000(n) {
  if (n === 100) return 'cem';
  const parts = [];
  const c = Math.floor(n / 100), r = n % 100;
  if (c) parts.push(HUNDREDS[c]);
  if (r >= 20) parts.push(r % 10 ? `${TENS[Math.floor(r / 10)]} e ${UNITS[r % 10]}` : TENS[r / 10]);
  else if (r) parts.push(UNITS[r]);
  return parts.join(' e ');
}

export function numberToWords(digits) {
  if (digits.length > 12) return digits.split('').map((d) => numberToWords(d)).join(' ');
  const n = Number(digits);
  if (n === 0) return 'zero';
  const parts = [];
  let rest = n;
  for (const [v, sing, plur] of GROUPS) {
    const q = Math.floor(rest / v);
    if (!q) continue;
    parts.push(v === 1e3 && q === 1 ? 'mil' : `${below1000(q)} ${q === 1 ? sing : plur}`);
    rest %= v;
  }
  if (rest) parts.push((parts.length && (rest < 100 || rest % 100 === 0) ? 'e ' : '') + below1000(rest));
  return parts.join(' ');
}
