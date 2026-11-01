import { db } from '../db';

export interface ExportData {
  version: 1;
  exportedAt: string;
  documents: unknown[];
  progress: unknown[];
  streaks: unknown[];
  sessions: unknown[];
  settings: unknown[];
}

/**
 * Export all data as a JSON blob.
 */
export async function exportData(): Promise<string> {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    documents: await db.documents.toArray(),
    progress: await db.progress.toArray(),
    streaks: await db.streaks.toArray(),
    sessions: await db.sessions.toArray(),
    settings: await db.settings.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from a JSON string, replacing all existing data.
 */
export async function importData(jsonString: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonString);

  if (data.version !== 1) {
    throw new Error(`Unsupported export version: ${data.version}`);
  }

  await db.transaction('rw', [db.documents, db.progress, db.streaks, db.sessions, db.settings], async () => {
    // Clear all tables
    await db.documents.clear();
    await db.progress.clear();
    await db.streaks.clear();
    await db.sessions.clear();
    await db.settings.clear();

    // Import data (strip ids to let Dexie auto-assign)
    if (data.documents?.length) await db.documents.bulkAdd(data.documents as any[]);
    if (data.progress?.length) await db.progress.bulkAdd(data.progress as any[]);
    if (data.streaks?.length) await db.streaks.bulkAdd(data.streaks as any[]);
    if (data.sessions?.length) await db.sessions.bulkAdd(data.sessions as any[]);
    if (data.settings?.length) await db.settings.bulkAdd(data.settings as any[]);
  });
}

/**
 * Trigger a file download with the given content.
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
