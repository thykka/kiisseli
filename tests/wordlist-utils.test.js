import test from 'ava';
import _ from 'lodash';
import wordList from '../modules/wordlist-fi.js';
import { weighedRandom } from '../modules/weighedRandom.js';
import {
  calculatePoints,
  countOccurrences,
  countWordsByLengths,
  findMaxValue,
  normalizeByMax
} from '../modules/wordlist-utils.js';


test('count the letters in the dataset', t => {
  const occurrences = countOccurrences(wordList);
  t.truthy(occurrences);
});

test('count words by lengths', t => {
  const lengths = countWordsByLengths(wordList);
  t.truthy(lengths);
});

test('find most used letter', t => {
  const occurrences = countOccurrences(wordList);
  const maxValue = findMaxValue(occurrences);
  t.true(typeof maxValue === 'number');
});

test('find most common length', t => {
  const lengths = countWordsByLengths(wordList);
  const mostCommon = findMaxValue(lengths);
  t.true(typeof mostCommon === 'number');
});

test('normalize values!', t => {
  const occurrences = normalizeByMax(countOccurrences(wordList));
  const lengths = normalizeByMax(countWordsByLengths(wordList));
  t.truthy(occurrences);
  t.truthy(lengths);
});

const lengthProbabilities = [0,0,1,10,20,10,5,2,1,1,1,1];
//*
const testWords = Array.from({
  length: 32
}, () => {
  let newLength = weighedRandom(lengthProbabilities) + 1;
  const list = wordList.filter(word => word.length === newLength);
  return _.sample(list)
});
/*/
const testWords = 'pisama haukka sunni hiki jalake käsi aina aivotoiminta klaani pölli koraali taju paukama oheen palle huostaanotto geiša ne luova punninta rangi koski ei tuulikuorma höpistä kaita kujeilu yhä hus hä repro väki'.split(' ')
console.log(testWords.join(' '));
//*/

test('calculate points', t => {
  testWords.sort((a,b)=>a.length-b.length).forEach(word => {
    const wordPoints = calculatePoints(wordList, word);
    t.truthy(typeof wordPoints === 'number' && !Number.isNaN(wordPoints));
  });
  t.truthy(true)
})