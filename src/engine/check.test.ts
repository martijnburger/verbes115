import { expect, test } from 'vitest';
import { checkAnswer } from './check';

test('case, spaces, apostrophes and punctuation do not matter', () => {
  expect(checkAnswer('  Nous   Allons. ', ['nous allons'])).toBe('ok');
  expect(checkAnswer('j’ai', ["j'ai"])).toBe('ok');
  expect(checkAnswer("j' ai", ["j'ai"])).toBe('ok');
});
test('que / dat may be left out', () => {
  expect(checkAnswer("j'aille", ["que j'aille"])).toBe('ok');
  expect(checkAnswer('ik ga', ['dat ik ga'])).toBe('ok');
});
test('accent mistakes are recognised', () => {
  expect(checkAnswer('je suis alle', ['je suis allé'])).toBe('accent');
  expect(checkAnswer('nous commencons', ['nous commençons'])).toBe('accent');
});
test('wrong and empty answers', () => {
  expect(checkAnswer('je vais', ['je suis allé'])).toBe('wrong');
  expect(checkAnswer('   ', ['x'])).toBe('wrong');
});
