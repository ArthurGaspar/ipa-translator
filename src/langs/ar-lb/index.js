// Arabic (Lebanese accent) ⇄ IPA, text level.

import { readWord } from './g2p.js';
import { parseIPA, syllabify, assignStress, sylsToIPA } from './phon.js';
import { numberToIPA } from './numbers.js';
import { adaptWord } from './adapt.js';
import { spellArabic, spellArabizi } from './spell.js';
import { CLITICS } from './lexicon.js';

// Arabic letters are \p{L} and vowel marks \p{M}; Arabic punctuation (، ؛ ؟) is neither
const TOKEN_RE = /([0-9٠-٩]+)|([\p{L}\p{M}]+)|([^\p{L}\p{M}0-9٠-٩]+)/gu;
const ARABIC_LETTER = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const SAME_PHRASE = /^[\s-]*$/;

function wordIPA(segs, opts) {
  const syls = assignStress(syllabify(segs));
  const plain = sylsToIPA(syls, {});
  return sylsToIPA(syls, opts, CLITICS.has(plain));
}

/** Arabic text → IPA. opts: { casual (Lebanese), dots } */
export function toIPA(text, opts = {}) {
  const casual = opts.casual !== false;
  const out = [];
  let prevEndsInVowel = false; // previous word in the same phrase ends in a vowel
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m[1]) {
      numberToIPA(m[1]).forEach((w, k) => {
        if (k) out.push({ type: 'text', text: ' ' });
        out.push({ type: 'word', src: k ? '' : m[1], ipa: wordIPA(parseIPA(w), opts) });
      });
      prevEndsInVowel = false;
    } else if (m[2]) {
      if (!ARABIC_LETTER.test(m[2])) { out.push({ type: 'text', text: m[2] }); continue; }
      const r = readWord(m[2], casual);
      // After a vowel the article is just l- (fi l-beːt), not il-
      if (r.article && prevEndsInVowel && r.segs[0]?.v === 'i') r.segs.shift();
      prevEndsInVowel = !!r.segs[r.segs.length - 1]?.v;
      out.push(r.segs.length ? { type: 'word', src: m[2], ipa: wordIPA(r.segs, opts), guessed: r.guessed } : { type: 'text', text: m[2] });
    } else {
      // IPA is written left to right with Latin punctuation
      out.push({ type: 'text', text: m[3].replace(/،/g, ',').replace(/؛/g, ';').replace(/؟/g, '?') });
      if (!SAME_PHRASE.test(m[3])) prevEndsInVowel = false;
    }
  }
  return out;
}

const PUNCT_EDGE = /^([¿¡"“«(\[/]*)(.*?)([.,;:!?…"”»)\]/،؛؟]*)$/u;

/** IPA (any language) → Arabic script (vowelled) + Arabizi + Lebanese-adapted IPA. */
export function fromIPA(text, opts = {}) {
  const notes = new Map();
  const note = (key, from = '', to = '') => {
    const id = `${key}|${from}`;
    if (!notes.has(id)) notes.set(id, { key, from, to });
  };
  const tokens = [];
  // Arabic punctuation in the output
  const arPunct = (s) => s.replace(/\?/g, '؟').replace(/,/g, '،').replace(/;/g, '؛');
  for (const chunk of text.split(/(\s+)/)) {
    if (!chunk) continue;
    if (/^\s+$/.test(chunk)) { tokens.push({ type: 'text', text: chunk }); continue; }
    if (chunk === '|' || chunk === '‖') { tokens.push({ type: 'text', text: chunk === '|' ? '،' : '.' }); continue; }
    const [, lead, core, trail] = chunk.match(PUNCT_EDGE);
    const cleanLead = lead.replace(/[[\]/¿¡]/g, ''), cleanTrail = trail.replace(/[[\]/]/g, '');
    if (cleanLead) tokens.push({ type: 'text', text: cleanLead });
    const segs = core ? adaptWord(core, note) : null;
    if (segs) {
      const syls = assignStress(syllabify(segs));
      tokens.push({ type: 'word', src: core, spelled: spellArabic(syls), alt: spellArabizi(syls), adapted: sylsToIPA(syls, opts) });
    } else if (core) tokens.push({ type: 'text', text: core });
    if (cleanTrail) tokens.push({ type: 'text', text: arPunct(cleanTrail), altText: cleanTrail });
  }
  if (tokens.some((t) => t.type === 'word' && /[eo]/.test(t.adapted))) note('eo');
  return { tokens, notes: [...notes.values()] };
}

export const arLB = {
  code: 'ar-LB',
  speechLang: 'ar-LB',
  rtl: true,
  toIPA,
  fromIPA,
};

