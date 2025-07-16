import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import 'react-big-calendar/lib/css/react-big-calendar.css';

ChartJS.register(ArcElement, Tooltip, Legend);
const localizer = momentLocalizer(moment);

const StudentDetail = () => {
  const { studentId } = useParams();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      try {
        const response = await axios.get('https://attendance-app-1-3e1n.onrender.com/api/attendance');
        // Filter attendance records for the given student
        const studentRecords = response.data.filter(
          att => att.studentId && att.studentId._id === studentId
        );
        setAttendanceRecords(studentRecords);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student attendance:', err);
        setError('Error fetching student attendance');
        setLoading(false);
      }
    };

    fetchStudentAttendance();
  }, [studentId]);

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 text-danger">{error}</div>;

  // Group records by unique day (YYYY-MM-DD)
  // For each day, if any record is "Present", mark that entire day as Present.
  const groupedByDay = attendanceRecords.reduce((acc, record) => {
    const dateKey = new Date(record.date).toISOString().substring(0, 10);
    if (!acc[dateKey]) {
      acc[dateKey] = record.status;
    } else {
      // If already marked as Absent but find a Present record, mark day as Present.
      if (record.status === 'Present') {
        acc[dateKey] = 'Present';
      }
    }
    return acc;
  }, {});
  const uniqueAttendances = Object.values(groupedByDay);
  const presentCount = uniqueAttendances.filter(status => status === 'Present').length;
  const absentCount = uniqueAttendances.filter(status => status === 'Absent').length;

  // Prepare calendar events from all attendance records
  const events = attendanceRecords.map(att => ({
    title: att.status,
    start: new Date(att.date),
    end: new Date(att.date),
    allDay: true,
  }));

  // Prepare animated pie chart data
  const pieData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [presentCount, absentCount],
        backgroundColor: ['#28a745', '#dc3545'],
        hoverBackgroundColor: ['#218838', '#c82333'],
        borderWidth: 1,
      },
    ],
  };

  // Options for animated pie chart
  const pieOptions = {
    animation: {
      animateScale: true,
      animateRotate: true,
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="container mt-4">
      <h2>Attendance Detail</h2>
      {attendanceRecords.length > 0 ? (
        <div className="mb-3">
          <h4>{attendanceRecords[0]?.studentId?.name}</h4>
          <p>
            <strong>Present:</strong> {presentCount} day(s) &nbsp;&nbsp;
            <strong>Absent:</strong> {absentCount} day(s)
          </p>
        </div>
      ) : (
        <div className="mb-3">
          <h4>No attendance record available</h4>
        </div>
      )}
      <div className="mb-4" style={{ height: '30px' }}>
        <h4>Attendance Summary (Animated Pie Chart)</h4>
        <Pie data={pieData} options={pieOptions} />
      </div>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default StudentDetail;