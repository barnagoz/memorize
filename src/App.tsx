import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useTheme } from './hooks/useTheme';
import { Dashboard } from './pages/Dashboard';
import { AddDocument } from './pages/AddDocument';
import { DocumentView } from './pages/DocumentView';
import { Settings } from './pages/Settings';
import { TapToReveal } from './pages/games/TapToReveal';
import { DensitySlider } from './pages/games/DensitySlider';
import { FirstLetter } from './pages/games/FirstLetter';
import { Blanks } from './pages/games/Blanks';
import { Scramble } from './pages/games/Scramble';
import { TypeIt } from './pages/games/TypeIt';
import { MultipleChoice } from './pages/games/MultipleChoice';

function App() {
  const { theme, toggleTheme, loaded } = useTheme();

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-accent)] text-xl font-semibold">Memorize</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout theme={theme} onToggleTheme={toggleTheme} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddDocument />} />
        <Route path="/document/:id" element={<DocumentView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/game/tap-to-reveal/:id" element={<TapToReveal />} />
        <Route path="/game/density-slider/:id" element={<DensitySlider />} />
        <Route path="/game/first-letter/:id" element={<FirstLetter />} />
        <Route path="/game/blanks/:id" element={<Blanks />} />
        <Route path="/game/scramble/:id" element={<Scramble />} />
        <Route path="/game/type-it/:id" element={<TypeIt />} />
        <Route path="/game/multiple-choice/:id" element={<MultipleChoice />} />
      </Route>
    </Routes>
  );
}

export default App;
