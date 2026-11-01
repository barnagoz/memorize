import React, { useState, useRef } from 'react';
import { exportData, importData, downloadFile } from '../lib/export';

export const Settings: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const data = await exportData();
      const filename = `memorize-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(data, filename);
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to export data.' });
      console.error(err);
    }
    setExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      await importData(text);
      setMessage({ type: 'success', text: 'Data imported successfully! Please refresh the page.' });
    } catch (err) {
      setMessage({ type: 'error', text: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
      console.error(err);
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Data Management */}
      <div className="card mb-4">
        <h2 className="font-semibold mb-4">Data Management</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Export all your data (texts, progress, streaks) as a JSON file for backup.
            </p>
            <button onClick={handleExport} className="btn-primary btn-sm" disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
          <div className="border-t pt-3">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Import data from a previously exported JSON file. This will replace all existing data.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className={`btn-secondary btn-sm cursor-pointer inline-flex ${importing ? 'opacity-50' : ''}`}>
              {importing ? 'Importing...' : 'Import Data'}
            </label>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`card mb-4 ${message.type === 'success' ? 'border-green-300 dark:border-green-800 text-green-600 dark:text-green-400' : 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* About */}
      <div className="card">
        <h2 className="font-semibold mb-2">About</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Memorize is a local-first PWA for memorizing poems, speeches, and texts using cognitive minigames and spaced repetition.
          All data is stored locally on your device — no accounts, no servers.
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-3">v1.0.0</p>
      </div>
    </div>
  );
};
