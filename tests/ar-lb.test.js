import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arLB } from '../src/langs/ar-lb/index.js';
import { ptBR } from '../src/langs/pt-br/index.js';

const ipa = (text, casual = true) => arLB.toIPA(text, { casual }).map((t) => t.ipa ?? t.text).join('');
const adapt = (text) => {
  const { tokens } = arLB.fromIPA(text);
  const join = (f) => tokens.map((t) => (t.type === 'word' ? t[f] : t.text)).join('');
  return [join('spelled'), join('alt'), join('adapted')];
};

test('Arabic → IPA: everyday Lebanese words', () => {
  assert.equal(ipa('مرحبا، كيفك؟'), 'ˈmarħaba, ˈkiːfak?');
  assert.equal(ipa('شو اسمك؟'), 'ʃu ˈʔismak?');
  assert.equal(ipa('بحبك كتير'), 'ˈbħibbak ktiːr');
  assert.equal(ipa('صباح الخير'), 'sˤaˈbaːħ ilˈxeːr');
  assert.equal(ipa('عندي 25 سنة'), 'ˈʕindi ˈxamse w ʕiʃˈriːn ˈsene');
});

test('Arabic → IPA: vowelled text, Lebanese vs Standard Arabic', () => {
  const cases = [
    ['ثَلَاثَة', 'taˈlaːte', 'θaˈlaːθa'],
    ['قَلَم', 'ˈʔalam', 'ˈqalam'],
    ['جَبَل', 'ˈʒabal', 'ˈdʒabal'],
    ['بَيْت', 'beːt', 'bajt'],
    ['مَدْرَسَة', 'ˈmadrase', 'ˈmadrasa'],
    ['كِتَابٌ', 'kiˈtaːb', 'kiˈtaːb'],
    ['شُكْرًا', 'ˈʃukran', 'ˈʃukran'],
    ['السَّلَامُ عَلَيْكُمْ', 'issaˈlaːm ʕaˈleːkum', 'ʔassaˈlaːm ʕaˈlajkum'],
  ];
  for (const [w, leb, fusha] of cases) {
    assert.equal(ipa(w), leb, `${w} (Lebanese)`);
    assert.equal(ipa(w, false), fusha, `${w} (fusha)`);
  }
});

test('Arabic → IPA: article, sun letters and liaison', () => {
  assert.equal(ipa('الشمس'), 'iʃˈʃams');
  assert.equal(ipa('في البيت'), 'fi lbeːt');
  assert.equal(ipa('للبيت'), 'lilˈbeːt');
});

test('Arabic → IPA: unvowelled unknown words are flagged as guessed', () => {
  const [tok] = arLB.toIPA('كلب', { casual: true });
  assert.equal(tok.guessed, true);
  assert.equal(tok.ipa, 'kalb');
});

test('IPA → Arabic script, Arabizi and adapted IPA', () => {
  assert.deepEqual(adapt('ˈθæŋk ju'), ['سَنْك يُو', 'sank yu', 'sank ju']);
  assert.deepEqual(adapt('ˈstɹɔːbəɹi'), ['إِسْتْرُوبِرِي', 'istroberi', 'istˈroːberi']);
  assert.deepEqual(adapt('ˈmarħaba ˈkiːfak'), ['مَرْحَبَا كِيفَك', 'mar7aba kifak', 'ˈmarħaba ˈkiːfak']);
  assert.deepEqual(adapt('ħabiːbi'), ['حَبِيبِي', '7abibi', 'ħaˈbiːbi']);
});

test('Arabic → Portuguese through IPA', () => {
  const ipaText = arLB.toIPA('مرحبا', { casual: true }).map((t) => t.ipa ?? t.text).join('');
  const { tokens } = ptBR.fromIPA(ipaText);
  assert.equal(tokens.map((t) => t.spelled ?? t.text).join(''), 'márraba');
});
