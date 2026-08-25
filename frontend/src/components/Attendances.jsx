import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, Bell, UserRound, CircleUserRound, Calendar } from 'lucide-react';
import { STATUSES, resolveDay } from '../constants/attendance';
import '../css/Attendance.css';

const ALL = 'All';

const Attendances = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [course, setCourse] = useState(ALL);
  const [batch, setBatch] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [slot, setSlot] = useState(ALL);
  const [query, setQuery] = useState('');

  // Marks are staged locally and written once the user presses Submit.
  const [marks, setMarks] = useState({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/api/admissions');
        setStudents(response.data);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Error fetching students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Load whatever is already recorded for the chosen day so the row buttons
  // show the existing state instead of looking unmarked.
  useEffect(() => {
    const fetchForDate = async () => {
      try {
        const response = await api.get('/api/attendance');
        const key = moment(selectedDate).format('YYYY-MM-DD');
        const forDay = response.data.filter(
          (record) => moment(record.date).format('YYYY-MM-DD') === key
        );
        setMarks(resolveDay(forDay));
      } catch (err) {
        console.error('Error fetching attendance:', err);
      }
    };
    fetchForDate();
  }, [selectedDate]);

  const options = useMemo(() => {
    const uniq = (values) => Array.from(new Set(values.filter(Boolean)));
    return {
      courses: uniq(students.map((s) => s.course)),
      batches: uniq(students.map((s) => s.batch)),
      years: uniq(students.map((s) => s.date && moment(s.date).format('YYYY'))).sort().reverse(),
      slots: uniq(students.map((s) => s.preferredSlot)),
    };
  }, [students]);

  const filtered = useMemo(
    () =>
      students.filter((student) => {
        if (course !== ALL && student.course !== course) return false;
        if (batch !== ALL && student.batch !== batch) return false;
        if (slot !== ALL && student.preferredSlot !== slot) return false;
        if (year !== ALL && moment(student.date).format('YYYY') !== year) return false;
        if (query && !(student.name || '').toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [students, course, batch, slot, year, query]
  );

  const setMark = (studentId, status) =>
    setMarks((prev) => ({ ...prev, [studentId]: prev[studentId] === status ? undefined : status }));

  const markedCount = filtered.filter((s) => marks[s._id]).length;

  const handleSubmit = async () => {
    const entries = filtered
      .map((student) => [student._id, marks[student._id]])
      .filter(([, status]) => status);

    if (!entries.length) {
      setMessage('Mark at least one student before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(
        entries.map(([studentId, status]) =>
          api.post('/api/attendance', { studentId, date: selectedDate, status })
        )
      );
      setMessage(
        `Attendance submitted for ${entries.length} student${entries.length > 1 ? 's' : ''} on ${moment(
          selectedDate
        ).format('D MMM YYYY')}.`
      );
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setMessage('Error submitting attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filterSelect = (value, onChange, placeholder, list) => (
    <select className="att-filter" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value={ALL}>{placeholder}</option>
      {list.map((item) => (
        <option key={item} value={item}>{item}</option>
      ))}
    </select>
  );

  if (loading) return <div className="att-state">Loading students…</div>;
  if (error) return <div className="att-state att-state--error">{error}</div>;

  return (
    <div className="att">
      <header className="att-header">
        <div className="att-title">
          <UserRound size={20} strokeWidth={1.75} />
          <h1>Attendances</h1>
        </div>

        <div className="att-header-actions">
          <div className="att-search">
            <Search size={16} strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search students"
            />
          </div>
          <button className="att-bell" type="button" aria-label="Notifications">
            <Bell size={20} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="att-filters">
        {filterSelect(course, setCourse, 'Courses', options.courses)}
        {filterSelect(batch, setBatch, 'Batches', options.batches)}
        {filterSelect(year, setYear, 'Year', options.years)}
        {filterSelect(slot, setSlot, 'Time', options.slots)}

        <div className="att-date">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            showTimeSelect
            dateFormat="d MMM yyyy – h:mm aa"
            className="att-date-input"
            wrapperClassName="att-date-wrapper"
          />
          <Calendar size={17} strokeWidth={1.75} />
        </div>
      </div>

      <div className="att-listhead">
        <h2 className="att-listtitle">Student lists</h2>
        {filtered.length > 0 && (
          <span className="att-progress">{markedCount} of {filtered.length} marked</span>
        )}
      </div>

      {message && <p className="att-message">{message}</p>}

      {filtered.length === 0 ? (
        <p className="att-empty">No students match the current filters.</p>
      ) : (
        <ul className="att-list">
          {filtered.map((student) => (
            <li className="att-row" key={student._id}>
              <div className="att-student">
                <CircleUserRound size={26} strokeWidth={1.5} className="att-avatar" />
                <span className="att-name">{student.name}</span>
              </div>

              <div
                className={`att-actions ${marks[student._id] ? 'has-choice' : ''}`}
                role="group"
                aria-label={`Attendance for ${student.name}`}
              >
                {STATUSES.map(({ value, short, label }) => (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    aria-pressed={marks[student._id] === value}
                    className={`att-btn att-btn--${value.toLowerCase()} ${
                      marks[student._id] === value ? 'is-active' : ''
                    }`}
                    onClick={() => setMark(student._id, value)}
                  >
                    {short}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > 0 && (
        <div className="att-footer">
          <button className="att-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Attendances;
