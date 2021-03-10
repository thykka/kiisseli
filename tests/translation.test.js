import test from 'ava';
import Translation from '../modules/translation.js';

function assert(test, expect, result) {
  return test.assert(result === expect, `Expected ${ expect }, got ${ result }`);
}

test('Missing translations return a bracketed key', t => {
  const expect = '[[test]]';
  const result = new Translation({}).localize('test');
  assert(t, expect, result);
});

test('Text translations return the text', t => {
  const key = 'test'
  const expect = 'Hello, World!';
  const result = new Translation({[key]: expect}).localize(key);
  assert(t, expect, result);
});

test('Function translations execute the function', t => {
  const fn = () => t.pass();
  new Translation({ test: fn }).localize('test');
});

test('Function translations use the view object', t => {
  const fn = t => `Hello, ${t.subject}!`;
  const subject = 'World';
  const expect = 'Hello, World!';
  const result = new Translation({ test: fn }).localize('test', { subject });
  assert(t, expect, result);
});