// Any IPA → Mandarin syllables, the way Chinese transliterates foreign names:
// sounds are mapped to Mandarin initials and finals, every syllable must be a real Mandarin
// syllable, and a consonant with no vowel after it gets one of its own (t → te 特, s → si 斯).
// best → bèi sī tè 贝斯特, Trump → tè lǎng pǔ 特朗普.

import { tokenizeIPA } from '../../ipa/tokenize.js';
import { isSyllable } from './dict.js';
import { spellKey } from './pinyin.js';
import { ALONE } from './translit.js';

// IPA vowels → vowel class
const V = {
  a: 'a', ɑ: 'a', ʌ: ['a', 'strut'], æ: ['a', 'ash'], ɐ: 'a', ɶ: 'a', e: 'e', ɛ: 'e', ø: ['e', 'frontRound'],
  œ: ['e', 'frontRound'], ɜ: 'ə', ə: 'ə', ɘ: 'ə', ɤ: 'ə', i: 'i', ɪ: ['i', 'lax'], ɨ: 'i', o: 'o', ɔ: 'o', ɒ: 'o',
  ɵ: 'o', u: 'u', ʊ: ['u', 'lax'], ʉ: 'u', ɯ: 'u', y: 'y', ʏ: 'y',
};
// IPA consonants → pinyin initial ('' = dropped); `[initial, note]`
const C = {
  p: 'p', b: 'b', t: 't', d: 'd', k: 'k', ɡ: 'g', c: 'k', ɟ: 'g', q: 'k', ɢ: 'g', ʔ: '', ʡ: '', ʈ: 't', ɖ: 'd',
  f: 'f', v: ['w', 'v'], ʋ: ['w', 'v'], ɸ: 'f', β: 'b', θ: ['s', 'th'], ð: ['d', 'dh'], s: 's', z: 'z',
  ʃ: ['sh', 'sh'], ʒ: ['r', 'zh'], ʂ: 'sh', ʐ: 'r', ɕ: 'x', ʑ: 'x', ç: ['x', 'ich'], ʝ: 'y', x: 'h', ɣ: 'g',
  χ: 'h', ħ: 'h', ʕ: '', h: 'h', ɦ: 'h', ɧ: 'x', m: 'm', ɱ: 'm', n: 'n', ɳ: 'n', ŋ: 'ŋ', ɴ: 'ŋ', ɲ: 'ɲ',
  l: 'l', ɫ: 'l', ɭ: 'l', ʟ: 'l', ɬ: 'l', ɮ: 'l', ʎ: 'ʎ', r: ['l', 'rL'], ɾ: ['l', 'rL'], ɹ: ['l', 'rL'],
  ɻ: ['l', 'rL'], ʁ: ['l', 'rL'], ʀ: ['l', 'rL'], ɽ: ['l', 'rL'], ɺ: 'l', ʙ: 'b', ⱱ: 'w', ɰ: '',
  ɓ: 'b', ɗ: 'd', ʄ: 'g', ɠ: 'g', ʛ: 'g',
  tʃ: ['ch', 'tsh'], dʒ: ['j', 'dzh'], ts: 'c', dz: 'z', tɕ: 'j', dʑ: 'j', tʂ: 'zh', dʐ: 'zh', ʈʂ: 'zh', ɖʐ: 'zh',
  pf: 'f', kx: 'k', tθ: 's', dð: 'd',
};
const ASPIRATE = { b: 'p', d: 't', g: 'k', j: 'q', zh: 'ch', z: 'c' };
const UNASPIRATE = { p: 'b', t: 'd', k: 'g', q: 'j', ch: 'zh', c: 'z' };
const GLIDES = { j: 'i', w: 'u', ɥ: 'ü', ʍ: 'u' };
const TONES = { '˥': 1, '˧˥': 2, '˨˩˦': 3, '˨˩': 3, '˩˦': 3, '˨˩˩': 3, '˥˩': 4, '˥˧': 4, '˧˩': 4, '˥˥': 1, '˧˥˥': 2 };

const FINALS = {
  a: { '': ['a'], i: ['ai'], u: ['ao'], n: ['an'], ng: ['ang'] },
  e: { '': ['ei', 'e', 'ai', 'ie'], i: ['ei', 'ai'], u: ['ou', 'ao'], n: ['en', 'an', 'ian'], ng: ['eng', 'ang'] },
  ə: { '': ['e', 'ei', 'a'], i: ['ei', 'ai'], u: ['ou'], n: ['en', 'an'], ng: ['eng', 'ang'] },
  i: { '': ['i', 'ei', 'e'], i: ['i'], u: ['iou', 'ou'], n: ['in', 'en'], ng: ['ing', 'eng'] },
  apical: { '': ['i'] },
  o: { '': ['uo', 'o', 'ou', 'ao', 'u'], i: ['uei', 'ei'], u: ['ou', 'ao'], n: ['uen', 'en', 'ong', 'an'], ng: ['ong', 'ang', 'eng'] },
  u: { '': ['u', 'ou', 'o'], i: ['uei'], u: ['u'], n: ['uen', 'en'], ng: ['ong', 'eng'] },
  y: { '': ['ü', 'u', 'i'], i: ['uei'], u: ['iou'], n: ['ün', 'uen'], ng: ['iong', 'ong'] },
};
const WITH_I = { a: 'ia', ao: 'iao', an: 'ian', ang: 'iang', e: 'ie', ei: 'ie', ai: 'ie', ou: 'iou', en: 'in', eng: 'ing', ong: 'iong', o: 'io', uo: 'io', u: 'iou', uen: 'ün', uei: 'ie' };
const WITH_U = { a: 'ua', ai: 'uai', an: 'uan', ang: 'uang', o: 'uo', ei: 'uei', e: 'uo', en: 'uen', eng: 'ueng', i: 'uei', in: 'uen', ing: 'ueng', ie: 'üe', ian: 'üan' };
const WITH_Ü = { e: 'üe', ie: 'üe', ei: 'üe', an: 'üan', ian: 'üan', en: 'ün', in: 'ün', '': 'ü', i: 'ü', u: 'ü' };
const RARE = new Set(['tei', 'lo', 'yo', 'dia', 'den', 'nou', 'zhei', 'shei', 'zei', 'fou', 'miu', 'cen', 'dei', 'gei', 'kei', 'nen']);
// before i / ü the sibilants and velars become palatal: si → xi, gi → ji, ri → li
const PALATAL = { s: 'x', sh: 'x', z: 'j', zh: 'j', c: 'q', ch: 'q', g: 'j', k: 'q', h: 'x', r: 'l' };

function toUnits(toks, note) {
  const units = [];
  const aspirated = toks.some((t) => t.t === 'seg' && t.mods.includes('ʰ'));
  let pendingTone = '';
  const flushTone = () => {
    const last = pendingTone && [...units].reverse().find((u) => u.k === 'V');
    if (last) last.tone = TONES[pendingTone] ?? last.tone;
    pendingTone = '';
  };
  for (const t of toks) {
    flushTone();
    if (t.t !== 'seg') continue;
    const m = t.mods;
    // Tone letters (˥ ˧˥ ˨˩˦…) arrive as modifiers of the syllable's last sound; once that sound
    // is added they set the tone of the most recent vowel
    pendingTone = m.filter((x) => '˥˦˧˨˩'.includes(x)).join('');
    const syllabic = m.includes('̩') || m.includes('̍');
    if ((t.base === 'ɹ' || t.base === 'ɻ') && syllabic) { units.push({ k: 'V', v: 'apical' }); continue; } // Mandarin "si", "shi"
    const chars = C[t.base] !== undefined || GLIDES[t.base] ? [t.base] : [...t.base];
    for (const b of chars) {
      if (V[b]) {
        const [v, key] = [].concat(V[b]);
        if (key) note(key, b, v);
        const rhotic = m.includes('˞');
        units.push({ k: 'V', v: rhotic ? 'ə' : v, nasal: m.includes('̃'), nonsyl: m.includes('̯'), long: m.includes('ː'), stress: false });
        if (m.includes('˞')) units.push({ k: 'C', c: 'l', fromR: true });
        continue;
      }
      if (GLIDES[b]) { units.push({ k: 'G', g: GLIDES[b] }); continue; }
      if (C[b] === undefined) {
        if (!/[ˈˌ.]/.test(b)) note('unknown', b, '∅');
        continue;
      }
      let [c, key] = [].concat(C[b]);
      if (key) note(key, b, c);
      if (!c) continue;
      // Mandarin contrasts aspiration, not voicing: without any ʰ in the word, voiceless stops are
      // read as aspirated (English p, t, k); with ʰ marked, plain p, t, k are the unaspirated b, d, g
      if (m.includes('ʰ') && ASPIRATE[c]) c = ASPIRATE[c];
      else if (aspirated && UNASPIRATE[c] && !m.includes('ʰ')) c = UNASPIRATE[c];
      if (c === 'ɲ') { units.push({ k: 'C', c: 'n' }, { k: 'G', g: 'i' }); continue; }
      if (c === 'ʎ') { units.push({ k: 'C', c: 'l' }, { k: 'G', g: 'i' }); continue; }
      units.push({ k: 'C', c, fromR: key === 'rL' });
    }
  }
  flushTone();
  return units;
}

function finalsFor(v, glide, tail) {
  const base = FINALS[v]?.[tail] ?? FINALS[v]?.[''] ?? ['a'];
  const out = [];
  if (glide === 'i') for (const f of base) out.push(f[0] === 'i' || f[0] === 'ü' ? f : WITH_I[f]);
  if (glide === 'u') for (const f of base) out.push(f[0] === 'u' ? f : WITH_U[f]);
  if (glide === 'ü') for (const f of base) out.push(WITH_Ü[f]);
  out.push(...base);
  return out.filter(Boolean);
}

/** Choose a real Mandarin syllable for onset + glide + vowel + tail. */
function makeSyllable(onset, glide, v, tail) {
  let ini = onset ?? '';
  let g = glide;
  if (ini === 'w') { ini = ''; g = g ?? 'u'; }
  if (ini === 'y') { ini = ''; g = g ?? 'i'; }
  if (ini === 'j' || ini === 'q' || ini === 'x') g = g ?? 'i'; // ja → jia
  for (const fin of finalsFor(v, g, tail)) {
    const palatal = (fin[0] === 'i' || fin[0] === 'ü') && v !== 'apical';
    const tries = palatal && PALATAL[ini] ? [PALATAL[ini], ini] : [ini];
    for (const i of tries) {
      const key = spellKey({ ini: i, fin });
      if (isSyllable(key) && !RARE.has(key)) return { key, palatal: i !== ini };
    }
  }
  return null;
}

/** IPA word → [{ key, tone? }] toneless pinyin keys of the syllables */
export function adaptWord(ipaWord, note = () => {}) {
  const units = toUnits(tokenizeIPA(ipaWord), note);
  // Vowel + unstressed i/u (or a glide) not followed by a vowel → diphthong tail
  const syls = [];
  const alone = (c) => {
    const key = ALONE[c === 'ŋ' ? 'n' : c];
    if (!key) return;
    syls.push({ key });
    note(c === 'm' || c === 'n' ? 'aloneNasal' : 'alone', c, key);
  };
  let i = 0;
  while (i < units.length) {
    const cons = [];
    while (units[i]?.k === 'C') cons.push(units[i++]);
    let glide = null;
    if (units[i]?.k === 'G' && units[i + 1]?.k === 'V') glide = units[i++].g;
    if (units[i]?.k === 'V') {
      // r after a vowel and before a consonant (or at the end) is not pronounced: Peter → 彼得
      const onset = cons.pop();
      cons.forEach((c) => (c.fromR && syls.length ? note('codaR', 'r', '∅') : alone(c.c)));
      const v = units[i++];
      let tail = '';
      const nx = units[i], nx2 = units[i + 1];
      if ((nx?.k === 'G' && nx2?.k !== 'V') || (nx?.k === 'V' && (nx.v === 'i' || nx.v === 'u') && ['a', 'e', 'ə', 'o'].includes(v.v) && !nx.long)) {
        tail = nx.k === 'G' ? (nx.g === 'u' ? 'u' : 'i') : nx.v;
        if (nx.tone && !v.tone) v.tone = nx.tone;
        i++;
      } else if (nx?.k === 'C' && (nx.c === 'n' || nx.c === 'ŋ') && nx2?.k !== 'V' && nx2?.k !== 'G') {
        tail = nx.c === 'n' ? 'n' : 'ng';
        i++;
      } else if (nx?.k === 'C' && nx.c === 'm' && nx2?.k === 'C') {
        tail = ['i', 'e', 'ə'].includes(v.v) ? 'n' : 'ng'; // Trump → 朗普 lang pu, computer → 肯 ken
        i++;
        note('mCoda', 'm', tail);
      }
      if (v.nasal && !tail) { tail = ['i', 'e'].includes(v.v) ? 'n' : 'ng'; note('nasalV', v.v + '̃', tail); }
      const made = makeSyllable(onset?.c, glide, v.v, tail);
      if (made) {
        if (made.palatal) note('palatal', `${onset.c}${v.v}`, made.key);
        syls.push({ key: made.key, tone: v.tone });
      } else {
        if (onset) alone(onset.c);
        const bare = makeSyllable('', glide, v.v, tail);
        if (bare) syls.push({ key: bare.key, tone: v.tone });
      }
      // a final r after the vowel is dropped; a final l becomes 尔 er
      while (units[i]?.k === 'C' && units[i].fromR && units[i + 1]?.k !== 'V' && units[i + 1]?.k !== 'G') { note('codaR', 'r', '∅'); i++; }
    } else {
      cons.forEach((c) => alone(c.c));
      if (units[i]?.k === 'G') { syls.push({ key: units[i].g === 'u' ? 'wu' : units[i].g === 'ü' ? 'yu' : 'yi' }); i++; }
    }
  }
  return syls.length ? syls : null;
}
