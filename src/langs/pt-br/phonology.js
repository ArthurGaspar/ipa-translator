// Shared Brazilian Portuguese phonology.
//
// Both directions of the translator produce the same intermediate form — a word
// as a list of phonemic syllables — and this module turns that into surface IPA.
//
//   syllable = {
//     onset: string[]            consonant phonemes, optionally ending in glide 'j' | 'w'
//     nuc:   { v, nasal }        v ∈ a ɐ e ɛ i o ɔ u
//     off:   { g, nasal } | null falling-diphthong offglide ('j' | 'w')
//     coda:  string[]            subset of s z ɾ R l (+ any consonant in careful mode)
//     stress: boolean
//     ep:    boolean             epenthetic (inserted) vowel, never stressed
//   }
//
// Phoneme 'R' is the "R forte" (rr, initial r), realised as [h] — the most
// widespread, neutral pronunciation across Brazil.

export const VOICED = new Set(['b', 'd', 'ɡ', 'v', 'z', 'ʒ', 'm', 'n', 'ɲ', 'l', 'ʎ', 'ɾ', 'R', 'dʒ', 'dz', 'w', 'j']);
const NASAL_V = { a: 'ɐ̃', ɐ: 'ɐ̃', e: 'ẽ', ɛ: 'ẽ', i: 'ĩ', o: 'õ', ɔ: 'õ', u: 'ũ' };
const TILDE = '̃';
const isSib = (c) => c === 's' || c === 'z';

export function cloneSyls(syls) {
  return syls.map((s) => ({
    ...s,
    onset: [...s.onset],
    nuc: { ...s.nuc },
    off: s.off ? { ...s.off } : null,
    coda: [...s.coda],
  }));
}

/** First phone of a word, used for sandhi with the previous word: 'V' for vowels/glides. */
export function firstPhone(word) {
  if (!word) return null;
  if (word.raw) return /^[ˈˌ]?[aɐeɛioɔuãẽĩõũjw]/.test(word.raw) ? 'V' : word.raw.replace(/^[ˈˌ]/, '')[0];
  const s = word.syls[0];
  if (!s) return null;
  const o = s.onset[0];
  return !o || o === 'j' || o === 'w' ? 'V' : o;
}

/**
 * Realise a phonemic word as surface IPA.
 * opts: { reduceFinal, casual, glides, dots }
 * nextFirst: first phone of the following word (same phrase) or null at a pause.
 */
export function realizeWord(word, opts = {}, nextFirst = null) {
  if (word.raw) return { ipa: word.raw, syllables: [word.raw] };
  let S = cloneSyls(word.syls);

  // Post-tonic hiatus → rising diphthong: his.tɔ.ɾi.a → his.tɔ.ɾjɐ, ˈa.ɾe.a → ˈa.ɾjɐ
  const si0 = S.findIndex((s) => s.stress);
  if (opts.glides && si0 >= 0) {
    for (let i = S.length - 2; i > si0; i--) {
      const s = S[i], nx = S[i + 1];
      if ('ieuo'.includes(s.nuc.v) && !s.nuc.nasal && !s.off && !s.coda.length && !s.ep && !nx.onset.length && !nx.stress) {
        nx.onset = [...s.onset, 'ie'.includes(s.nuc.v) ? 'j' : 'w'];
        S.splice(i, 1);
      }
    }
  }

  // Final unstressed vowel: a → ɐ always; e → i, o → u when reduceFinal (orthographic input)
  const last = S[S.length - 1];
  if (!last.stress && !last.nuc.nasal && !last.ep && last.coda.every(isSib)) {
    const v = last.nuc.v;
    if (v === 'a') last.nuc.v = 'ɐ';
    else if (opts.reduceFinal && !last.off) {
      if (v === 'e') last.nuc.v = 'i';
      else if (v === 'o') last.nuc.v = 'u';
    }
  }

  // Everyday-speech processes
  if (opts.casual) {
    const f = S[0];
    if (S.length > 1 && !f.stress && f.nuc.v === 'e' && !f.off) {
      const bareOrD = f.onset.length === 0 || (f.onset.length === 1 && f.onset[0] === 'd');
      // escola → [is], desculpa → [dʒis], entender → [ĩ]
      if (bareOrD && f.coda.some(isSib)) f.nuc.v = 'i';
      else if (f.onset.length === 0 && f.nuc.nasal && !f.coda.length) f.nuc.v = 'i';
    }
    for (let i = 0; i < S.length; i++) {
      const s = S[i], nx = S[i + 1];
      if (!s.off || s.off.nasal) continue;
      if (s.nuc.v === 'o' && s.off.g === 'w') s.off = null; // pouco → [ˈpoku]
      else if (nx && !s.coda.length) {
        const o = nx.onset[0];
        if (s.nuc.v === 'e' && s.off.g === 'j' && ['ɾ', 'ʃ', 'ʒ'].includes(o)) s.off = null; // primeiro → [pɾiˈmeɾu]
        else if (s.nuc.v === 'a' && s.off.g === 'j' && o === 'ʃ') s.off = null; // caixa → [ˈkaʃɐ]
      }
    }
  }

  // Stressed vowel before a nasal consonant is nasalised: cama → [ˈkɐ̃mɐ]
  for (let i = 0; i < S.length - 1; i++) {
    const s = S[i];
    if (s.stress && !s.nuc.nasal && !s.coda.length && !s.off && ['m', 'n', 'ɲ'].includes(S[i + 1].onset[0])) s.nuc.nasal = true;
  }

  // Segment realisation
  const out = S.map((s, i) => {
    const prev = S[i - 1], nx = S[i + 1];
    let str = '';
    s.onset.forEach((c, k) => {
      let r = c;
      if (c === 'R') r = 'h';
      else if (c === 'ɾ' && k === 0 && (i === 0 || (prev && prev.coda.length))) r = 'h';
      else if ((c === 't' || c === 'd') && k === s.onset.length - 1 && s.nuc.v === 'i') r = c === 't' ? 'tʃ' : 'dʒ';
      str += r;
    });
    let v = s.nuc.v;
    if (s.stress && v === 'ɐ' && !s.nuc.nasal) v = 'a';
    str += s.nuc.nasal ? NASAL_V[v] : v;
    if (s.off) str += s.off.g + (s.off.nasal ? TILDE : '');
    s.coda.forEach((c, k) => {
      const atWordEnd = !nx && k === s.coda.length - 1;
      const following = k < s.coda.length - 1 ? s.coda[k + 1] : nx ? nx.onset[0] || 'V' : nextFirst;
      if (c === 'l') str += 'w';
      else if (c === 'ɾ' || c === 'R') str += atWordEnd && following === 'V' ? 'ɾ' : 'h';
      else if (isSib(c)) str += following === 'V' || VOICED.has(following) ? 'z' : 's';
      else str += c;
    });
    return str;
  });

  const showStress = !word.clitic && out.length > 1;
  let ipa = '';
  out.forEach((syl, i) => {
    if (showStress && S[i].stress) ipa += 'ˈ';
    else if (i > 0 && opts.dots) ipa += '.';
    ipa += syl;
  });
  return { ipa, syllables: out };
}
