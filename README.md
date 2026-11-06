# Tradutor IPA · IPA Translator

A Google Translate–style page that converts **Brazilian Portuguese**, **American English**, **Spanish (Spain)**, **Arabic (Lebanese accent)** and **Mandarin Chinese (mainland)** ⇄ **IPA** (International Phonetic Alphabet).

- **Português → IPA**: the pronunciation a *neutral* Brazilian speaker would use.
  For example, *Bom dia! Tudo bem?* → `[bõ ˈdʒiɐ! ˈtudu bẽj̃?]`
- **IPA → Português**: takes IPA from **any** language and turns it into something a Brazilian would say
  naturally, written in Portuguese spelling. Only the changes Portuguese requires are made.
  For example, English `ˈstɹɔːbəɹi` → **estróbari** `[isˈtɾɔbɐɾi]`, and `dɔɡ` → **dógui**.
  The page also lists every change it made ("O que mudou") and can read the result aloud.

- **English → IPA**: General American, from the CMU Pronouncing Dictionary (126k words).
  For example, *I want a bottle of water* → `[aɪ wɑnt ə ˈbɑɾəl əv ˈwɑɾɚ]`
- **IPA → English**: a dictionary-style pronunciation respelling, e.g. `bɔ̃ˈʒuʁ mɛʁˈsi` → **bawn-ZHOOR mair-SEE**,
  `ˈhiu dʒi ʒaˈnejɾu` → **HEE-oo jee zhah-NAY-roo**.
- **Spanish → IPA**: a generic accent from Spain. For example, *¿Quieres una cerveza?* → `[ˈkjeɾes ˈuna θeɾˈβeθa]`
- **IPA → Spanish**: Spanish spelling with written accents, e.g. `həˈloʊ` → **jelóu**, `pɑɹk` → **parque**, `ˈstɹɔːbəɹi` → **estróberi**.
- **Arabic → IPA**: everyday Lebanese pronunciation, e.g. *مرحبا، كيفك؟* → `[ˈmarħaba, ˈkiːfak?]`, *بَيْت* → `[beːt]`.
  Turn "everyday speech" off for a Standard Arabic (fuṣḥā) reading (*بَيْت* → `[bajt]`).
- **IPA → Arabic**: Arabic script with every vowel marked, plus **Arabizi** (Lebanese chat spelling):
  `ˈθæŋk ju` → **سَنْك يُو** / **sank yu**, `ˈstɹɔːbəɹi` → **إِسْتْرُوبِرِي** / **istroberi**.
- **Mandarin → IPA**: from characters or pinyin, with tone letters and everyday tone sandhi:
  *你好* → `[ni˧˥ xɑʊ˨˩˦]`, *一个人* → `[i˧˥ kɤ˥˩ ʐən˧˥]`. The pinyin is shown too.
- **IPA → Mandarin**: the way Chinese transliterates foreign names, as characters + pinyin:
  `bɛst` → **贝斯特** *bèi sī tè*, `tɹʌmp` → **特朗普** *tè lǎng pǔ*, `ˈmaɪkəl` → **迈克尔** *mài kè ěr*.
- **Between any two languages** (for example Portuguese ⇄ English) the text goes through IPA and shows how a speaker of one language would say the other:
  *thank you* → **tênqui iu**, *Rio de Janeiro* → **HEE-oo jee zhah-NAY-roo**.

It's a static site with no build step and no dependencies, so it runs on GitHub Pages as is.

## Accent choices (neutral Brazilian)

| Feature | Choice | Example |
|---|---|---|
| t, d before [i] | [tʃ], [dʒ] | *dia* [ˈdʒiɐ], *noite* [ˈnojtʃi] |
| syllable-final l | [w] | *Brasil* [bɾaˈziw] |
| strong r (rr, initial r) and syllable-final r | [h] | *carro* [ˈkahu], *porta* [ˈpɔhtɐ] |
| syllable-final s | [s]/[z], not [ʃ] | *mesmo* [ˈmezmu] |
| unstressed final e / o / a | [i] / [u] / [ɐ] | *leite* [ˈlejtʃi] |
| sandhi between words | s → [z], r → [ɾ] before vowels | *os amigos* [uz aˈmiɡus] |

The **"Fala do dia a dia"** (everyday speech) switch adds these features of casual speech:

- an extra [i] in consonant clusters (*ritmo* [ˈhitʃimu], *pneu* [piˈnew])
- *ou* → [o]
- *ei* → [e] before r/ch/j
- initial *es-/des-/en-* → [i]

## American English choices

| Feature | Choice | Example |
|---|---|---|
| r | always pronounced | *car* [kɑɹ] |
| *cot* / *caught* | merged as [ɑ] (except before r) | *thought* [θɑt], *north* [nɔɹθ] |
| t, d between vowels | flapped [ɾ] (everyday speech) | *water* [ˈwɑɾɚ], *get it* [ɡɛɾ ɪt] |
| nt before an unstressed vowel | [n] (everyday speech) | *twenty* [ˈtwɛni] |
| t before syllabic n | glottal [ʔ] (everyday speech) | *button* [ˈbʌʔn̩] |
| function words | weak forms (everyday speech) | *to* [tə], *and* [ən], *of* [əv] |

Words missing from the dictionary get a rule-based guess. They're shown underlined so you know to double-check them.

## Spanish (Spain) choices

| Feature | Choice | Example |
|---|---|---|
| c (e, i), z | [θ] (distinción) | *cerveza* [θeɾˈβeθa] |
| j, g (e, i) | [x] | *gente* [ˈxente] |
| ll and y | the same, [ʝ] (yeísmo) | *calle* [ˈkaʝe] |
| b, d, g after a vowel | soft [β ð ɣ] | *la boca* [la ˈβoka] |
| n before a consonant | takes its place | *en Madrid* [em maˈðɾi], *tengo* [ˈteŋɡo] |
| s before a voiced consonant | [z] | *mismo* [ˈmizmo] |
| -ado, final -d | [ao], dropped (everyday speech) | *cansado* [kanˈsao], *Madrid* [maˈðɾi] |

## Arabic (Lebanese) choices

| Feature | Everyday Lebanese | Standard Arabic (switch off) |
|---|---|---|
| ق | [ʔ] (*قلب* [ʔalb]) | [q] |
| ث ذ ظ | [t] [d] [dˤ] | [θ] [ð] [ðˤ] |
| ج | [ʒ] | [dʒ] |
| final ة | [e], or [a] after back/emphatic consonants (*مدرسة* [ˈmadrase], *صِحَّة* [ˈsˤiħħa]) | [a] |
| ay, aw | [eː], [oː] (*بيت* [beːt], *يوم* [joːm]) | [aj], [aw] |
| article ال | *il-*, *l-* after a vowel, sun letters assimilate (*الشمس* [iʃˈʃams], *في البيت* [fi lbeːt]) | *ʔal-* |
| stress | Levantine rule (*مدرسة* [ˈmadrase]) | same |

**Short vowels.** Arabic script usually leaves short vowels out:

- **Text with *tashkīl*** (فَتْحة، كَسْرة، ضَمّة، شَدّة) is read exactly as written.
- **Text without it**: about 150 everyday Lebanese words come from `src/langs/ar-lb/lexicon.js`.
- **Other words** get guessed short vowels and are shown underlined.

Add words to the lexicon to improve unvowelled text.

## Mandarin choices

- **Readings**: [pinyin-data](https://github.com/mozillazg/pinyin-data) (26k characters) and
  [phrase-pinyin-data](https://github.com/mozillazg/phrase-pinyin-data). Only the 9k words whose reading differs
  from their characters' defaults are kept (银行 *yínháng* vs 行人 *xíngrén*). Rebuild with `node tools/build-zh-dict.mjs`.
- **Sounds**: standard mainland initials and finals (zh ch sh = [ʈʂ ʈʂʰ ʂ], j q x = [tɕ tɕʰ ɕ], 字 [tsɹ̩], 是 [ʂɻ̩]).
- **Tones**: Chao tone letters 1 ˥, 2 ˧˥, 3 ˨˩˦, 4 ˥˩, neutral unmarked.
- **Everyday speech** (the switch) applies tone sandhi. With it off you get dictionary tones.
  - 3+3 → 2+3
  - 一 → *yí* before 4th tone, *yì* before others
  - 不 → *bú* before 4th tone
  - a 3rd tone mid-phrase is the "half third" [˨˩]
  - 4+4 → [˥˧]+[˥˩]
- **Pinyin input** accepts tone marks (*nǐ hǎo*), numbers (*ni3 hao3*) or no tones (flagged as guessed).

## Running locally

ES modules don't load from `file://`, so you need a local server:

```sh
python -m http.server 8000      # then open http://localhost:8000
# or
npm start                       # npx serve
```

Tests use Node's built-in test runner, so there's nothing to install:

```sh
npm test
```

## Deploying to GitHub Pages

1. Create a repository on GitHub (for example `ipa-translator`) and push this folder to the `main` branch.
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and pick `main` / `/ (root)`.
3. The site goes live at `https://<your-user>.github.io/ipa-translator/`.

The `.nojekyll` file stops GitHub from running the files through Jekyll.

## Structure

```
index.html              page
assets/style.css        Google Translate–like styling, light/dark
src/main.js             UI (tabs, swap, IPA keyboard, speech, share-by-URL)
src/i18n.js             interface strings (PT/EN) and the "what changed" explanations
src/ipa/tokenize.js     language-independent IPA tokenizer
src/langs/index.js      language registry (add new languages here)
src/langs/en-us/
  dict.js               loads data/en-us.txt (lazily, only when English is used)
  g2p.js                spelling → phonemes (dictionary, suffix rules, letter rules) + syllables
  phonology.js          General American surface rules (flapping, weak forms, glottal t)
  adapt.js              any IPA → English syllables
  respell.js            English syllables → respelling (bawn-ZHOOR)
src/langs/zh-cn/        Mandarin: dict.js, g2p.js (characters/pinyin → syllables, tone sandhi), pinyin.js
                        (syllable ↔ IPA), adapt.js + translit.js (IPA → transliteration), numbers.js
data/zh-cn.txt          character and word readings
tools/build-zh-dict.mjs rebuilds data/zh-cn.txt
src/langs/ar-lb/        Arabic: g2p.js (script → sounds), phon.js (syllables, stress), lexicon.js, adapt.js,
                        spell.js (Arabic script + Arabizi), numbers.js
src/langs/es-es/        Spanish: g2p.js, phonology.js, adapt.js, spell.js, lexicon.js, numbers.js
data/en-us.txt          compacted CMU Pronouncing Dictionary
tools/build-en-dict.mjs rebuilds data/en-us.txt from CMUdict
src/langs/pt-br/
  g2p.js                Portuguese spelling → phonemic syllables
  lexicon.js            exceptions (x = [ks], open é/ó, qu/gu = [kw]/[ɡw], …)
  phonology.js          phonemic syllables → Brazilian surface IPA (shared by both directions)
  adapt.js              any IPA → Brazilian phonemic syllables
  spell.js              phonemic syllables → Portuguese spelling, with accent marks
  numbers.js            digits → words
tests/                  node --test
```

### Adding a language

Create `src/langs/<code>/index.js` that exports `toIPA(text, opts)` and `fromIPA(text, opts)` (see `pt-br/index.js`),
register it in `src/langs/index.js`, then add its tab and strings in `main.js` / `i18n.js`.

## Credits

English pronunciations come from the [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict)
(© Carnegie Mellon University, BSD 2-clause license). To rebuild the data file, run `node tools/build-en-dict.mjs`.
Mandarin readings come from [pinyin-data](https://github.com/mozillazg/pinyin-data) and
[phrase-pinyin-data](https://github.com/mozillazg/phrase-pinyin-data) (© mozillazg, MIT license).

## Known limitations

- Stressed *e/o* without an accent mark can be open or closed (*ele* [e] vs *ela* [ɛ]). Suffix heuristics and the
  lexicon cover the most common cases. To fix a word, add it to `lexicon.js`.
- *x* is read as [ʃ] by default, and words with [ks] or [s] come from the lexicon.
- In the IPA → Portuguese direction, a final unstressed [e]/[o] can only be spelled *e/o*, which Brazilians read as [i]/[u].
- Unvowelled Arabic words outside the lexicon get guessed vowels, so they're often wrong. The guess is marked.
  Text-to-speech uses whatever Arabic voice the browser has, which is usually not Lebanese.
- Mandarin words outside the phrase list use each character's everyday reading, so rarer readings can come out wrong.
  Sandhi is applied across whole clauses, because the text isn't parsed into prosodic groups.
- English words with more than one pronunciation (*read*, *live*, *record*) always get the dictionary's first one.
