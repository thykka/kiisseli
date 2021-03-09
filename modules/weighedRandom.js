const { random } = Math;

/**
 * @param {Array[Number]} weights - List of weights as numeric values
 * @param {Array[*]} [values] - List of values to pick from. Defaults to returning the weight index
 * @returns {*|number} - The picked list item, or the picked weight index
 */
function weighedRandom(weights, values = []) {
  const rnd = random();
  const firstIndex = normalizeWeights(weights)
    .map(mAccumulate())
    .findIndex(av => rnd < av);
  return values.length ? values[firstIndex] : firstIndex;
}

/**
 * @param {Number} [initial] - Where to begin accumulating from. Defaults to 0
 * @returns {Function} - A closured .map function
 */
function mAccumulate(initial) {
  let acc = initial || 0;
  return value => {
    return acc += value;
  }
}

/**
 * @param {Array[Number]} weights - List of weights as numeric values
 * @returns {Array[number]} - List of values scaled so their sum equals 1
 */
function normalizeWeights(weights) {
  const sum = weights.reduce(rSum, 0);
  if(sum === 1) return weights;
  return weights.map(v => v / sum);
}

/**
 * @param {Number} sum - reduce sum argument
 * @param {Number} value - reduce value argument
 */
function rSum(sum, value) {
  return sum + value;
}

export default weighedRandom;
export { weighedRandom, normalizeWeights, rSum, mAccumulate };