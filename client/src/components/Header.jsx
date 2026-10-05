import React from 'react';
import { Menu, Sun, Moon, Sparkles } from 'lucide-react';

export function Header({
  onToggleSidebar,
  theme,
  onToggleTheme,
  activeTitle
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="icon-btn menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar menu"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="header-title-container">
          <span className="app-badge"><Sparkles size={14} /> AI Assistant</span>
          {activeTitle && <span className="active-conv-title">{activeTitle}</span>}
        </div>
      </div>

      <div className="header-right">
        <button
          className="icon-btn theme-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  );
}
