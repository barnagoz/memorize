import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocument';

export const AddDocument: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { addDocument } = useDocuments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const id = await addDocument(title.trim(), content);
      navigate(`/document/${id}`);
    } catch (err) {
      console.error('Failed to save document:', err);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Text</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="input"
            placeholder="e.g., Szeptember végén — Petőfi Sándor"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1.5">
            Content
          </label>
          <textarea
            id="content"
            className="textarea min-h-[300px] font-mono text-sm leading-relaxed"
            placeholder="Paste or type your poem, speech, or text here...&#10;&#10;Line breaks and stanza separations will be preserved."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
            {content.split('\n').filter(l => l.trim()).length} lines · {content.length} characters
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1" disabled={saving || !title.trim() || !content.trim()}>
            {saving ? 'Saving...' : 'Save Text'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
