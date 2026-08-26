import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { BrandLogo } from './Brand';
import '../css/Register.css';

// Step 1 of the reset: ask for the link.
const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('Please enter a valid email address!');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/users/forgot-password', { email });
            // The API answers the same way whether or not the address is known,
            // and so does this screen — anything else would let a stranger test
            // which addresses have accounts.
            setSent(true);
        } catch (err) {
            console.error('Could not start password reset:', err);
            setError(
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
                        {sent ? (
                            <>
                                <h2 className="mb-4">Check your email</h2>
                                <p className="text-muted mb-4">
                                    If <strong>{email}</strong> has an account, a link to choose a new
                                    password is on its way. It works once and expires in an hour.
                                </p>
                                <Link to="/login">
                                    <button type="button" className="btn button-color auth-submit p-3">
                                        Back to sign in
                                    </button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <h2 className="mb-4">Reset your password</h2>
                                <p className="text-muted mb-4">
                                    Enter the address you signed up with and we'll send you a link.
                                </p>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="name mb-3">
                                        <input
                                            type="email"
                                            className={`form-control ${error ? 'is-invalid' : ''} p-3`}
                                            name="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                            placeholder="Email address"
                                            required
                                            autoComplete="username"
                                        />
                                        {error && (
                                            <div className="invalid-feedback text-start mt-1" style={{ fontSize: '0.875rem' }}>
                                                {error}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="btn button-color auth-submit p-3 mt-3" disabled={loading}>
                                        {loading
                                            ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            : 'Send reset link'}
                                    </button>
                                </form>

                                <p className="mt-4 mb-0">
                                    <Link to="/login" className="forget">Back to sign in</Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
