import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import moment from 'moment';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Search, House, Plus, BookOpen } from 'lucide-react';
import { COURSES } from '../constants/courses';
import { ABSENT, resolveDay, isAttended } from '../constants/attendance';
import { centerLabel } from '../utils/chartPlugins';
import AdmissionModal from './AdmissionModal';
import Preloader from './Preloader';
import '../css/Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Charts paint to canvas, so they need the resolved theme rather than a CSS var.
const useThemeName = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute('data-theme') || 'light')
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  const theme = useThemeName();
  const isDark = theme === 'dark';

  const purple = '#a45ee5';
  const track = isDark ? '#3f434a' : '#dcdde1';
  const axisColor = isDark ? '#a8aeb5' : '#8b909a';
  const centerColor = isDark ? '#ffffff' : '#33353a';

  const loadData = useCallback(async () => {
    try {
      const [admissionsRes, eventsRes, attendanceRes] = await Promise.allSettled([
        api.get('/api/admissions'),
        api.get('/api/events'),
        api.get('/api/attendance'),
      ]);

      if (admissionsRes.status === 'fulfilled') {
        setAdmissions(admissionsRes.value.data);
      } else {
        setError('Error fetching admissions data');
      }
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
      if (attendanceRes.status === 'fulfilled') setAttendance(attendanceRes.value.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal if redirected with ?openAdmission=true query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openAdmission') === 'true') {
      setShowAdmissionModal(true);
      // Clean query parameter from URL without page reload
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate]);

  // Global event listener to open admission modal or reload on addition
  useEffect(() => {
    const handleOpenModal = () => setShowAdmissionModal(true);
    const handleAdmissionAdded = () => loadData();

    window.addEventListener('open-add-admission', handleOpenModal);
    window.addEventListener('admission-added', handleAdmissionAdded);

    return () => {
      window.removeEventListener('open-add-admission', handleOpenModal);
      window.removeEventListener('admission-added', handleAdmissionAdded);
    };
  }, [loadData]);

  // --- Course cards -------------------------------------------------------
  const courseCounts = useMemo(() => {
    const grouped = admissions.reduce((acc, admission) => {
      const course = admission.course || 'Unassigned';
      acc[course] = (acc[course] || 0) + 1;
      return acc;
    }, {});

    const offered = COURSES.map((course) => ({ course, count: grouped[course] || 0 }));
    const extras = Object.keys(grouped)
      .filter((course) => !COURSES.includes(course))
      .map((course) => ({ course, count: grouped[course] }));

    const all = [...offered, ...extras];
    return [...all.filter((c) => c.count > 0), ...all.filter((c) => c.count === 0)];
  }, [admissions]);

  // --- Day wise summary ---------------------------------------------------
  const dayWise = useMemo(() => {
    const today = moment().format('YYYY-MM-DD');
    const todays = attendance.filter(
      (record) => moment(record.date).format('YYYY-MM-DD') === today
    );
    const statuses = Object.values(resolveDay(todays));
    const present = statuses.filter(isAttended).length;
    const absent = statuses.filter((s) => s === ABSENT).length;
    const total = present + absent;

    return {
      present,
      absent,
      total,
      presentPct: total ? Math.round((present / total) * 100) : 0,
      absentPct: total ? Math.round((absent / total) * 100) : 0,
    };
  }, [attendance]);

  // --- Weekly summary -----------------------------------------------------
  const weekly = useMemo(() => {
    const startOfWeek = moment().startOf('isoWeek');

    return Array.from({ length: 7 }, (_, i) => {
      const day = startOfWeek.clone().add(i, 'day');
      const key = day.format('YYYY-MM-DD');
      const records = attendance.filter(
        (record) => moment(record.date).format('YYYY-MM-DD') === key
      );
      const statuses = Object.values(resolveDay(records));
      const present = statuses.filter(isAttended).length;
      const total = statuses.length;

      return {
        label: day.format('dd').charAt(0),
        pct: total ? Math.round((present / total) * 100) : 0,
        hasData: total > 0,
      };
    });
  }, [attendance]);

  // --- Upcoming classes ---------------------------------------------------
  const upcoming = useMemo(() => {
    const now = moment();
    return events
      .filter((event) => event.start && moment(event.start).isSameOrAfter(now, 'day'))
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 6)
      .map((event) => ({
        id: event._id,
        label: `${moment(event.start).format('MMMM h A')} ${event.title || event.course || 'Class'}`,
      }));
  }, [events]);

  // --- Top students -------------------------------------------------------
  const topStudents = useMemo(() => {
    const byDate = attendance.reduce((acc, record) => {
      const key = moment(record.date).format('YYYY-MM-DD');
      (acc[key] = acc[key] || []).push(record);
      return acc;
    }, {});

    const tally = {};
    Object.values(byDate).forEach((records) => {
      Object.entries(resolveDay(records)).forEach(([id, status]) => {
        if (!tally[id]) tally[id] = { present: 0, total: 0 };
        tally[id].total += 1;
        if (isAttended(status)) tally[id].present += 1;
      });
    });

    return admissions
      .map((student) => {
        const counts = tally[student._id];
        return {
          id: student._id,
          name: student.name,
          course: student.course,
          batch: student.batch,
          pct: counts && counts.total ? Math.round((counts.present / counts.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct || (a.name || '').localeCompare(b.name || ''))
      .slice(0, 5);
  }, [attendance, admissions]);

  const filteredAdmissions = useMemo(
    () =>
      admissions.filter((admission) =>
        (admission.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [admissions, searchTerm]
  );

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: dayWise.total ? [dayWise.presentPct, dayWise.absentPct] : [0, 100],
        backgroundColor: [purple, track],
        borderWidth: 0,
        borderRadius: 12,
        cutout: '76%',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: -20,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: dayWise.total > 0 },
      centerLabel: { text: 'Total : 100%', color: centerColor },
    },
  };

  const barData = {
    labels: weekly.map((d) => d.label),
    datasets: [
      {
        data: weekly.map((d) => d.pct),
        backgroundColor: weekly.map((d) => (d.hasData ? purple : track)),
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.45,
        categoryPercentage: 0.7,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.y}% present` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: axisColor, font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { display: false },
        border: { display: false },
        ticks: {
          stepSize: 20,
          color: axisColor,
          font: { size: 10 },
          padding: 6,
          callback: (value) => (value === 0 ? '' : `○ ${value}%`),
        },
      },
    },
  };

  if (loading) {
    return (
      <Preloader
        message="Loading Dashboard…"
        subMessage="Fetching student enrollment, batch schedules, and attendance metrics…"
        onRetry={() => {
          setLoading(true);
          loadData();
        }}
      />
    );
  }

  if (selectedStudent) {
    return (
      <div className="dash">
        <button className="dash-back" onClick={() => setSelectedStudent(null)}>
          ← Back to Dashboard
        </button>
        <div className="dash-panel">
          <h3 className="dash-panel-title">{selectedStudent.name}</h3>
          <ul className="dash-detail-list">
            {Object.keys(selectedStudent)
              .filter((key) => !['__v', 'id', '_id'].includes(key))
              .map((key) => (
                <li key={key}>
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <strong>{String(selectedStudent[key])}</strong>
                </li>
              ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-title">
          <House size={20} strokeWidth={1.75} />
          <h1>Dashboard</h1>
        </div>

        <div className="dash-header-actions">
          <div className="dash-search">
            <Search size={16} strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search student name"
            />
          </div>

          <button
            className="dash-add-btn"
            type="button"
            onClick={() => setShowAdmissionModal(true)}
            title="Add Admission"
          >
            <Plus size={16} strokeWidth={2.2} />
            <span>Add Admission</span>
          </button>
        </div>
      </header>

      {error && <div className="dash-error">{error}</div>}

      {/* Search results */}
      {searchTerm && (
        <section className="dash-search-results">
          <h2 className="dash-section-title">Search results</h2>
          {filteredAdmissions.length ? (
            <div className="dash-result-grid">
              {filteredAdmissions.map((admission) => (
                <button
                  key={admission._id}
                  className="dash-result-card"
                  onClick={() => setSelectedStudent(admission)}
                >
                  <strong>{admission.name}</strong>
                  <span>{admission.course}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="dash-empty">No results found.</p>
          )}
        </section>
      )}

      {/* Hero: course counts */}
      <section className="dash-hero">
        <div className="dash-hero-header">
          <div className="dash-hero-copy">
            <h2>Our courses</h2>
            <p>Number of student in each courses</p>
          </div>
          <Link
            to="/courses"
            className="dash-hero-action-btn"
            title="View all courses"
          >
            <BookOpen size={16} strokeWidth={1.8} />
            <span>All courses</span>
          </Link>
        </div>

        <div className="dash-course-row">
          {courseCounts.map(({ course, count }) => (
            <article className="dash-course-card" key={course}>
              <h3 title={course}>{course}</h3>
              <p>
                <span className="dash-course-count">{count}</span> Students
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Three summary panels */}
      <section className="dash-panels">
        <article className="dash-panel">
          <h2 className="dash-panel-title">Day wise summary</h2>
          <div className="dash-donut-row">
            <div className="dash-donut">
              <Doughnut data={doughnutData} options={doughnutOptions} plugins={[centerLabel]} />
            </div>
            <ul className="dash-legend">
              <li>
                <span className="dash-dot dash-dot--present" />
                <div>
                  <strong>{dayWise.presentPct}%</strong>
                  <span>Present</span>
                </div>
              </li>
              <li>
                <span className="dash-dot dash-dot--absent" />
                <div>
                  <strong>{dayWise.absentPct}%</strong>
                  <span>Absent</span>
                </div>
              </li>
            </ul>
          </div>
          {!dayWise.total && <p className="dash-empty">No attendance marked today.</p>}
        </article>

        <article className="dash-panel">
          <h2 className="dash-panel-title">Weekly summary</h2>
          <div className="dash-bars">
            <Bar data={barData} options={barOptions} />
          </div>
        </article>

        <article className="dash-panel">
          <h2 className="dash-panel-title">Upcoming class</h2>
          {upcoming.length ? (
            <ul className="dash-upcoming">
              {upcoming.map((item) => (
                <li key={item.id}>
                  <span className="dash-ring" />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-empty">No classes scheduled yet.</p>
          )}
        </article>
      </section>

      {/* Top students */}
      <section className="dash-top">
        <header className="dash-top-header">
          <h2>Top students</h2>
        </header>

        <div className="dash-table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="dash-col-no">No</th>
                <th>Student name</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.length ? (
                topStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td className="dash-col-no">{String(index + 1).padStart(2, '0')}</td>
                    <td>{student.name}</td>
                    <td>{student.course || '—'}</td>
                    <td>{student.batch || '—'}</td>
                    <td>
                      <span className={`dash-pct ${
                        student.pct >= 75 ? 'is-high' : student.pct >= 50 ? 'is-mid' : 'is-low'
                      }`}>
                        {student.pct}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="dash-table-empty">
                    No students enrolled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admission modal */}
      <AdmissionModal
        show={showAdmissionModal}
        onHide={() => setShowAdmissionModal(false)}
        onAdmissionAdded={loadData}
      />
    </div>
  );
};

export default Dashboard;
