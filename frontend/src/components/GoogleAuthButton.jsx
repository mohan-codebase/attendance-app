import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Sign in / sign up with Google. Both are the same action to Google, so this is
// rendered identically on the Login and Register pages.
const GoogleAuthButton = ({ setIsAuthenticated, onError }) => {
  const navigate = useNavigate();
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

  // Without a client ID the Google script has nothing to talk to, so render
  // nothing rather than a button that always fails.
  if (!clientId) return null;

  const handleSuccess = async (credentialResponse) => {
    setBusy(true);
    try {
      const response = await api.post('/api/users/google', {
        credential: credentialResponse.credential,
      });

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      if (setIsAuthenticated) setIsAuthenticated(true);

      // Google gives us no institute name or mobile number, so first-time users
      // land on Settings to fill them in.
      navigate(response.data.profileComplete ? '/dashboard' : '/settings');
    } catch (err) {
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

  return (
    <div className="google-auth">
      <div className="google-auth-divider">
        <span>or</span>
      </div>
      <div className="google-auth-button" aria-busy={busy}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError && onError('Google sign-in was cancelled or failed.')}
          theme={theme === 'dark' ? 'filled_black' : 'outline'}
          shape="rectangular"
          size="large"
          width="280"
          text="continue_with"
          useOneTap={false}
        />
      </div>
    </div>
  );
};

export default GoogleAuthButton;
