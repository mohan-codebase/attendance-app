import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import api from '../api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Modal as BsModal, Button, Badge } from 'react-bootstrap';
import NotificationModal from './Modal';
import '../css/Calendar.css';

const localizer = momentLocalizer(moment);

// react-big-calendar needs `id` and real Date objects, but the API speaks
// `_id` and ISO strings. Every path that puts an event into state goes through
// here so a created or edited event can't land in a different shape than a
// fetched one.
const toCalendarEvent = (event) => ({
  ...event,
  id: event._id,
  start: new Date(event.start),
  end: new Date(event.end),
});

const Calendar = () => {
  // State declarations
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: null,
    end: null,
    slot: '',
    batch: '',
    course: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsResponse = await api.get('/api/events');
        const formattedEvents = eventsResponse.data.map(toCalendarEvent);
        setEvents(formattedEvents);

        // Fetch batches and courses
        const admissionsResponse = await api.get('/api/admissions');
        const admissionsData = admissionsResponse.data;
        const uniqueBatches = [...new Set(admissionsData.map(item => item.batch))].filter(Boolean);
        const uniqueCourses = [...new Set(admissionsData.map(item => item.course))].filter(Boolean);
        setBatches(uniqueBatches);
        setCourses(uniqueCourses);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Event handlers
  const handleAddEvent = async (e) => {
    e.preventDefault();
    // Immediately close the form modal
    setShowForm(false);
    // Create a temporary event for immediate UI update (optimistic update)
    const tempEvent = {
      ...newEvent,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
      id: Date.now() // temporary unique id
    };
    setEvents(prev => [...prev, tempEvent]);
    showSuccess('Event created successfully!');

    try {
      const response = await api.post('/api/events', newEvent);
      // The create endpoint wraps the document as { message, event }.
      const createdEvent = toCalendarEvent(response.data.event);
      // Replace temporary event with the actual event data
      setEvents(prev => prev.map(event => event.id === tempEvent.id ? createdEvent : event));
      resetForm();
    } catch (error) {
      console.error('Error creating event:', error);
      // Remove the temporary event if the API call fails
      setEvents(prev => prev.filter(event => event.id !== tempEvent.id));
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    setShowForm(false);
    try {
      const response = await api.put(`/api/events/${editEvent.id}`, newEvent);
      const updatedEvent = toCalendarEvent(response.data);
      setEvents(events.map(event => event.id === updatedEvent.id ? updatedEvent : event));
      resetForm();
      showSuccess('Event updated successfully!');
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await api.delete(`/api/events/${id}`);
      setEvents(events.filter(event => event.id !== id));
      showSuccess('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Helper functions
  const resetForm = () => {
    setNewEvent({
      title: '',
      start: null,
      end: null,
      slot: '',
      batch: '',
      course: ''
    });
    setEditEvent(null);
    setShowForm(false);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowModel(true);
  };

  const handleEditClick = (event) => {
    setEditEvent(event);
    setNewEvent({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    });
    setShowForm(true);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const batchMatch = selectedBatch === 'All' || event.batch === selectedBatch;
    const courseMatch = selectedCourse === 'All' || event.course === selectedCourse;
    return batchMatch && courseMatch;
  });

  // Calendar configuration
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.course === 'Math' ? '#4CAF50' :
        event.course === 'Science' ? '#2196F3' : '#9C27B0',
      borderRadius: '4px',
      color: 'white',
      border: 'none'
    }
  });

  const CustomToolbar = ({ label, onNavigate, onView, view }) => (
    <div className="cal-toolbar mb-3">
      <div className="d-flex align-items-center gap-2">
        <Button variant="outline-secondary button-color" onClick={() => onNavigate('PREV')}>
          <i className="bi bi-chevron-left"></i>
        </Button>
        <h5 className="cal-toolbar-label">{label}</h5>
        <Button variant="outline-secondary button-color" onClick={() => onNavigate('NEXT')}>
          <i className="bi bi-chevron-right"></i>
        </Button>
      </div>
      <div className="d-flex gap-2">
        <Button className='button-color' variant={view === 'month' ? '' : ''} onClick={() => onView('month')}>
          Month
        </Button>
        <Button className='button-color' variant={view === 'week' ? '' : ''} onClick={() => onView('week')}>
          Week
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mt-3 mt-md-4">
      <div className="card shadow">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h2 className="cal-title mb-0">Academic Calendar</h2>
          <Button className='button-color' variant="" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-2"></i>Add Event
          </Button>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-people"></i>
                </span>
                <select className="form-select" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                  <option value="All">All Batches</option>
                  {batches.map((batch, index) => (
                    <option key={index} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-book"></i>
                </span>
                <select className="form-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                  <option value="All">All Courses</option>
                  {courses.map((course, index) => (
                    <option key={index} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="cal-shell mb-4">
            <BigCalendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              components={{ toolbar: CustomToolbar }}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week']}
            />
          </div>

          {/* Upcoming Events */}
          <h4 className="mb-3">Upcoming Events</h4>
          <div className="row g-3">
            {filteredEvents.map(event => (
              <div className="col-12 col-lg-6" key={event.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="cal-event-head">
                      <div>
                        <h5 className="card-title">{event.title}</h5>
                        <div className="text-muted small mb-2">
                          <i className="bi bi-clock me-1"></i>
                          {moment(event.start).format('MMM Do, h:mm a')} - {moment(event.end).format('h:mm a')}
                        </div>
                        <div className="cal-event-badges">
                          <Badge bg="primary">{event.batch}</Badge>
                          <Badge bg="success">{event.course}</Badge>
                          <Badge bg="secondary">{event.slot}</Badge>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="outline-warning" size="sm" onClick={() => handleEditClick(event)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      <BsModal show={showForm} onHide={() => { setShowForm(false); setEditEvent(null); }} centered>
        <BsModal.Header closeButton>
          <BsModal.Title>{editEvent ? 'Edit Event' : 'New Event'}</BsModal.Title>
        </BsModal.Header>
        <BsModal.Body>
          <form onSubmit={editEvent ? handleEditEvent : handleAddEvent}>
            <div className="mb-3">
              <label>Event Title</label>
              <input
                type="text"
                className="form-control"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label>Start Date/Time</label>
                <DatePicker
                  selected={newEvent.start}
                  onChange={(date) => setNewEvent({ ...newEvent, start: date })}
                  showTimeSelect
                  dateFormat="Pp"
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6">
                <label>End Date/Time</label>
                <DatePicker
                  selected={newEvent.end}
                  onChange={(date) => setNewEvent({ ...newEvent, end: date })}
                  showTimeSelect
                  dateFormat="Pp"
                  className="form-control"
                  required
                />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label>Slot</label>
                <input
                  type="text"
                  className="form-control"
                  value={newEvent.slot}
                  onChange={(e) => setNewEvent({ ...newEvent, slot: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label>Batch</label>
                <select
                  className="form-select"
                  value={newEvent.batch}
                  onChange={(e) => setNewEvent({ ...newEvent, batch: e.target.value })}
                  required
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch, index) => (
                    <option key={index} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label>Course</label>
              <select
                className="form-select"
                value={newEvent.course}
                onChange={(e) => setNewEvent({ ...newEvent, course: e.target.value })}
                required
              >
                <option value="">Select Course</option>
                {courses.map((course, index) => (
                  <option key={index} value={course}>{course}</option>
                ))}
              </select>
            </div>
            <div className="d-grid gap-2">
              <Button variant="primary" type="submit">
                {editEvent ? 'Update Event' : 'Create Event'}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </BsModal.Body>
      </BsModal>

      {/* Success notification popup */}
      <NotificationModal 
        show={showModel} 
        message={successMessage} 
        onClose={() => setShowModel(false)} 
        duration={1000}
      />
    </div>
  );
};

export default Calendar;