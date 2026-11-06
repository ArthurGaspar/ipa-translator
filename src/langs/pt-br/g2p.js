// Brazilian Portuguese spelling → phonemic syllables (see phonology.js for the format).

import { LEXICON, CLITICS } from './lexicon.js';

const VOWEL_LETTERS = 'aeiouáàâãéêíóôõúüy';
const ACCENTS = {
  á: ['a', 'acute'], à: ['a', 'grave'], â: ['a', 'circ'], ã: ['a', 'tilde'],
  é: ['e', 'acute'], ê: ['e', 'circ'], í: ['i', 'acute'], ó: ['o', 'acute'],
  ô: ['o', 'circ'], õ: ['o', 'tilde'], ú: ['u', 'acute'], ü: ['u', null], y: ['i', null],
};
const isV = (ch) => !!ch && VOWEL_LETTERS.includes(ch);
const isFront = (ch) => !!ch && 'eéêiíy'.includes(ch);
const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Obstruents that may start an onset cluster with ɾ or l (pr, bl, tr, cl, fr, vr…)
const CLUSTER_HEADS = new Set(['p', 'b', 't', 'd', 'k', 'ɡ', 'f', 'v']);
const LIQUIDS = new Set(['ɾ', 'l']);
const CODA_OK = new Set(['s', 'z', 'ɾ', 'R', 'l']);

// Stressed e / o that are usually open when not written with an accent,
// matched against the word from the stressed vowel onward.
const OPEN_E = [/^el$/, /^elas?$/, /^ert[oa]s?$/, /^est[oa]s?$/, /^egas?$/, /^eve[sm]?$/, /^ebe[sm]?$/,
  /^erras?$/, /^ecas?$/, /^eros?$/, /^eras?$/, /^ern[oa]s?$/];
const OPEN_O = [/^ol$/, /^olas?$/, /^otas?$/, /^osas?$/, /^ort[ae]s?$/, /^ordas?$/, /^ov[ae]s?$/,
  /^ormas?$/, /^ojas?$/, /^ot[eo]s?$/, /^oques?$/, /^ossas?$/, /^oras?$/, /^ogas?$/, /^ostas?$/,
  /^obras?$/, /^odes?$/];

/** Spelling → list of letter units: C (consonant), V (vowel), G (glide), N (nasal coda). */
function parseLetters(w) {
  const u = [];
  const at = (i) => (i >= 0 && i < w.length ? w[i] : '');
  const C = (p, i) => u.push({ k: 'C', p, i });
  let i = 0;
  while (i < w.length) {
    const c = w[i], n1 = at(i + 1), n2 = at(i + 2), p = at(i - 1);
    if (isV(c)) {
      const [base, acc] = ACCENTS[c] || [c, null];
      u.push({ k: 'V', base, acc, nasal: acc === 'tilde', i });
      if (acc === 'tilde' && base === 'a' && n1 === 'o') { u.push({ k: 'G', g: 'w', nasal: true, off: true }); i += 2; continue; }
      if (acc === 'tilde' && n1 === 'e') { u.push({ k: 'G', g: 'j', nasal: true, off: true }); i += 2; continue; }
      i++;
      continue;
    }
    switch (c) {
      case 'c':
        if (n1 === 'h') { C('ʃ', i); i += 2; } else { C(isFront(n1) ? 's' : 'k', i); i++; }
        break;
      case 'ç': C('s', i); i++; break;
      case 'g':
        if (n1 === 'u' && isFront(n2)) { C('ɡ', i); i += 2; }
        else if ((n1 === 'u' || n1 === 'ü') && isV(n2)) { C('ɡ', i); u.push({ k: 'G', g: 'w' }); i += 2; }
        else { C(isFront(n1) ? 'ʒ' : 'ɡ', i); i++; }
        break;
      case 'q':
        C('k', i);
        if (n1 === 'u' || n1 === 'ü') {
          if ((n1 === 'ü' || !isFront(n2)) && isV(n2)) u.push({ k: 'G', g: 'w' });
          i += 2;
        } else i++;
        break;
      case 'h': i++; break;
      case 'j': C('ʒ', i); i++; break;
      case 'k': C('k', i); i++; break;
      case 'l':
        if (n1 === 'h') { C('ʎ', i); i += 2; } else { C('l', i); i++; }
        break;
      case 'm': case 'n': {
        if (c === 'n' && n1 === 'h') { C('ɲ', i); i += 2; break; }
        const prev = u[u.length - 1];
        if (prev && prev.k === 'V' && !isV(n1)) u.push({ k: 'N', letter: c, i });
        else C(c, i);
        i++;
        break;
      }
      case 'r':
        if (n1 === 'r') { C('R', i); i += 2; }
        else if (i === 0 || 'nls'.includes(p)) { C('R', i); i++; }
        else { C('ɾ', i); i++; }
        break;
      case 's':
        if (n1 === 's') { C('s', i); i += 2; }
        else if ((n1 === 'c' && isFront(n2)) || n1 === 'ç') { C('s', i); i += 2; }
        else if (i > 0 && isV(p) && isV(n1)) { C('z', i); i++; }
        else { C('s', i); i++; }
        break;
      case 't':
        if (n1 === 'c' && n2 === 'h') { C('tʃ', i); i += 3; } else { C('t', i); i++; }
        break;
      case 'w': u.push({ k: 'G', g: 'w' }); i++; break;
      case 'x': {
        const before = w.slice(0, i);
        if (n1 === 'c' && isFront(n2)) { C('s', i); i += 2; break; } // exceção
        if (i === 0) C('ʃ', i);                                        // xícara
        else if (/^(h|in|re|des|co)?[eê]$/.test(before)) C(isV(n1) ? 'z' : 's', i); // exame, explicar
        else if (/(ai|ei|ou|en)$/.test(before)) C('ʃ', i);           // caixa, peixe, enxame
        else if (n1 && !isV(n1)) C('s', i);                            // texto
        else if (!n1) { C('k', i); C('s', i); }                        // tórax
        else C('ʃ', i);                                                // lixo (exceptions in lexicon)
        i++;
        break;
      }
      case 'z': C('z', i); i++; break;
      default:
        if ('bdfpv'.includes(c)) C(c, i);
        i++;
    }
  }
  return u;
}

/** Unaccented i/u after a vowel → falling-diphthong glide, unless hiatus is forced (sa-ir, ra-iz, ra-i-nha). */
function markGlides(u) {
  // Word-initial unaccented u + vowel is an onset glide in loanword spellings: uóter → [ˈwɔteh]
  if (u.length > 1 && u[0].k === 'V' && u[0].base === 'u' && !u[0].acc && u[1].k === 'V') u[0] = { k: 'G', g: 'w' };
  for (let k = 1; k < u.length; k++) {
    const x = u[k], prev = u[k - 1];
    if (x.k !== 'V' || !(x.base === 'i' || x.base === 'u') || x.acc || prev.k !== 'V') continue;
    const nx = u[k + 1], nx2 = u[k + 2];
    if (nx && nx.k === 'N') continue;
    if (nx && nx.k === 'C' && nx.p === 'ɲ') continue;
    if (nx && nx.k === 'C' && ['ɾ', 'l', 'z', 'R'].includes(nx.p) && !(nx2 && nx2.k === 'V')) continue;
    u[k] = { k: 'G', g: x.base === 'i' ? 'j' : 'w', nasal: false, off: true };
  }
}

/** Nasal-coda m/n → nasal vowel. Final -em/-ens → [ẽj̃], final -am → [ɐ̃w̃]. */
function resolveNasals(u) {
  const out = [];
  for (let k = 0; k < u.length; k++) {
    const x = u[k];
    if (x.k !== 'N') { out.push(x); continue; }
    const prev = out[out.length - 1];
    prev.nasal = true;
    const rest = u.slice(k + 1);
    const isFinal = rest.length === 0 || (rest.length === 1 && rest[0].k === 'C' && rest[0].p === 's');
    if (isFinal && prev.k === 'V') {
      if (prev.base === 'e') out.push({ k: 'G', g: 'j', nasal: true, off: true });
      else if (prev.base === 'a' && x.letter === 'm') out.push({ k: 'G', g: 'w', nasal: true, off: true });
    }
  }
  return out;
}

function legalOnset(cl) {
  if (cl.length <= 1) return true;
  const [a, b, c] = cl;
  const pair = a.k === 'C' && b.k === 'C' && CLUSTER_HEADS.has(a.p) && LIQUIDS.has(b.p) && !(b.p === 'l' && (a.p === 't' || a.p === 'd'));
  if (cl.length === 2) return pair || (a.k === 'C' && b.k === 'G');
  if (cl.length === 3) return pair && c.k === 'G';
  return false;
}

function syllabify(u) {
  const syls = [];
  let cluster = [];
  let cur = null;
  for (const x of u) {
    if (x.k === 'V') {
      let onset = cluster;
      if (cur) {
        let s = 0;
        while (s < cluster.length && !legalOnset(cluster.slice(s))) s++;
        cur.coda.push(...cluster.slice(0, s));
        onset = cluster.slice(s);
      }
      cur = { onset, nuc: x, off: null, coda: [] };
      syls.push(cur);
      cluster = [];
    } else if (x.k === 'G' && x.off && cur && !cluster.length && !cur.off) {
      cur.off = x;
    } else cluster.push(x);
  }
  if (!cur) return null;
  cur.coda.push(...cluster);
  return syls;
}

function stressIndex(syls, word) {
  let idx = syls.findIndex((s) => s.nuc.acc === 'acute' || s.nuc.acc === 'circ');
  if (idx >= 0) return idx;
  for (let k = syls.length - 1; k >= 0; k--) if (syls[k].nuc.acc === 'tilde') return k;
  if (syls.length === 1) return 0;
  return /([aeo]s?|[ae]m|ens)$/.test(stripAccents(word)) ? syls.length - 2 : syls.length - 1;
}

function vowelQuality(nuc, stressed, word) {
  const { base, acc } = nuc;
  if (base === 'a') return acc === 'circ' ? 'ɐ' : 'a';
  if (base === 'e' || base === 'o') {
    if (acc === 'acute') return base === 'e' ? 'ɛ' : 'ɔ';
    if (acc || !stressed || nuc.nasal) return base;
    const rest = stripAccents(word.slice(nuc.i));
    const open = (base === 'e' ? OPEN_E : OPEN_O).some((re) => re.test(rest));
    return open ? (base === 'e' ? 'ɛ' : 'ɔ') : base;
  }
  return base;
}

const ep = (c) => ({ onset: [c], nuc: { v: 'i', nasal: false }, off: null, coda: [], stress: false, ep: true });

/** Insert the [i] Brazilians add after consonants that cannot close a syllable (ritmo → [ˈhitʃimu]). */
function epenthesize(syls) {
  const out = [];
  syls.forEach((s, idx) => {
    if (idx === 0) {
      while (s.onset.length > 1 && !legalOnset(s.onset.map((p) => ({ k: p === 'w' || p === 'j' ? 'G' : 'C', p })))) {
        out.push(ep(s.onset.shift()));
      }
    }
    const keep = [];
    const extra = [];
    const nextOnset = syls[idx + 1]?.onset[0];
    for (const c of s.coda) {
      const target = extra.length ? extra[extra.length - 1].coda : keep;
      if (CODA_OK.has(c) && codaAccepts(target, c)) target.push(c);
      else if (c === 'k' && nextOnset === 's' && !extra.length) keep.push(c); // táxi stays [ˈtaksi]
      else extra.push(ep(c));
    }
    s.coda = keep;
    out.push(s, ...extra);
  });
  return out;
}

function codaAccepts(coda, c) {
  if (c === 's' || c === 'z') return coda.every((x) => x === 'ɾ' || x === 'R' || x === 'l');
  return coda.length === 0;
}

/**
 * Convert one Portuguese word to phonemic syllables.
 * Returns { syls, clitic } or { raw } for lexicon IPA entries, or null if nothing pronounceable.
 */
export function wordToPhonemic(word, opts = {}) {
  let w = word.toLowerCase().normalize('NFC');
  const lex = LEXICON[w];
  if (lex && lex.startsWith('/')) return { raw: lex.slice(1, -1) };
  const clitic = CLITICS.has(w);
  if (lex) w = lex;

  let u = parseLetters(w);
  markGlides(u);
  u = resolveNasals(u);
  const raw = syllabify(u);
  if (!raw) return null;

  const si = clitic ? -1 : stressIndex(raw, w);
  let syls = raw.map((s, i) => ({
    onset: s.onset.map((x) => (x.k === 'G' ? x.g : x.p)),
    nuc: { v: vowelQuality(s.nuc, i === si, w), nasal: !!s.nuc.nasal },
    off: s.off ? { g: s.off.g, nasal: !!s.off.nasal } : null,
    coda: s.coda.map((x) => (x.k === 'G' ? x.g : x.p)),
    stress: i === si,
    ep: false,
  }));
  if (opts.casual) syls = epenthesize(syls);
  return { syls, clitic };
}
