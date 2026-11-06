import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esES } from '../src/langs/es-es/index.js';

const ipa = (text, casual = true) => esES.toIPA(text, { casual }).map((t) => t.ipa ?? t.text).join('');
const adapt = (text) => {
  const { tokens } = esES.fromIPA(text);
  return [tokens.map((t) => t.spelled ?? t.text).join(''), tokens.map((t) => t.adapted ?? t.text).join('')];
};

test('Spanish → IPA: words', () => {
  const cases = {
    casa: 'ˈkasa', perro: 'ˈpero', cerveza: 'θeɾˈβeθa', gente: 'ˈxente', calle: 'ˈkaʝe', bien: 'bjen',
    aire: 'ˈajɾe', ciudad: 'θjuˈða', país: 'paˈis', guerra: 'ˈɡera', pingüino: 'piŋˈɡwino', agua: 'ˈaɣwa',
    mismo: 'ˈmizmo', enfermo: 'eɱˈfeɾmo', España: 'esˈpaɲa', historia: 'isˈtoɾja', acción: 'akˈθjon',
    México: 'ˈmexiko', hoy: 'oj', huevo: 'ˈweβo',
  };
  for (const [w, expected] of Object.entries(cases)) assert.equal(ipa(w), expected, w);
});

test('Spanish → IPA: careful vs everyday speech', () => {
  assert.equal(ipa('cansado', false), 'kanˈsaðo');
  assert.equal(ipa('cansado'), 'kanˈsao');
  assert.equal(ipa('Madrid', false), 'maˈðɾið');
  assert.equal(ipa('Madrid'), 'maˈðɾi');
});

test('Spanish → IPA: phrases (soft b/d/g, assimilation, s-voicing) and numbers', () => {
  assert.equal(ipa('La boca de Barcelona'), 'la ˈβoka ðe βaɾθeˈlona');
  assert.equal(ipa('Los dos gatos'), 'loz ðoz ˈɣatos');
  assert.equal(ipa('en Madrid'), 'em maˈðɾi');
  assert.equal(ipa('25'), 'bejntiˈθiŋko'); // b is a stop after a pause
  assert.equal(ipa('tengo 25'), 'ˈteŋɡo βejntiˈθiŋko');
});

test('IPA → Spanish', () => {
  const cases = {
    həˈloʊ: ['jelóu', 'xeˈlow'],
    'ˈθæŋk ju': ['zanque hiu', 'ˈθaŋke ju'],
    'ˈstɹɔːbəɹi': ['estróberi', 'esˈtɾoβeɾi'],
    pɑɹk: ['parque', 'ˈpaɾke'],
    ʃoʊ: ['chou', 'tʃow'],
    ʃtaɪn: ['estáin', 'esˈtajn'],
    'ˈhiu': ['jíu', 'xiw'],
    'kaˈfe': ['café', 'kaˈfe'],
  };
  for (const [src, expected] of Object.entries(cases)) assert.deepEqual(adapt(src), expected, src);
});

test('IPA → Spanish spelling reads back as the adapted pronunciation', () => {
  for (const src of ['həˈloʊ', 'ˈstɹɔːbəɹi', 'pɑɹk', 'ʃtaɪn', 'ˈhiu', 'bɔ̃ˈʒuʁ', 'kaˈfe']) {
    const [spelled, adapted] = adapt(src);
    assert.equal(ipa(spelled, false), adapted, `${src} → ${spelled}`);
  }
});
