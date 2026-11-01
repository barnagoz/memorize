export interface Document {
  id?: number;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Progress {
  id?: number;
  documentId: number;
  // SM-2 fields
  easinessFactor: number; // starts at 2.5
  interval: number; // days
  repetitions: number;
  nextReviewDate: number; // timestamp
  lastReviewDate: number;
  // Metrics
  masteryScore: number; // 0-100
  totalXP: number;
  lastGrade: number; // 0-5
}

export interface StreakData {
  id?: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string; // YYYY-MM-DD
  totalDaysPracticed: number;
}

export interface GameSession {
  id?: number;
  documentId: number;
  gameType: GameType;
  score: number; // 0-100
  xpEarned: number;
  completedAt: number;
  details?: Record<string, unknown>;
}

export type GameType =
  | 'tap-to-reveal'
  | 'density-slider'
  | 'first-letter'
  | 'blanks'
  | 'scramble'
  | 'type-it'
  | 'multiple-choice';

export type GamePhase = 'familiarize' | 'solidify' | 'evaluate';

export const GAME_INFO: Record<GameType, { name: string; phase: GamePhase; description: string; scored: boolean }> = {
  'tap-to-reveal': { name: 'Tap to Reveal', phase: 'familiarize', description: 'Unmask the text line by line', scored: false },
  'density-slider': { name: 'Density Slider', phase: 'familiarize', description: 'Control text visibility with a slider', scored: false },
  'first-letter': { name: 'First Letter', phase: 'solidify', description: 'Type words from their first letter hints', scored: true },
  'blanks': { name: 'Blanks', phase: 'solidify', description: 'Fill in missing words (cloze deletion)', scored: true },
  'scramble': { name: 'Scramble', phase: 'solidify', description: 'Reorder shuffled lines', scored: true },
  'type-it': { name: 'Type It', phase: 'evaluate', description: 'Reconstruct the text from memory', scored: true },
  'multiple-choice': { name: 'Multiple Choice', phase: 'evaluate', description: 'Pick the correct word from options', scored: true },
};

export interface AppSettings {
  id?: number;
  theme: 'light' | 'dark';
  blanksDefaultDensity: number; // 20, 40, or 60
}

export interface Token {
  type: 'word' | 'punctuation' | 'whitespace';
  value: string;
  normalized: string;
  index: number;
}
