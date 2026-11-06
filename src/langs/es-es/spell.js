// Spanish phonemic syllables → Spanish spelling (with written accents where the
// default stress rule would put the stress elsewhere).

const FRONT = new Set(['e', 'i']);
const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
const SIMPLE = { p: 'p', b: 'b', t: 't', d: 'd', f: 'f', m: 'm', n: 'n', l: 'l', s: 's', ɾ: 'r', x: 'j', ʝ: 'y', tʃ: 'ch', ɲ: 'ñ' };
const CODA = { s: 's', n: 'n', l: 'l', ɾ: 'r', d: 'd', θ: 'z', x: 'j', b: 'b', k: 'c', p: 'p', t: 't', ɡ: 'g', f: 'f', m: 'm' };

function spellOnset(syl, i, syls) {
  const on = syl.onset;
  const front = FRONT.has(syl.nuc.v);
  const prev = syls[i - 1];
  let out = '';
  for (let k = 0; k < on.length; k++) {
    const c = on[k], nx = on[k + 1], direct = k === on.length - 1;
    switch (c) {
      case 'k':
        if (nx === 'w') { out += 'cu'; k++; } else out += front && direct ? 'qu' : 'c';
        break;
      case 'ɡ':
        if (nx === 'w') { out += front ? 'gü' : 'gu'; k++; } else out += front && direct ? 'gu' : 'g';
        break;
      case 'θ': out += front && direct ? 'c' : 'z'; break;
      case 'R': out += k === 0 && i > 0 && !prev.coda.length ? 'rr' : 'r'; break;
      case 'j': out += k === 0 ? 'hi' : 'i'; break;
      case 'w': out += k === 0 ? 'hu' : 'u'; break;
      default: out += SIMPLE[c] ?? c;
    }
  }
  return out;
}

function defaultStress(n, word) {
  if (n === 1) return 0;
  return /[aeiouns]$/.test(word) ? n - 2 : n - 1;
}

export function spellWord(word) {
  const syls = word.syls;
  const parts = syls.map((s, i) => {
    const last = i === syls.length - 1;
    const off = s.off ? (s.off.g === 'j' ? (last && !s.coda.length ? 'y' : 'i') : 'u') : '';
    return { onset: spellOnset(s, i, syls), vowel: s.nuc.v, off, coda: s.coda.map((c) => CODA[c] ?? c).join('') };
  });
  const plain = parts.map((p) => p.onset + p.vowel + p.off + p.coda).join('');
  const si = syls.findIndex((s) => s.stress);
  if (si >= 0) {
    const s = syls[si];
    const prev = syls[si - 1], next = syls[si + 1];
    // A stressed i/u next to another vowel needs an accent to be read as its own syllable (país, río)
    const hiatus = 'iu'.includes(s.nuc.v) && (
      (prev && !s.onset.length && !prev.coda.length && !prev.off) || (next && !next.onset.length && !s.coda.length && !s.off));
    // Words ending in y count as ending in a consonant for the stress rule
    const def = defaultStress(syls.length, plain.replace(/y$/, 'Y'));
    // In iu / ui the second vowel would take the stress unless the first is marked (jíu)
    const highPair = 'iu'.includes(s.nuc.v) && s.off;
    if (def !== si || hiatus || highPair) parts[si].vowel = ACUTE[s.nuc.v];
  }
  return parts.map((p) => p.onset + p.vowel + p.off + p.coda).join('');
}
