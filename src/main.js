import { LANGUAGES } from './langs/index.js';
import { STRINGS, NOTES } from './i18n.js';

const $ = (id) => document.getElementById(id);
const els = {
  src: $('src'), out: $('out'), clear: $('clearBtn'), count: $('count'), swap: $('swapBtn'),
  srcTabs: $('srcTabs'), tgtTabs: $('tgtTabs'), speakSrc: $('speakSrc'), speakOut: $('speakOut'),
  copy: $('copyBtn'), kbdBtn: $('kbdBtn'), kbd: $('keyboard'), details: $('details'),
  notes: $('notes'), notesList: $('notesList'), examples: $('examples'), casual: $('optCasual'),
  casualWrap: $('casualWrap'), casualHint: $('casualHint'), dots: $('optDots'), uiLang: $('uiLangBtn'), theme: $('themeBtn'),
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

const CODES = ['pt-BR', 'en-US', 'es-ES', 'ar-LB', 'zh-CN', 'ipa'];
const SRC_TABS = ['pt-BR', 'en-US', 'es-ES', 'ar-LB', 'zh-CN', 'ipa'];
const TGT_TABS = ['ipa', 'pt-BR', 'en-US', 'es-ES', 'ar-LB', 'zh-CN'];
const TAB_CODES = { 'pt-BR': 'PT', 'en-US': 'EN', 'es-ES': 'ES', 'ar-LB': 'AR', 'zh-CN': 'ZH', ipa: 'IPA' };

const state = {
  src: 'pt-BR',
  tgt: 'ipa',
  ui: store.get('ui') || ((navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en'),
  opts: { casual: store.get('casual') !== '0', dots: store.get('dots') === '1', brackets: store.get('brackets') ?? '[]' },
  plainOut: '',
};

const t = (key) => STRINGS[state.ui][key] ?? STRINGS.pt[key] ?? key;

const EXAMPLES = {
  'pt-BR': [
    'Bom dia! Tudo bem com você?',
    'O rato roeu a roupa do rei de Roma.',
    'Eu gosto de pão de queijo com café.',
    'Obrigado pela ajuda, até amanhã!',
    'A escola fica perto da praia.',
  ],
  'en-US': [
    'Hello! How are you doing today?',
    'I want to get a bottle of water.',
    'Thank you very much!',
    'The weather is better in the city.',
    "What's your name?",
  ],
  'es-ES': [
    '¡Hola! ¿Qué tal estás?',
    'Me gustaría una cerveza, por favor.',
    'El perro de San Roque no tiene rabo.',
    'Vivo en Madrid desde hace cinco años.',
    'Estoy muy cansado, me voy a dormir.',
  ],
  'ar-LB': [
    'مرحبا، كيفك؟',
    'شو اسمك؟',
    'بحبك كتير يا حبيبي',
    'صباح الخير',
    'كِتَابٌ جَمِيلٌ',
    'مع السلامة',
  ],
  'zh-CN': [
    '你好！你叫什么名字？',
    '我们去银行吧。',
    '谢谢你，再见！',
    '我很好，你呢？',
    'nǐ hǎo, xiè xie',
  ],
  ipa: [
    ['EN', 'ˈθæŋk ju'], ['EN', 'ˈstɹɔːbəɹi'], ['PT', 'ˈɔj, ˈtudu ˈbẽj̃?'], ['PT', 'ˈhiu dʒi ʒaˈnejɾu'],
    ['FR', 'bɔ̃ˈʒuʁ mɛʁˈsi'], ['DE', 'ɪç ˈliːbə dɪç'], ['ES', 'ˈpero ˈneɣɾo'], ['ES', 'θeɾˈβeθa'], ['AR', 'ˈmarħaba ˈkiːfak'], ['ZH', 'ni˨˩ xɑʊ˨˩˦'], ['IT', 'ˈpittsa'], ['JA', 'aɾiɡatoː'],
  ],
};

const KEYBOARD = [
  ['kbd.vowels', 'i y ɨ ʉ ɯ u ɪ ʏ ʊ e ø ɘ ɵ ɤ o ə ɛ œ ɜ ɞ ʌ ɔ æ ɐ a ɶ ɑ ɒ ɚ ɝ'],
  ['kbd.consonants', 'p b t d ʈ ɖ c ɟ k ɡ q ɢ ʔ m ɱ n ɳ ɲ ŋ ɴ ʙ r ʀ ɾ ɽ ɸ β f v θ ð s z ʃ ʒ ʂ ʐ ɕ ʑ ç ʝ x ɣ χ ʁ ħ ʕ h ɦ ɬ ɮ ʋ ɹ ɻ j ɰ l ɭ ʎ ʟ ɫ w ʍ ɥ tʃ dʒ ts dz'],
  ['kbd.marks', 'ˈ ˌ ː . ◌̃ ◌̩ ◌̯ ◌͡◌ ʰ ʷ ʲ ˞'],
];

// ---------- rendering ----------

function renderTabs() {
  const mk = (code, side) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab';
    b.role = 'tab';
    const long = document.createElement('span');
    long.className = 'long';
    long.textContent = t(`short.${code}`);
    b.title = t(`lang.${code}`); // full name, e.g. "Árabe (Líbano)"
    const short = document.createElement('span');
    short.className = 'short';
    short.textContent = TAB_CODES[code]; // compact label for narrow screens
    b.append(long, short);
    b.setAttribute('aria-selected', String(state[side] === code));
    b.addEventListener('click', () => selectLang(side, code));
    return b;
  };
  els.srcTabs.replaceChildren(...SRC_TABS.map((c) => mk(c, 'src')));
  els.tgtTabs.replaceChildren(...TGT_TABS.map((c) => mk(c, 'tgt')));
  // On narrow screens the tab rows scroll; keep the selected tab visible
  for (const row of [els.srcTabs, els.tgtTabs]) {
    const sel = row.querySelector('[aria-selected="true"]');
    if (sel) row.scrollLeft = sel.offsetLeft - (row.clientWidth - sel.offsetWidth) / 2;
  }
}

function applyI18n() {
  document.documentElement.lang = state.ui === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
  els.uiLang.textContent = state.ui === 'pt' ? 'EN' : 'PT';
  document.title = `${t('appName')} — ${CODES.filter((c) => c !== 'ipa').map((c) => t(`short.${c}`)).join(' · ')} ⇄ IPA`;
}

function renderExamples() {
  els.examples.replaceChildren(...EXAMPLES[state.src].map((ex) => {
    const [tag, text] = Array.isArray(ex) ? ex : [null, ex];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    if (tag) {
      const s = document.createElement('small');
      s.textContent = tag;
      b.append(s);
    }
    b.append(text);
    b.addEventListener('click', () => { els.src.value = text; onInput(); els.src.focus(); });
    return b;
  }));
}

function renderKeyboard() {
  els.kbd.replaceChildren(...KEYBOARD.map(([key, symbols]) => {
    const g = document.createElement('div');
    g.className = 'kbd-group';
    const h = document.createElement('h3');
    h.dataset.i18n = key;
    h.textContent = t(key);
    const keys = document.createElement('div');
    keys.className = 'kbd-keys';
    for (const sym of symbols.split(' ')) {
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'key';
      k.textContent = sym;
      const insert = sym === '◌͡◌' ? '͡' : sym.replace(/◌/g, '');
      k.title = insert;
      k.addEventListener('mousedown', (e) => e.preventDefault()); // keep textarea focus
      k.addEventListener('click', () => insertAtCursor(insert));
      keys.append(k);
    }
    g.append(h, keys);
    return g;
  }));
}

function insertAtCursor(text) {
  const ta = els.src;
  ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
  ta.focus();
  onInput();
}

const wrap = (s) => {
  const b = state.opts.brackets;
  return b ? b[0] + s + b[1] : s;
};

function wordSpan(text, title, guessed = false) {
  const span = document.createElement('span');
  span.className = guessed ? 'w guess' : 'w';
  span.textContent = text;
  const tip = [title, guessed ? t('guessed') : ''].filter(Boolean).join(' · ');
  if (tip) span.title = tip;
  return span;
}

/** Group tokens into lines and wrap each non-empty line in brackets. */
function renderLines(tokens, render, brackets = state.opts.brackets) {
  const lines = [[]];
  for (const tok of tokens) {
    if (tok.type === 'text' && tok.text.includes('\n')) {
      tok.text.split('\n').forEach((part, k) => {
        if (k) lines.push([]);
        if (part) lines[lines.length - 1].push({ type: 'text', text: part });
      });
    } else lines[lines.length - 1].push(tok);
  }
  const nodes = [];
  let plain = '';
  lines.forEach((line, k) => {
    if (k) { nodes.push('\n'); plain += '\n'; }
    const hasWord = line.some((x) => x.type === 'word');
    if (hasWord && brackets) nodes.push(brackets[0]);
    // keep trailing spaces outside the closing bracket
    const trimmed = [...line];
    let tail = '';
    while (trimmed.length && trimmed[trimmed.length - 1].type === 'text' && !trimmed[trimmed.length - 1].text.trim()) tail = trimmed.pop().text + tail;
    for (const x of trimmed) {
      const [node, txt] = render(x);
      nodes.push(node);
      plain += txt;
    }
    if (hasWord && brackets) nodes.push(brackets[1]);
    nodes.push(tail);
    plain += tail;
  });
  return { nodes, plain };
}

const ipaRender = (x) => (x.type === 'word' ? [wordSpan(x.ipa, x.src, x.guessed), x.ipa] : [x.text, x.text]);

/** Second transcription line (Arabizi, pinyin) */
const altText = (tokens) => tokens.map((x) => (x.type === 'word' ? x.alt : x.altText ?? x.text)).join('');

function detailLine(label, nodes) {
  const box = document.createElement('div');
  box.className = 'adapted';
  const l = document.createElement('div');
  l.className = 'adapted-label';
  l.textContent = label;
  const v = document.createElement('div');
  v.className = 'adapted-ipa ipa';
  v.dir = 'auto';
  v.append(...nodes);
  box.append(l, v);
  return box;
}

/** Make sure every language involved has its data loaded; returns false (and re-runs later) if not. */
function ensureReady(codes) {
  const pending = codes.map((c) => LANGUAGES[c]).filter((L) => L?.isReady && !L.isReady());
  if (!pending.length) return true;
  els.out.textContent = t(`loading.${pending[0].code}`);
  els.out.classList.add('loading');
  Promise.all(pending.map((L) => L.ready()))
    .then(() => translate())
    .catch(() => { els.out.textContent = t('loadError'); });
  return false;
}

function translate() {
  const text = els.src.value;
  const has = text.trim().length > 0;
  els.clear.hidden = !text.length;
  els.count.textContent = `${text.length} / 5000`;
  els.src.classList.toggle('small', text.length > 160);
  els.out.classList.toggle('small', text.length > 160);
  els.out.classList.remove('loading', 'placeholder');
  els.details.hidden = true;
  els.notes.hidden = true;
  state.plainOut = '';

  if (!has) {
    els.out.textContent = t('out.empty');
    els.out.classList.add('placeholder');
    updateSpeakers();
    return;
  }
  if (!ensureReady([state.src, state.tgt])) { updateSpeakers(); return; }

  const S = LANGUAGES[state.src], T = LANGUAGES[state.tgt];

  if (state.tgt === 'ipa') {
    const tokens = S.toIPA(text, state.opts);
    const { nodes, plain } = renderLines(tokens, ipaRender);
    els.out.replaceChildren(...nodes);
    state.plainOut = plain;
    if (tokens.some((x) => x.alt)) {
      els.details.replaceChildren(detailLine(t(`alt.${state.src}`), [altText(tokens)]));
      els.details.hidden = false;
    }
    updateSpeakers();
    return;
  }

  // Into a language: from IPA directly, or from another language through its IPA
  const details = [];
  let ipaText = text;
  if (state.src !== 'ipa') {
    const srcTokens = S.toIPA(text, state.opts);
    ipaText = srcTokens.map((x) => x.ipa ?? x.text).join('');
    if (srcTokens.some((x) => x.alt)) details.push(detailLine(t(`alt.${state.src}`), [altText(srcTokens)]));
    details.push(detailLine(t('ipaOf').replace('{lang}', t(`short.${state.src}`)), renderLines(srcTokens, ipaRender).nodes));
  }
  const { tokens, notes } = T.fromIPA(ipaText, { ...state.opts, sourceLang: state.src });
  const nodes = [];
  for (const x of tokens) {
    if (x.type === 'word') { nodes.push(wordSpan(x.spelled, `${wrap(x.src)} → ${wrap(x.adapted)}`)); state.plainOut += x.spelled; }
    else { nodes.push(x.text); state.plainOut += x.text; }
  }
  els.out.replaceChildren(...nodes);
  const adapted = renderLines(tokens, (x) => (x.type === 'word' ? [wordSpan(x.adapted, x.spelled), x.adapted] : [x.text, x.text]));
  if (tokens.some((x) => x.alt)) details.push(detailLine(t(`alt.${state.tgt}`), [altText(tokens)]));
  details.push(detailLine(t(`adapted.${state.tgt}`), adapted.nodes));
  els.details.replaceChildren(...details);
  els.details.hidden = false;
  renderNotes(notes);
  updateSpeakers();
}

function renderNotes(notes) {
  const texts = NOTES[state.tgt]?.[state.ui] ?? {};
  const items = notes
    .map((n) => (texts[n.key] || '').replaceAll('{from}', n.from).replaceAll('{to}', n.to))
    .filter(Boolean);
  els.notes.hidden = !items.length;
  els.notesList.replaceChildren(...items.map((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    return li;
  }));
}

// ---------- speech ----------

const canSpeak = 'speechSynthesis' in window;
let voices = [];
function loadVoices() { voices = canSpeak ? speechSynthesis.getVoices() : []; }
if (canSpeak) { loadVoices(); speechSynthesis.addEventListener?.('voiceschanged', loadVoices); }

function voiceFor(tag) {
  const [lang] = tag.split('-');
  return voices.find((v) => v.lang.replace('_', '-') === tag)
    || voices.find((v) => v.lang.toLowerCase().startsWith(lang)) || null;
}

function speak(text, code) {
  const L = LANGUAGES[code];
  if (!canSpeak || !L || !text.trim()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = voiceFor(L.speechLang);
  u.lang = v ? v.lang : L.speechLang;
  if (v) u.voice = v;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

function updateSpeakers() {
  const has = els.src.value.trim().length > 0;
  els.speakSrc.hidden = !(canSpeak && has && state.src !== 'ipa');
  els.speakOut.hidden = !(canSpeak && has && state.tgt !== 'ipa' && state.plainOut);
}

// ---------- state changes ----------

function selectLang(side, code) {
  const other = side === 'src' ? 'tgt' : 'src';
  if (state[side] === code) return;
  if (state[other] === code) state[other] = state[side]; // picking the other side's language swaps them
  state[side] = code;
  modeChanged();
}

function modeChanged() {
  const ipaSrc = state.src === 'ipa';
  els.src.placeholder = t(`ph.${state.src}`);
  els.src.classList.toggle('ipa', ipaSrc);
  els.kbdBtn.hidden = !ipaSrc;
  if (!ipaSrc) { els.kbd.hidden = true; els.kbdBtn.setAttribute('aria-expanded', 'false'); }
  els.casualWrap.hidden = ipaSrc;
  if (!ipaSrc) els.casualHint.textContent = t(`casualHint.${state.src}`);
  renderTabs();
  renderExamples();
  translate();
  saveHash();
}

function swap() {
  const out = state.plainOut;
  [state.src, state.tgt] = [state.tgt, state.src];
  if (out) els.src.value = state.src === 'ipa' ? out.replace(/[[\]/]/g, '') : out;
  autosize();
  modeChanged();
}

function autosize() {
  els.src.style.height = 'auto';
  els.src.style.height = `${els.src.scrollHeight}px`;
}

let hashTimer;
function saveHash() {
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => {
    const p = new URLSearchParams({ sl: state.src, tl: state.tgt });
    if (els.src.value) p.set('text', els.src.value);
    history.replaceState(null, '', `#${p}`);
  }, 300);
}

function loadHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const sl = p.get('sl'), tl = p.get('tl');
  if (CODES.includes(sl)) {
    state.src = sl;
    state.tgt = CODES.includes(tl) && tl !== sl ? tl : sl === 'ipa' ? 'pt-BR' : 'ipa';
  }
  if (p.get('text')) els.src.value = p.get('text');
}

function onInput() {
  autosize();
  translate();
  saveHash();
}

function setBrackets(b) {
  state.opts.brackets = b;
  store.set('brackets', b);
  document.querySelectorAll('[data-brackets]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.brackets === b)));
  translate();
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 1600);
}

// ---------- wiring ----------

els.src.addEventListener('input', onInput);
els.clear.addEventListener('click', () => { els.src.value = ''; onInput(); els.src.focus(); });
els.swap.addEventListener('click', swap);
els.speakSrc.addEventListener('click', () => speak(els.src.value, state.src));
els.speakOut.addEventListener('click', () => {
  const L = LANGUAGES[state.tgt];
  speak(L?.speakable ? L.speakable(state.plainOut) : state.plainOut, state.tgt);
});
els.copy.addEventListener('click', async () => {
  if (!state.plainOut) return;
  try { await navigator.clipboard.writeText(state.plainOut); toast(t('copied')); } catch { /* clipboard blocked */ }
});
els.kbdBtn.addEventListener('click', () => {
  const open = els.kbd.hidden;
  els.kbd.hidden = !open;
  els.kbdBtn.setAttribute('aria-expanded', String(open));
});
els.casual.addEventListener('change', () => { state.opts.casual = els.casual.checked; store.set('casual', els.casual.checked ? '1' : '0'); translate(); });
els.dots.addEventListener('change', () => { state.opts.dots = els.dots.checked; store.set('dots', els.dots.checked ? '1' : '0'); translate(); });
document.querySelectorAll('[data-brackets]').forEach((b) => b.addEventListener('click', () => setBrackets(b.dataset.brackets)));
els.uiLang.addEventListener('click', () => {
  state.ui = state.ui === 'pt' ? 'en' : 'pt';
  store.set('ui', state.ui);
  applyI18n();
  renderKeyboard();
  modeChanged();
});
els.theme.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const next = dark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('theme', next);
});
// Ctrl/Cmd + Shift + S swaps languages, as in Google Translate
els.src.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); swap(); } });

window.addEventListener('hashchange', () => { loadHash(); autosize(); modeChanged(); });

// ---------- init ----------

els.casual.checked = state.opts.casual;
els.dots.checked = state.opts.dots;
loadHash();
renderKeyboard();
applyI18n();
document.querySelectorAll('[data-brackets]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.brackets === state.opts.brackets)));
modeChanged();
autosize();
