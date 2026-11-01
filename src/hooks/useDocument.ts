import { useState, useEffect, useCallback } from 'react';
import { db, getOrCreateProgress } from '../db';
import type { Document, Progress } from '../types';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await db.documents.toArray();
      docs.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addDocument = useCallback(async (title: string, content: string): Promise<number> => {
    const now = Date.now();
    const id = await db.documents.add({
      title,
      content: content.normalize('NFC'),
      createdAt: now,
      updatedAt: now,
    });
    await getOrCreateProgress(id);
    await load();
    return id;
  }, [load]);

  const updateDocument = useCallback(async (id: number, title: string, content: string) => {
    await db.documents.update(id, {
      title,
      content: content.normalize('NFC'),
      updatedAt: Date.now(),
    });
    await load();
  }, [load]);

  const deleteDocument = useCallback(async (id: number) => {
    await db.transaction('rw', [db.documents, db.progress, db.sessions], async () => {
      await db.documents.delete(id);
      await db.progress.where('documentId').equals(id).delete();
      await db.sessions.where('documentId').equals(id).delete();
    });
    await load();
  }, [load]);

  return { documents, loading, addDocument, updateDocument, deleteDocument, reload: load };
}

export function useDocument(id: number | undefined) {
  const [document, setDocument] = useState<Document | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const doc = await db.documents.get(id);
    if (doc) {
      setDocument(doc);
      const prog = await getOrCreateProgress(id);
      setProgress(prog);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { document, progress, loading, reload: load };
}
