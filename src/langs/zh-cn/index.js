// Mandarin Chinese (mainland) ⇄ IPA, text level.

import { loadDict, isReady, charReadings, charForSyllable } from './dict.js';
import { readHan, readPinyin, clauseIPA } from './g2p.js';
import { toMarked } from './pinyin.js';
import { numberToKeys } from './numbers.js';
import { adaptWord } from './adapt.js';
import { TRANSLIT } from './translit.js';

const HAN = /[㐀-䶿一-鿿]/;
const TOKEN_RE = /([㐀-䶿一-鿿]+)|(\d+)|([A-Za-zÀ-ÿĀ-ɏǍ-ǜüÜ:'’1-5]+)|([^㐀-䶿一-鿿A-Za-zÀ-ÿĀ-ɏǍ-ǜüÜ\d]+)/gu;
const PAUSE = /[，。！？、；：,.!?;:…—（）()「」『』“”"《》\n]/;
// Chinese punctuation → Latin, for IPA and pinyin lines
const LATIN_PUNCT = { '，': ',', '。': '.', '！': '!', '？': '?', '、': ',', '；': ';', '：': ':', '（': '(', '）': ')', '“': '"', '”': '"', '《': '"', '》': '"', '「': '"', '」': '"' };
// Full-width punctuation carries its own spacing; Latin punctuation needs a space after it
const latin = (s) => s.replace(/[，。！？、；：（）“”《》「」]/g, (c) => LATIN_PUNCT[c] + (/[，。！？、；：]/.test(c) ? ' ' : ''));

/**
 * Chinese characters (or pinyin) → IPA, one token per syllable.
 * opts: { casual (tone sandhi as spoken), dots } → [{ type: 'word', src, ipa, alt (pinyin), guessed } | { type: 'text', text }]
 */
export function toIPA(text, opts = {}) {
  const items = []; // syllables { src, key, ch, guessed } and text pieces
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m[1]) readHan(m[1]).forEach((s) => items.push(s.key ? { type: 'syl', src: s.ch, key: s.key, ch: s.ch } : { type: 'text', text: s.ch }));
    else if (m[2]) numberToKeys(m[2]).forEach((key, k) => items.push({ type: 'syl', src: k ? '' : m[2], key }));
    else if (m[3]) {
      const syls = readPinyin(m[3]);
      if (syls) syls.forEach((s, k) => items.push({ type: 'syl', src: k ? '' : m[3], key: s.key, guessed: s.guessed }));
      else items.push({ type: 'text', text: m[3] });
    } else items.push({ type: 'text', text: m[4] });
  }
  // Tone sandhi works within a clause (between punctuation)
  let clause = [];
  const clauses = [];
  for (const it of items) {
    if (it.type === 'syl') clause.push(it);
    else if (PAUSE.test(it.text) || /S/.test(it.text)) { if (clause.length) clauses.push(clause); clause = []; }
  }
  if (clause.length) clauses.push(clause);
  for (const c of clauses) clauseIPA(c, opts).forEach((ipa, k) => { c[k].ipa = ipa; });
  // Syllables are separated by spaces in IPA and pinyin
  const out = [];
  let prevSyl = false;
  for (const it of items) {
    if (it.type === 'syl') {
      if (prevSyl) out.push({ type: 'text', text: ' ' });
      out.push({ type: 'word', src: it.src, ipa: it.ipa, alt: toMarked(it.key), guessed: it.guessed });
      prevSyl = true;
    } else {
      out.push({ type: 'text', text: latin(it.text) });
      prevSyl = false;
    }
  }
  // no dangling space after the final punctuation mark
  const last = out[out.length - 1];
  if (last?.type === 'text' && !/s$/.test(text)) last.text = last.text.replace(/ $/, '');
  return out;
}

const PUNCT_EDGE = /^([¿¡"“«(\[/]*)(.*?)([.,;:!?…"”»)\]/،؛؟]*)$/u;
const CN_PUNCT = { ',': '，', '.': '。', '!': '！', '?': '？', ';': '；', ':': '：' };

/** IPA (any language) → Chinese transliteration characters + pinyin + Mandarin-adapted IPA. */
export function fromIPA(text, opts = {}) {
  const notes = new Map();
  const note = (key, from = '', to = '') => {
    const id = `${key}|${from}`;
    if (!notes.has(id)) notes.set(id, { key, from, to });
  };
  const tokens = [];
  for (const chunk of text.split(/(\s+)/)) {
    if (!chunk) continue;
    if (/^\s+$/.test(chunk)) { tokens.push({ type: 'text', text: chunk, cn: '' }); continue; }
    const [, lead, core, trail] = chunk.match(PUNCT_EDGE);
    const cleanTrail = trail.replace(/[[\]/]/g, '');
    if (lead.replace(/[[\]/¿¡]/g, '')) tokens.push({ type: 'text', text: lead.replace(/[[\]/¿¡]/g, '') });
    const syls = core ? adaptWord(core, note) : null;
    if (syls) {
      const withChars = syls.map((s) => {
        const ch = TRANSLIT.get(s.key) ?? charForSyllable(s.key) ?? '?';
        const readings = charReadings(ch) ?? [];
        const tone = s.tone ?? Number((readings.find((r) => r.slice(0, -1) === s.key) ?? `${s.key}1`).slice(-1));
        return { ch, key: s.key + tone };
      });
      const ipa = clauseIPA(withChars, { casual: true });
      tokens.push({
        type: 'word', src: core,
        spelled: withChars.map((s) => s.ch).join(''),
        alt: withChars.map((s) => toMarked(s.key)).join(' '),
        adapted: ipa.join(opts.dots ? '.' : ' '),
      });
    } else if (core) tokens.push({ type: 'text', text: core });
    if (cleanTrail) tokens.push({ type: 'text', text: cleanTrail, cn: cleanTrail.replace(/[,.!?;:]/g, (c) => CN_PUNCT[c]) });
  }
  // Chinese is written without spaces between words; punctuation becomes full-width
  const cnTokens = tokens.map((t) => (t.type === 'word' ? t : { ...t, text: t.cn ?? t.text }));
  if (tokens.some((t) => t.type === 'word')) note('chars');
  return { tokens: cnTokens.map((t, k) => ({ ...t, altText: tokens[k].text })), notes: [...notes.values()] };
}

export const zhCN = {
  code: 'zh-CN',
  speechLang: 'zh-CN',
  ready: loadDict,
  isReady,
  toIPA,
  fromIPA,
  isText: (s) => HAN.test(s),
};
