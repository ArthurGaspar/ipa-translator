// Phonemic syllables → Brazilian Portuguese spelling that a Brazilian reads back
// as intended (accent marks added wherever the default stress rule would fail).

const FRONT = new Set(['e', 'ɛ', 'i']);
const LETTER = { a: 'a', ɐ: 'a', e: 'e', ɛ: 'e', i: 'i', o: 'o', ɔ: 'o', u: 'u' };
const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
const CIRC = { a: 'â', e: 'ê', i: 'í', o: 'ô', u: 'ú' };
const SIMPLE = { p: 'p', b: 'b', t: 't', d: 'd', f: 'f', v: 'v', m: 'm', n: 'n', l: 'l', ɾ: 'r', z: 'z', ʃ: 'ch', ʒ: 'j', ɲ: 'nh', ʎ: 'lh', ts: 'ts', dz: 'dz' };

function spellOnset(syl, i, syls) {
  const on = syl.onset;
  const front = FRONT.has(syl.nuc.v);
  const prev = syls[i - 1];
  // A nasal previous syllable is spelled with n/m, so a single s/r after it is already read right.
  const afterVowel = i > 0 && !prev.coda.length && !prev.nuc.nasal;
  let out = '';
  for (let k = 0; k < on.length; k++) {
    const c = on[k], nx = on[k + 1], direct = k === on.length - 1;
    switch (c) {
      case 'k':
        if (nx === 'w') { out += front ? 'qü' : 'qu'; k++; } else out += front && direct ? 'qu' : 'c';
        break;
      case 'ɡ':
        if (nx === 'w') { out += front ? 'gü' : 'gu'; k++; } else out += front && direct ? 'gu' : 'g';
        break;
      case 's': out += k === 0 && afterVowel ? 'ss' : 's'; break;
      case 'R': out += k === 0 && afterVowel ? 'rr' : 'r'; break;
      case 'tʃ': out += 'tch'; break; // an original [tʃ]; a plain t before i is read [tʃ] anyway
      case 'dʒ': out += 'dj'; break;
      case 'j': out += 'i'; break;
      case 'w': out += 'u'; break;
      default: out += SIMPLE[c] ?? c;
    }
  }
  return out;
}

/** A nasal vowel needs no letter of its own before m / n / nh: cama, banho. */
function nasalImplied(syl, next) {
  return !!next && ['m', 'n', 'ɲ'].includes(next.onset[0]);
}

/** Returns { pre, vowel, post, tilde } so an accent can later be put on `vowel`. */
function spellNucleus(syl, next) {
  const v = LETTER[syl.nuc.v];
  const off = syl.off;
  if (!syl.nuc.nasal) {
    return { vowel: v, post: off ? (off.g === 'j' ? 'i' : 'u') : '', tilde: false };
  }
  if (off) {
    if (v === 'a') return { vowel: 'ã', post: off.g === 'w' ? 'o' : 'e', tilde: true };
    if (v === 'o' && off.g === 'j') return { vowel: 'õ', post: 'e', tilde: true };
    if (v === 'e' && off.g === 'j' && !next) return { vowel: 'e', post: 'm', tilde: false };
    return { vowel: v, post: (off.g === 'j' ? 'i' : 'u') + 'n', tilde: false };
  }
  if (nasalImplied(syl, next)) return { vowel: v, post: '', tilde: false };
  if (v === 'a' && (!next || !next.onset.length)) return { vowel: 'ã', post: '', tilde: true }; // irmã, irmãs
  if (v === 'o' && next && !next.onset.length) return { vowel: 'õ', post: '', tilde: true };
  const nextOnset = next && next.onset[0];
  const useM = next ? nextOnset === 'p' || nextOnset === 'b' : !syl.coda.length; // bom, campo / bons
  return { vowel: v, post: useM ? 'm' : 'n', tilde: false };
}

function spellCoda(syl) {
  return syl.coda.map((c) => (c === 's' || c === 'z' ? 's' : c === 'ɾ' || c === 'R' ? 'r' : c === 'l' ? 'l' : c)).join('');
}

/** Index the Portuguese default stress rule would assign to these spelled syllables. */
function defaultStress(parts, word) {
  for (let k = parts.length - 1; k >= 0; k--) if (parts[k].tilde) return k;
  if (parts.length === 1) return 0;
  return /([aeo]s?|[ae]m|ens)$/.test(word) ? parts.length - 2 : parts.length - 1;
}

export function spellWord(word) {
  const syls = word.syls;
  const parts = syls.map((s, i) => {
    const next = syls[i + 1];
    if (s.prothetic) return { onset: '', vowel: 'e', post: '', coda: 's', tilde: false };
    return { onset: spellOnset(s, i, syls), ...spellNucleus(s, next), coda: spellCoda(s) };
  });
  const plain = parts.map((p) => p.onset + p.vowel + p.post + p.coda).join('');
  const si = syls.findIndex((s) => s.stress);
  if (si >= 0 && syls.length) {
    const s = syls[si], p = parts[si];
    const def = defaultStress(parts, plain);
    const prev = syls[si - 1];
    const hiatus = si > 0 && !s.onset.length && 'iu'.includes(s.nuc.v) && !prev.coda.length && !prev.off;
    const open = s.nuc.v === 'ɛ' || s.nuc.v === 'ɔ';
    const monoEO = syls.length === 1 && /[eo]s?$/.test(plain) && !s.nuc.nasal;
    if (!p.tilde && (def !== si || open || hiatus || monoEO)) {
      const base = p.vowel;
      p.vowel = open || (!s.nuc.nasal && 'aiu'.includes(base)) ? ACUTE[base] : CIRC[base];
    }
  }
  return parts.map((p) => p.onset + p.vowel + p.post + p.coda).join('');
}
