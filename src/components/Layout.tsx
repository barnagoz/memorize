import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

interface LayoutProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ theme, onToggleTheme }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
