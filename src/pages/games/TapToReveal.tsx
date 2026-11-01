import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { GameShell } from '../../components/GameShell';
import { splitLines } from '../../lib/tokenizer';
import { recordSession } from '../../lib/xp';

export const TapToReveal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, loading } = useDocument(docId);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lines = doc ? splitLines(doc.content) : [];

  const revealNext = useCallback(() => {
    if (completed || lines.length === 0) return;
    setRevealedIndex(prev => {
      const next = prev + 1;
      if (next >= lines.length - 1) {
        setCompleted(true);
        if (doc?.id) {
          recordSession(docId, 'tap-to-reveal', 100);
        }
        return lines.length - 1;
      }
      return next;
    });
  }, [lines.length, completed, doc?.id, docId]);

  // Keyboard handler: Spacebar triggers reveal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        revealNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [revealNext]);

  // Viewport auto-scrolls to keep current active line centered
  useEffect(() => {
    if (revealedIndex >= 0 && lineRefs.current[revealedIndex]) {
      lineRefs.current[revealedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [revealedIndex]);

  if (loading || !doc) {
    return (
      <div className="game-container">
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  const restart = () => {
    setRevealedIndex(-1);
    setCompleted(false);
  };

  return (
    <GameShell gameType="tap-to-reveal" documentTitle={doc.title} documentId={docId}>
      <div
        ref={containerRef}
        onClick={revealNext}
        className="cursor-pointer select-none min-h-[50vh] p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50"
      >
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            {completed
              ? '🎉 All lines revealed! Tap Restart to practice again.'
              : 'Tap anywhere or press Space to unmask the next line'}
          </p>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">
            {Math.max(0, revealedIndex + 1)} / {lines.length} lines revealed
          </div>
        </div>

        <div className="font-mono text-base sm:text-lg leading-relaxed space-y-2">
          {lines.map((line, i) => {
            const isRevealed = i <= revealedIndex;
            const isActive = i === revealedIndex;
            const isEmpty = line.trim() === '';

            if (isEmpty) {
              return <div key={i} className="h-6" />;
            }

            return (
              <div
                key={i}
                ref={el => {
                  lineRefs.current[i] = el;
                }}
                className={`py-2 px-3 rounded-lg transition-all duration-500 ease-out ${
                  isRevealed
                    ? 'opacity-100 blur-0 translate-y-0'
                    : 'opacity-10 blur-md pointer-events-none'
                } ${
                  isActive
                    ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)] shadow-sm'
                    : 'border border-transparent'
                }`}
                style={{
                  whiteSpace: 'pre-wrap',
                }}
              >
                {line}
              </div>
            );
          })}
        </div>

        {completed && (
          <div className="mt-8 text-center animate-fade-in" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-[var(--color-success)] font-semibold mb-3">
              Practice session complete! +5 XP earned.
            </p>
            <button onClick={restart} className="btn-primary">
              Restart Practice
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
};
