import React, { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';
import StudyHoursNotification from './StudyHoursNotification';
import NudgeManager from '../utils/NudgeManager';
import googleCalendarService from '../services/googleCalendarService';

const Calendar = ({ initialEvents = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nudgeManager] = useState(() => new NudgeManager());
  const [examsNeedingHours, setExamsNeedingHours] = useState([]);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: 'idle', message: '' });

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

  // Import events from Google Calendar
  const importGoogleCalendarEvents = useCallback(async () => {
    try {
      setSyncStatus({ status: 'loading', message: 'Importing events from Google Calendar...' });
        
      // Get events from the last month to the next month
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        
      const googleEvents = await googleCalendarService.importEvents(oneMonthAgo, oneMonthFromNow);
        
      // Filter out any Google events that might already be in our events array
      const existingGoogleEventIds = events
        .filter(event => event.googleEventId)
        .map(event => event.googleEventId);
        
      const newGoogleEvents = googleEvents.filter(
        event => !existingGoogleEventIds.includes(event.googleEventId)
      );
        
      // Add the new Google events to our events array
      setEvents(prevEvents => [...prevEvents, ...newGoogleEvents]);
        
      setSyncStatus({ 
        status: 'success', 
        message: `Successfully imported ${newGoogleEvents.length} events from Google Calendar` 
      });
        
      // Clear the success message after a few seconds
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: '' });
      }, 3000);
        
    } catch (error) {
      console.error('Error importing Google Calendar events:', error);
      setSyncStatus({ 
        status: 'error', 
        message: 'Failed to import events from Google Calendar' 
      });
        
      // Clear the error message after a few seconds
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: '' });
      }, 3000);
    }
  }, [events]);

  // Check if Google Calendar is connected when component mounts
  useEffect(() => {
    const checkGoogleCalendarConnection = async () => {
      try {
        await googleCalendarService.initialize();
        const isSignedIn = googleCalendarService.isSignedIn();
        setIsGoogleCalendarConnected(isSignedIn);
        
        // Add listener for sign-in state changes
        googleCalendarService.addSignInListener((isSignedIn) => {
          setIsGoogleCalendarConnected(isSignedIn);
        });
        
        // If signed in, import events from Google Calendar
        if (isSignedIn) {
          importGoogleCalendarEvents();
        }
      } catch (error) {
        console.error('Error checking Google Calendar connection:', error);
      }
    };
    
    checkGoogleCalendarConnection();
  }, [importGoogleCalendarEvents]);

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

  const saveEvent = async (eventData) => {
    const { id: _, ...cleanEventData } = eventData;
    
    // Ensure dates are properly formatted with timezone consideration
    const formatEventDate = (date, time) => {
      if (!date) return null;
      const [year, month, day] = date.split('-');
      const [hours, minutes] = (time || '00:00').split(':');
      const eventDate = new Date(year, month - 1, day, hours, minutes);
      return eventDate.toISOString();
    };

    const formattedEvent = {
      ...cleanEventData,
      start: cleanEventData.allDay ? cleanEventData.start : formatEventDate(cleanEventData.start, cleanEventData.startTime),
      end: cleanEventData.allDay ? cleanEventData.end : formatEventDate(cleanEventData.end, cleanEventData.endTime)
    };
    
    if (selectedEvent) {
      // Update existing event
      const updatedEvents = events.map(event => 
        event.id === selectedEvent.id ? { 
          ...event, 
          ...formattedEvent,
          // Keep existing study hours if not being updated
          studyHours: formattedEvent.studyHours !== undefined ? formattedEvent.studyHours : event.studyHours,
          type: formattedEvent.type || event.type // Ensure type property is present
        } : event
      );
      setEvents(updatedEvents);

      // If it's a Google Calendar event, update it there too
      if (selectedEvent.googleEventId && isGoogleCalendarConnected) {
        try {
          await googleCalendarService.updateEvent(selectedEvent.googleEventId, formattedEvent);
        } catch (error) {
          console.error('Error updating Google Calendar event:', error);
        }
      }

      // Update NudgeManager if study hours were set
      if (formattedEvent.studyHours !== undefined) {
        nudgeManager.setStudyHours(selectedEvent.id, formattedEvent.studyHours);
      }
    } else {
      // Add new event
      const newEvent = {
        id: Date.now().toString(),
        ...formattedEvent,
        type: formattedEvent.type || 'event' // Ensure type property is present
      };

      // If connected to Google Calendar and it's not a local-only event
      if (isGoogleCalendarConnected && !formattedEvent.localOnly) {
        try {
          const googleEvent = await googleCalendarService.createEvent(newEvent);
          newEvent.googleEventId = googleEvent.id;
        } catch (error) {
          console.error('Error creating Google Calendar event:', error);
        }
      }

      setEvents([...events, newEvent]);

      // Set study hours in NudgeManager if provided for new exam
      if (newEvent.type === 'exam' && formattedEvent.studyHours !== undefined) {
        nudgeManager.setStudyHours(newEvent.id, formattedEvent.studyHours);
      }
    }
    
    closeModal();
  };

  const deleteEvent = async (eventId) => {
    const eventToDelete = events.find(event => event.id === eventId);
    
    if (eventToDelete) {
      // If it's a Google Calendar event, delete it there too
      if (eventToDelete.googleEventId && isGoogleCalendarConnected) {
        try {
          await googleCalendarService.deleteEvent(eventToDelete.googleEventId);
        } catch (error) {
          console.error('Error deleting Google Calendar event:', error);
        }
      }
      
      setEvents(events.filter(event => event.id !== eventId));
    }
    
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
      {/* Render sync status as a popup banner if not idle */}
      {syncStatus.status !== 'idle' && (
        <div className={`sync-banner sync-${syncStatus.status}`} data-testid="sync-status">
          {syncStatus.message}
        </div>
      )}
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
