import React, { useState, useMemo } from "react";
import api from '../api';
import { Modal as BootstrapModal } from "react-bootstrap";
import { Search } from "lucide-react";
import { COURSES } from '../constants/courses';
import Model from "./Model";
import "../css/Admission.css";

const MODES = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];
const BATCHES = ["9.30", "10.30", "11.30", "12.30", "1.30", "2.30", "4.30", "5.30"];
const SLOTS = ["Morning", "Afternoon", "Evening"];
const ATTEND_BY = [
  { value: "self", label: "Self" },
  { value: "guardian", label: "Guardian" },
];
const PLACEMENTS = ["Yes", "No"];

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
  };

  const [formData, setFormData] = useState(initialFormData);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [courseQuery, setCourseQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The "Search course" box narrows the course dropdown rather than being a
  // field of its own — it is not submitted.
  const visibleCourses = useMemo(
    () => COURSES.filter((c) => c.toLowerCase().includes(courseQuery.trim().toLowerCase())),
    [courseQuery]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
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
    if (!mobilePattern.test(mobile)) newErrors.mobile = "Enter a valid 10-digit mobile number!";
    if (!emailPattern.test(email)) newErrors.email = "Enter a valid email address!";
    if (!qualification.trim()) newErrors.qualification = "Please enter the qualification!";
    if (!parentName.trim()) newErrors.parentName = "Please enter the parent's name!";
    if (!mobilePattern.test(parentMobile)) newErrors.parentMobile = "Enter a valid 10-digit mobile number!";
    if (!address.trim()) newErrors.address = "Please enter the address!";
    if (!course) newErrors.course = "Please select a course!";
    if (!modeOfLearning) newErrors.modeOfLearning = "Please select a mode of learning!";
    if (!batch) newErrors.batch = "Please select a batch!";
    if (!attendBy) newErrors.attendBy = "Please select who is attending!";
    if (!preferredSlot) newErrors.preferredSlot = "Please select a preferred slot!";
    if (!placement) newErrors.placement = "Please select a placement option!";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeForm = () => {
    setShowForm(false);
    setErrors({});
    setCourseQuery("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const checkResponse = await api.post("/api/admissions/check", {
        email: formData.email,
        mobile: formData.mobile,
      });

      if (checkResponse.data.exists) {
        setErrorMessage("Student with this email or mobile number already exists!");
        setSuccessMessage("");
        return;
      }

      await api.post("/api/admissions", formData);
      setSuccessMessage("Admission submitted successfully!");
      setErrorMessage("");
      setFormData(initialFormData);
      closeForm();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || "Error submitting admission form."
      );
      setSuccessMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  // One field: label, control, and its validation message.
  const Field = ({ label, name, span, children }) => (
    <div className={`adm-field ${span ? "adm-field--full" : ""}`}>
      <label className="adm-label" htmlFor={name}>{label}</label>
      {children}
      {errors[name] && <p className="adm-error">{errors[name]}</p>}
    </div>
  );

  const input = (name, placeholder, type = "text") => (
    <input
      id={name}
      type={type}
      name={name}
      placeholder={placeholder}
      value={formData[name]}
      onChange={handleChange}
      className={`adm-input ${errors[name] ? "is-invalid" : ""}`}
    />
  );

  const select = (name, placeholder, options) => (
    <select
      id={name}
      name={name}
      value={formData[name]}
      onChange={handleChange}
      className={`adm-input adm-select ${errors[name] ? "is-invalid" : ""}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => {
        const value = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        return <option key={value} value={value}>{label}</option>;
      })}
    </select>
  );

  return (
    <div className="adm-page">
      <h2 className="adm-page-title">Add Admission</h2>
      <button className="adm-open-btn" onClick={() => setShowForm(true)}>
        Add Admission
      </button>

      <BootstrapModal
        show={showForm}
        onHide={closeForm}
        centered
        size="lg"
        dialogClassName="adm-dialog"
        contentClassName="adm-content"
      >
        {/* Cover banner */}
        <div className="adm-cover" role="presentation" />

        <form className="adm-body" onSubmit={handleSubmit} noValidate>
          {errorMessage && <p className="adm-alert">{errorMessage}</p>}

          <div className="adm-grid">
            <Field label="Name" name="name">{input("name", "Enter student name")}</Field>
            <Field label="Mobile no" name="mobile">{input("mobile", "Enter Student mobile no")}</Field>

            <Field label="Email" name="email">{input("email", "Enter student email", "email")}</Field>
            <Field label="Qualification" name="qualification">
              {input("qualification", "Enter student qualification")}
            </Field>

            <Field label="Parent name" name="parentName">
              {input("parentName", "Enter student parent's name")}
            </Field>
            <Field label="Parent mobile no" name="parentMobile">
              {input("parentMobile", "Enter student parent's no")}
            </Field>

            <Field label="Address" name="address" span>
              {input("address", "Enter student address")}
            </Field>

            {/* Course: the dropdown plus a box that filters its options */}
            <div className="adm-field adm-field--full">
              <label className="adm-label" htmlFor="course">Course</label>
              <div className="adm-course-row">
                {select("course", "Select course", visibleCourses)}
                <div className="adm-search">
                  <input
                    type="text"
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                    placeholder="Search course"
                    aria-label="Filter the course list"
                  />
                  <Search size={16} strokeWidth={1.75} />
                </div>
              </div>
              {errors.course && <p className="adm-error">{errors.course}</p>}
            </div>

            <Field label="Mode of learning" name="modeOfLearning">
              {select("modeOfLearning", "Select mode", MODES)}
            </Field>
            <Field label="Preferred slot" name="preferredSlot">
              {select("preferredSlot", "Select slot", SLOTS)}
            </Field>

            <Field label="Placement" name="placement">
              {select("placement", "Select", PLACEMENTS)}
            </Field>
            <Field label="Attend by" name="attendBy">
              {select("attendBy", "Select", ATTEND_BY)}
            </Field>

            <Field label="Batch" name="batch">
              {select("batch", "Select batch", BATCHES)}
            </Field>
          </div>

          <button type="submit" className="adm-submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit admission"}
          </button>
        </form>
      </BootstrapModal>

      <Model
        show={Boolean(successMessage)}
        message={successMessage}
        onClose={() => setSuccessMessage("")}
      />
    </div>
  );
};

export default AddAdmission;
