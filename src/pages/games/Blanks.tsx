import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from '../../hooks/useDocument';
import { GameShell } from '../../components/GameShell';
import { tokenize, positionalHash, compareStrings } from '../../lib/tokenizer';
import { recordSession } from '../../lib/xp';
import { calculateSM2, scoreToGrade } from '../../lib/sm2';
import { db, getOrCreateProgress } from '../../db';

interface BlankSlot {
  wordIndex: number;
  answer: string;
  userInput: string;
  status: 'pending' | 'correct' | 'incorrect';
}

export const Blanks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const { document: doc, loading } = useDocument(docId);
  const [density, setDensity] = useState<20 | 40 | 60>(40);
  const [blanks, setBlanks] = useState<BlankSlot[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const tokens = useMemo(() => {
    if (!doc) return [];
    return tokenize(doc.content);
  }, [doc]);

  const wordTokens = useMemo(() => {
    return tokens.filter(t => t.type === 'word');
  }, [tokens]);

  // Generate blanks when density or words change
  useEffect(() => {
    if (wordTokens.length === 0) return;
    const newBlanks: BlankSlot[] = [];
    const threshold = density / 100;

    wordTokens.forEach((token, i) => {
      const hash = positionalHash(i, density * 17);
      if (hash < threshold) {
        newBlanks.push({
          wordIndex: i,
          answer: token.value,
          userInput: '',
          status: 'pending',
        });
      }
    });

    // Ensure at least 1 blank if there are words
    if (newBlanks.length === 0 && wordTokens.length > 0) {
      newBlanks.push({
        wordIndex: 0,
        answer: wordTokens[0].value,
        userInput: '',
        status: 'pending',
      });
    }

    setBlanks(newBlanks);
    setSubmitted(false);
    setScore(null);
  }, [wordTokens, density]);

  const handleInputChange = (blankIdx: number, value: string) => {
    setBlanks(prev => {
      const next = [...prev];
      next[blankIdx] = { ...next[blankIdx], userInput: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (blanks.length === 0) return;

    const checked = blanks.map(b => ({
      ...b,
      status: compareStrings(b.userInput.trim(), b.answer)
        ? ('correct' as const)
        : ('incorrect' as const),
    }));

    setBlanks(checked);
    setSubmitted(true);

    const correctCount = checked.filter(b => b.status === 'correct').length;
    const finalScore = Math.round((correctCount / checked.length) * 100);
    setScore(finalScore);

    if (doc?.id) {
      await recordSession(docId, 'blanks', finalScore);
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
    setBlanks(prev =>
      prev.map(b => ({
        ...b,
        userInput: '',
        status: 'pending',
      }))
    );
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

  const blankByWordIdx = new Map(blanks.map((b, i) => [b.wordIndex, i]));
  let globalWordCounter = 0;

  return (
    <GameShell
      gameType="blanks"
      documentTitle={doc.title}
      documentId={docId}
      showScore={submitted}
      score={score}
      headerExtra={
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Blank Density:</span>
            {([20, 40, 60] as const).map(d => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                disabled={submitted}
                className={`btn-sm rounded-lg font-medium transition-all ${
                  density === d
                    ? 'btn-primary'
                    : 'btn-secondary text-[var(--color-text-secondary)]'
                }`}
              >
                {d}%
              </button>
            ))}
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {blanks.length} blank{blanks.length === 1 ? '' : 's'} to fill
          </span>
        </div>
      }
    >
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
                  const wIdx = globalWordCounter++;
                  const blankIdx = blankByWordIdx.get(wIdx);

                  if (blankIdx !== undefined) {
                    const blank = blanks[blankIdx];
                    const charCount = Array.from(blank.answer).length;

                    return (
                      <span key={tIdx} className="inline-block mx-1">
                        {submitted ? (
                          <span
                            className={`font-semibold px-1 rounded ${
                              blank.status === 'correct'
                                ? 'text-[var(--color-success)] bg-green-500/10'
                                : 'text-[var(--color-error)] bg-red-500/10'
                            }`}
                          >
                            {blank.status === 'correct' ? (
                              blank.answer
                            ) : (
                              <span>
                                <span className="line-through opacity-70">
                                  {blank.userInput || '____'}
                                </span>{' '}
                                <span className="text-[var(--color-success)] underline">
                                  {blank.answer}
                                </span>
                              </span>
                            )}
                          </span>
                        ) : (
                          <input
                            ref={el => {
                              inputRefs.current[blankIdx] = el;
                            }}
                            type="text"
                            value={blank.userInput}
                            onChange={e => handleInputChange(blankIdx, e.target.value)}
                            className="inline-block border-b-2 border-[var(--color-accent)] bg-transparent outline-none text-center font-mono font-medium px-1 focus:border-[var(--color-accent-hover)] focus:bg-[var(--color-accent)]/10 rounded transition-all"
                            style={{
                              width: `${Math.max(4, charCount + 1)}ch`,
                            }}
                            placeholder="···"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const nextInput = inputRefs.current[blankIdx + 1];
                                if (nextInput) {
                                  nextInput.focus();
                                } else {
                                  handleSubmit();
                                }
                              }
                            }}
                          />
                        )}
                      </span>
                    );
                  }
                  return <span key={tIdx}>{token.value}</span>;
                }
                return <span key={tIdx}>{token.value}</span>;
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="btn-primary btn-lg shadow-md"
            disabled={blanks.length === 0}
          >
            Check Answers
          </button>
        ) : (
          <div className="animate-fade-in card p-6">
            <h3 className="text-xl font-bold mb-2">Results</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {blanks.filter(b => b.status === 'correct').length} of {blanks.length} correct ({score}%)
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
