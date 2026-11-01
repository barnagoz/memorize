import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { GameShell } from '../../components/GameShell';
import { tokenize, positionalHash } from '../../lib/tokenizer';
import { recordSession } from '../../lib/xp';

export const DensitySlider: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, loading } = useDocument(docId);
  const [density, setDensity] = useState(100);
  const [hasReachedZero, setHasReachedZero] = useState(false);

  if (loading || !doc) {
    return (
      <div className="game-container">
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  const handleDensityChange = (val: number) => {
    setDensity(val);
    if (val === 0 && !hasReachedZero && doc.id) {
      setHasReachedZero(true);
      recordSession(docId, 'density-slider', 100);
    }
  };

  let globalWordCounter = 0;

  return (
    <GameShell
      gameType="density-slider"
      documentTitle={doc.title}
      documentId={docId}
      headerExtra={
        <div className="card shadow-sm border border-[var(--color-border)] mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-semibold">Visible Word Density: </span>
              <span className="text-base font-bold text-[var(--color-accent)]">{density}%</span>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Slide left to thin out words gradually
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={density}
            onChange={e => handleDensityChange(Number(e.target.value))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-[var(--color-surface-hover)] accent-[var(--color-accent)]"
          />
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1.5">
            <span>0% (Blank recall)</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100% (Full text)</span>
          </div>
        </div>
      }
    >
      <div className="card font-mono text-base leading-relaxed p-6 bg-[var(--color-surface)]/70">
        {doc.content.split('\n').map((line, lineIdx) => {
          if (line.trim() === '') {
            return <div key={lineIdx} className="h-6" />;
          }

          const lineTokens = tokenize(line);

          return (
            <div key={lineIdx} className="py-0.5" style={{ whiteSpace: 'pre-wrap' }}>
              {lineTokens.map((token, tIdx) => {
                if (token.type === 'word') {
                  const wIdx = globalWordCounter++;
                  const hash = positionalHash(wIdx);
                  const isVisible = hash * 100 < density;

                  return (
                    <span
                      key={tIdx}
                      className="transition-all duration-300 inline-block"
                      style={{
                        opacity: isVisible ? 1 : 0.08,
                        filter: isVisible ? 'none' : 'blur(5px)',
                        transform: isVisible ? 'scale(1)' : 'scale(0.96)',
                      }}
                    >
                      {token.value}
                    </span>
                  );
                }
                return <span key={tIdx}>{token.value}</span>;
              })}
            </div>
          );
        })}
      </div>

      {hasReachedZero && (
        <div className="mt-6 text-center animate-fade-in p-4 card border-[var(--color-success)] bg-green-500/10">
          <p className="text-sm font-semibold text-[var(--color-success)]">
            🌟 Master level unlocked: You practiced recalling at 0% density! +5 XP earned.
          </p>
        </div>
      )}
    </GameShell>
  );
};
