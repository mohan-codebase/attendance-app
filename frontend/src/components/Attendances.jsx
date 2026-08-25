import React, { useState, useEffect } from 'react';
import api from '../api';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Container, Row, Col, ListGroup, Button, Form } from 'react-bootstrap';
import { FaUserGraduate } from 'react-icons/fa';  // Imported FontAwesome icon
import '../css/Attendance.css';
import bell from "../img/bell 1.png";

const Attendances = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState({});

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/admissions'); // Adjust endpoint as needed
      const data = response.data;
      setStudents(data);
      setFilteredStudents(data);
      setLoading(false);

      // Extract distinct courses and batches for the dropdown filters
      const courseList = Array.from(new Set(data.map(student => student.course).filter(Boolean)));
      const batchList = Array.from(new Set(data.map(student => student.batch).filter(Boolean)));
      setCourses(courseList);
      setBatches(batchList);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Error fetching students');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = students;
    if (selectedCourse !== 'All') {
      filtered = filtered.filter(student => student.course === selectedCourse);
    }
    if (selectedBatch !== 'All') {
      filtered = filtered.filter(student => student.batch === selectedBatch);
    }
    setFilteredStudents(filtered);
  }, [selectedCourse, selectedBatch, students]);

  useEffect(() => {
    const fetchAttendanceForDate = async () => {
      try {
        const response = await api.get('/api/attendance');
        const attendanceRecordsForDate = response.data.filter(record => {
          const recordDate = moment(record.date).format('YYYY-MM-DD');
          return recordDate === moment(selectedDate).format('YYYY-MM-DD');
        });
        const statusObj = attendanceRecordsForDate.reduce((acc, record) => {
          if (record.studentId && record.studentId._id) {
            const id = record.studentId._id;
            if (!acc[id]) {
              acc[id] = record.status;
            } else {
              if (acc[id] === 'Absent' && record.status === 'Present') {
                acc[id] = 'Present';
              }
            }
          }
          return acc;
        }, {});
        setAttendanceStatus(statusObj);
      } catch (err) {
        console.error('Error fetching attendance:', err);
      }
    };

    fetchAttendanceForDate();
  }, [selectedDate]);

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 text-danger">{error}</div>;

  const markAttendance = async (studentId, status) => {
    try {
      const attendanceData = { studentId, date: selectedDate, status };
      await api.post('/api/attendance', attendanceData);
      setMessage(`Attendance for student marked as ${status} on ${moment(selectedDate).format('YYYY-MM-DD')}`);
      
      // Update the attendanceStatus for the student
      setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage('Error marking attendance');
    }
  };

  const totalFiltered = filteredStudents.length;
  const markedPresent = filteredStudents.filter(s => attendanceStatus[s._id] === "Present").length;
  const markedAbsent = filteredStudents.filter(s => attendanceStatus[s._id] === "Absent").length;
  const unmarked = totalFiltered - (markedPresent + markedAbsent);

  return (
    <Container fluid>
      <div className="shadow-sm mb-4">
        <div className='d-flex justify-content-between py-2'>
          <div className='d-flex'>
            <p className="ms-2 mt-2 font-weight-bold">Mark Attendance</p>
          </div>
          <img src={bell} alt="Notification" style={{ height: '20px' }} />
        </div>

        {message && <div className="alert alert-info py-2">{message}</div>}

        <Row className="g-3 mb-3">
          <Col md={4}>
            <Form.Group controlId="courseFilter">
              <Form.Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="All">Filter by Course: All</option>
                {courses.map((course, index) => (
                  <option key={index} value={course}>{course}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="dateFilter">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                wrapperClassName="d-block"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="batchFilter">
              <Form.Select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="All">Filter by Batch: All</option>
                {batches.map((batch, index) => (
                  <option key={index} value={batch}>{batch}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Student List ({totalFiltered})</h4>
          <div>
            <span className="badge bg-success me-2">Present: {markedPresent}</span>
            <span className="badge bg-danger me-2">Absent: {markedAbsent}</span>
            <span className="badge bg-secondary">Unmarked: {unmarked}</span>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="text-muted text-center py-4">No students found matching current filters.</p>
        ) : (
          <ListGroup>
            {filteredStudents.map((student) => {
              const currentStatus = attendanceStatus[student._id];
              return (
                <ListGroup.Item 
                  key={student._id} 
                  className="d-flex p-3 justify-content-between align-items-center student-list-item"
                >
                  <div className="d-flex align-items-center">
                    <FaUserGraduate 
                      style={{
                        fontSize: '32px',
                        marginRight: '12px',
                        color: '#6c757d'
                      }} 
                    />
                    <div>
                      <strong className="d-block">{student.name}</strong>
                      <small className="text-muted">{student.course} • Batch {student.batch}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {currentStatus ? (
                      <span className={`badge ${currentStatus === 'Present' ? 'bg-success' : 'bg-danger'} me-2`}>
                        {currentStatus}
                      </span>
                    ) : (
                      <span className="badge bg-light text-dark border me-2">Not marked</span>
                    )}
                    <Button
                      variant={currentStatus === "Present" ? "success" : "outline-success"}
                      size="sm"
                      className="px-3"
                      onClick={() => markAttendance(student._id, "Present")}
                    >
                      P
                    </Button>
                    <Button
                      variant={currentStatus === "Absent" ? "danger" : "outline-danger"}
                      size="sm"
                      className="px-3"
                      onClick={() => markAttendance(student._id, "Absent")}
                    >
                      A
                    </Button>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </div>
    </Container>
  );
};

export default Attendances;