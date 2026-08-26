import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleUserRound, Mail, Phone, Building2, CalendarDays, ShieldCheck } from 'lucide-react';
import moment from 'moment';
import api from '../api';
import '../css/Profile.css';

const FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', placeholder: 'Your name' },
  { name: 'instituteName', label: 'Institute name', type: 'text', placeholder: 'Your institute' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  { name: 'mobileNumber', label: 'Mobile number', type: 'tel', placeholder: '10-digit number' },
];

const EMPTY = { name: '', instituteName: '', email: '', mobileNumber: '' };

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
      const updated = data.user || { ...user, ...form };
      setUser(updated);

      // The sidebar reads the cached copy, so keep it in step and tell it to
      // re-read — otherwise the old name sits there until the next reload.
      const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem(
        'userInfo',
        JSON.stringify({ ...cached, name: updated.name, email: updated.email, instituteName: updated.instituteName })
      );
      window.dispatchEvent(new Event('userinfo-changed'));

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

  if (loading) return <div className="pro"><p className="pro-state">Loading your profile…</p></div>;

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
        {user.avatar ? (
          <img src={user.avatar} alt="" className="pro-avatar" />
        ) : (
          <span className="pro-avatar pro-avatar--initials">{initialsOf(user)}</span>
        )}

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
