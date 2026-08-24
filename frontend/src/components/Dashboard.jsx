import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import moment from 'moment';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import '../css/Dashboard.css';
import dashboard from '../img/dashboard.png';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Static Upcoming Classes Data
const upcomingClasses = [
  { _id: "1", title: "Fullstack Development", date: "2025-02-28T09:30:00.000Z", batch: "9.30" },
  { _id: "2", title: "UI/UX", date: "2025-02-28T10:30:00.000Z", batch: "10.30" },
  { _id: "3", title: "Graphics Design", date: "2025-02-28T11:30:00.000Z", batch: "11.30" },
  { _id: "4", title: "Creator Course", date: "2025-02-28T12:30:00.000Z", batch: "12.30" },
  { _id: "5", title: "Digital Marketing", date: "2025-02-28T13:30:00.000Z", batch: "1.30" },
  { _id: "6", title: "Web Design", date: "2025-02-28T14:30:00.000Z", batch: "2.30" },
  { _id: "7", title: "Video Editing", date: "2025-02-28T15:30:00.000Z", batch: "3.30" },
  { _id: "8", title: "Machine Learning", date: "2025-02-28T16:30:00.000Z", batch: "4.30" },
  { _id: "9", title: "App Development", date: "2025-02-28T17:30:00.000Z", batch: "5.30" },
];

const Dashboard = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  const scrollContainerRef = useRef(null);
  const leaderboardScrollRef = useRef(null);

  // Fetch Admissions Data
  const fetchAdmissions = async () => {
    try {
      const response = await api.get('/api/admissions');
      setAdmissions(response.data);
    } catch (err) {
      console.error('Error fetching admissions data:', err);
      setError('Error fetching admissions data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance Data
  const fetchAttendance = async () => {
    try {
      const response = await api.get('/api/attendance');
      setAttendance(response.data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setAttendanceError('Error fetching attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchAttendance();
    setShowWelcomePopup(true);
    const timer = setTimeout(() => setShowWelcomePopup(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Sort Upcoming Classes by Date and Batch
  const sortedClasses = [...upcomingClasses].sort((a, b) => new Date(a.date) - new Date(b.date));
  const batchOrder = ["9.30", "10.30", "11.30", "12.30", "1.30", "2.30", "3.30", "4.30", "5.30"];
  const batchTimesMapping = batchOrder.reduce((acc, batch) => {
    const [hour, minute] = batch.split('.').map(Number);
    acc[batch] = { hour, minute };
    return acc;
  }, {});

  const now = moment();
  const nextBatchIndex = batchOrder.findIndex((batch) => now.isBefore(moment().set(batchTimesMapping[batch])));
  const rotatedBatchOrder = [...batchOrder.slice(nextBatchIndex), ...batchOrder.slice(0, nextBatchIndex)];
  const sortedClassesByBatch = [...sortedClasses].sort((a, b) => rotatedBatchOrder.indexOf(a.batch) - rotatedBatchOrder.indexOf(b.batch));

  // Auto-scroll Effect for Upcoming Classes
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        scrollContainerRef.current.scrollTop += 1;
        if (scrollTop >= scrollHeight - clientHeight) scrollContainerRef.current.scrollTop = 0;
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Group Admissions by Course
  const groupedAdmissions = admissions.reduce((acc, admission) => {
    const course = admission.course;
    if (!acc[course]) acc[course] = [];
    acc[course].push(admission);
    return acc;
  }, {});

  // Filter Today's Attendance
  const todayStr = moment().format('YYYY-MM-DD');
  const todayAttendance = attendance.filter((att) => moment(att.date).format('YYYY-MM-DD') === todayStr);
  const groupedAttendance = todayAttendance.reduce((acc, record) => {
    if (record.studentId?._id) {
      const id = record.studentId._id;
      if (!acc[id] || (acc[id] === 'Absent' && record.status === 'Present')) acc[id] = record.status;
    }
    return acc;
  }, {});
  const presentCount = Object.values(groupedAttendance).filter((status) => status === 'Present').length;
  const absentCount = Object.values(groupedAttendance).filter((status) => status === 'Absent').length;

  // Pie Chart Data
  const pieData = {
    datasets: [{
      rotation: 120,
      data: [presentCount || 0, absentCount || 0],
      backgroundColor: ["#9B5DE5", "#D3D3D3"],
      hoverBackgroundColor: ["#8A4BC3", "#BEBEBE"],
      borderWidth: 0,
      cutout: "80%",
      borderRadius: 15,
    }],
    labels: ["Present", "Absent"],
  };

  // Weekly Attendance Summary
  const startOfWeek = moment().startOf('isoWeek');
  const endOfWeek = moment().endOf('isoWeek');
  const weekAttendance = attendance.filter((att) => moment(att.date).isBetween(startOfWeek, endOfWeek, null, '[]'));
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'day'));
  const weeklyData = daysOfWeek.map((day) => {
    const dayStr = day.format('YYYY-MM-DD');
    const recordsForDay = weekAttendance.filter((att) => moment(att.date).format('YYYY-MM-DD') === dayStr);
    const group = recordsForDay.reduce((acc, record) => {
      if (record.studentId?._id) {
        const id = record.studentId._id;
        if (!acc[id] || (acc[id] === 'Absent' && record.status === 'Present')) acc[id] = record.status;
      }
      return acc;
    }, {});
    return {
      day: day.format('ddd'),
      present: Object.values(group).filter((status) => status === 'Present').length,
      absent: Object.values(group).filter((status) => status === 'Absent').length,
    };
  });

  // Bar Chart Data
  const barData = {
    labels: weeklyData.map((d) => d.day),
    datasets: [
      {
        label: 'Present',
        data: weeklyData.map((d) => d.present),
        backgroundColor: "#9B5DE5",
        hoverBackgroundColor: "#8A4BC3",
        borderRadius: 100,
      },
      {
        label: 'Absent',
        data: weeklyData.map((d) => d.absent),
        backgroundColor: "#D3D3D3",
        hoverBackgroundColor: "#BEBEBE",
        borderRadius: 15,
      },
    ],
  };

  // Leaderboard Data
  const startOfMonth = moment().startOf('month');
  const endOfMonth = moment().endOf('month');
  const leaderboard = attendance.reduce((acc, record) => {
    if (record.studentId?._id && record.status === 'Present' && moment(record.date).isBetween(startOfMonth, endOfMonth, null, '[]')) {
      const id = record.studentId._id;
      if (!acc[id]) acc[id] = { name: record.studentId.name || 'Unknown', count: 0 };
      acc[id].count += 1;
    }
    return acc;
  }, {});
  const leaderboardArray = Object.values(leaderboard).sort((a, b) => b.count - a.count);

  // Auto-scroll Effect for Leaderboard
  useEffect(() => {
    const interval = setInterval(() => {
      if (leaderboardScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = leaderboardScrollRef.current;
        leaderboardScrollRef.current.scrollTop += 1;
        if (scrollTop >= scrollHeight - clientHeight) leaderboardScrollRef.current.scrollTop = 0;
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Filter Admissions by Search Term
  const filteredAdmissions = admissions.filter((admission) =>
    admission.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading and Error States
  if (loading) return <div className="alert alert-info">Loading Admissions...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  // Detailed Student Report
  if (selectedStudent) {
    return (
      <div className="container mt-5">
        <button className="btn btn-secondary mb-4" onClick={() => setSelectedStudent(null)}>
          Back to Dashboard
        </button>
        <h2 className="mb-4 text-center">Student Detailed Report</h2>
        <div className="shadow-sm">
          <div>
            <h4>{selectedStudent.name}</h4>
            <ul className="list-unstyled">
              {Object.keys(selectedStudent)
                .filter((key) => !['__v', 'id', '_id'].includes(key))
                .map((key) => (
                  <li key={key}>
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {selectedStudent[key]}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="mb-4 text-start">Dashboard</h2>

      {/* Search Bar */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', width: '250px' }}>
        <input
          type="text"
          className="form-control form-control-sm rounded-lg px-2   shadow-sm"
          placeholder="Search student name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ backgroundColor: 'var(--input-background-color)', color: 'var(--input-text-color)' }}
        />
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="mb-5">
          <h4>Search Results</h4>
          {filteredAdmissions.length > 0 ? (
            <div className="row">
              {filteredAdmissions.map((admission) => (
                <div
                  key={admission._id}
                  className="col-md-4 mb-3"
                  onClick={() => setSelectedStudent(admission)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card shadow-sm" style={{ backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }}>
                    <div className="card-body">
                      <h5>{admission.name}</h5>
                      <p>{admission.course}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>No results found.</div>
          )}
        </div>
      )}

      {/* Admissions Data by Course */}
      <div className="dashboard-cards">
        <div className="dashboard-cards-header">
          <h1 className="text-start">Our Courses</h1>
          <h5 className="text-start mb-4">Number of Students in Each Course</h5>
        </div>
        {['Fullstack Development', 'UI/UX', 'Creator Course', 'Graphics Design'].map((course) => (
          <div className="dashboard-card" key={course}>
            <div className="dashboard-card-content">
              <div>
                <h5>{course}</h5>
                <p>{groupedAdmissions[course]?.length || 0} Students</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3-Column Layout */}
      <div className="row d-flex justify-content-between">
        <div className="col-md-3 my-3 mx-2 p-3 rounded-lg d-flex flex-column justify-content-center align-items-center">
          <h5 className='mb-2'>Day wise summary</h5>
          <div style={{ height: '245px' }}>
            <Pie data={pieData} options={{ maintainAspectRatio: true, responsive: true }} />
          </div>
        </div>

        <div className="col-md-3 my-3 mx-0 p-3 rounded-lg d-flex flex-column justify-content-center align-items-center ">
          <h5>Weekly summary</h5>
          <div className='d-flex justify-content-center align-items-center' style={{ height: '245px' }}>
            <Bar data={barData} options={{ maintainAspectRatio: true, responsive: true }} />
          </div>
        </div>

        <div className="col-md-3 my-3 mx-0 p-3 rounded-lg d-flex flex-column justify-content-center align-items-center ">
          <h5 className="text-center mb-4">Upcoming class</h5>
          <div
            className=""
            ref={scrollContainerRef}
            style={{ height: '230px', width: '300px', overflow: 'hidden' }}
          >
            <ul className="list-group list-group-flush">
              {[...sortedClassesByBatch, ...sortedClassesByBatch].map((cls, index) => (
                <li key={index} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>{cls.title}</h6>
                      <p className="mb-0">Batch: {cls.batch}</p>
                    </div>
                    <span className="badge badge-primary">{moment(cls.date).format('MMM D, YYYY')}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Attendance Leaderboard */}
      <div className="row mb-4 justify-content-center">
        <div className="col-md-12">
          <h5 className="text-center p-1 bg-color rounded">Attendance Leaderboard</h5>
          <div
            className=""
            ref={leaderboardScrollRef}
            style={{ height: '300px', overflow: 'hidden' }}
          >
            <ul className="list-group list-group-flush">
              {[...leaderboardArray, ...leaderboardArray].map((student, index) => (
                <li key={index} className="list-group-item">
                  <strong>{index % leaderboardArray.length + 1}. {student.name}</strong> - {student.count} Present
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;