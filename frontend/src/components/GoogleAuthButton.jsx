import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';
import Preloader from './Preloader';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Google's four-colour mark. Inlined so the button has no network dependency.
const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
    />
    <path
      fill="#34A853"
      d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
    />
    <path
      fill="#FBBC05"
      d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
    />
    <path
      fill="#EA4335"
      d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
    />
  </svg>
);

// Sign in / sign up with Google. Both are the same action to Google, so the
// only difference between the two pages is the wording on the button.
const GoogleAuthButton = ({ setIsAuthenticated, onError, mode = 'signin' }) => {
  const navigate = useNavigate();
  const nativeRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  // Google renders its own button, so it needs to be told the theme explicitly.
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute('data-theme') || 'light')
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const label = mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google';

  // Without a client ID the Google script has nothing to talk to. In production
  // that means rendering nothing rather than a button that always fails; in
  // development the button is shown disabled so the layout can still be seen.
  if (!clientId) {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="google-auth">
        <div className="google-auth-divider">
          <span>or</span>
        </div>
        <button
          type="button"
          className="google-auth-btn"
          disabled
          title="Set REACT_APP_GOOGLE_CLIENT_ID to enable Google sign-in"
        >
          <GoogleMark />
          <span>{label}</span>
        </button>
        <p className="google-auth-hint">
          Set <code>REACT_APP_GOOGLE_CLIENT_ID</code> to enable this. Shown in development only.
        </p>
      </div>
    );
  }

  const handleSuccess = async (credentialResponse) => {
    const startTime = Date.now();
    setBusy(true);
    try {
      const response = await api.post('/api/users/google', {
        credential: credentialResponse.credential,
      });

      // Enforce intentional 2 second loading experience
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      if (setIsAuthenticated) setIsAuthenticated(true);

      // Google gives us no institute name or mobile number, so first-time users
      // land on Settings to fill them in.
      navigate(response.data.profileComplete ? '/dashboard' : '/settings');
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((resolve) => setTimeout(resolve, 800 - elapsed));
      }
      console.error('Google sign-in failed:', err);
      if (onError) {
        onError(
          err.response?.data?.message || 'Google sign-in failed. Please try again.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  // Google's widget caps at 400px and owns its own border, font and label, so it
  // can't match the card's full-width outlined button. Instead it is rendered
  // off-screen and this button forwards the click to it — the sign-in flow is
  // still Google's own, and the backend keeps verifying a real ID token.
  const openGoogle = () => {
    const target = nativeRef.current?.querySelector('[role="button"], button');
    if (target) {
      target.click();
      return;
    }
    if (onError) onError('Google sign-in is still loading. Please try again in a moment.');
  };

  return (
    <>
      <div className="google-auth" aria-busy={busy}>
        <div className="google-auth-divider">
          <span>or</span>
        </div>

        <button type="button" className="google-auth-btn" onClick={openGoogle} disabled={busy}>
          <GoogleMark />
          <span>{busy ? 'Signing in…' : label}</span>
        </button>

        {/* The real Google button: rendered (so its click handler is live) but
            moved off-screen. Never remove it — it is what actually signs you in. */}
        <div className="google-auth-native" ref={nativeRef} aria-hidden="true">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => onError && onError('Google sign-in was cancelled or failed.')}
            theme={theme === 'dark' ? 'filled_black' : 'outline'}
            shape="rectangular"
            size="large"
            width="280"
            text={mode === 'signup' ? 'signup_with' : 'signin_with'}
            useOneTap={false}
          />
        </div>
      </div>
      {busy && (
        <Preloader
          fullScreen
          message="Signing in with Google…"
          subMessage="Authenticating Google account and setting up your workspace…"
          showMilestones={false}
          showTips={false}
          showTimer={false}
        />
      )}
    </>
  );
};

export default GoogleAuthButton;
