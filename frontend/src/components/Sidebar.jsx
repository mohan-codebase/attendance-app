import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  House,
  BookOpen,
  UserRound,
  PieChart,
  CalendarDays,
  Plus,
  Settings as SettingsIcon,
  CircleHelp,
  ChevronDown,
  ChevronUp,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import logo from '../img/logo.png';
import '../css/Sidebar.css';

// Grouped navigation. Items with `children` get a disclosure chevron.
const navSections = [
  {
    label: 'Home',
    items: [
      { path: '/dashboard', icon: House, label: 'Dashboard', children: [{ path: '/dashboard', label: 'Overview' }] },
      { path: '/courses', icon: BookOpen, label: 'Courses', children: [{ path: '/courses', label: 'All courses' }] },
      { path: '/attendances', icon: UserRound, label: 'Attendances', children: [{ path: '/attendances', label: 'Take attendance' }] },
      { path: '/report', icon: PieChart, label: 'Report', children: [{ path: '/report', label: 'Student Performance' }] },
      { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
      { path: '/add-admission', icon: Plus, label: 'Add admission' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { path: '/settings', icon: SettingsIcon, label: 'Settings', children: [{ path: '/settings', label: 'Preferences' }] },
      { path: '/help', icon: CircleHelp, label: 'Help' },
    ],
  },
];

const Sidebar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => ['/dashboard']);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    setIsAuthenticated(false);
    navigate('/login');
  }, [setIsAuthenticated, navigate]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, 5 * 60 * 1000);
  }, [handleLogout]);

  const handleActivity = useCallback(() => resetTimeout(), [resetTimeout]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsAuthenticated(false);
      navigate('/login');
    } else {
      setIsAuthenticated(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo) {
          setUser(userInfo);
        } else {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    }

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    resetTimeout();

    return () => {
      clearTimeout(timeoutRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [setIsAuthenticated, navigate, handleActivity, resetTimeout]);

  // Close the mobile drawer on navigation, and reveal the section you land in.
  useEffect(() => {
    setIsMobileOpen(false);
    setExpanded((prev) => (prev.includes(location.pathname) ? prev : [...prev, location.pathname]));
  }, [location.pathname]);

  const isActive = (path) =>
    path === '/report' ? location.pathname.startsWith('/report') : location.pathname === path;

  const toggleGroup = (path) =>
    setExpanded((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));

  const initials = (user?.instituteName || user?.name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        <span className="hamburger-icon">
          <span />
          <span />
          <span />
        </span>
      </button>

      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />}

      <aside
        className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'} ${
          isMobileOpen ? 'sidebar-mobile-open' : ''
        }`}
      >
        {/* Brand */}
        <div className="sidebar-brandbar">
          <img src={logo} alt="" className="sidebar-brand-avatar" />
          {isOpen && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-eyebrow">Attendance Management</span>
              <span className="sidebar-brand-name">Present sir</span>
            </div>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div className="sidebar-section" key={section.label}>
              {isOpen && <p className="sidebar-section-label">{section.label}</p>}

              <ul className="sidebar-nav-list">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const open = expanded.includes(item.path);

                  return (
                    <li key={item.path}>
                      <div className={`sidebar-row ${active ? 'active' : ''}`}>
                        <Link
                          to={item.path}
                          className="sidebar-nav-link"
                          title={!isOpen ? item.label : undefined}
                        >
                          <Icon size={19} strokeWidth={1.75} className="sidebar-nav-icon" />
                          {isOpen && <span className="sidebar-nav-label">{item.label}</span>}
                        </Link>

                        {isOpen && item.children && (
                          <button
                            className="sidebar-chevron"
                            onClick={() => toggleGroup(item.path)}
                            aria-expanded={open}
                            aria-label={`${open ? 'Collapse' : 'Expand'} ${item.label}`}
                          >
                            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </div>

                      {isOpen && item.children && open && (
                        <ul className="sidebar-subnav">
                          {item.children.map((child) => (
                            <li key={child.label}>
                              <Link
                                to={child.path}
                                className={`sidebar-subnav-link ${
                                  location.pathname === child.path ? 'active' : ''
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account + logout */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-account">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="sidebar-account-avatar" />
              ) : (
                <span className="sidebar-account-avatar sidebar-account-initials">{initials}</span>
              )}
              {isOpen && (
                <div className="sidebar-account-text">
                  <span className="sidebar-account-email">{user.email}</span>
                  <span className="sidebar-account-org">{user.instituteName || user.name}</span>
                </div>
              )}
            </div>
          )}

          <button onClick={handleLogout} className="sidebar-logout" title="Logout">
            <LogOut size={17} strokeWidth={1.75} />
            {isOpen && <span>Logout Account</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
