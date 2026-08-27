import React, { useEffect, useState } from 'react';
import { Moon, Sun, UserPlus } from 'lucide-react';
import '../css/ThemeToggle.css';

// Floating light/dark switch and quick Add Admission action.
// Rendered once by App outside the routes so it is present across all screens.
const ThemeToggle = ({ setTheme, isAuthenticated = true, onOpenAdmission }) => {
  const [applied, setApplied] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

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

  const handleThemeClick = () => {
    setTheme(next);
    localStorage.setItem('preferredTheme', next);
  };

  const handleAdmissionClick = () => {
    if (onOpenAdmission) {
      onOpenAdmission();
    } else {
      window.dispatchEvent(new CustomEvent('open-add-admission'));
    }
  };

  return (
    <div className="floating-controls" aria-label="Quick actions">
      {isAuthenticated && (
        <button
          type="button"
          className="floating-btn floating-btn--admission"
          onClick={handleAdmissionClick}
          aria-label="Add Admission"
          title="Add Admission"
        >
          <UserPlus size={18} strokeWidth={2} />
        </button>
      )}

      <button
        type="button"
        className="floating-btn floating-btn--theme"
        onClick={handleThemeClick}
        aria-label={`Switch to ${next} theme`}
        title={`Switch to ${next} theme`}
      >
        {isDark ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
      </button>
    </div>
  );
};

export default ThemeToggle;
