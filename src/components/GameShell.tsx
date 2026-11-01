import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GAME_INFO, type GameType } from '../types';

interface GameShellProps {
  gameType: GameType;
  documentTitle: string;
  documentId: number;
  score?: number | null;
  showScore?: boolean;
  onComplete?: (score: number) => void;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({
  gameType,
  documentTitle,
  documentId,
  score = null,
  showScore = false,
  children,
  headerExtra,
}) => {
  const navigate = useNavigate();
  const info = GAME_INFO[gameType];

  return (
    <div className="game-container">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/document/${documentId}`)}
          className="btn-ghost p-2 rounded-lg"
          aria-label="Back to document"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{info.name}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] truncate">{documentTitle}</p>
        </div>
        {showScore && score !== null && (
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--color-accent)]">{score}%</div>
            <div className="text-xs text-[var(--color-text-secondary)]">Score</div>
          </div>
        )}
      </div>

      {headerExtra && <div className="mb-4">{headerExtra}</div>}

      <div className="animate-fade-in">
        {children}
      </div>
    </div>
  );
};
