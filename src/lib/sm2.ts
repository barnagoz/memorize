/**
 * SM-2 (SuperMemo 2) spaced repetition algorithm.
 * 
 * Grade scale:
 *   5 – perfect response
 *   4 – correct response after hesitation
 *   3 – correct response with difficulty
 *   2 – incorrect response; easy to recall correct answer
 *   1 – incorrect response; correct answer remembered
 *   0 – complete blackout
 */

export interface SM2Input {
  grade: number; // 0-5
  repetitions: number;
  easinessFactor: number;
  interval: number; // in days
}

export interface SM2Output {
  repetitions: number;
  easinessFactor: number;
  interval: number; // in days
  nextReviewDate: number; // timestamp
}

export function calculateSM2(input: SM2Input): SM2Output {
  const { grade, repetitions, easinessFactor, interval } = input;

  let newRepetitions: number;
  let newInterval: number;
  let newEF: number;

  if (grade >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easinessFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update easiness factor
  newEF = easinessFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  // Floor at 1.3
  if (newEF < 1.3) newEF = 1.3;

  const now = Date.now();
  const nextReviewDate = now + newInterval * 24 * 60 * 60 * 1000;

  return {
    repetitions: newRepetitions,
    easinessFactor: Math.round(newEF * 100) / 100,
    interval: newInterval,
    nextReviewDate,
  };
}

/**
 * Convert a game score (0-100) to an SM-2 grade (0-5).
 */
export function scoreToGrade(score: number): number {
  if (score >= 95) return 5;
  if (score >= 85) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  if (score >= 25) return 1;
  return 0;
}
