import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrCreateProgress } from '../db';
import type { Document, Progress } from '../types';

interface DocumentCardProps {
  document: Document;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (document.id) {
      getOrCreateProgress(document.id).then(setProgress);
    }
  }, [document.id]);

  const isDue = progress ? progress.nextReviewDate <= Date.now() : false;
  const mastery = progress?.masteryScore ?? 0;

  const getMasteryColor = () => {
    if (mastery >= 80) return 'text-green-500';
    if (mastery >= 50) return 'text-amber-500';
    return 'text-[var(--color-text-secondary)]';
  };

  const lines = document.content.split('\n').filter(l => l.trim());
  const preview = lines.slice(0, 2).join(' / ');

  return (
    <Link to={`/document/${document.id}`} className="card-hover block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-text)] truncate">{document.title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">{preview}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-lg font-bold ${getMasteryColor()}`}>{mastery}%</span>
          {isDue && <span className="badge-warning">Due</span>}
          {progress && progress.totalXP > 0 && (
            <span className="text-xs text-[var(--color-text-secondary)]">{progress.totalXP} XP</span>
          )}
        </div>
      </div>
    </Link>
  );
};
