import { useState, useEffect, useCallback } from 'react';
import { db, initSettings } from '../db';
import type { AppSettings } from '../types';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initSettings().then((settings) => {
      setThemeState(settings.theme);
      applyTheme(settings.theme);
      setLoaded(true);
    });
  }, []);

  const applyTheme = useCallback((t: 'light' | 'dark') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setTheme = useCallback(async (t: 'light' | 'dark') => {
    setThemeState(t);
    applyTheme(t);
    const settings = await db.settings.toCollection().first();
    if (settings?.id) {
      await db.settings.update(settings.id, { theme: t });
    }
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, loaded };
}
