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
  UserCog,
  ChevronDown,
  ChevronUp,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';

import { BrandLogo, BrandMark } from './Brand';
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
      { path: '/profile', icon: UserCog, label: 'Profile' },
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
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
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
          handleLogout();
        }
      } catch {
        handleLogout();
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
  }, [setIsAuthenticated, navigate, handleActivity, resetTimeout, handleLogout]);

  // Close the mobile drawer on navigation, and reveal the section you land in.
  useEffect(() => {
    setIsMobileOpen(false);
    setExpanded((prev) => (prev.includes(location.pathname) ? prev : [...prev, location.pathname]));
  }, [location.pathname]);

  // Follow the viewport so desktop/mobile layout remains in sync on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escape key closes the mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Publish the rail width so .main-content can reclaim the space (App.css).
  useEffect(() => {
    document.body.dataset.sidebar = isMobile ? 'mobile' : isOpen ? 'open' : 'collapsed';
    return () => {
      delete document.body.dataset.sidebar;
    };
  }, [isMobile, isOpen]);

  // Profile saves rewrite the cached copy, so the footer updates immediately
  useEffect(() => {
    const reread = () => {
      try {
        const info = JSON.parse(localStorage.getItem('userInfo'));
        if (info) setUser(info);
      } catch {
        /* a corrupt copy is handled by the session check above */
      }
    };
    window.addEventListener('userinfo-changed', reread);
    return () => window.removeEventListener('userinfo-changed', reread);
  }, []);

  // An open drawer covers the page, so the page behind it must not scroll.
  useEffect(() => {
    document.body.classList.toggle('sidebar-drawer-open', isMobileOpen);
    return () => document.body.classList.remove('sidebar-drawer-open');
  }, [isMobileOpen]);

  // A phone drawer is always the full-width version
  const showLabels = isMobile || isOpen;

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
      {/* Top mobile navigation bar */}
      <header className="sidebar-mobile-bar">
        <button
          className="sidebar-mobile-toggle"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isMobileOpen}
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <Link to="/dashboard" className="sidebar-mobile-brand" aria-label="PresentSir home">
          <BrandLogo className="brand-logo--mobile" />
        </Link>

        {user ? (
          <Link to="/profile" className="sidebar-mobile-user" title="My Profile" aria-label="My Profile">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || 'User'} className="sidebar-mobile-avatar" />
            ) : (
              <span className="sidebar-mobile-avatar sidebar-mobile-avatar-initials">{initials}</span>
            )}
          </Link>
        ) : (
          <div className="sidebar-mobile-spacer" />
        )}
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main sidebar / mobile drawer */}
      <aside
        className={`sidebar ${showLabels ? 'sidebar-open' : 'sidebar-collapsed'} ${
          isMobileOpen ? 'sidebar-mobile-open' : ''
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand */}
        <div className="sidebar-brandbar">
          {showLabels ? (
            <div className="sidebar-brand-text">
              <BrandLogo className="brand-logo--sidebar" />
              <span className="sidebar-brand-eyebrow">Attendance Management</span>
            </div>
          ) : (
            <BrandMark />
          )}

          {/* Close button for mobile drawer */}
          <button
            className="sidebar-close-btn"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div className="sidebar-section" key={section.label}>
              {showLabels && <p className="sidebar-section-label">{section.label}</p>}

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
                          onClick={() => setIsMobileOpen(false)}
                          title={!showLabels ? item.label : undefined}
                        >
                          <Icon size={19} strokeWidth={1.75} className="sidebar-nav-icon" />
                          {showLabels && <span className="sidebar-nav-label">{item.label}</span>}
                        </Link>

                        {showLabels && item.children && (
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

                      {showLabels && item.children && open && (
                        <ul className="sidebar-subnav">
                          {item.children.map((child) => (
                            <li key={child.label}>
                              <Link
                                to={child.path}
                                className={`sidebar-subnav-link ${
                                  location.pathname === child.path ? 'active' : ''
                                }`}
                                onClick={() => setIsMobileOpen(false)}
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
            <Link
              to="/profile"
              className="sidebar-account"
              title="View profile"
              onClick={() => setIsMobileOpen(false)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="sidebar-account-avatar" />
              ) : (
                <span className="sidebar-account-avatar sidebar-account-initials">{initials}</span>
              )}
              {showLabels && (
                <div className="sidebar-account-text">
                  <span className="sidebar-account-email">{user.email}</span>
                  <span className="sidebar-account-org">{user.instituteName || user.name}</span>
                </div>
              )}
            </Link>
          )}

          <button onClick={handleLogout} className="sidebar-logout" title="Logout">
            <LogOut size={17} strokeWidth={1.75} />
            {showLabels && <span>Logout Account</span>}
          </button>

          {/* Desktop collapse button */}
          <button
            className="sidebar-collapse-btn"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <PanelLeftClose size={17} strokeWidth={1.75} /> : <PanelLeftOpen size={17} strokeWidth={1.75} />}
            {showLabels && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
