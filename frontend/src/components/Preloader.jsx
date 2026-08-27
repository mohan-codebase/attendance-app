import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  Clock,
  RefreshCw,
  AlertCircle,
  Database,
  Layers,
  Activity,
} from 'lucide-react';
import '../css/Preloader.css';

const DEFAULT_TIPS = [
  '💡 Pro tip: Filter students instantly by Course, Batch, and Date.',
  '📊 Regular attendance tracking increases student engagement and outcomes.',
  '✨ You can generate detailed student performance reports in the Report tab.',
  '📅 Schedule classes and track batch sessions easily via the Calendar.',
  '🌙 Toggle between Light and Dark themes anytime to suit your preference.',
  '⚡ Fast search allows filtering through student lists in real-time.',
  '🎯 Batch-wise admission records help manage classroom capacities effectively.',
];

const MILESTONES = [
  { label: 'Connecting', icon: Database },
  { label: 'Fetching Data', icon: Activity },
  { label: 'Organizing Records', icon: Layers },
];

/**
 * Preloader - A modern, dynamic, and informative preloader component
 * designed specifically for handling long data fetching & cold-start delays.
 */
const Preloader = ({
  message = 'Loading Attendance Data…',
  subMessage,
  fullScreen = false,
  inline = false,
  minHeight = '420px',
  showTips = true,
  showTimer = true,
  showMilestones = true,
  tips = DEFAULT_TIPS,
  slowWarningThreshold = 10, // seconds before showing cold-start helper
  onRetry,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipFade, setTipFade] = useState(true);

  // Track elapsed loading time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate helpful tips every 4 seconds
  useEffect(() => {
    if (!showTips || tips.length <= 1) return;
    const tipInterval = setInterval(() => {
      setTipFade(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % tips.length);
        setTipFade(true);
      }, 250);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, [showTips, tips]);

  // Determine active milestone based on elapsed time
  const currentMilestoneIndex = useMemo(() => {
    if (elapsedSeconds < 3) return 0;
    if (elapsedSeconds < 7) return 1;
    return 2;
  }, [elapsedSeconds]);

  // Contextual status text based on elapsed duration
  const dynamicStatus = useMemo(() => {
    if (subMessage) return subMessage;
    if (elapsedSeconds < 3) {
      return 'Retrieving latest records from the database…';
    }
    if (elapsedSeconds < 8) {
      return 'Crunching statistics and organizing classroom records…';
    }
    if (elapsedSeconds < 16) {
      return 'Connecting to cloud services… Almost there!';
    }
    return 'The backend server is waking up from idle state. Thank you for your patience!';
  }, [elapsedSeconds, subMessage]);

  const isTakingLong = elapsedSeconds >= slowWarningThreshold;

  const handleRetry = () => {
    if (typeof onRetry === 'function') {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={`preloader-container ${fullScreen ? 'fullscreen' : ''} ${inline ? 'inline' : ''}`}
      style={{ '--preloader-min-height': typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
      role="status"
      aria-live="polite"
    >
      <div className="preloader-card">
        <div className="preloader-ambient-glow" aria-hidden="true" />

        {/* Central Orbital Animation */}
        <div className="preloader-orbit-wrapper" aria-hidden="true">
          <div className="preloader-ring-outer" />
          <div className="preloader-ring-middle" />
          <div className="preloader-ring-inner" />
          <div className="preloader-satellite" />
          <div className="preloader-core-hub">
            <GraduationCap size={inline ? 22 : 30} className="preloader-core-icon" />
          </div>
        </div>

        {/* Dynamic Titles */}
        <h3 className="preloader-heading">{message}</h3>
        <p className="preloader-subheading">{dynamicStatus}</p>

        {/* Animated Progress Beam */}
        <div className="preloader-progress-track" aria-hidden="true">
          <div className="preloader-progress-bar" />
        </div>

        {/* Step Milestones */}
        {showMilestones && !inline && (
          <div className="preloader-steps" aria-hidden="true">
            {MILESTONES.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentMilestoneIndex;
              const isPast = idx < currentMilestoneIndex;
              return (
                <div
                  key={step.label}
                  className={`preloader-step-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                >
                  <Icon size={13} />
                  <span>{step.label}</span>
                  {isActive && <span className="preloader-step-dot" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Cold Start / Slow Load Alert Banner */}
        {isTakingLong && !inline && (
          <div className="preloader-slow-banner">
            <AlertCircle size={17} className="preloader-slow-icon" />
            <div>
              <strong>Loading is taking a bit longer than usual.</strong>
              <div>
                If this is the first request in a while, cloud servers may take 20–40 seconds to spin up from idle.
              </div>
            </div>
          </div>
        )}

        {/* Rotating Tips Box */}
        {showTips && !inline && tips.length > 0 && (
          <div className="preloader-tip-box">
            <Sparkles size={14} className="preloader-tip-icon" />
            <span
              className="preloader-tip-text"
              style={{ opacity: tipFade ? 1 : 0 }}
            >
              {tips[tipIndex]}
            </span>
          </div>
        )}

        {/* Footer with Elapsed Timer and Optional Retry */}
        {!inline && (
          <div className="preloader-footer">
            {showTimer ? (
              <span className="preloader-timer">
                <Clock size={13} />
                <span>Elapsed: {elapsedSeconds}s</span>
              </span>
            ) : (
              <span />
            )}

            {isTakingLong && (
              <button
                type="button"
                className="preloader-retry-btn"
                onClick={handleRetry}
                title="Retry data fetch"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Preloader;
