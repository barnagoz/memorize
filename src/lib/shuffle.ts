/**
 * Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new shuffled array without mutating the original.
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffle and ensure the result differs from the original order.
 * Falls back to the shuffled version if array length <= 2.
 */
export function shuffleWithDifference<T>(array: T[]): T[] {
  if (array.length <= 1) return [...array];
  
  let shuffled: T[];
  let attempts = 0;
  
  do {
    shuffled = fisherYatesShuffle(array);
    attempts++;
  } while (
    attempts < 10 &&
    shuffled.every((item, i) => item === array[i])
  );
  
  return shuffled;
}
