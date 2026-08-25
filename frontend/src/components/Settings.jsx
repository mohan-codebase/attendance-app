import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import api from '../api';
import system from "../img/system.png";
import light from "../img/light.png";
import dark from "../img/dark.png";
import settings from '../img/Settings.png';
import '../css/Setting.css';
import Model from './Model';

const Settings = ({ setTheme }) => {
  const [localTheme, setLocalTheme] = useState(localStorage.getItem('preferredTheme') || "system");
  const [studentNotification, setStudentNotification] = useState("");
  const [studentTime, setStudentTime] = useState(0);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [systemTime, setSystemTime] = useState(0);
  const [accountDetails, setAccountDetails] = useState({
    name: "",
    email: "",
    instituteName: "",
    mobileNumber: ""
  });
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const displayMessage = (msg) => {
    setModalMessage(msg);
    setShowModal(true);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/api/user');
        if (response.data) {
          setAccountDetails({
            name: response.data.name || "",
            email: response.data.email || "",
            instituteName: response.data.instituteName || "",
            mobileNumber: response.data.mobileNumber || ""
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleThemeChange = (mode) => {
    setLocalTheme(mode);
    setTheme(mode);
    localStorage.setItem('preferredTheme', mode);
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/api/user', accountDetails);
      displayMessage(response.data?.message || "Account details updated successfully!");
    } catch (error) {
      console.error("Error updating account:", error);
      displayMessage(error.response?.data?.error || "Error updating account details");
    }
  };

  return (
    <div className="container p-4">
      <div className="d-flex flex-row justify-content-top align-items-center gap-5">
        <img src={settings} className='settings' style={{ width: '40px' }} alt="Settings" />
      </div>
      <h2 className="setting mb-4 d-flex">Settings</h2>

      {/* Theme Settings */}
      <div className="mb-4">
        <h4 className="inter">Interface Theme</h4>
        <p className="inter1 mt-3">Select or customize your UI theme</p>
        <div className="d-flex gap-5 theme-selection flex-wrap">
          {[
            { mode: "system", img: system },
            { mode: "light", img: light },
            { mode: "dark", img: dark },
          ].map(({ mode, img }) => (
            <label key={mode} className="text-center theme-option" style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="theme"
                value={mode}
                checked={localTheme === mode}
                onChange={() => handleThemeChange(mode)}
                className="me-2"
              />
              <img
                src={img}
                alt={mode}
                className={`rounded border theme-img ${localTheme === mode ? 'border-primary shadow' : ''}`}
                width="150"
              />
              <div className="mt-1">{mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="mb-5" style={{ maxWidth: '600px' }}>
        <h4 className="inter mb-3">Account Details</h4>
        {loading ? (
          <p className="text-muted">Loading profile...</p>
        ) : (
          <form onSubmit={handleAccountUpdate} className="card p-3 shadow-sm border-0">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={accountDetails.name}
                  onChange={(e) => setAccountDetails({ ...accountDetails, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={accountDetails.email}
                  onChange={(e) => setAccountDetails({ ...accountDetails, email: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="instituteName" className="form-label">Institute Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="instituteName"
                  value={accountDetails.instituteName}
                  onChange={(e) => setAccountDetails({ ...accountDetails, instituteName: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="mobileNumber" className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
                  id="mobileNumber"
                  value={accountDetails.mobileNumber}
                  onChange={(e) => setAccountDetails({ ...accountDetails, mobileNumber: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-primary px-4">Update Profile</button>
            </div>
          </form>
        )}
      </div>

      {/* Student Notifications */}
      <div className="mb-4" style={{ maxWidth: '600px' }}>
        <h4 className="inter mb-3">Student Notifications</h4>
        <input
          type="text"
          placeholder="Type notification broadcast message"
          className="student form-control mb-3 p-2"
          value={studentNotification}
          onChange={(e) => setStudentNotification(e.target.value)}
        />
        <label className="time">Notify minutes before class: {studentTime}m</label>
        <input
          type="range"
          min="-60"
          max="60"
          step="10"
          value={studentTime}
          onChange={(e) => setStudentTime(Number(e.target.value))}
          className="range form-range mt-2"
        />
      </div>

      {/* System Notifications */}
      <div className="mb-4" style={{ maxWidth: '600px' }}>
        <h4 className="inter mb-3">System Notifications</h4>
        <div className="check form-check form-switch mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="systemNotifSwitch"
            checked={systemNotifications}
            onChange={() => setSystemNotifications(!systemNotifications)}
          />
          <label className="form-check-label ms-2" htmlFor="systemNotifSwitch">
            {systemNotifications ? 'Enabled' : 'Disabled'}
          </label>
        </div>
        <label className="time">System reminder interval: {systemTime}m</label>
        <input
          type="range"
          min="-60"
          max="60"
          step="10"
          value={systemTime}
          onChange={(e) => setSystemTime(Number(e.target.value))}
          className="range form-range mt-2"
        />
      </div>

      {/* Pop-up feedback message */}
      <Model
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default Settings;
