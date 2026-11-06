// Integers → Mandarin readings (tone-numbered pinyin keys, one per syllable).

const DIGITS = ['ling2', 'yi1', 'er4', 'san1', 'si4', 'wu3', 'liu4', 'qi1', 'ba1', 'jiu3'];
const UNITS = ['', 'shi2', 'bai3', 'qian1'];

function below10000(n, leading) {
  const out = [];
  const ds = String(n).padStart(4, '0').split('').map(Number);
  let zero = false;
  ds.forEach((d, i) => {
    const unit = 3 - i;
    if (d === 0) { if (out.length) zero = true; return; }
    if (zero) { out.push('ling2'); zero = false; }
    // 十 alone for 10–19 at the start (十五, not 一十五); 两 before 百 / 千
    if (unit === 1 && d === 1 && !out.length && leading) out.push('shi2');
    else {
      out.push(d === 2 && unit >= 2 ? 'liang3' : DIGITS[d]);
      if (unit) out.push(UNITS[unit]);
    }
  });
  return out;
}

export function numberToKeys(digits) {
  if (digits.length > 8) return [...digits].map((d) => DIGITS[Number(d)]);
  const n = Number(digits);
  if (n === 0) return ['ling2'];
  const wan = Math.floor(n / 10000), rest = n % 10000;
  const out = [];
  if (wan) out.push(...below10000(wan, true), 'wan4');
  if (rest) {
    if (wan && rest < 1000) out.push('ling2');
    out.push(...below10000(rest, !wan));
  }
  return out;
}
