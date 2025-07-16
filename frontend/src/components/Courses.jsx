import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import book from '../img/book 2.png';
import bell from '../img/bell 1.png';
import { Form } from 'react-bootstrap';
import '../css/Courses.css';
import Model from './Model';  // Importing our custom Modal

const Courses = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    qualification: '',
    parentName: '',
    parentMobile: '',
    address: '',
    modeOfLearning: '',
    preferredSlot: '',
    placement: '',
    attendBy: '',
    course: '',
    batch: '',
    date: new Date(),
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('All');

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const response = await axios.get('https://attendance-app-1-3e1n.onrender.com/api/admissions');
        const sorted = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAdmissions(sorted);
        setLoading(false);
        const batchList = Array.from(new Set(response.data.map(student => student.batch).filter(Boolean)));
        setBatches(batchList);
      } catch (error) {
        console.error('Error fetching admissions:', error);
        setError('Error fetching admissions');
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, []);

  const groupByCourse = (admissions) => {
    const courses = [
      'Fullstack Development', 'UI/UX', 'Graphics Design', 'Creator Course',
      'Digital Marketing', 'Web Design', 'Video Editing', 'Machine Learning', 'App Development'
    ];
    
    return courses.reduce((groups, course) => {
      groups[course] = admissions.filter(admission => admission.course === course);
      return groups;
    }, {});
  };

  const groupedAdmissions = groupByCourse(admissions);

  const handleEdit = (admission) => {
    setEditingAdmission(admission._id);
    setFormData({ ...admission, date: new Date(admission.date) });
  };

  const handleCancelEdit = () => {
    setEditingAdmission(null);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      qualification: '',
      parentName: '',
      parentMobile: '',
      address: '',
      modeOfLearning: '',
      preferredSlot: '',
      placement: '',
      attendBy: '',
      course: '',
      batch: '',
      date: new Date(),
    });
  };

  const handleDelete = async (admissionId) => {
    try {
      await axios.delete(`https://attendance-app-1-3e1n.onrender.com/api/admissions/${admissionId}`);
      setAdmissions(admissions.filter(admission => admission._id !== admissionId));
      setSuccessMessage('Admission deleted successfully!');
      setErrorMessage('');
      if (admissions.length === 1) {
        setSelectedCourse(null);
      }
      setEditingAdmission(null);
    } catch (error) {
      console.error('Error deleting admission:', error);
      setErrorMessage('Error deleting admission');
      setSuccessMessage('');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://attendance-app-1-3e1n.onrender.com/api/admissions/${editingAdmission}`, formData);
      setAdmissions(admissions.map(admission => 
        admission._id === editingAdmission ? { ...admission, ...formData } : admission
      ));
      setEditingAdmission(null);
      setSuccessMessage('Admission updated successfully!');
      setErrorMessage('');
    } catch (error) {
      console.error('Error updating admission:', error);
      setErrorMessage('Error updating admission');
      setSuccessMessage('');
    }
  };

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
  };

  const filteredAdmissions = admissions.filter(admission => {
    const admissionDate = moment(admission.date);
    return admissionDate.isSame(selectedMonth, 'month') && 
           (selectedBatch === 'All' || admission.batch === selectedBatch) &&
           (!selectedCourse || admission.course === selectedCourse);
  });

  const groupedFilteredAdmissions = groupByCourse(filteredAdmissions);
  const formFields = [
    'name', 'email', 'mobile', 'qualification', 'parentName',
    'parentMobile', 'address', 'modeOfLearning', 'preferredSlot',
    'placement', 'attendBy'
  ];

  if (loading) {
    return <div className="alert alert-info">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      {/* Header Section */}
      <div className="d-flex justify-content-between mb-4">
        <div className="d-flex gap-3">
          <img src={book} className="book" alt="Courses" style={{ height: '30px', width: '30px'  }} />
          <h3 className="course">Courses</h3>
        </div>
        <div>
          <img src={bell} className="bell" alt="Notifications" style={{ height: '30px', width: '30px' }} />
        </div>
      </div>

      {/* Filters Section */}
      {selectedCourse && (
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <DatePicker
            selected={selectedMonth}
            onChange={handleMonthChange}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="form-control"
            placeholderText="Select Month"
            style={{ width: '200px' , }}
          />
          <Form.Group controlId="batchFilter" className="ms-3" style={{ minWidth: '200px' }}>
            <Form.Select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="All">All Batches</option>
              {batches.map((batch, index) => (
                <option key={index} value={batch}>{batch}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      )}

         {/* Pop-up Messages using Model component */}
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

      {/* Course Details or Course List */}
      {selectedCourse ? (
        <div>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setEditingAdmission(null);
              setFormData({
                name: '',
                email: '',
                mobile: '',
                qualification: '',
                parentName: '',
                parentMobile: '',
                address: '',
                modeOfLearning: '',
                preferredSlot: '',
                placement: '',
                attendBy: '',
                course: '',
                batch: '',
                date: new Date(),
              });
            }}
            className="btn btn-secondary mb-4"
          >
            ← Back to Courses
          </button>
          <h3 className="text-center mb-3">{selectedCourse}</h3>

          {groupedFilteredAdmissions[selectedCourse]?.length > 0 ? (
            <div className="row">
              {groupedFilteredAdmissions[selectedCourse].map((admission) => (
                <div key={admission._id} className="col-md-4 mb-4">
                  <div className="card shadow-sm" style={{ 
                    backgroundColor: '#CF9CFF', 
                    minHeight: '500px',
                    overflow: 'hidden'
                  }}>
                    <div className="card-body">
                      {editingAdmission === admission._id ? (
                        <form onSubmit={handleUpdate}>
                          {formFields.map((key) => (
                            <div className="mb-3" key={key}>
                              <label className="form-label">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </label>
                              <input
                                type="text"
                                name={key}
                                value={formData[key]}
                                onChange={handleChange}
                                className="form-control form-control-sm text-white"
                                required
                              />
                            </div>
                          ))}

                          <div className="mb-3">
                            <label className="form-label">Date</label>
                            <DatePicker
                              selected={new Date(formData.date)}
                              onChange={(date) => setFormData({...formData, date})}
                              className="form-control form-control-sm"
                              showTimeSelect
                              dateFormat="Pp"
                            />
                          </div>

                          <div className="d-grid gap-2 mt-4">
                            <button type="submit" className="btn btn-warning">Update</button>
                            <button type="button" className="btn btn-outline-secondary" 
                              onClick={handleCancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h5 className="mb-4">{admission.name}</h5>
                          <div className="admission-details">
                            {Object.entries(admission).map(([key, value]) => {
                              if (key === '_id' || key === '__v') return null;
                              return (
                                <div key={key} className="detail-item">
                                  <span className="detail-label">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                                  </span>
                                  <span className="detail-value">
                                    {key === 'date' ? 
                                      moment(value).format('DD/MM/YYYY hh:mm A') : value}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 d-grid gap-2">
                            <button onClick={() => handleEdit(admission)} 
                              className="btn btn-sm btn-primary">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(admission._id)} 
                              className="btn btn-sm btn-danger">
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center">No admissions available for this course.</p>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {Object.keys(groupByCourse(admissions)).map((course) => (
            <div key={course} className="col-md-3">
              <div 
                className="card shadow-sm h-100" 
                onClick={() => setSelectedCourse(course)} 
                role="button"
                style={{ 
                  backgroundColor: '#A45EE5',
                  transition: 'transform 0.2s',
                  minHeight: '150px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div className="card-body d-flex align-items-center justify-content-center">
                  <h6 className="card-title text-center mb-0 px-2 text-white">
                    {course}
                  </h6>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;