import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';
import StudyHoursNotification from './StudyHoursNotification';
import NudgeManager from '../utils/NudgeManager';

// Initialize with some test exam events (without study hours)
const initialEvents = [
  {
    id: '1',
    title: 'CS1060 Final Exam',
    type: 'exam',
    start: addDays(new Date(), 7).toISOString().split('T')[0] + 'T14:00:00',
    end: addDays(new Date(), 7).toISOString().split('T')[0] + 'T16:00:00',
    description: 'Computer Science Final Examination',
    allDay: false
  },
  {
    id: '2',
    title: 'MATH2200 Midterm',
    type: 'exam',
    start: addDays(new Date(), 10).toISOString().split('T')[0] + 'T10:00:00',
    end: addDays(new Date(), 10).toISOString().split('T')[0] + 'T12:00:00',
    description: 'Linear Algebra Midterm',
    allDay: false
  }
];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nudgeManager] = useState(() => new NudgeManager());
  const [examsNeedingHours, setExamsNeedingHours] = useState([]);

  useEffect(() => {
    const checkExams = () => {
      const now = new Date();
      const exams = nudgeManager.getExamsNeedingAttention(events, now);
      console.log('Checking exams:', { events, examsNeedingAttention: exams }); // Debug log
      setExamsNeedingHours(exams);
    };

    // Clear any existing study hours from localStorage
    localStorage.removeItem('nudgeManager');
    
    // Initial check
    checkExams();
    
    // Set up periodic checks every minute
    const interval = setInterval(checkExams, 60000);
    return () => clearInterval(interval);
  }, [events, nudgeManager]);

  const nextHandler = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const prevHandler = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const todayHandler = () => {
    setCurrentDate(new Date());
  };

  const addEventHandler = (date = currentDate) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const saveEvent = (eventData) => {
    const { id: _, ...cleanEventData } = eventData;
    
    if (selectedEvent) {
      const updatedEvents = events.map(event => 
        event.id === selectedEvent.id ? { 
          ...event, 
          ...cleanEventData,
          // Keep existing study hours if not being updated
          studyHours: cleanEventData.studyHours !== undefined ? cleanEventData.studyHours : event.studyHours,
          start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
          end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`,
          type: cleanEventData.type || event.type // Ensure type property is present
        } : event
      );
      setEvents(updatedEvents);

      // Update NudgeManager if study hours were set
      if (cleanEventData.studyHours !== undefined) {
        nudgeManager.setStudyHours(selectedEvent.id, cleanEventData.studyHours);
      }
    } else {
      const newEvent = {
        id: Date.now().toString(),
        ...cleanEventData,
        start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
        end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`,
        type: cleanEventData.type || 'event' // Ensure type property is present
      };
      setEvents([...events, newEvent]);

      // Set study hours in NudgeManager if provided for new exam
      if (newEvent.type === 'exam' && cleanEventData.studyHours !== undefined) {
        nudgeManager.setStudyHours(newEvent.id, cleanEventData.studyHours);
      }
    }
    closeModal();
  };

  const deleteEvent = (id) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    closeModal();
  };

  const editEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleSetStudyHours = (examId, hours) => {
    nudgeManager.setStudyHours(examId, hours);
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === examId
          ? { ...event, studyHours: hours }
          : event
      )
    );
    setExamsNeedingHours(prevExams => 
      prevExams.filter(exam => exam.id !== examId)
    );
  };

  const handleDismissExam = (examId) => {
    const now = new Date();
    nudgeManager.dismissExam(examId, now);
    setExamsNeedingHours(prevExams => 
      prevExams.filter(exam => exam.id !== examId)
    );
  };

  const renderView = () => {
    switch (view) {
      case 'month':
        return (
          <MonthView 
            currentDate={currentDate} 
            events={events} 
            onAddEvent={addEventHandler}
            onEditEvent={editEvent}
          />
        );
      case 'week':
        return (
          <WeekView 
            currentDate={currentDate} 
            events={events} 
            onAddEvent={addEventHandler}
            onEditEvent={editEvent}
          />
        );
      case 'day':
        return (
          <DayView 
            currentDate={currentDate} 
            events={events} 
            onAddEvent={addEventHandler}
            onEditEvent={editEvent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-title">
          {view === 'month' && format(currentDate, 'MMMM yyyy')}
          {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
          {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
        </div>
        <div className="calendar-nav">
          <div className="view-selector">
            <button 
              className={`view-button ${view === 'day' ? 'active' : ''}`}
              onClick={() => setView('day')}
            >
              Day
            </button>
            <button 
              className={`view-button ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button 
              className={`view-button ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
          </div>

          <button className="nav-button" onClick={prevHandler}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="today-button" onClick={todayHandler}>
            Today
          </button>
          <button className="nav-button" onClick={nextHandler}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          <button className="add-event-button" onClick={() => addEventHandler()}>
            <FontAwesomeIcon icon={faPlus} /> Add Event
          </button>
        </div>
      </div>

      {renderView()}

      {showModal && (
        <EventModal 
          onClose={closeModal}
          onSave={saveEvent}
          onDelete={deleteEvent}
          event={selectedEvent}
          selectedDate={selectedDate}
        />
      )}

      {examsNeedingHours.length > 0 && (
        <StudyHoursNotification
          exams={examsNeedingHours}
          onSetHours={handleSetStudyHours}
          onDismiss={handleDismissExam}
        />
      )}
    </div>
  );
};

export default Calendar;
