import React, { useState, useMemo } from 'react';
import api from '../api';
import { Modal as BootstrapModal } from 'react-bootstrap';
import { Search, X } from 'lucide-react';
import { COURSES } from '../constants/courses';
import ToastModal from './Modal';
import '../css/Admission.css';

const MODES = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];
const BATCHES = ['9.30', '10.30', '11.30', '12.30', '1.30', '2.30', '4.30', '5.30'];
const SLOTS = ['Morning', 'Afternoon', 'Evening'];
const ATTEND_BY = [
  { value: 'self', label: 'Self' },
  { value: 'guardian', label: 'Guardian' },
];
const PLACEMENTS = ['Yes', 'No'];

const initialFormData = {
  name: '',
  mobile: '',
  email: '',
  qualification: '',
  parentName: '',
  parentMobile: '',
  address: '',
  course: '',
  modeOfLearning: '',
  batch: '',
  placement: '',
  attendBy: '',
  preferredSlot: '',
};

const AdmissionModal = ({ show, onHide, onAdmissionAdded }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [courseQuery, setCourseQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const visibleCourses = useMemo(() => {
    if (!courseQuery.trim()) return COURSES;
    return COURSES.filter((c) =>
      c.toLowerCase().includes(courseQuery.trim().toLowerCase())
    );
  }, [courseQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const {
      name, mobile, email, qualification, parentName, parentMobile,
      address, course, modeOfLearning, batch, attendBy, preferredSlot, placement,
    } = formData;
    const newErrors = {};
    const mobilePattern = /^\d{10}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) newErrors.name = "Please enter the student's name!";
    if (!mobile.trim() || !mobilePattern.test(mobile)) newErrors.mobile = 'Enter a valid 10-digit mobile number!';
    if (!email.trim() || !emailPattern.test(email)) newErrors.email = 'Enter a valid email address!';
    if (!qualification.trim()) newErrors.qualification = 'Please enter the qualification!';
    if (!parentName.trim()) newErrors.parentName = "Please enter the parent's name!";
    if (!parentMobile.trim() || !mobilePattern.test(parentMobile)) newErrors.parentMobile = 'Enter a valid 10-digit mobile number!';
    if (!address.trim()) newErrors.address = 'Please enter the address!';
    if (!course) newErrors.course = 'Please select a course!';
    if (!modeOfLearning) newErrors.modeOfLearning = 'Please select a mode of learning!';
    if (!batch) newErrors.batch = 'Please select a batch!';
    if (!attendBy) newErrors.attendBy = 'Please select who is attending!';
    if (!preferredSlot) newErrors.preferredSlot = 'Please select a preferred slot!';
    if (!placement) newErrors.placement = 'Please select a placement option!';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    if (onHide) onHide();
    setErrors({});
    setErrorMessage('');
    setCourseQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const checkResponse = await api.post('/api/admissions/check', {
        email: formData.email,
        mobile: formData.mobile,
      });

      if (checkResponse.data.exists) {
        setErrorMessage('Student with this email or mobile number already exists!');
        setSuccessMessage('');
        return;
      }

      await api.post('/api/admissions', formData);
      setSuccessMessage('Admission submitted successfully!');
      setErrorMessage('');
      setFormData(initialFormData);

      if (onAdmissionAdded) {
        onAdmissionAdded();
      }
      window.dispatchEvent(new CustomEvent('admission-added'));

      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || 'Error submitting admission form.'
      );
      setSuccessMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BootstrapModal
        show={show}
        onHide={handleClose}
        centered
        size="lg"
        dialogClassName="adm-dialog"
        contentClassName="adm-content"
      >
        <div className="adm-header">
          <div className="adm-header-title">
            <h3>Add Admission</h3>
            <p>Enter new student admission details</p>
          </div>
          <button
            type="button"
            className="adm-close-btn"
            onClick={handleClose}
            aria-label="Close admission form"
            title="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form className="adm-body" onSubmit={handleSubmit} noValidate>
          {errorMessage && <p className="adm-alert">{errorMessage}</p>}

          <div className="adm-grid">
            {/* Student Name */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-name">Name</label>
              <input
                id="adm-name"
                type="text"
                name="name"
                placeholder="Enter student name"
                value={formData.name}
                onChange={handleChange}
                className={`adm-input ${errors.name ? 'is-invalid' : ''}`}
              />
              {errors.name && <p className="adm-error">{errors.name}</p>}
            </div>

            {/* Student Mobile */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-mobile">Mobile no</label>
              <input
                id="adm-mobile"
                type="tel"
                name="mobile"
                maxLength={10}
                placeholder="Enter Student mobile no"
                value={formData.mobile}
                onChange={handleChange}
                className={`adm-input ${errors.mobile ? 'is-invalid' : ''}`}
              />
              {errors.mobile && <p className="adm-error">{errors.mobile}</p>}
            </div>

            {/* Email */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-email">Email</label>
              <input
                id="adm-email"
                type="email"
                name="email"
                placeholder="Enter student email"
                value={formData.email}
                onChange={handleChange}
                className={`adm-input ${errors.email ? 'is-invalid' : ''}`}
              />
              {errors.email && <p className="adm-error">{errors.email}</p>}
            </div>

            {/* Qualification */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-qualification">Qualification</label>
              <input
                id="adm-qualification"
                type="text"
                name="qualification"
                placeholder="Enter student qualification"
                value={formData.qualification}
                onChange={handleChange}
                className={`adm-input ${errors.qualification ? 'is-invalid' : ''}`}
              />
              {errors.qualification && <p className="adm-error">{errors.qualification}</p>}
            </div>

            {/* Parent Name */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-parentName">Parent name</label>
              <input
                id="adm-parentName"
                type="text"
                name="parentName"
                placeholder="Enter student parent's name"
                value={formData.parentName}
                onChange={handleChange}
                className={`adm-input ${errors.parentName ? 'is-invalid' : ''}`}
              />
              {errors.parentName && <p className="adm-error">{errors.parentName}</p>}
            </div>

            {/* Parent Mobile */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-parentMobile">Parent mobile no</label>
              <input
                id="adm-parentMobile"
                type="tel"
                name="parentMobile"
                maxLength={10}
                placeholder="Enter student parent's no"
                value={formData.parentMobile}
                onChange={handleChange}
                className={`adm-input ${errors.parentMobile ? 'is-invalid' : ''}`}
              />
              {errors.parentMobile && <p className="adm-error">{errors.parentMobile}</p>}
            </div>

            {/* Address */}
            <div className="adm-field adm-field--full">
              <label className="adm-label" htmlFor="adm-address">Address</label>
              <input
                id="adm-address"
                type="text"
                name="address"
                placeholder="Enter student address"
                value={formData.address}
                onChange={handleChange}
                className={`adm-input ${errors.address ? 'is-invalid' : ''}`}
              />
              {errors.address && <p className="adm-error">{errors.address}</p>}
            </div>

            {/* Course & Filter */}
            <div className="adm-field adm-field--full">
              <label className="adm-label" htmlFor="adm-course">Course</label>
              <div className="adm-course-row">
                <select
                  id="adm-course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className={`adm-input adm-select ${errors.course ? 'is-invalid' : ''}`}
                >
                  <option value="">Select course</option>
                  {visibleCourses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="adm-search">
                  <input
                    type="text"
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                    placeholder="Search course"
                    aria-label="Filter course options"
                  />
                  <Search size={16} strokeWidth={1.75} />
                </div>
              </div>
              {errors.course && <p className="adm-error">{errors.course}</p>}
            </div>

            {/* Mode of Learning */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-modeOfLearning">Mode of learning</label>
              <select
                id="adm-modeOfLearning"
                name="modeOfLearning"
                value={formData.modeOfLearning}
                onChange={handleChange}
                className={`adm-input adm-select ${errors.modeOfLearning ? 'is-invalid' : ''}`}
              >
                <option value="">Select mode</option>
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {errors.modeOfLearning && <p className="adm-error">{errors.modeOfLearning}</p>}
            </div>

            {/* Preferred Slot */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-preferredSlot">Preferred slot</label>
              <select
                id="adm-preferredSlot"
                name="preferredSlot"
                value={formData.preferredSlot}
                onChange={handleChange}
                className={`adm-input adm-select ${errors.preferredSlot ? 'is-invalid' : ''}`}
              >
                <option value="">Select slot</option>
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.preferredSlot && <p className="adm-error">{errors.preferredSlot}</p>}
            </div>

            {/* Placement */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-placement">Placement</label>
              <select
                id="adm-placement"
                name="placement"
                value={formData.placement}
                onChange={handleChange}
                className={`adm-input adm-select ${errors.placement ? 'is-invalid' : ''}`}
              >
                <option value="">Select</option>
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.placement && <p className="adm-error">{errors.placement}</p>}
            </div>

            {/* Attend By */}
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-attendBy">Attend by</label>
              <select
                id="adm-attendBy"
                name="attendBy"
                value={formData.attendBy}
                onChange={handleChange}
                className={`adm-input adm-select ${errors.attendBy ? 'is-invalid' : ''}`}
              >
                <option value="">Select</option>
                {ATTEND_BY.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              {errors.attendBy && <p className="adm-error">{errors.attendBy}</p>}
            </div>

            {/* Batch */}
            <div className="adm-field adm-field--full">
              <label className="adm-label" htmlFor="adm-batch">Batch</label>
              <select
                id="adm-batch"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                className={`adm-input adm-select ${errors.batch ? 'is-invalid' : ''}`}
              >
                <option value="">Select batch</option>
                {BATCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.batch && <p className="adm-error">{errors.batch}</p>}
            </div>
          </div>

          <button type="submit" className="adm-submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit admission'}
          </button>
        </form>
      </BootstrapModal>

      <ToastModal
        show={Boolean(successMessage)}
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
    </>
  );
};

export default AdmissionModal;
