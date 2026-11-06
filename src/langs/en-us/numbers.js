// Integers → English words.

const UNITS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const GROUPS = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];

function below1000(n) {
  const parts = [];
  if (n >= 100) parts.push(`${UNITS[Math.floor(n / 100)]} hundred`);
  const r = n % 100;
  if (r >= 20) parts.push(TENS[Math.floor(r / 10)] + (r % 10 ? ` ${UNITS[r % 10]}` : ''));
  else if (r) parts.push(UNITS[r]);
  return parts.join(' ');
}

export function numberToWords(digits) {
  if (digits.length > 12) return digits.split('').map((d) => numberToWords(d)).join(' ');
  let n = Number(digits);
  if (n === 0) return 'zero';
  const parts = [];
  for (const [v, name] of GROUPS) {
    const q = Math.floor(n / v);
    if (q) { parts.push(`${below1000(q)} ${name}`); n %= v; }
  }
  if (n) parts.push(below1000(n));
  return parts.join(' ');
}
