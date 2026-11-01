import Dexie, { type Table } from 'dexie';
import type { Document, Progress, StreakData, GameSession, AppSettings } from '../types';

export class MemorizeDB extends Dexie {
  documents!: Table<Document, number>;
  progress!: Table<Progress, number>;
  streaks!: Table<StreakData, number>;
  sessions!: Table<GameSession, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('MemorizeDB');
    this.version(1).stores({
      documents: '++id, title, createdAt',
      progress: '++id, documentId, nextReviewDate',
      streaks: '++id',
      sessions: '++id, documentId, gameType, completedAt',
      settings: '++id',
    });
  }
}

export const db = new MemorizeDB();

// Initialize default settings if not present
export async function initSettings(): Promise<AppSettings> {
  const existing = await db.settings.toCollection().first();
  if (existing) return existing;
  const defaults: AppSettings = {
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    blanksDefaultDensity: 40,
  };
  const id = await db.settings.add(defaults);
  return { ...defaults, id };
}

// Get or create progress for a document
export async function getOrCreateProgress(documentId: number): Promise<Progress> {
  const existing = await db.progress.where('documentId').equals(documentId).first();
  if (existing) return existing;
  const defaults: Progress = {
    documentId,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: Date.now(),
    lastReviewDate: 0,
    masteryScore: 0,
    totalXP: 0,
    lastGrade: 0,
  };
  const id = await db.progress.add(defaults);
  return { ...defaults, id };
}

// Get or create streak data
export async function getOrCreateStreak(): Promise<StreakData> {
  const existing = await db.streaks.toCollection().first();
  if (existing) return existing;
  const defaults: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: '',
    totalDaysPracticed: 0,
  };
  const id = await db.streaks.add(defaults);
  return { ...defaults, id };
}
