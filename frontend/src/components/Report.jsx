import React, { useState, useEffect, useMemo } from 'react';
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
import { ChevronLeft, ChevronRight, Pencil, X, Download } from 'lucide-react';
import { ABSENT, resolveDay, isAttended } from '../constants/attendance';
import { centerLabel } from '../utils/chartPlugins';
import Preloader from './Preloader';
import '../css/Report.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const ALL = 'All';
const PURPLE = '#a45ee5';

const useThemeName = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute('data-theme') || 'light')
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
};

// Present/absent day counts for a set of students over a set of records.
const tally = (records, studentIds) => {
  const byDate = records.reduce((acc, record) => {
    const key = moment(record.date).format('YYYY-MM-DD');
    (acc[key] = acc[key] || []).push(record);
    return acc;
  }, {});

  let present = 0;
  let absent = 0;
  const perStudent = {};

  Object.values(byDate).forEach((dayRecords) => {
    Object.entries(resolveDay(dayRecords)).forEach(([id, status]) => {
      if (studentIds && !studentIds.has(id)) return;
      if (!perStudent[id]) perStudent[id] = { present: 0, absent: 0 };
      if (isAttended(status)) {
        present += 1;
        perStudent[id].present += 1;
      } else if (status === ABSENT) {
        absent += 1;
        perStudent[id].absent += 1;
      }
    });
  });

  return { present, absent, perStudent };
};

// One course card: its own month stepper, doughnut and legend.
const CourseCard = ({ course, students, attendance, track, centerColor }) => {
  const [offset, setOffset] = useState(0);
  const month = useMemo(() => moment().add(offset, 'month'), [offset]);

  const stats = useMemo(() => {
    const ids = new Set(students.map((s) => s._id));
    const inMonth = attendance.filter(
      (r) => r.studentId && moment(r.date).isSame(month, 'month')
    );
    const { present, absent } = tally(inMonth, ids);
    const total = present + absent;
    return {
      present,
      absent,
      total,
      presentPct: total ? Math.round((present / total) * 100) : 0,
      absentPct: total ? Math.round((absent / total) * 100) : 0,
    };
  }, [students, attendance, month]);

  const data = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: stats.total ? [stats.presentPct, stats.absentPct] : [0, 100],
        backgroundColor: [PURPLE, track],
        borderWidth: 0,
        borderRadius: 12,
        cutout: '76%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: -20,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: stats.total > 0 },
      centerLabel: { text: 'Total : 100%', color: centerColor },
    },
  };

  return (
    <article className="rep-card">
      <header className="rep-card-month">
        <button type="button" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month">
          <ChevronLeft size={17} />
        </button>
        <span>{month.format('MMMM YYYY')}</span>
        <button type="button" onClick={() => setOffset((o) => o + 1)} aria-label="Next month">
          <ChevronRight size={17} />
        </button>
      </header>

      <h3 className="rep-card-title" title={course}>{course}</h3>

      <div className="rep-card-donut">
        <Doughnut data={data} options={options} plugins={[centerLabel]} />
      </div>

      <ul className="rep-card-legend">
        <li>
          <span className="rep-dot rep-dot--present" />
          Present <strong>{stats.presentPct}%</strong>
        </li>
        <li>
          <span className="rep-dot rep-dot--absent" />
          Absent <strong>{stats.absentPct}%</strong>
        </li>
      </ul>
    </article>
  );
};

const Report = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Draft filters vs. the ones the table is actually showing — the table only
  // changes when "Generate Report" is pressed, as designed.
  const [draft, setDraft] = useState({ course: ALL, batch: ALL, month: ALL, mode: ALL });
  const [applied, setApplied] = useState({ course: ALL, batch: ALL, month: ALL, mode: ALL });

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ batch: '', modeOfLearning: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const theme = useThemeName();
  const isDark = theme === 'dark';
  const track = isDark ? '#3f434a' : '#dcdde1';
  const centerColor = isDark ? '#ffffff' : '#33353a';
  const axisColor = isDark ? '#a8aeb5' : '#8b909a';

  const load = async () => {
    try {
      const [studentsRes, attendanceRes] = await Promise.allSettled([
        api.get('/api/admissions'),
        api.get('/api/attendance'),
      ]);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data);
      else setError('Error fetching students');
      if (attendanceRes.status === 'fulfilled') setAttendance(attendanceRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const options = useMemo(() => {
    const uniq = (values) => Array.from(new Set(values.filter(Boolean)));
    return {
      courses: uniq(students.map((s) => s.course)),
      batches: uniq(students.map((s) => s.batch)),
      modes: uniq(students.map((s) => s.modeOfLearning)),
      months: Array.from({ length: 12 }, (_, i) =>
        moment().subtract(i, 'month').format('MMM YYYY')
      ),
    };
  }, [students]);

  // Cards: one per course that has students.
  const courseGroups = useMemo(() => {
    const groups = students.reduce((acc, student) => {
      const key = student.course || 'Unassigned';
      (acc[key] = acc[key] || []).push(student);
      return acc;
    }, {});
    return Object.entries(groups).map(([course, list]) => ({ course, students: list }));
  }, [students]);

  // Table rows for the applied filters.
  const rows = useMemo(() => {
    const matching = students.filter((student) => {
      if (applied.course !== ALL && student.course !== applied.course) return false;
      if (applied.batch !== ALL && student.batch !== applied.batch) return false;
      if (applied.mode !== ALL && student.modeOfLearning !== applied.mode) return false;
      return true;
    });

    const scoped =
      applied.month === ALL
        ? attendance
        : attendance.filter((r) => moment(r.date).format('MMM YYYY') === applied.month);

    const ids = new Set(matching.map((s) => s._id));
    const { perStudent } = tally(scoped, ids);

    return matching.map((student) => ({
      ...student,
      present: perStudent[student._id]?.present || 0,
      absent: perStudent[student._id]?.absent || 0,
    }));
  }, [students, attendance, applied]);

  // Right-hand chart: attendance rate per month for the applied course.
  const overall = useMemo(() => {
    const scopedStudents =
      applied.course === ALL ? students : students.filter((s) => s.course === applied.course);
    const ids = new Set(scopedStudents.map((s) => s._id));

    return Array.from({ length: 6 }, (_, i) => {
      const month = moment().subtract(5 - i, 'month');
      const inMonth = attendance.filter((r) => moment(r.date).isSame(month, 'month'));
      const { present, absent } = tally(inMonth, ids);
      const total = present + absent;
      return { label: month.format('MMM'), pct: total ? Math.round((present / total) * 100) : 0 };
    });
  }, [students, attendance, applied.course]);

  const reportTitle = applied.course === ALL ? 'All courses' : applied.course;

  // CSV export of exactly what the table is showing.
  const exportCSV = () => {
    const headers = ['#', 'Student name', 'Batch', 'Mode', 'Total Present Day', 'Total Absence Day'];
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [
      headers.join(','),
      ...rows.map((student, index) =>
        [
          index + 1,
          escape(student.name),
          escape(student.batch),
          escape(student.modeOfLearning),
          student.present,
          student.absent,
        ].join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_report_${reportTitle.replace(/\W+/g, '_')}_${moment().format(
      'YYYY-MM-DD'
    )}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openEdit = (student) => {
    setEditing(student);
    setEditForm({ batch: student.batch || '', modeOfLearning: student.modeOfLearning || '' });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/admissions/${editing._id}`, { ...editing, ...editForm });
      setStudents((prev) =>
        prev.map((s) => (s._id === editing._id ? { ...s, ...editForm } : s))
      );
      setNotice(`Updated ${editing.name}.`);
      setEditing(null);
    } catch (err) {
      console.error('Error updating student:', err);
      setNotice('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const barData = {
    labels: overall.map((m) => m.label),
    datasets: [
      {
        data: overall.map((m) => m.pct),
        backgroundColor: PURPLE,
        borderRadius: 5,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.75,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}% present` } },
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
        grid: { color: isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)' },
        border: { display: false },
        ticks: {
          stepSize: 50,
          color: axisColor,
          font: { size: 10 },
          callback: (v) => `${v}%`,
        },
      },
    },
  };

  const filterSelect = (key, label, list) => (
    <label className="rep-filter">
      <span className="rep-filter-label">{label}</span>
      <select
        className="rep-filter-select"
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      >
        <option value={ALL}>All</option>
        {list.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  );

  if (loading) {
    return (
      <Preloader
        message="Generating Performance Report…"
        subMessage="Calculating attendance percentages and aggregate student metrics…"
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }
  if (error) return <div className="rep-state rep-state--error">{error}</div>;

  return (
    <div className="rep">
      <h1 className="rep-heading">Student Performance</h1>

      {/* Per-course summary cards */}
      {courseGroups.length > 0 && (
        <div className="rep-cards">
          {courseGroups.map(({ course, students: list }) => (
            <CourseCard
              key={course}
              course={course}
              students={list}
              attendance={attendance}
              track={track}
              centerColor={centerColor}
            />
          ))}
        </div>
      )}

      <div className="rep-main">
        <div className="rep-left">
          {/* Filters */}
          <div className="rep-filters">
            {filterSelect('course', 'Course', options.courses)}
            {filterSelect('batch', 'Batch', options.batches)}
            {filterSelect('month', 'Year', options.months)}
            {filterSelect('mode', 'Mode', options.modes)}
            <button className="rep-generate" onClick={() => setApplied(draft)}>
              Generate Report
            </button>
          </div>

          {/* Table */}
          <div className="rep-table-card">
            <div className="rep-table-head">
              <h2 className="rep-table-title">{reportTitle} Report</h2>
              <button className="rep-export" onClick={exportCSV} disabled={!rows.length}>
                <Download size={15} strokeWidth={1.75} />
                Export CSV
              </button>
            </div>
            {notice && <p className="rep-notice">{notice}</p>}

            <div className="rep-table-scroll">
              <table className="rep-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student name</th>
                    <th>Batch</th>
                    <th>Mode</th>
                    <th>Total Present Day</th>
                    <th>Total Absence Day</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((student, index) => (
                      <tr key={student._id}>
                        <td>{index + 1}</td>
                        <td>{student.name}</td>
                        <td>{student.batch || '—'}</td>
                        <td className="rep-mode">{student.modeOfLearning || '—'}</td>
                        <td>{student.present}</td>
                        <td>{student.absent}</td>
                        <td>
                          <button
                            className="rep-edit"
                            onClick={() => openEdit(student)}
                            aria-label={`Edit ${student.name}`}
                          >
                            <Pencil size={16} strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="rep-table-empty">
                        No students match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Overall performance */}
        <aside className="rep-side">
          <h2 className="rep-side-title">{reportTitle}</h2>
          <div className="rep-side-chart">
            <Bar data={barData} options={barOptions} />
          </div>
          <p className="rep-side-caption">Overall Performance</p>
        </aside>
      </div>

      {/* Edit dialog */}
      {editing && (
        <div className="rep-modal-backdrop" onClick={() => setEditing(null)}>
          <form
            className="rep-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEdit}
          >
            <header className="rep-modal-head">
              <h3>Edit {editing.name}</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close">
                <X size={18} />
              </button>
            </header>

            <label className="rep-modal-field">
              <span>Batch</span>
              <select
                value={editForm.batch}
                onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
              >
                <option value="">Select batch</option>
                {options.batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>

            <label className="rep-modal-field">
              <span>Mode</span>
              <select
                value={editForm.modeOfLearning}
                onChange={(e) => setEditForm({ ...editForm, modeOfLearning: e.target.value })}
              >
                <option value="">Select mode</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </label>

            <button type="submit" className="rep-modal-save" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Report;
