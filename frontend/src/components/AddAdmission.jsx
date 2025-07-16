import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal as BootstrapModal, Button } from "react-bootstrap";
import Model from "./Model";

const AddAdmission = () => {
  const initialFormData = {
    name: "",
    mobile: "",
    email: "",
    qualification: "",
    parentName: "",
    parentMobile: "",
    address: "",
    course: "",
    modeOfLearning: "",
    batch: "",
    placement: "",
    attendBy: "",
    preferredSlot: "",
    date: new Date(),
  };

  const [formData, setFormData] = useState(initialFormData);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for the modified field
    setErrors({ ...errors, [name]: "" });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, date });
  };

  const validateForm = () => {
    const {
      name,
      mobile,
      email,
      qualification,
      parentName,
      parentMobile,
      address,
      course,
      modeOfLearning,
      batch,
      attendBy,
      preferredSlot,
      placement,
    } = formData;
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Please enter the student's name!";
    }
    const mobilePattern = /^\d{10}$/;
    if (!mobilePattern.test(mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number!";
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      newErrors.email = "Please enter a valid email address!";
    }
    if (!qualification.trim()) {
      newErrors.qualification = "Please enter the student's qualification!";
    }
    if (!parentName.trim()) {
      newErrors.parentName = "Please enter the parent's name!";
    }
    if (!mobilePattern.test(parentMobile)) {
      newErrors.parentMobile = "Please enter a valid 10-digit mobile number!";
    }
    if (!address.trim()) {
      newErrors.address = "Please enter the student's address!";
    }
    if (!course) {
      newErrors.course = "Please select a course!";
    }
    if (!modeOfLearning) {
      newErrors.modeOfLearning = "Please select a mode of learning!";
    }
    if (!batch) {
      newErrors.batch = "Please select a batch!";
    }
    if (!attendBy) {
      newErrors.attendBy = "Please select who is attending!";
    }
    if (!preferredSlot) {
      newErrors.preferredSlot = "Please select a preferred slot!";
    }
    if (!placement) {
      newErrors.placement = "Please select a placement option!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Check for duplicate email or mobile
      const checkResponse = await axios.post("https://attendance-app-1-3e1n.onrender.com/api/admissions/check", {
        email: formData.email,
        mobile: formData.mobile,
      });

      if (checkResponse.data.exists) {
        setErrorMessage("Student with this email or mobile number already exists!");
        setSuccessMessage("");
        return;
      }

      // Submit admission form data
      await axios.post("https://attendance-app-1-3e1n.onrender.com/api/admissions", formData);
      setSuccessMessage("Admission submitted successfully!");
      setErrorMessage("");
      setFormData(initialFormData);

      // Close the form modal immediately after submission
      setTimeout(() => {
        setShowForm(false);
      }, 0.1);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || "Error submitting admission form."
      );
      setSuccessMessage("");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3 text-center">Add Admission</h2>
      <div className="d-flex justify-content-center mb-3">
        <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(true)}>
          Add Admission
        </button>
      </div>
      
      {/* Form Modal */}
      <BootstrapModal show={showForm} onHide={() => setShowForm(false)} centered>
        <BootstrapModal.Header closeButton className="bg-color">
          <BootstrapModal.Title>Add Admission</BootstrapModal.Title>
        </BootstrapModal.Header>
        <BootstrapModal.Body>
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              {/* Name Field */}
              <div className="col-md-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Enter student name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                />
                {errors.name && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Mobile Field */}
              <div className="col-md-6">
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Enter student mobile no"
                  value={formData.mobile}
                  onChange={handleChange}
                  className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                />
                {errors.mobile && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.mobile}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="col-md-6">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter student email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                />
                {errors.email && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Qualification Field */}
              <div className="col-md-6">
                <input
                  type="text"
                  name="qualification"
                  placeholder="Enter student qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className={`form-control ${errors.qualification ? "is-invalid" : ""}`}
                />
                {errors.qualification && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.qualification}
                  </div>
                )}
              </div>

              {/* Parent Name Field */}
              <div className="col-md-6">
                <input
                  type="text"
                  name="parentName"
                  placeholder="Enter student parent's name"
                  value={formData.parentName}
                  onChange={handleChange}
                  className={`form-control ${errors.parentName ? "is-invalid" : ""}`}
                />
                {errors.parentName && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.parentName}
                  </div>
                )}
              </div>

              {/* Parent Mobile Field */}
              <div className="col-md-6">
                <input
                  type="tel"
                  name="parentMobile"
                  placeholder="Enter student parent's mobile no"
                  value={formData.parentMobile}
                  onChange={handleChange}
                  className={`form-control ${errors.parentMobile ? "is-invalid" : ""}`}
                />
                {errors.parentMobile && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.parentMobile}
                  </div>
                )}
              </div>

              {/* Address Field */}
              <div className="col-12">
                <input
                  type="text"
                  name="address"
                  placeholder="Enter student address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`form-control ${errors.address ? "is-invalid" : ""}`}
                />
                {errors.address && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.address}
                  </div>
                )}
              </div>

              {/* Course Field */}
              <div className="col-md-6">
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className={`form-select ${errors.course ? "is-invalid" : ""}`}
                >
                  <option value="">Select course</option>
                  <option value="Fullstack Development">Fullstack Development</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Graphics Design">Graphics Design</option>
                  <option value="Creator Course">Creator Course</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Web Design">Web Design</option>
                  <option value="Video Editing">Video Editing</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="App Development">App Development</option>
                </select>
                {errors.course && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.course}
                  </div>
                )}
              </div>

              {/* Mode of Learning Field */}
              <div className="col-md-6">
                <select
                  name="modeOfLearning"
                  value={formData.modeOfLearning}
                  onChange={handleChange}
                  className={`form-select ${errors.modeOfLearning ? "is-invalid" : ""}`}
                >
                  <option value="">Select mode</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
                {errors.modeOfLearning && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.modeOfLearning}
                  </div>
                )}
              </div>

              {/* Batch Field */}
              <div className="col-md-6">
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  className={`form-select ${errors.batch ? "is-invalid" : ""}`}
                >
                  <option value="">Select batch</option>
                  <option value="9.30">9.30</option>
                  <option value="4.30">4.30</option>
                  <option value="12.30">12.30</option>
                  <option value="2.30">2.30</option>
                  <option value="5.30">5.30</option>
                  <option value="1.30">1.30</option>
                </select>
                {errors.batch && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.batch}
                  </div>
                )}
              </div>

              {/* AttendBy Field */}
              <div className="col-md-6">
                <select
                  name="attendBy"
                  value={formData.attendBy}
                  onChange={handleChange}
                  className={`form-select ${errors.attendBy ? "is-invalid" : ""}`}
                >
                  <option value="">AttendBy</option>
                  <option value="self">Self</option>
                  <option value="guardian">Guardian</option>
                </select>
                {errors.attendBy && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.attendBy}
                  </div>
                )}
              </div>

              {/* Preferred Slot Field */}
              <div className="col-md-6">
                <select
                  name="preferredSlot"
                  value={formData.preferredSlot}
                  onChange={handleChange}
                  className={`form-select ${errors.preferredSlot ? "is-invalid" : ""}`}
                >
                  <option value="">Select preferred slot</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
                {errors.preferredSlot && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.preferredSlot}
                  </div>
                )}
              </div>

              {/* Placement Field */}
              <div className="col-md-6">
                <select
                  name="placement"
                  value={formData.placement}
                  onChange={handleChange}
                  className={`form-select ${errors.placement ? "is-invalid" : ""}`}
                >
                  <option value="">Select placement option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {errors.placement && (
                  <div className="text-danger text-start mt-1" style={{ fontSize: "0.875rem" }}>
                    {errors.placement}
                  </div>
                )}
              </div>

              {/* Date Field */}
              <div className="col-md-6">
                <label htmlFor="date" className="form-label">Select Date:</label>
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                />
              </div>
            </div>
            <div className="text-center mt-4">
              <button type="submit" className="btn button-color px-5 py-2">
                Submit Admission
              </button>
            </div>
          </form>
        </BootstrapModal.Body>
      </BootstrapModal>

      {/* Custom pop-up using Model component */}
      <Model
        show={!!successMessage}
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
      <Model
        show={!!errorMessage}
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />
    </div>
  );
};

export default AddAdmission;