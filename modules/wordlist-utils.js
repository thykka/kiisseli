function countLetterOccurrences(list) {
  let occurrences = {};
  list.forEach(word => {
    [...word].forEach(letter => {
      const l = letter.toUpperCase();
      if(!occurrences[l]) occurrences[l] = 0;
      occurrences[l]++;
    })
  });
  return occurrences;
}

function countWordsByLengths(list) {
  const lengths = [0];
  list.forEach(word => {
    lengths[word.length] = (lengths[word.length] || 0) + 1;
  });
  return lengths;
}

function findMaxValue(oValues) {
  return Object.entries(oValues).reduce(
    (m,[,v]) => Math.max(m,v,0), 0
  );
}

function normalizeByMax(oValues) {
  const maxValue = findMaxValue(oValues);
  return Object.fromEntries(Object.entries(oValues)
    .map(([letter, value]) => [letter, value / maxValue])
  );
}

function Sum(sum, value) {
  return sum + value;
}

function calculatePoints(list, word, occurrences, lengths) {
  occurrences = occurrences || normalizeByMax(countLetterOccurrences(list));
  const letterCommonRatio = [...(word || '')].reduce((pts, letter) => {
    pts.push(
      occurrences[letter.toUpperCase()]
    );
    return pts;
  },[]);
  
  lengths = lengths || normalizeByMax(countWordsByLengths(list));
  const wordLengthRatio = lengths[(word || '').length] || 0;

  return Math.floor(
    Math.max(
      0,
      letterCommonRatio.reduce(Sum, 0)
      + wordLengthRatio
      + (word || '').length - 4
    )
  );
}

export {
  countLetterOccurrences as countOccurrences,
  countWordsByLengths,
  findMaxValue,
  normalizeByMax,
  calculatePoints
};