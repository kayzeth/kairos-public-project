import React, { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';
import googleCalendarService from '../services/googleCalendarService';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', or 'day'
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [, setSyncStatus] = useState({ status: 'idle', message: '' });

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
    }, [events, setEvents, setSyncStatus]);

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

  const saveEvent = async (eventData) => {
    // Remove any existing id from eventData
    const { id: _, ...cleanEventData } = eventData;

    try {
      if (selectedEvent) {
        // Edit existing event
        const updatedEvents = events.map(event => 
          event.id === selectedEvent.id ? { 
            ...cleanEventData, 
            ...eventData,
            start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
            end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`
          } : event
        );
        setEvents(updatedEvents);
        
        // If this event was from Google Calendar and we're connected, update it there too
        if (isGoogleCalendarConnected && selectedEvent.googleEventId) {
          try {
            await googleCalendarService.updateEvent({
              ...cleanEventData,
              googleEventId: selectedEvent.googleEventId,
              start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
              end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`
            });
          } catch (error) {
            console.error('Error updating event in Google Calendar:', error);
          }
        }
      } else {
        // Add new event
        const newEvent = {
          id: Date.now().toString(),
          ...cleanEventData,
          start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
          end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`
        };
        
        // If connected to Google Calendar, also create the event there
        if (isGoogleCalendarConnected) {
          try {
            const googleEvent = await googleCalendarService.exportEvent(newEvent);
            // Add the Google Calendar event ID to our event
            newEvent.googleEventId = googleEvent.id;
            newEvent.source = 'google';
          } catch (error) {
            console.error('Error creating event in Google Calendar:', error);
          }
        }
        
        setEvents([...events, newEvent]);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
    
    closeModal();
  };

  const deleteEvent = async (id) => {
    const eventToDelete = events.find(event => event.id === id);
    
    // Remove from our local events
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    
    // If this event was from Google Calendar and we're connected, delete it there too
    if (isGoogleCalendarConnected && eventToDelete && eventToDelete.googleEventId) {
      try {
        await googleCalendarService.deleteEvent(eventToDelete);
      } catch (error) {
        console.error('Error deleting event from Google Calendar:', error);
      }
    }
    
    closeModal();
  };

  const editEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
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
    </div>
  );
};

export default Calendar;
