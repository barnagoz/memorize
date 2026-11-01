import React from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocument';
import { useStreak } from '../hooks/useStreak';
import { DocumentCard } from '../components/DocumentCard';

export const Dashboard: React.FC = () => {
  const { documents, loading, addDocument } = useDocuments();
  const { streak } = useStreak();

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-[var(--color-accent)]">{streak?.currentStreak ?? 0}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">Day Streak</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-[var(--color-accent)]">{documents.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">Texts</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-[var(--color-accent)]">{streak?.totalDaysPracticed ?? 0}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">Days Practiced</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Your Texts</h2>
        <Link to="/add" className="btn-primary btn-sm flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Text
        </Link>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12 p-6">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-semibold mb-2">No texts yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
            Add a poem, speech, or any text you want to memorize, or start with our sample texts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/add" className="btn-primary">
              Add Your First Text
            </Link>
            <button
              onClick={async () => {
                await addDocument(
                  'Szeptember végén — Petőfi Sándor',
                  'Még nyílnak a völgyben a kerti virágok,\nMég zöldel a nyárfa az ablak előtt,\nDe látod amottan a téli világot?\nMár hó fedi a bérci tetőt.\n\nMég ifjú szivemben a lángsugarú nyár,\nS még benne virít az egész kikelet,\nDe íme sötét hajam őszbe vegyűl már,\nA tél dere már megüté fejemet.'
                );
                await addDocument(
                  'Sonnet 18 — William Shakespeare',
                  'Shall I compare thee to a summer\'s day?\nThou art more lovely and more temperate:\nRough winds do shake the darling buds of May,\nAnd summer\'s lease hath all too short a date.'
                );
              }}
              className="btn-secondary"
            >
              Load Sample Poems
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
};
