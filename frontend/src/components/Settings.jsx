import React, { useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import system from "../img/system.png";
import light from "../img/light.png";
import dark from "../img/dark.png";
import settings from '../img/Settings.png';
import '../css/Setting.css';

const Settings = ({ theme, setTheme }) => {
  // Driven by App's state rather than a local copy, so the picker stays in step
  // with the floating theme toggle.
  const localTheme = theme || localStorage.getItem('preferredTheme') || "system";
  const [studentNotification, setStudentNotification] = useState("");
  const [studentTime, setStudentTime] = useState(0);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [systemTime, setSystemTime] = useState(0);
  const handleThemeChange = (mode) => {
    setTheme(mode);
    localStorage.setItem('preferredTheme', mode);
  };

  return (
    <div className="container p-3 p-md-4">
      <div className="d-flex flex-row justify-content-top align-items-center gap-5">
        <img src={settings} className='settings' style={{ width: '40px' }} alt="Settings" />
      </div>
      <h2 className="setting mb-4 d-flex">Settings</h2>

      {/* Theme Settings */}
      <div className="mb-4">
        <h4 className="inter">Interface Theme</h4>
        <p className="inter1 mt-3">Select or customize your UI theme</p>
        <div className="theme-selection">
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

      {/* Account details live on the profile page — keeping a second copy of
          the same form here would mean two places to change and two chances to
          drift apart. */}
      <div className="mb-5" style={{ maxWidth: '600px' }}>
        <h4 className="inter mb-3">Account Details</h4>
        <p className="inter1 mb-3">
          Your name, institute, email and mobile number live on your profile.
        </p>
        <Link to="/profile" className="btn btn-outline-primary px-4">Go to profile</Link>
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

    </div>
  );
};

export default Settings;
