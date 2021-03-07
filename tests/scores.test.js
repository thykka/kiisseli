import test from 'ava';

import scores from '../modules/scores.js';
import Storage from 'node-persist';
(async () => {
await Storage.init();
await Storage.clear()

const testPlayer = 'TeppoTest';
const testPlayer2 = 'DanielaDemo'

test('Gets the player key', async t => {
  const s = new scores('test');
  t.assert(s.getKey(testPlayer) === `HiScores_test`);
});

test('We\'re able to use storage', async t => {
  await Storage.setItem('test1', true);
  const loaded = await Storage.get('test1');
  t.true(loaded);
})

test('Reads the default value, when no value set', async t => {
  const s = new scores('test2', { storage: Storage });
  const points = await s.getPlayerPoints(testPlayer);
  t.assert(points === 0, `Points was ${ points }`);
});

test('Saving and reading works', async t => {
  const s = new scores('test3', { storage: Storage });
  await s.setPlayerPoints(testPlayer, 1337);
  await s.setPlayerPoints(testPlayer2, -100);
  t.assert(await s.getPlayerPoints(testPlayer) === 1337);
  t.assert(await s.getPlayerPoints(testPlayer2) === -100);
});

})();