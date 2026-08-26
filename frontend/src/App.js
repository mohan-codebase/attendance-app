import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Chart as ChartJS } from 'chart.js';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Courses from './components/Courses';
import Attendances from './components/Attendances';
import Report from './components/Report';
import Calendar from './components/Calendar';
import AddAdmission from './components/AddAdmission';
import Login from './components/Login';
import Register from './components/Register';
import Startingpage from './components/Startingpage';
import Dashboard from './components/Dashboard';
import Help from './components/Help';
import ThemeToggle from './components/ThemeToggle';

import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Restore the saved choice; Settings writes it as 'preferredTheme'.
  // Without this the theme silently resets to 'system' on every reload.
  const [theme, setTheme] = useState(() => localStorage.getItem('preferredTheme') || 'system');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }

    // Apply theme
    const applyTheme = (theme) => {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      // Chart.js paints to canvas and cannot read CSS variables, so its axis
      // labels, legend and grid lines have to be told the theme explicitly.
      const dark = theme === 'dark';
      ChartJS.defaults.color = dark ? '#c9ced4' : '#495057';
      ChartJS.defaults.borderColor = dark
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.1)';
    };

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Apply initial theme
    if (theme === 'system') {
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      applyTheme(theme);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="app">
        {isAuthenticated && <Sidebar setIsAuthenticated={setIsAuthenticated} />}
        {/* Outside the routes, so it is on every screen — login and register
            included, where there is no sidebar to reach Settings from. */}
        <ThemeToggle setTheme={setTheme} />
        <div className={`main-content ${isAuthenticated ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Startingpage />} />
            <Route path="/settings" element={isAuthenticated ? <Settings theme={theme} setTheme={setTheme} /> : <Navigate to="/login" />} />
            <Route path="/courses" element={isAuthenticated ? <Courses /> : <Navigate to="/login" />} />
            <Route path="/attendances" element={isAuthenticated ? <Attendances /> : <Navigate to="/login" />} />
            <Route path="/report/:studentId?" element={isAuthenticated ? <Report /> : <Navigate to="/login" />} />
            <Route path="/calendar" element={isAuthenticated ? <Calendar /> : <Navigate to="/login" />} />
            <Route path="/add-admission" element={isAuthenticated ? <AddAdmission /> : <Navigate to="/login" />} />
            <Route path="/help" element={<Help />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;