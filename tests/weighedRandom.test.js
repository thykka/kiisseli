import test from 'ava';

import { rSum, weighedRandom, normalizeWeights, mAccumulate } from '../modules/weighedRandom.js';

test('rSum sums an array together with reduce', t => {
  const result = [1,1,1,2].reduce(rSum, 0);
  t.assert(result === 5, `Expected 5, got ${result}`);
})

test('normalizeWeights scales values properly', t => {
  const values = [0,1,2];
  const expects = [0,1/3,2/3];
  const result = normalizeWeights(values);
  expects.forEach((expect, i) => t.assert(
    result[i] === expect,
    `expected ${ expects }, got ${ result }`
  ));

  t.assert(result.reduce(rSum, 0) === 1);
});

test('mAccumulate returns a cumulated list', t => {
  const values = [1,1,1];
  const expects = [1,2,3];
  const result = values.map(mAccumulate());
  expects.forEach((expect, i) => t.assert(
    result[i] === expect,
    `expected ${ expects }, got ${ result }`
  ));
});

test('Returns an item from the list, considering weights', t => {
  const weights = [0, 1];
  const values = ['foo', 'bar'];
  let result;
  Array.from({ length: 9001 }).forEach(() => {
    result = weighedRandom(weights, values);
    t.assert(result === values[1], `expected ${values[1]}, got ${result}`);
  });
});