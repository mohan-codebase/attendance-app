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
  X,
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

// Kept in sync with the `max-width: 768px` breakpoint in Sidebar.css
const MOBILE_QUERY = '(max-width: 768px)';

const Sidebar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
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

  // Follow the viewport so a desktop collapse doesn't leave the mobile drawer
  // stuck as a 264px-wide icon rail after a rotate or resize.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handleChange = (e) => {
      setIsMobile(e.matches);
      if (!e.matches) setIsMobileOpen(false);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Publish the rail width so .main-content can reclaim the space (App.css).
  useEffect(() => {
    document.body.dataset.sidebar = isMobile ? 'mobile' : isOpen ? 'open' : 'collapsed';
    return () => {
      delete document.body.dataset.sidebar;
    };
  }, [isMobile, isOpen]);

  // An open drawer covers the page, so the page behind it must not scroll.
  useEffect(() => {
    document.body.classList.toggle('sidebar-drawer-open', isMobileOpen);
    return () => document.body.classList.remove('sidebar-drawer-open');
  }, [isMobileOpen]);

  // A phone drawer is always the full-width version, whatever the desktop
  // collapse state happens to be.
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
      <button
        className={`sidebar-mobile-toggle ${isMobileOpen ? 'is-hidden' : ''}`}
        onClick={() => setIsMobileOpen((prev) => !prev)}
        aria-label="Open navigation"
        aria-expanded={isMobileOpen}
      >
        <span className="hamburger-icon">
          <span />
          <span />
          <span />
        </span>
      </button>

      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />}

      <aside
        className={`sidebar ${showLabels ? 'sidebar-open' : 'sidebar-collapsed'} ${
          isMobileOpen ? 'sidebar-mobile-open' : ''
        }`}
      >
        {/* Brand */}
        <div className="sidebar-brandbar">
          <img src={logo} alt="" className="sidebar-brand-avatar" />
          {showLabels && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-eyebrow">Attendance Management</span>
              <span className="sidebar-brand-name">Present sir</span>
            </div>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={() => (isMobile ? setIsMobileOpen(false) : setIsOpen((prev) => !prev))}
            aria-label={isMobile ? 'Close navigation' : isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isMobile ? 'Close navigation' : isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isMobile ? <X size={18} /> : isOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
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
              {showLabels && (
                <div className="sidebar-account-text">
                  <span className="sidebar-account-email">{user.email}</span>
                  <span className="sidebar-account-org">{user.instituteName || user.name}</span>
                </div>
              )}
            </div>
          )}

          <button onClick={handleLogout} className="sidebar-logout" title="Logout">
            <LogOut size={17} strokeWidth={1.75} />
            {showLabels && <span>Logout Account</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
