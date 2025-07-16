import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      const response = await axios.get('https://attendance-app-1-3e1n.onrender.com/api/admissions'); // Adjust endpoint as needed
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
        const response = await axios.get('https://attendance-app-1-3e1n.onrender.com/api/attendance');
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

  const presentCount = filteredStudents.filter(student => attendanceStatus[student._id] === "Present").length;
  const absentCount = filteredStudents.filter(student => attendanceStatus[student._id] === "Absent").length;

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 text-danger">{error}</div>;

  const markAttendance = async (studentId, status) => {
    try {
      const attendanceData = { studentId, date: selectedDate, status };
      await axios.post('https://attendance-app-1-3e1n.onrender.com/api/attendance', attendanceData);
      setMessage(`Attendance marked as ${status} on ${moment(selectedDate).format('YYYY-MM-DD')}`);
      
      // Remove the student from the filtered list after attendance is marked
      setFilteredStudents(prevFilteredStudents => 
        prevFilteredStudents.filter(student => student._id !== studentId)
      );
      
      // Update the attendanceStatus for the student as well
      setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage('Error marking attendance');
    }
  };

  return (
    <Container fluid>
      <div className="shadow-sm mb-4">
        <div className='d-flex justify-content-between py-2'>
          <div className='d-flex'>
            <p className="ms-2 mt-2">Mark Attendance</p>
          </div>
          <img src={bell} alt="Notification" style={{ height: '20px' }} />
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <Row className="g-3 mb-4">
          <Col md={4}>
            <Form.Group controlId="courseFilter">
              <Form.Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="All">Filter by Course:</option>
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
                <option value="All">Filter by Batch:</option>
                {batches.map((batch, index) => (
                  <option key={index} value={batch}>{batch}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <div className="mb-">
          <h4>Student Lists</h4>
        </div>

        <ListGroup>
          {filteredStudents.map((student) => (
            <ListGroup.Item 
              key={student._id} 
              className="d-flex p-2 justify-content-between align-items-center student-list-item"
            >
              <div className="d-flex align-items-center">
                <FaUserGraduate 
                  style={{
                    fontSize: '40px',
                    marginRight: '10px',
                    color: '#6c757d'
                  }} 
                />
                <strong>{student.name}</strong>
              </div>
              <div>
                <Button
                  variant="success"
                  size="sm"
                  className="me-2 mb-2 rounded-circle px-3 py-2"
                  onClick={() => markAttendance(student._id, "Present")}
                >
                  P
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="mb-2 px-3 py-2 rounded-circle"
                  onClick={() => markAttendance(student._id, "Absent")}
                >
                  A
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    </Container>
  );
};

export default Attendances;