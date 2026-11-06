// Integers → Lebanese Arabic number words, as IPA (one entry per word).

const UNITS = ['sifr', 'waːħad', 'tneːn', 'tleːte', 'ʔarbaʕa', 'xamse', 'sitte', 'sabʕa', 'tmeːne', 'tisʕa', 'ʕaʃra',
  'ħdaʕʃ', 'tnaʕʃ', 'tlattaʕʃ', 'ʔarbaʕtaʕʃ', 'xamstaʕʃ', 'sittaʕʃ', 'sabaʕtaʕʃ', 'tmantaʕʃ', 'tisaʕtaʕʃ'];
const TENS = ['', '', 'ʕiʃriːn', 'tleːtiːn', 'ʔarbʕiːn', 'xamsiːn', 'sittiːn', 'sabʕiːn', 'tmeːniːn', 'tisʕiːn'];
const HUNDREDS = ['', 'mijje', 'mijteːn', 'tlett mijje', 'ʔarbaʕ mijje', 'xams mijje', 'sitt mijje', 'sabaʕ mijje',
  'tmen mijje', 'tisaʕ mijje'];
const THOUSANDS_FEW = ['', 'ʔalf', 'ʔalfeːn', 'tlett aːleːf', 'ʔarbaʕt aːleːf', 'xamst aːleːf', 'sitt aːleːf',
  'sabaʕt aːleːf', 'tment aːleːf', 'tisaʕt aːleːf', 'ʕaʃert aːleːf'];

function below1000(n) {
  const parts = [];
  if (n >= 100) parts.push(HUNDREDS[Math.floor(n / 100)]);
  const r = n % 100;
  if (r >= 20) parts.push(r % 10 ? `${UNITS[r % 10]} w ${TENS[Math.floor(r / 10)]}` : TENS[r / 10]);
  else if (r) parts.push(UNITS[r]);
  return parts.join(' w ');
}

/** Digits (Western or Arabic-Indic) → array of IPA words */
export function numberToIPA(digits) {
  const d = digits.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660));
  const n = Number(d);
  if (d.length > 6) return [...d].flatMap((x) => numberToIPA(x));
  if (n === 0) return [UNITS[0]];
  const parts = [];
  const th = Math.floor(n / 1000), rest = n % 1000;
  if (th) parts.push(th <= 10 ? THOUSANDS_FEW[th] : `${below1000(th)} ʔalf`);
  if (rest) parts.push(below1000(rest));
  return parts.join(' w ').split(' ');
}
