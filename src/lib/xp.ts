import { db, getOrCreateStreak } from '../db';
import type { GameType, GameSession } from '../types';

/**
 * XP rewards per game type.
 */
const XP_REWARDS: Record<GameType, { base: number; perPoint: number }> = {
  'tap-to-reveal': { base: 5, perPoint: 0 },
  'density-slider': { base: 5, perPoint: 0 },
  'first-letter': { base: 10, perPoint: 0.2 },
  'blanks': { base: 10, perPoint: 0.2 },
  'scramble': { base: 15, perPoint: 0.3 },
  'type-it': { base: 20, perPoint: 0.5 },
  'multiple-choice': { base: 15, perPoint: 0.3 },
};

/**
 * Calculate XP earned for a game session.
 */
export function calculateXP(gameType: GameType, score: number): number {
  const reward = XP_REWARDS[gameType];
  return Math.round(reward.base + score * reward.perPoint);
}

/**
 * Record a completed game session and update progress + streak.
 */
export async function recordSession(
  documentId: number,
  gameType: GameType,
  score: number,
): Promise<GameSession> {
  const xpEarned = calculateXP(gameType, score);

  // Save session
  const session: GameSession = {
    documentId,
    gameType,
    score,
    xpEarned,
    completedAt: Date.now(),
  };
  const sessionId = await db.sessions.add(session);

  // Update document progress XP
  const progress = await db.progress.where('documentId').equals(documentId).first();
  if (progress?.id) {
    await db.progress.update(progress.id, {
      totalXP: (progress.totalXP || 0) + xpEarned,
    });
  }

  // Update streak
  await updateStreak();

  return { ...session, id: sessionId };
}

/**
 * Update daily streak tracking.
 */
export async function updateStreak(): Promise<void> {
  const streak = await getOrCreateStreak();
  const today = new Date().toISOString().split('T')[0];

  if (streak.lastPracticeDate === today) {
    // Already practiced today
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newCurrentStreak: number;
  if (streak.lastPracticeDate === yesterday) {
    // Consecutive day
    newCurrentStreak = streak.currentStreak + 1;
  } else if (streak.lastPracticeDate === '') {
    // First ever practice
    newCurrentStreak = 1;
  } else {
    // Streak broken (but no penalty to scores)
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  if (streak.id) {
    await db.streaks.update(streak.id, {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastPracticeDate: today,
      totalDaysPracticed: streak.totalDaysPracticed + 1,
    });
  }
}
