import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocument, useDocuments } from '../hooks/useDocument';
import { GAME_INFO, type GameType, type GamePhase } from '../types';

const PHASES: { key: GamePhase; label: string; emoji: string; description: string }[] = [
  { key: 'familiarize', label: 'Familiarize', emoji: '👀', description: 'Get comfortable with the text' },
  { key: 'solidify', label: 'Solidify', emoji: '🧠', description: 'Active recall with scaffolding' },
  { key: 'evaluate', label: 'Evaluate', emoji: '✍️', description: 'Test your memory' },
];

export const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, progress, loading } = useDocument(docId);
  const { deleteDocument } = useDocuments();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center py-12">
        <h2 className="text-xl font-bold mb-2">Document not found</h2>
        <Link to="/" className="btn-primary mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteDocument(docId);
    navigate('/');
  };

  const isDue = progress ? progress.nextReviewDate <= Date.now() : false;
  const nextReview = progress ? new Date(progress.nextReviewDate) : null;

  const gamesByPhase = (phase: GamePhase) =>
    (Object.entries(GAME_INFO) as [GameType, typeof GAME_INFO[GameType]][])
      .filter(([, info]) => info.phase === phase);

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{doc.title}</h1>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
          <span>{doc.content.split('\n').filter(l => l.trim()).length} lines</span>
          <span>·</span>
          <span>Mastery: <span className="font-semibold text-[var(--color-accent)]">{progress?.masteryScore ?? 0}%</span></span>
          <span>·</span>
          <span>{progress?.totalXP ?? 0} XP</span>
          {isDue && <span className="badge-warning">Review Due</span>}
        </div>
        {nextReview && progress && progress.repetitions > 0 && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Next review: {nextReview.toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Text Preview */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Text</h3>
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="btn-ghost btn-sm text-xs"
          >
            {showFullText ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <pre className={`text-sm font-mono leading-relaxed whitespace-pre-wrap text-[var(--color-text-secondary)] ${!showFullText ? 'max-h-32 overflow-hidden' : ''}`}>
          {doc.content}
        </pre>
        {!showFullText && doc.content.split('\n').length > 5 && (
          <div className="h-8 bg-gradient-to-t from-[var(--color-surface)] to-transparent -mt-8 relative" />
        )}
      </div>

      {/* Game Phases */}
      <div className="space-y-6">
        {PHASES.map(phase => (
          <div key={phase.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{phase.emoji}</span>
              <div>
                <h3 className="font-semibold">{phase.label}</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">{phase.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {gamesByPhase(phase.key).map(([type, info]) => (
                <Link
                  key={type}
                  to={`/game/${type}/${docId}`}
                  className="card-hover flex items-center gap-3 py-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold text-sm shrink-0">
                    {info.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{info.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{info.description}</div>
                  </div>
                  {info.scored && (
                    <span className="badge-primary ml-auto shrink-0">Scored</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t">
        {showDeleteConfirm ? (
          <div className="card border-red-300 dark:border-red-800">
            <p className="text-sm mb-3">Are you sure you want to delete "<strong>{doc.title}</strong>"? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="btn-danger btn-sm">Yes, Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost btn-sm text-red-500">
            Delete this text
          </button>
        )}
      </div>
    </div>
  );
};
