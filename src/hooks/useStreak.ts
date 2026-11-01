import { useState, useEffect, useCallback } from 'react';
import { getOrCreateStreak } from '../db';
import type { StreakData } from '../types';

export function useStreak() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getOrCreateStreak();
    setStreak(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { streak, loading, reload: load };
}
