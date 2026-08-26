import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from './Model'; // Import the Modal component
import GoogleAuthButton from './GoogleAuthButton';
import person1 from '../img/character-1.png'; // Person 1
import person2 from '../img/character-2.png'; // Person 2
import '../css/Register.css'; // Import the Register.css file
import Vector from '../img/Vector.png';

const Register = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    instituteName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [modal, setModal] = useState({ show: false, message: '' }); // Modal state
  const [nameError, setNameError] = useState(''); // Name error state
  const [instituteNameError, setInstituteNameError] = useState(''); // Institute name error state
  const [emailError, setEmailError] = useState(''); // Email error state
  const [mobileNumberError, setMobileNumberError] = useState(''); // Mobile number error state
  const [passwordError, setPasswordError] = useState(''); // Password error state
  const [confirmPasswordError, setConfirmPasswordError] = useState(''); // Confirm password error state
  const [loading, setLoading] = useState(false); // Loading state

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear errors when user starts typing
    if (e.target.name === 'name') {
      setNameError('');
    }
    if (e.target.name === 'instituteName') {
      setInstituteNameError('');
    }
    if (e.target.name === 'email') {
      setEmailError('');
    }
    if (e.target.name === 'mobileNumber') {
      setMobileNumberError('');
    }
    if (e.target.name === 'password') {
      setPasswordError('');
    }
    if (e.target.name === 'confirmPassword') {
      setConfirmPasswordError('');
    }
  };

  const validateForm = () => {
    const { name, instituteName, email, mobileNumber, password, confirmPassword } = formData;
    let isValid = true;

    // Validate name
    if (!name) {
      setNameError('Please enter your name!');
      isValid = false;
    }

    // Validate institute name
    if (!instituteName) {
      setInstituteNameError('Please enter your institute name!');
      isValid = false;
    }

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setEmailError('Please enter a valid email address!');
      isValid = false;
    }

    // Validate mobile number
    const mobileNumberPattern = /^\d{10}$/;
    if (!mobileNumberPattern.test(mobileNumber)) {
      setMobileNumberError('Please enter a valid 10-digit mobile number!');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Please enter a password!');
      isValid = false;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match!");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { name, instituteName, email, mobileNumber, password } = formData;

    setLoading(true); // Start loading

    try {
      const response = await api.post('/api/users/register', {
        name,
        instituteName,
        email,
        mobileNumber,
        password,
      });

      // Clear the form fields upon successful registration
      setFormData({
        name: '',
        instituteName: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
      });

      setModal({ show: true, message: response.data.message });
      setTimeout(() => {
        setModal({ show: false, message: '' });
        navigate('/Login');
      }, 1500);

    } catch (error) {
      console.error(error);

      if (error.response && error.response.status === 400) {
        setModal({ show: true, message: 'Email or Mobile Number already registered!' });
      } else {
        setModal({ show: true, message: 'An error occurred while registering.' });
      }
      setTimeout(() => setModal({ show: false, message: '' }), 2000); // Close modal after 2 seconds
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="register-container d-flex flex-column position-relative">
      {/* Navbar */}
      <nav className="navbar auth-nav w-100 px-3 px-sm-4 d-flex justify-content-between flex-nowrap">
        <p className="mb-0">PresentSir</p>
        <div className="auth-nav-actions">
          <Link to='/Login'><button className="btn btn-light auth-nav-btn">Login</button></Link>
          <Link to='/Register'><button className="btn button-color auth-nav-btn">Register</button></Link>
        </div>
      </nav>

      {/* Decorative vectors — absolutely placed, hidden below lg (Register.css) */}
      <div className='vector'></div>
      <div className='vector1'></div>

      <div className="register-page-body d-flex align-items-center justify-content-center flex-grow-1 px-3 px-sm-4 py-4">
        <div className="register-card position-relative d-flex align-items-center justify-content-center" >
          <div className="hands-left position-absolute"></div>
          <div className="hands-right position-absolute"></div>
          <img src={person1} className='person1' alt="" />
          <div className=" shadow text-center w-100 maincard">
            <h2 className=" mb-5">Sign up to your account</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3 auth-row">
                <div className="name">
                  <input
                    type="text"
                    className={`form-control ${nameError ? 'is-invalid' : ''} p-3`}
                    placeholder="Enter your name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {nameError && <div className="invalid-feedback">{nameError}</div>}
                </div>
                <div className="name">
                  <input
                    type="text"
                    className={`form-control ${instituteNameError ? 'is-invalid' : ''} p-3`}
                    placeholder="Enter institute name"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleChange}
                  />
                  {instituteNameError && <div className="invalid-feedback">{instituteNameError}</div>}
                </div>
              </div>
              <div className="name mb-3 " >
                <input
                  type="email"
                  className={`form-control ${emailError ? 'is-invalid' : ''} p-3`}
                  placeholder="Enter your email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {emailError && <div className="invalid-feedback">{emailError}</div>}
              </div>
              <div className="name mb-3">
                <input
                  type="text"
                  className={`form-control ${mobileNumberError ? 'is-invalid' : ''} p-3`}
                  placeholder="Enter your mobile number"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                />
                {mobileNumberError && <div className="invalid-feedback">{mobileNumberError}</div>}
              </div>
              <div className="name mb-3">
                <input
                  type="password"
                  className={`form-control ${passwordError ? 'is-invalid' : ''} p-3`}
                  placeholder="Enter password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {passwordError && <div className="invalid-feedback">{passwordError}</div>}
              </div>
              <div className="name mb-3">
                <input
                  type="password"
                  className={`form-control ${confirmPasswordError ? 'is-invalid' : ''} p-3`}
                  placeholder="Confirm password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {confirmPasswordError && <div className="invalid-feedback">{confirmPasswordError}</div>}
              </div>
              <button type="submit" className="btn button-color auth-submit p-3" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Register'}
              </button>
            </form>

            <GoogleAuthButton
              mode="signup"
              setIsAuthenticated={setIsAuthenticated}
              onError={(message) => {
                setModal({ show: true, message });
                setTimeout(() => setModal({ show: false, message: '' }), 2500);
              }}
            />
          </div>
          <img src={person2} className='person2' alt="" />
        </div>
      </div>

      {/* Modal component */}
      <Modal show={modal.show} message={modal.message} />
    </div>
  );
};

export default Register;