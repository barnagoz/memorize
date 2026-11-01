import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { diffChars, type Change } from 'diff';
import { useDocument } from '../../hooks/useDocument';
import { GameShell } from '../../components/GameShell';
import { recordSession } from '../../lib/xp';
import { calculateSM2, scoreToGrade } from '../../lib/sm2';
import { db, getOrCreateProgress } from '../../db';
import { getFirstLetter, splitLines } from '../../lib/tokenizer';

export const TypeIt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, loading } = useDocument(docId);
  const [userText, setUserText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [firstLetterMode, setFirstLetterMode] = useState(false);

  const originalText = useMemo(() => doc?.content.normalize('NFC') || '', [doc]);
  const originalLines = useMemo(() => splitLines(originalText), [originalText]);

  // First-Letter Mode hint generation
  const hintText = useMemo(() => {
    if (!firstLetterMode) return '';
    return originalLines
      .map(line => {
        if (line.trim() === '') return '';
        return line.replace(
          /(?:[\p{L}\p{M}\p{N}]+(?:[-'\u2019][\p{L}\p{M}\p{N}]+)*)/gu,
          word => {
            const first = getFirstLetter(word);
            const len = Array.from(word).length;
            return first + '·'.repeat(Math.max(0, len - 1));
          }
        );
      })
      .join('\n');
  }, [originalLines, firstLetterMode]);

  // Real-time diff calculation
  const diffResult = useMemo<Change[]>(() => {
    if (!originalText) return [];
    return diffChars(originalText, userText.normalize('NFC'));
  }, [originalText, userText]);

  // Calculate accuracy based on matching characters
  const liveStats = useMemo(() => {
    const origChars = Array.from(originalText);
    const userChars = Array.from(userText.normalize('NFC'));

    if (origChars.length === 0) return { accuracy: 100, matchedChars: 0, totalChars: 0 };

    let matches = 0;
    const minLen = Math.min(origChars.length, userChars.length);
    for (let i = 0; i < minLen; i++) {
      if (origChars[i] === userChars[i]) {
        matches++;
      }
    }

    const accuracy = Math.round((matches / Math.max(origChars.length, userChars.length)) * 100);
    return {
      accuracy: Math.max(0, accuracy),
      matchedChars: matches,
      totalChars: origChars.length,
    };
  }, [originalText, userText]);

  const handleSubmit = async () => {
    const finalScore = liveStats.accuracy;
    setScore(finalScore);
    setSubmitted(true);

    if (doc?.id) {
      await recordSession(docId, 'type-it', finalScore);
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
  };

  const restart = () => {
    setUserText('');
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
      gameType="type-it"
      documentTitle={doc.title}
      documentId={docId}
      showScore={submitted}
      score={score}
      headerExtra={
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 p-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <input
              type="checkbox"
              checked={firstLetterMode}
              onChange={e => setFirstLetterMode(e.target.checked)}
              className="rounded w-4 h-4 accent-[var(--color-accent)]"
              disabled={submitted}
            />
            <span>Step-by-step "First-Letter" scaffolding</span>
          </label>
          <div className="text-xs text-[var(--color-text-secondary)] font-mono">
            {userText.length} / {originalText.length} characters ({liveStats.accuracy}% accuracy)
          </div>
        </div>
      }
    >
      {firstLetterMode && !submitted && (
        <div className="card mb-4 p-4 border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            Scaffolding Guide
          </div>
          <pre className="font-mono text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-wrap select-none">
            {hintText}
          </pre>
        </div>
      )}

      {!submitted ? (
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={userText}
              onChange={e => setUserText(e.target.value)}
              className="textarea w-full font-mono text-base leading-relaxed p-4 min-h-[320px] rounded-xl shadow-inner focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder="Start typing the passage verbatim from memory..."
              autoFocus
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-[var(--color-text-secondary)]">
              Accented characters and line breaks must match the original text.
            </div>
            <button
              onClick={handleSubmit}
              disabled={userText.trim().length === 0}
              className="btn-primary btn-lg shadow-md"
            >
              Submit & Grade
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Detailed Diff View */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span>Detailed Character Comparison</span>
              <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                Green = Added/Correct | Red = Missing/Deleted
              </span>
            </h3>
            <div className="font-mono text-sm sm:text-base leading-relaxed whitespace-pre-wrap bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)]">
              {diffResult.map((part, index) => {
                if (part.added) {
                  return (
                    <span
                      key={index}
                      className="bg-red-500/20 text-red-700 dark:text-red-300 underline decoration-red-500 decoration-wavy"
                      title="Unexpected / incorrect input"
                    >
                      {part.value}
                    </span>
                  );
                }
                if (part.removed) {
                  return (
                    <span
                      key={index}
                      className="bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 line-through"
                      title="Missing from your input"
                    >
                      {part.value}
                    </span>
                  );
                }
                return (
                  <span key={index} className="text-[var(--color-success)]">
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-3xl font-bold mb-1 text-[var(--color-accent)]">{score}%</div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {liveStats.matchedChars} matching characters out of {liveStats.totalChars} total characters
            </p>
            <button onClick={restart} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      )}
    </GameShell>
  );
};
