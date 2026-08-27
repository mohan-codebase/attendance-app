import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from './Modal';
import GoogleAuthButton from './GoogleAuthButton';
import { BrandLogo } from './Brand';
import person1 from '../img/character-1.png'; // Person 1
import person2 from '../img/character-2.png'; // Person 2
import '../css/Login.css'; // Import the Login.css file

const Login = ({ setIsAuthenticated }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const [modal, setModal] = useState({ show: false, message: '' }); // Modal state
    const [emailError, setEmailError] = useState(''); // Email error state
    const [passwordError, setPasswordError] = useState(''); // Password error state
    const [loading, setLoading] = useState(false); // Loading state

    const navigate = useNavigate();

    useEffect(() => {
        // Earlier builds saved the password here in plaintext. Delete it on
        // sight so devices that signed in before this change stop carrying it
        // around; the browser's own password manager fills the field instead.
        localStorage.removeItem('password');

        const savedEmail = localStorage.getItem('email');
        if (savedEmail) {
            setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
        }

        const token = localStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
            navigate('/dashboard');
        }
    }, [setIsAuthenticated, navigate]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;

        // A checkbox's `value` is the string "on" whether it is ticked or not,
        // so reading it here left "Remember me" stuck on once it was ticked.
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear errors when user starts typing
        if (name === 'email') {
            setEmailError('');
        }
        if (name === 'password') {
            setPasswordError('');
        }
    };

    const validateForm = () => {
        const { email, password } = formData;
        let isValid = true;

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setEmailError('Please enter a valid email address!');
            isValid = false;
        }

        // Validate password
        if (!password) {
            setPasswordError('Please enter a password!');
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const { email, password, rememberMe } = formData;

        setLoading(true); // Start loading

        try {
            const response = await api.post('/api/users/login', {
                email,
                password,
            });

            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('userInfo', JSON.stringify(response.data.user));
            setIsAuthenticated(true);

            // The address only: a stored password is readable by any script on
            // the page, and the session already survives a reload via authToken.
            if (rememberMe) {
                localStorage.setItem('email', email);
            } else {
                localStorage.removeItem('email');
            }

            setModal({ show: true, message: 'Login successful!' });
            setTimeout(() => {
                setModal({ show: false, message: '' });
                navigate('/dashboard');
            }, 0.100);
        } catch (err) {
            console.error(err);
            setModal({ show: true, message: 'Invalid email or password' });
            setTimeout(() => setModal({ show: false, message: '' }), 2000); // Close modal after 2 seconds
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleCloseModal = () => {
        setModal({ show: false, message: '' });
    };

    return (
        <div className="login-container d-flex flex-column">
            <nav className="navbar navbar-light auth-nav w-100 px-3 px-sm-4 flex-nowrap">
                <BrandLogo className="brand-logo--nav" />
                <div className="auth-nav-actions">
                    <Link to='/Login'><button className="btn btn-light auth-nav-btn">Login</button></Link>
                    <Link to='/Register'><button className="btn button-color auth-nav-btn">Register</button></Link>
                </div>
            </nav>

            <div className='d-flex align-items-center justify-content-center flex-grow-1 px-3 px-sm-4 py-4'>
                <div className='vector1'>
                </div>
                <div className='vector2'>
                </div>
                <img src={person1} className='person1' alt="" />

                <div className="login-card position-relative">
                    <div className="hands-left"></div>
                    <div className="hands-right"></div>
                    <div>
                        <div className="maincard shadow text-center">
                            <h2 className=" mb-5">Sign in to your account</h2>

                            <form onSubmit={handleSubmit} noValidate>
                                <div className="name mb-3">
                                    <input
                                        type="email"
                                        className={`form-control ${emailError ? 'is-invalid' : ''} p-3`}
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email address"
                                        required
                                        autoComplete="username"
                                    />
                                    {emailError && (
                                        <div className="invalid-feedback text-start mt-1" style={{ fontSize: '0.875rem' }}>
                                            {emailError}
                                        </div>
                                    )}
                                </div>

                                <div className="name mb-3">
                                    <input
                                        type="password"
                                        className={`form-control ${passwordError ? 'is-invalid' : ''} p-3`}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    {passwordError && (
                                        <div className="invalid-feedback text-start mt-1" style={{ fontSize: '0.875rem' }}>
                                            {passwordError}
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex justify-content-between align-items-center auth-options mb-3">
                                    <div className='remember mt-4 d-flex gap-1'>
                                        <input
                                            type="checkbox"
                                            id="remember-me"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="remember-me">Remember me</label>
                                    </div>
                                    <Link to="/forgot-password" className="forget text-primary mt-4">Forgot password?</Link>
                                </div>

                                <button type="submit" className="sign-in btn button-color auth-submit p-3 mt-4" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Sign In'}
                                </button>
                            </form>

                            <GoogleAuthButton
                                setIsAuthenticated={setIsAuthenticated}
                                onError={(message) => {
                                    setModal({ show: true, message });
                                    setTimeout(() => setModal({ show: false, message: '' }), 2500);
                                }}
                            />
                        </div>
                    </div>
                </div>
                <img src={person2} className='person2' alt="" />
            </div>

            <Modal show={modal.show} message={modal.message} onClose={handleCloseModal} />
        </div>
    );
};

export default Login;