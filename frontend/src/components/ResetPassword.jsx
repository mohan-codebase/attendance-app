import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { BrandLogo } from './Brand';
import '../css/Register.css';

const MIN_PASSWORD_LENGTH = 8; // matches the check in authController

// Step 2 of the reset: the screen the emailed link opens.
const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [failure, setFailure] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (name === 'password') setPasswordError('');
        if (name === 'confirmPassword') setConfirmError('');
        setFailure('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let valid = true;
        if (form.password.length < MIN_PASSWORD_LENGTH) {
            setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            valid = false;
        }
        if (form.password !== form.confirmPassword) {
            setConfirmError("Passwords don't match!");
            valid = false;
        }
        if (!valid) return;

        setLoading(true);
        try {
            await api.post('/api/users/reset-password', { token, password: form.password });
            setDone(true);
            setTimeout(() => navigate('/login'), 2200);
        } catch (err) {
            console.error('Could not reset password:', err);
            // A used, expired or tampered link all land here.
            setFailure(
                err.response?.data?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container d-flex flex-column">
            <nav className="navbar navbar-light auth-nav w-100 px-3 px-sm-4 flex-nowrap">
                <Link to="/"><BrandLogo className="brand-logo--nav" /></Link>
                <div className="auth-nav-actions">
                    <Link to="/login"><button className="btn btn-light auth-nav-btn">Login</button></Link>
                    <Link to="/register"><button className="btn button-color auth-nav-btn">Register</button></Link>
                </div>
            </nav>

            <div className="d-flex align-items-center justify-content-center flex-grow-1 px-3 px-sm-4 py-4">
                <div className="login-card position-relative">
                    <div className="maincard shadow text-center">
                        {done ? (
                            <>
                                <h2 className="mb-4">Password updated</h2>
                                <p className="text-muted mb-4">Taking you to the sign-in page…</p>
                                <Link to="/login">
                                    <button type="button" className="btn button-color auth-submit p-3">
                                        Sign in
                                    </button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <h2 className="mb-4">Choose a new password</h2>

                                {failure && (
                                    <div className="alert alert-danger py-2" role="alert">
                                        {failure}
                                        <div className="mt-2">
                                            <Link to="/forgot-password" className="forget">Request a new link</Link>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="name mb-3">
                                        <input
                                            type="password"
                                            className={`form-control ${passwordError ? 'is-invalid' : ''} p-3`}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="New password"
                                            required
                                            autoComplete="new-password"
                                        />
                                        {passwordError && (
                                            <div className="invalid-feedback text-start mt-1" style={{ fontSize: '0.875rem' }}>
                                                {passwordError}
                                            </div>
                                        )}
                                    </div>

                                    <div className="name mb-3">
                                        <input
                                            type="password"
                                            className={`form-control ${confirmError ? 'is-invalid' : ''} p-3`}
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm new password"
                                            required
                                            autoComplete="new-password"
                                        />
                                        {confirmError && (
                                            <div className="invalid-feedback text-start mt-1" style={{ fontSize: '0.875rem' }}>
                                                {confirmError}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="btn button-color auth-submit p-3 mt-3" disabled={loading}>
                                        {loading
                                            ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            : 'Update password'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
