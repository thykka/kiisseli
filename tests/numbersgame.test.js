import test from 'ava';

import NumbersGame from '../modules/numbersgame.js';

test('Initializes a new game', async t => {
  const ng = new NumbersGame();
  t.assert(typeof ng.targetNumber === 'number');
});

test('Generates a given amount of unique integers', async t => {
  const ng = new NumbersGame();
  for(let i = 0; i < 1000; i++) {
    const smallCount = Math.ceil(Math.random() * 6);
    const result = ng.generateNumbers(smallCount, 6);
    t.assert(Array.isArray(result));
    t.assert(result.length === 6);
  }
});

test('Adds a player to an existing game', async t => {
  const ng = new NumbersGame();
  ng.addPlayer('testPlayer');
  ng.addPlayer('testPlayer2');
  t.assert(ng.players.length === 2);
});

test('Ensures a given answer is valid', async t => {
  const ng = new NumbersGame({
    numbers: [1, 2, 3, 4, 5, 6]
  });
  const result = ng.isValidAnswer('1 + 2 - 3 * 4 / 5');
  t.assert(result === true);
  const result2 = ng.isValidAnswer('1+2-3*4/5');
  t.assert(result2 === true);
  const result3 = ng.isValidAnswer('2 ^ 3');
  t.assert(result3 === false);
  const result4 = ng.isValidAnswer('8 + 2');
  t.assert(result4 === false);
  const result5 = ng.isValidAnswer('1 + 1 + 1');
  t.assert(result5 === false);
  const result6 = ng.isValidAnswer('1 + (2 / 3)');
  t.assert(result6 === true);
});

test('Adds an answer for a player', async t => {
  const ng = new NumbersGame({
    targetNumber: 128,
    numbers: [2, 3, 4, 5, 64, 256]
  });
  const playerAnswer = '256 / 4 * 3 + 5 * 2 - 64';
  ng.addAnswer('testPlayer', playerAnswer);
  const answer = ng.players[0].answers[0];
  t.assert(typeof answer.expression === 'string');
  t.assert(answer.result === 138);
  t.assert(answer.difference === 10);
});

test('Counts the score for an answer', async t => {
  const testAnswer = '256 / 4 * 3 + 5 * 2 - 64';
  const ng = new NumbersGame();
  const result = ng.getResult(testAnswer);
  t.assert(result === 138);
})