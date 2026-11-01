import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { GameShell } from '../../components/GameShell';
import { getWords, compareStrings } from '../../lib/tokenizer';
import { fisherYatesShuffle } from '../../lib/shuffle';
import { recordSession } from '../../lib/xp';
import { calculateSM2, scoreToGrade } from '../../lib/sm2';
import { db, getOrCreateProgress } from '../../db';
import type { Token } from '../../types';

export const MultipleChoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, loading } = useDocument(docId);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const words = useMemo(() => {
    if (!doc) return [];
    return getWords(doc.content);
  }, [doc]);

  // Generate 6 options: 1 ground truth + 5 contextual distractors from text
  const options = useMemo(() => {
    if (words.length === 0 || currentWordIndex >= words.length) return [];

    const groundTruth = words[currentWordIndex];
    const distractors: Token[] = [];

    // Filter candidate words from other positions that don't match ground truth
    const otherWords = words.filter(
      (w, i) => i !== currentWordIndex && !compareStrings(w.value, groundTruth.value)
    );

    // Deduplicate distractors by normalized value
    const seen = new Set<string>();
    const uniqueCandidates: Token[] = [];
    for (const w of otherWords) {
      if (!seen.has(w.normalized)) {
        seen.add(w.normalized);
        uniqueCandidates.push(w);
      }
    }

    const shuffledCandidates = fisherYatesShuffle(uniqueCandidates);
    for (const w of shuffledCandidates) {
      if (distractors.length >= 5) break;
      distractors.push(w);
    }

    // If there aren't enough unique words in short texts, generate fallback variations
    const choices = [groundTruth.value, ...distractors.map(d => d.value)];
    while (choices.length < 6) {
      choices.push(`${groundTruth.value}${choices.length}`);
    }

    return fisherYatesShuffle(choices);
  }, [words, currentWordIndex]);

  // Context window: show surrounding words
  const contextBefore = useMemo(() => {
    const start = Math.max(0, currentWordIndex - 6);
    return words.slice(start, currentWordIndex).map(w => w.value).join(' ');
  }, [words, currentWordIndex]);

  const contextAfter = useMemo(() => {
    const end = Math.min(words.length, currentWordIndex + 7);
    return words.slice(currentWordIndex + 1, end).map(w => w.value).join(' ');
  }, [words, currentWordIndex]);

  const handleSelect = useCallback(
    async (option: string) => {
      if (selectedOption !== null || currentWordIndex >= words.length) return;

      const groundTruth = words[currentWordIndex];
      const correct = compareStrings(option, groundTruth.value);

      setSelectedOption(option);
      setIsCorrect(correct);
      setTotalAnswered(prev => prev + 1);
      if (correct) {
        setCorrectCount(prev => prev + 1);
      }

      // Auto-advance to next word after brief feedback pause
      setTimeout(async () => {
        const nextIdx = currentWordIndex + 1;
        if (nextIdx >= words.length) {
          // Completed entire text
          const finalCorrect = correct ? correctCount + 1 : correctCount;
          const finalTotal = totalAnswered + 1;
          const finalScore = Math.round((finalCorrect / finalTotal) * 100);
          setScore(finalScore);
          setCompleted(true);

          if (doc?.id) {
            await recordSession(docId, 'multiple-choice', finalScore);
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
                masteryScore: Math.round((prog.masteryScore * 0.3) + (finalScore * 0.7)),
              });
            }
          }
        } else {
          setCurrentWordIndex(nextIdx);
          setSelectedOption(null);
          setIsCorrect(null);
        }
      }, 700);
    },
    [selectedOption, words, currentWordIndex, correctCount, totalAnswered, doc?.id, docId]
  );

  const restart = () => {
    setCurrentWordIndex(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setCompleted(false);
    setScore(null);
  };

  if (loading || !doc) {
    return (
      <div className="game-container">
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <GameShell gameType="multiple-choice" documentTitle={doc.title} documentId={docId}>
        <div className="card p-6 text-center text-[var(--color-text-secondary)]">
          No words found in this document to test.
        </div>
      </GameShell>
    );
  }

  const progressPercent = Math.round((currentWordIndex / words.length) * 100);

  return (
    <GameShell
      gameType="multiple-choice"
      documentTitle={doc.title}
      documentId={docId}
      showScore={completed}
      score={score}
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
          <span>Word {currentWordIndex + 1} of {words.length}</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {!completed ? (
        <div className="space-y-6">
          {/* Target in Context */}
          <div className="card p-6 text-center shadow-sm">
            <div className="font-mono text-base sm:text-lg leading-relaxed">
              <span className="text-[var(--color-text-secondary)]">{contextBefore}</span>
              {contextBefore ? ' ' : ''}
              <span className="inline-block px-3 py-1 bg-[var(--color-accent)]/20 border-2 border-dashed border-[var(--color-accent)] rounded-lg font-bold text-[var(--color-accent)]">
                ???
              </span>
              {contextAfter ? ' ' : ''}
              <span className="text-[var(--color-text-secondary)]">{contextAfter}</span>
            </div>
          </div>

          {/* 6 Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isGroundTruth =
                selectedOption !== null &&
                compareStrings(option, words[currentWordIndex].value);

              let styleClasses =
                'card-hover py-4 px-3 text-center font-mono text-base font-semibold transition-all border';

              if (selectedOption !== null) {
                if (isGroundTruth) {
                  styleClasses =
                    'card py-4 px-3 text-center font-mono text-base font-semibold border-green-500 bg-green-500/20 text-green-700 dark:text-green-300 scale-102';
                } else if (isSelected && !isCorrect) {
                  styleClasses =
                    'card py-4 px-3 text-center font-mono text-base font-semibold border-red-500 bg-red-500/20 text-red-700 dark:text-red-300 animate-shake';
                } else {
                  styleClasses = 'card py-4 px-3 text-center font-mono text-base opacity-40';
                }
              }

              return (
                <button
                  key={`${option}-${idx}`}
                  onClick={() => handleSelect(option)}
                  disabled={selectedOption !== null}
                  className={styleClasses}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="text-center text-xs text-[var(--color-text-secondary)]">
            Score: {correctCount} / {totalAnswered} correct
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center animate-fade-in space-y-4">
          <div className="text-5xl">{score! >= 80 ? '🏆' : score! >= 50 ? '👏' : '📚'}</div>
          <h2 className="text-2xl font-bold">Evaluation Complete!</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            You scored <span className="font-bold text-[var(--color-accent)]">{score}%</span> ({correctCount} of {words.length} words correct).
          </p>
          <div className="pt-2">
            <button onClick={restart} className="btn-primary btn-lg">
              Practice Again
            </button>
          </div>
        </div>
      )}
    </GameShell>
  );
};
