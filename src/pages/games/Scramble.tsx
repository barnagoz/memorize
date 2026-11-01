import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { GameShell } from '../../components/GameShell';
import { splitLines } from '../../lib/tokenizer';
import { shuffleWithDifference } from '../../lib/shuffle';
import { recordSession } from '../../lib/xp';
import { calculateSM2, scoreToGrade } from '../../lib/sm2';
import { db, getOrCreateProgress } from '../../db';

interface ScrambleItem {
  id: string;
  text: string;
  originalIndex: number;
}

export const Scramble: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, loading } = useDocument(docId);
  const [items, setItems] = useState<ScrambleItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const rawLines = useMemo(() => {
    if (!doc) return [];
    return splitLines(doc.content).filter(l => l.trim().length > 0);
  }, [doc]);

  useEffect(() => {
    if (rawLines.length === 0) return;
    const initialItems: ScrambleItem[] = rawLines.map((text, i) => ({
      id: `line-${i}-${text.slice(0, 10)}`,
      text,
      originalIndex: i,
    }));
    setItems(shuffleWithDifference(initialItems));
    setSelectedIndex(null);
    setSubmitted(false);
    setScore(null);
  }, [rawLines]);

  // Click-to-swap handler
  const handleItemClick = (index: number) => {
    if (submitted) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      // Swap items
      setItems(prev => {
        const next = [...prev];
        const temp = next[selectedIndex];
        next[selectedIndex] = next[index];
        next[index] = temp;
        return next;
      });
      setSelectedIndex(null);
    }
  };

  // Move up/down buttons for accessible tactile ordering
  const moveItem = (fromIdx: number, toIdx: number) => {
    if (submitted || toIdx < 0 || toIdx >= items.length) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setSelectedIndex(null);
  };

  // HTML5 Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (submitted) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (submitted || draggedIndex === null) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (submitted || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setSubmitted(true);

    let correctCount = 0;
    items.forEach((item, i) => {
      if (item.originalIndex === i) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / items.length) * 100);
    setScore(finalScore);

    if (doc?.id) {
      await recordSession(docId, 'scramble', finalScore);
      const prog = await getOrCreateProgress(docId);
      const grade = scoreToGrade(finalScore);
      const sm2 = calculateSM2({
        grade,
        repetitions: prog.repetitions,
        easinessFactor: prog.easinessFactor,
        interval: prog.interval,
      });

      if (prog.id) {
        await db.progress.update(prog.id, {
          ...sm2,
          lastReviewDate: Date.now(),
          lastGrade: grade,
          masteryScore: Math.round((prog.masteryScore * 0.4) + (finalScore * 0.6)),
        });
      }
    }
  };

  const restart = () => {
    const initialItems: ScrambleItem[] = rawLines.map((text, i) => ({
      id: `line-${i}-${text.slice(0, 10)}`,
      text,
      originalIndex: i,
    }));
    setItems(shuffleWithDifference(initialItems));
    setSelectedIndex(null);
    setSubmitted(false);
    setScore(null);
  };

  if (loading || !doc) {
    return (
      <div className="game-container">
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  return (
    <GameShell
      gameType="scramble"
      documentTitle={doc.title}
      documentId={docId}
      showScore={submitted}
      score={score}
    >
      <div className="card mb-4 p-3 text-center text-sm text-[var(--color-text-secondary)]">
        {submitted ? (
          <span className="text-[var(--color-text)] font-semibold">
            Results checked! See correct positions below.
          </span>
        ) : (
          <span>
            💡 Reorder lines by <strong>dragging</strong>, using the <strong>▲ / ▼</strong> arrows, or <strong>clicking two lines to swap</strong> them.
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const isSelected = selectedIndex === index && !submitted;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const isCorrect = submitted && item.originalIndex === index;
          const isIncorrect = submitted && item.originalIndex !== index;

          return (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick(index)}
              className={`card flex items-center gap-3 p-3 transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                isSelected
                  ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-accent)]/15 scale-[1.01]'
                  : ''
              } ${isDragging ? 'opacity-40 scale-95' : ''} ${
                isDragOver ? 'border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/10' : ''
              } ${
                isCorrect
                  ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-300'
                  : ''
              } ${
                isIncorrect
                  ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300'
                  : ''
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 text-[var(--color-text-secondary)]">
                {!submitted ? (
                  <>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={e => {
                        e.stopPropagation();
                        moveItem(index, index - 1);
                      }}
                      className="p-1 hover:text-[var(--color-accent)] disabled:opacity-20 text-xs"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <span className="text-xs font-mono font-bold">{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={e => {
                        e.stopPropagation();
                        moveItem(index, index + 1);
                      }}
                      className="p-1 hover:text-[var(--color-accent)] disabled:opacity-20 text-xs"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-mono font-bold">{index + 1}</span>
                )}
              </div>

              <div className="flex-1 font-mono text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                {item.text}
              </div>

              {submitted && (
                <div className="text-right text-xs font-semibold shrink-0">
                  {isCorrect ? (
                    <span className="text-[var(--color-success)] flex items-center gap-1">
                      ✓ Correct
                    </span>
                  ) : (
                    <span className="text-[var(--color-error)]">
                      Was line #{item.originalIndex + 1}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        {!submitted ? (
          <button onClick={handleSubmit} className="btn-primary btn-lg shadow-md">
            Check Order
          </button>
        ) : (
          <div className="animate-fade-in card p-6">
            <h3 className="text-xl font-bold mb-2">Order Results</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {items.filter((item, i) => item.originalIndex === i).length} of {items.length} lines placed correctly ({score}%)
            </p>
            <button onClick={restart} className="btn-primary">
              Try Again
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
};
