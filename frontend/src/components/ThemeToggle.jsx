import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import '../css/ThemeToggle.css';

// Floating light/dark switch, rendered once by App outside the routes so it is
// present on every screen — signed-out pages included, where there is no
// sidebar and no Settings to reach.
//
// Settings still owns the three-way choice (System / Light / Dark). This only
// ever writes an explicit 'light' or 'dark': it reads whichever theme is
// actually on screen and flips it, so a click while on System does the
// intuitive thing rather than silently staying put.
const ThemeToggle = ({ setTheme }) => {
  const [applied, setApplied] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  // App writes data-theme on <html>, including when the OS flips while the
  // preference is System, so that attribute is the source of truth for which
  // icon to show.
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setApplied(document.documentElement.getAttribute('data-theme') || 'light')
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const isDark = applied === 'dark';
  const next = isDark ? 'light' : 'dark';

  const handleClick = () => {
    setTheme(next);
    localStorage.setItem('preferredTheme', next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleClick}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {isDark ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
    </button>
  );
};

export default ThemeToggle;
