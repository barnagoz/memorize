import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { GameShell } from '../../components/GameShell';
import { tokenize, getFirstLetter } from '../../lib/tokenizer';
import { recordSession } from '../../lib/xp';
import { calculateSM2, scoreToGrade } from '../../lib/sm2';
import { db, getOrCreateProgress } from '../../db';
import type { Token } from '../../types';

interface WordState {
  token: Token;
  revealed: boolean;
  shaking: boolean;
  firstChar: string;
}

export const FirstLetter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, loading } = useDocument(docId);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);

  // Initialize word states
  useEffect(() => {
    if (!doc) return;
    const tokens = tokenize(doc.content);
    const words = tokens
      .filter(t => t.type === 'word')
      .map(t => ({
        token: t,
        revealed: false,
        shaking: false,
        firstChar: getFirstLetter(t.value),
      }));

    setWordStates(words);
    setCurrentIndex(0);
    setErrors(0);
    setCompleted(false);
    setScore(null);
  }, [doc]);

  // Keep hidden input focused for mobile virtual keyboards
  const focusInput = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  useEffect(() => {
    focusInput();
  }, [currentIndex, completed]);

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex]);

  const handleCharInput = useCallback(
    (inputChar: string) => {
      if (completed || currentIndex >= wordStates.length) return;
      if (!inputChar || inputChar.length === 0) return;

      const current = wordStates[currentIndex];
      const targetChar = current.firstChar.normalize('NFC').toLowerCase();
      const enteredChar = inputChar.normalize('NFC').toLowerCase();

      if (enteredChar === targetChar) {
        // Correct character
        setWordStates(prev => {
          const next = [...prev];
          next[currentIndex] = { ...next[currentIndex], revealed: true, shaking: false };
          return next;
        });

        const nextIdx = currentIndex + 1;
        if (nextIdx >= wordStates.length) {
          // Completed
          const totalWords = wordStates.length;
          const accuracy = Math.round(
            (Math.max(0, totalWords - errors) / totalWords) * 100
          );
          setScore(accuracy);
          setCompleted(true);

          if (doc?.id) {
            recordSession(docId, 'first-letter', accuracy);
            getOrCreateProgress(docId).then(async prog => {
              const grade = scoreToGrade(accuracy);
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
                  masteryScore: Math.round((prog.masteryScore * 0.4) + (accuracy * 0.6)),
                });
              }
            });
          }
        } else {
          setCurrentIndex(nextIdx);
        }
      } else {
        // Incorrect character - shake pulse
        setErrors(prev => prev + 1);
        setWordStates(prev => {
          const next = [...prev];
          next[currentIndex] = { ...next[currentIndex], shaking: true };
          return next;
        });

        setTimeout(() => {
          setWordStates(prev => {
            const next = [...prev];
            if (next[currentIndex]) {
              next[currentIndex] = { ...next[currentIndex], shaking: false };
            }
            return next;
          });
        }, 400);
      }
    },
    [completed, currentIndex, wordStates, errors, doc?.id, docId]
  );

  // Desktop keyboard event listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (completed || currentIndex >= wordStates.length) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Tab' || e.key === 'Escape') return;

      // Single unicode characters
      if (e.key.length === 1 && !/^\s$/.test(e.key)) {
        e.preventDefault();
        handleCharInput(e.key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCharInput, completed, currentIndex, wordStates.length]);

  if (loading || !doc) {
    return (
      <div className="game-container">
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  const restart = () => {
    const tokens = tokenize(doc.content);
    const words = tokens
      .filter(t => t.type === 'word')
      .map(t => ({
        token: t,
        revealed: false,
        shaking: false,
        firstChar: getFirstLetter(t.value),
      }));

    setWordStates(words);
    setCurrentIndex(0);
    setErrors(0);
    setCompleted(false);
    setScore(null);
  };

  let wordIndexCounter = 0;

  return (
    <GameShell
      gameType="first-letter"
      documentTitle={doc.title}
      documentId={docId}
      showScore={completed}
      score={score}
    >
      <div onClick={focusInput} className="cursor-text">
        {/* Hidden input for mobile keyboard support */}
        <input
          ref={hiddenInputRef}
          type="text"
          className="opacity-0 absolute -left-[9999px]"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          value=""
          onChange={e => {
            const val = e.target.value;
            if (val.length > 0) {
              handleCharInput(val.slice(-1));
            }
          }}
        />

        <div className="card mb-4 flex items-center justify-between py-2.5 px-4 text-sm">
          <span className="text-[var(--color-text-secondary)]">
            Progress: {currentIndex} / {wordStates.length} words
          </span>
          <span className="text-xs text-[var(--color-error)]">
            {errors > 0 ? `${errors} mistake${errors > 1 ? 's' : ''}` : 'No mistakes yet'}
          </span>
        </div>

        <div className="card font-mono text-base sm:text-lg leading-loose p-6 bg-[var(--color-surface)]/80">
          {doc.content.split('\n').map((line, lineIdx) => {
            if (line.trim() === '') {
              return <div key={lineIdx} className="h-6" />;
            }

            const lineTokens = tokenize(line);

            return (
              <div key={lineIdx} className="py-0.5" style={{ whiteSpace: 'pre-wrap' }}>
                {lineTokens.map((token, tIdx) => {
                  if (token.type === 'word') {
                    const wIdx = wordIndexCounter++;
                    const state = wordStates[wIdx];
                    if (!state) return <span key={tIdx}>{token.value}</span>;

                    const isCurrent = wIdx === currentIndex && !completed;
                    const charCount = Array.from(token.value).length;
                    const firstChar = state.firstChar;
                    const dots = '·'.repeat(Math.max(1, charCount - 1));

                    return (
                      <span
                        key={tIdx}
                        ref={isCurrent ? activeWordRef : null}
                        className={`inline-block px-1 mx-0.5 rounded transition-all duration-200 ${
                          state.revealed
                            ? 'text-[var(--color-success)] font-medium'
                            : isCurrent
                            ? 'bg-[var(--color-accent)] text-white shadow-md ring-2 ring-[var(--color-accent)]/50 scale-105'
                            : 'text-[var(--color-text-secondary)]/80 opacity-70'
                        } ${state.shaking ? 'animate-shake bg-red-500 text-white' : ''}`}
                      >
                        {state.revealed ? token.value : `${firstChar}${dots}`}
                      </span>
                    );
                  }
                  return <span key={tIdx}>{token.value}</span>;
                })}
              </div>
            );
          })}
        </div>

        {completed ? (
          <div className="mt-6 text-center animate-fade-in card p-6">
            <h3 className="text-xl font-bold mb-2">Practice Completed!</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Accuracy: <span className="font-bold text-[var(--color-accent)]">{score}%</span> ({wordStates.length - errors} of {wordStates.length} words correct on first try)
            </p>
            <button onClick={restart} className="btn-primary">
              Practice Again
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--color-text-secondary)] mt-3">
            💡 Type the first letter of each highlighted word (including Hungarian accents like á, é, í, ó, ö, ő, ú, ü, ű).
          </p>
        )}
      </div>
    </GameShell>
  );
};
