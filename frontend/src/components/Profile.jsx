import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleUserRound, Mail, Phone, Building2, CalendarDays, ShieldCheck, Camera } from 'lucide-react';
import moment from 'moment';
import api from '../api';
import Preloader from './Preloader';
import '../css/Profile.css';

const FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', placeholder: 'Your name' },
  { name: 'instituteName', label: 'Institute name', type: 'text', placeholder: 'Your institute' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  { name: 'mobileNumber', label: 'Mobile number', type: 'tel', placeholder: '10-digit number' },
];

const EMPTY = { name: '', instituteName: '', email: '', mobileNumber: '' };

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// Downscale the picked file to a square before it ever leaves the browser, so
// what we store and ship around is a small JPEG rather than a phone photo.
const resizeImage = (file, size = 256) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });

const initialsOf = (user) =>
  (user?.instituteName || user?.name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/user');
      setUser(data);
      setForm({
        name: data.name || '',
        instituteName: data.instituteName || '',
        email: data.email || '',
        mobileNumber: data.mobileNumber || '',
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Could not load your profile. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Push a fresh user record into local state and the sidebar's cached copy,
  // then nudge the sidebar to re-read it.
  const applyUser = useCallback((updated) => {
    setUser(updated);
    const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
    localStorage.setItem(
      'userInfo',
      JSON.stringify({
        ...cached,
        name: updated.name,
        email: updated.email,
        instituteName: updated.instituteName,
        avatar: updated.avatar || '',
      })
    );
    window.dispatchEvent(new Event('userinfo-changed'));
  }, []);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPG or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('That image is too large. Please choose one under 10 MB.');
      return;
    }

    setError('');
    setNotice('');
    setAvatarBusy(true);
    try {
      const dataUrl = await resizeImage(file);
      const { data } = await api.put('/api/user', { avatar: dataUrl });
      applyUser(data.user || { ...user, avatar: dataUrl });
      setNotice('Profile photo updated.');
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      setError(err.response?.data?.error || 'Could not upload that photo. Please try again.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setError('');
    setNotice('');
    setAvatarBusy(true);
    try {
      const { data } = await api.put('/api/user', { avatar: '' });
      applyUser(data.user || { ...user, avatar: '' });
      setNotice('Profile photo removed.');
    } catch (err) {
      console.error('Error removing profile photo:', err);
      setError(err.response?.data?.error || 'Could not remove that photo. Please try again.');
    } finally {
      setAvatarBusy(false);
    }
  };

  // Enables/disables Save, and drives the Discard button.
  const dirty = useMemo(() => {
    if (!user) return false;
    return FIELDS.some(({ name }) => (form[name] || '') !== (user[name] || ''));
  }, [form, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setNotice('');
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Please enter your name';
    if (!form.instituteName.trim()) errors.instituteName = 'Please enter your institute';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Please enter a valid email address';
    // Matches the 10-digit rule the User schema enforces, so a save cannot fail
    // on something we could have caught here.
    if (!/^\d{10}$/.test(form.mobileNumber)) errors.mobileNumber = 'Please enter a 10-digit mobile number';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice('');
    setError('');
    if (!validate()) return;

    setSaving(true);
    try {
      const { data } = await api.put('/api/user', form);
      applyUser(data.user || { ...user, ...form });
      setNotice(data.message || 'Profile updated.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!user) return;
    setForm({
      name: user.name || '',
      instituteName: user.instituteName || '',
      email: user.email || '',
      mobileNumber: user.mobileNumber || '',
    });
    setFieldErrors({});
    setNotice('');
  };

  if (loading) {
    return (
      <Preloader
        message="Loading Your Profile…"
        subMessage="Fetching account preferences, institute details, and user permissions…"
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }

  if (!user) {
    return (
      <div className="pro">
        <p className="pro-state pro-state--error">{error || 'Profile unavailable.'}</p>
      </div>
    );
  }

  const viaGoogle = user.authProvider === 'google';

  return (
    <div className="pro">
      <header className="pro-header">
        <CircleUserRound size={20} strokeWidth={1.75} />
        <h1>Profile</h1>
      </header>

      {/* Identity */}
      <section className="pro-card pro-identity">
        <div className="pro-avatar-edit">
          <div className="pro-avatar-frame">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="pro-avatar" />
            ) : (
              <span className="pro-avatar pro-avatar--initials">{initialsOf(user)}</span>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={handleAvatarPick}
            />
            <button
              type="button"
              className="pro-avatar-cam"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label={user.avatar ? 'Change photo' : 'Add photo'}
              title={user.avatar ? 'Change photo' : 'Add photo'}
            >
              <Camera size={13} strokeWidth={2} />
            </button>
          </div>

          {user.avatar && (
            <button
              type="button"
              className="pro-avatar-remove"
              onClick={removeAvatar}
              disabled={avatarBusy}
            >
              {avatarBusy ? 'Working…' : 'Remove'}
            </button>
          )}
        </div>

        <div className="pro-identity-text">
          <h2>{user.name || 'Unnamed account'}</h2>
          <p>{user.instituteName || 'No institute set'}</p>
          <span className={`pro-badge ${viaGoogle ? 'pro-badge--google' : ''}`}>
            <ShieldCheck size={13} strokeWidth={2} />
            {viaGoogle ? 'Signed in with Google' : 'Email and password'}
          </span>
        </div>

        <dl className="pro-meta">
          <div>
            <dt><CalendarDays size={14} strokeWidth={1.75} /> Member since</dt>
            <dd>{user.createdAt ? moment(user.createdAt).format('MMMM YYYY') : '—'}</dd>
          </div>
          <div>
            <dt><Mail size={14} strokeWidth={1.75} /> Email</dt>
            <dd>{user.email || '—'}</dd>
          </div>
          <div>
            <dt><Phone size={14} strokeWidth={1.75} /> Mobile</dt>
            <dd>{user.mobileNumber || '—'}</dd>
          </div>
          <div>
            <dt><Building2 size={14} strokeWidth={1.75} /> Institute</dt>
            <dd>{user.instituteName || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Editable details */}
      <section className="pro-card">
        <h2 className="pro-card-title">Account details</h2>

        {error && <p className="pro-alert pro-alert--error">{error}</p>}
        {notice && <p className="pro-alert pro-alert--ok">{notice}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="pro-grid">
            {FIELDS.map(({ name, label, type, placeholder }) => (
              <label className="pro-field" key={name}>
                <span className="pro-field-label">{label}</span>
                <input
                  className={`pro-input ${fieldErrors[name] ? 'is-invalid' : ''}`}
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  autoComplete="off"
                />
                {fieldErrors[name] && <span className="pro-field-error">{fieldErrors[name]}</span>}
              </label>
            ))}
          </div>

          {viaGoogle && (
            <p className="pro-hint">
              You sign in with Google. Changing the email here updates your PresentSir
              record; it does not change the Google account you sign in with.
            </p>
          )}

          <div className="pro-actions">
            <button type="button" className="pro-discard" onClick={discard} disabled={!dirty || saving}>
              Discard changes
            </button>
            <button type="submit" className="pro-save" disabled={!dirty || saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Profile;
