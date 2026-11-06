// Spanish spelling → phonemic syllables.
//
//   syllable = { onset: string[], nuc: { v }, off: { g } | null, coda: string[], stress: boolean }
// Phonemes: p b t d k ɡ f θ s x ʝ tʃ m n ɲ l ɾ R(trill) + glides j w; vowels a e i o u.

import { LEXICON, CLITICS } from './lexicon.js';

const ACC = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
const isV = (ch) => !!ch && 'aeiouáéíóúü'.includes(ch);
const isFront = (ch) => !!ch && 'eéií'.includes(ch);
const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const CLUSTER_HEADS = new Set(['p', 'b', 't', 'd', 'k', 'ɡ', 'f']);

function parseLetters(w) {
  const u = [];
  const at = (i) => (i >= 0 && i < w.length ? w[i] : '');
  const C = (p) => u.push({ k: 'C', p });
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n1 = at(i + 1), n2 = at(i + 2);
    if (isV(c)) {
      u.push({ k: 'V', base: ACC[c] || (c === 'ü' ? 'u' : c), acc: !!ACC[c], i });
      continue;
    }
    switch (c) {
      case 'b': case 'v': C('b'); break;
      case 'c':
        if (n1 === 'h') { C('tʃ'); i++; } else C(isFront(n1) ? 'θ' : 'k');
        break;
      case 'g':
        if (n1 === 'u' && isFront(n2)) { C('ɡ'); i++; }
        else if (n1 === 'ü') { C('ɡ'); u.push({ k: 'G', g: 'w' }); i++; }
        else C(isFront(n1) ? 'x' : 'ɡ');
        break;
      case 'h': break;
      case 'j': C('x'); break;
      case 'l':
        if (n1 === 'l') { C('ʝ'); i++; } else C('l');
        break;
      case 'ñ': C('ɲ'); break;
      case 'q':
        C('k');
        if (n1 === 'u') i++;
        break;
      case 'r':
        if (n1 === 'r') { C('R'); i++; } else C(i === 0 || 'nls'.includes(at(i - 1)) ? 'R' : 'ɾ');
        break;
      case 'w': u.push({ k: 'G', g: 'w' }); break;
      case 'x':
        if (i === 0) C('s'); else { C('k'); C('s'); }
        break;
      case 'y':
        if (isV(n1)) C('ʝ');
        else if (u.length && u[u.length - 1].k === 'V') u.push({ k: 'G', g: 'j', off: true }); // hoy, rey
        else u.push({ k: 'V', base: 'i', acc: false, i }); // conjunction "y"
        break;
      case 'z': C('θ'); break;
      default:
        if ('dfkmnpst'.includes(c)) C(c);
    }
  }
  return u;
}

const weak = (x) => x && x.k === 'V' && (x.base === 'i' || x.base === 'u') && !x.acc;

/** Unaccented i/u next to another vowel is a glide: bien [bjen], aire [ˈajɾe], ciudad [θjuˈðað]. */
function markGlides(u) {
  for (let k = 0; k < u.length; k++) {
    const x = u[k];
    if (!weak(x)) continue;
    const prev = u[k - 1], next = u[k + 1];
    const g = x.base === 'i' ? 'j' : 'w';
    if (next && next.k === 'V') u[k] = { k: 'G', g };              // rising: onset glide
    else if (prev && prev.k === 'V') u[k] = { k: 'G', g, off: true }; // falling: offglide
  }
}

export function legalOnset(cl) {
  if (cl.length <= 1) return true;
  const [a, b, c] = cl;
  const pair = a.k === 'C' && b.k === 'C' && CLUSTER_HEADS.has(a.p) && (b.p === 'ɾ' || (b.p === 'l' && a.p !== 't' && a.p !== 'd'));
  if (cl.length === 2) return pair || (a.k === 'C' && b.k === 'G');
  return cl.length === 3 && pair && c.k === 'G';
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
    } else if (x.k === 'G' && x.off && cur && !cluster.length && !cur.off) cur.off = x;
    else cluster.push(x);
  }
  if (!cur) return null;
  cur.coda.push(...cluster);
  return syls;
}

/** One Spanish word → { syls, clitic } | { raw } | null */
export function wordToPhonemic(word) {
  let w = word.toLowerCase().normalize('NFC');
  const lex = LEXICON[w];
  if (lex && lex.startsWith('/')) return { raw: lex.slice(1, -1) };
  const clitic = CLITICS.has(w);
  if (lex) w = lex;
  const u = parseLetters(w);
  markGlides(u);
  const raw = syllabify(u);
  if (!raw) return null;
  let si = raw.findIndex((s) => s.nuc.acc);
  if (si < 0) si = raw.length === 1 ? 0 : /[aeiouns]$/.test(stripAccents(w)) ? raw.length - 2 : raw.length - 1;
  if (clitic) si = -1;
  const ph = (x) => (x.k === 'G' ? x.g : x.p);
  return {
    clitic,
    syls: raw.map((s, i) => ({
      onset: s.onset.map(ph), nuc: { v: s.nuc.base }, off: s.off ? { g: s.off.g } : null,
      coda: s.coda.map(ph), stress: i === si,
    })),
  };
}
