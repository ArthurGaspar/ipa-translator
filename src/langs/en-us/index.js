// American English ⇄ IPA, text level.

import { loadDict, isReady } from './dict.js';
import { wordToPhones, syllabify } from './g2p.js';
import { realizeWord, startsWithVowel } from './phonology.js';
import { numberToWords } from './numbers.js';
import { adaptWord } from './adapt.js';
import { respellWord } from './respell.js';

const TOKEN_RE = /(\d+)|([\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*'?)|([^\p{L}\p{M}\d]+)/gu;
const SAME_PHRASE = /^[\s-]*$/;

/**
 * English text → IPA (General American).
 * opts: { casual, dots } → [{ type: 'word', src, ipa, guessed } | { type: 'text', text }]
 */
export function toIPA(text, opts = {}) {
  const items = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m[1]) {
      numberToWords(m[1]).split(' ').forEach((w, k) => {
        if (k) items.push({ type: 'text', text: ' ' });
        items.push({ type: 'word', src: k ? '' : m[1], spelled: w });
      });
    } else if (m[2]) items.push({ type: 'word', src: m[2], spelled: m[2] });
    else items.push({ type: 'text', text: m[3] });
  }
  for (const it of items) {
    if (it.type !== 'word') continue;
    const r = wordToPhones(it.spelled, opts);
    if (r) Object.assign(it, { syls: syllabify(r.phones), guessed: r.guessed, func: r.func });
  }
  const nextWord = (k) => {
    const gap = items[k + 1];
    if (gap?.type === 'word') return gap;
    if (gap?.type === 'text' && SAME_PHRASE.test(gap.text) && items[k + 2]?.type === 'word') return items[k + 2];
    return null;
  };
  return items.map((it, k) => {
    if (it.type !== 'word') return it;
    if (!it.syls) return { type: 'text', text: it.src };
    const nextV = startsWithVowel(nextWord(k)?.syls);
    let syls = it.syls;
    // "the" before a vowel: [ði]
    if (it.spelled.toLowerCase() === 'the' && nextV) syls = [{ ...syls[0], v: 'i' }];
    return { type: 'word', src: it.src || it.spelled, ipa: realizeWord(syls, opts, nextV, it.func), guessed: it.guessed };
  });
}

const PUNCT_EDGE = /^([¿¡"“«(\[/]*)(.*?)([.,;:!?…"”»)\]/،؛؟]*)$/u;

/** IPA (any language) → English respelling + American-adapted IPA. */
export function fromIPA(text, opts = {}) {
  const notes = new Map();
  const note = (key, from = '', to = '') => {
    const id = `${key}|${from}`;
    if (!notes.has(id)) notes.set(id, { key, from, to });
  };
  const tokens = [];
  for (const chunk of text.split(/(\s+)/)) {
    if (!chunk) continue;
    if (/^\s+$/.test(chunk)) { tokens.push({ type: 'text', text: chunk }); continue; }
    if (chunk === '|' || chunk === '‖') { tokens.push({ type: 'text', text: chunk === '|' ? ',' : '.' }); continue; }
    const [, lead, core, trail] = chunk.match(PUNCT_EDGE);
    const cleanLead = lead.replace(/[[\]/]/g, ''), cleanTrail = trail.replace(/[[\]/]/g, '');
    if (cleanLead) tokens.push({ type: 'text', text: cleanLead });
    const syls = core ? adaptWord(core, note) : null;
    if (syls) {
      tokens.push({ type: 'word', src: core, spelled: respellWord(syls), adapted: realizeWord(syls, { dots: !!opts.dots }) });
    } else if (core) tokens.push({ type: 'text', text: core });
    if (cleanTrail) tokens.push({ type: 'text', text: cleanTrail });
  }
  return { tokens, notes: [...notes.values()] };
}

export const enUS = {
  code: 'en-US',
  speechLang: 'en-US',
  ready: loadDict,
  isReady,
  toIPA,
  fromIPA,
  /** Text to send to speech synthesis for a respelled output. */
  speakable: (s) => s.toLowerCase().replace(/-/g, ''),
};
