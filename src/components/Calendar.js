import React, { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';
import PreparationPrompt from './PreparationPrompt'; 
import googleCalendarService from '../services/googleCalendarService';
import nudgerService from '../services/nudgerService'; 

const Calendar = ({ initialEvents = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); 
  const [events, setEvents] = useState(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: 'idle', message: '' });
  const [showPreparationPrompt, setShowPreparationPrompt] = useState(false);
  const [eventsNeedingPreparation, setEventsNeedingPreparation] = useState([]);
  const [dismissedEvents, setDismissedEvents] = useState({});

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

  const importGoogleCalendarEvents = useCallback(async () => {
    try {
      setSyncStatus({ status: 'loading', message: 'Importing events from Google Calendar...' });
        
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        
      const googleEvents = await googleCalendarService.importEvents(oneMonthAgo, oneMonthFromNow);
        
      const existingGoogleEventIds = events
        .filter(event => event.googleEventId)
        .map(event => event.googleEventId);
        
      const newGoogleEvents = googleEvents.filter(
        event => !existingGoogleEventIds.includes(event.googleEventId)
      );
        
      setEvents(prevEvents => [...prevEvents, ...newGoogleEvents]);
        
      setSyncStatus({ 
        status: 'success', 
        message: `Successfully imported ${newGoogleEvents.length} events from Google Calendar` 
      });
        
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: '' });
      }, 3000);
        
    } catch (error) {
      console.error('Error importing Google Calendar events:', error);
      setSyncStatus({ 
        status: 'error', 
        message: 'Failed to import events from Google Calendar' 
      });
        
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: '' });
      }, 3000);
    }
  }, [events, setEvents, setSyncStatus]);

  useEffect(() => {
    const checkGoogleCalendarConnection = async () => {
      try {
        await googleCalendarService.initialize();
        const isSignedIn = googleCalendarService.isSignedIn();
        setIsGoogleCalendarConnected(isSignedIn);
        
        googleCalendarService.addSignInListener((isSignedIn) => {
          setIsGoogleCalendarConnected(isSignedIn);
        });
        
        if (isSignedIn) {
          importGoogleCalendarEvents();
        }
      } catch (error) {
        console.error('Error checking Google Calendar connection:', error);
      }
    };
    
    checkGoogleCalendarConnection();
  }, [importGoogleCalendarEvents]);

  // Check for dismissed events that should be reminded again
  useEffect(() => {
    const checkDismissedEvents = () => {
      const now = new Date().getTime();
      const updatedDismissed = { ...dismissedEvents };
      let hasChanges = false;

      Object.keys(dismissedEvents).forEach(eventId => {
        if (now >= dismissedEvents[eventId]) {
          delete updatedDismissed[eventId];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setDismissedEvents(updatedDismissed);
      }
    };

    // Check every minute
    const intervalId = setInterval(checkDismissedEvents, 60000);
    
    // Initial check
    checkDismissedEvents();
    
    return () => clearInterval(intervalId);
  }, [dismissedEvents]);

  useEffect(() => {
    const studyPlan = nudgerService.getStudyPlan(events);
    // Filter events needing preparation that haven't been dismissed
    const pendingEvents = studyPlan.events.filter(event => 
      event.needsPreparationInput && 
      !dismissedEvents[event.id]
    );
    
    if (pendingEvents.length > 0 && !showModal) {
      setEventsNeedingPreparation(pendingEvents);
      setShowPreparationPrompt(true);
    } else {
      setShowPreparationPrompt(false);
    }
    
    window.studyPlan = studyPlan;
    console.log('[KAIR-15] Nudger study plan updated:', studyPlan);
  }, [events, showModal, dismissedEvents]);

  const saveEvent = async (eventData) => {
    const { id: _, ...cleanEventData } = eventData;

    try {
      if (selectedEvent) {
        const updatedEvents = events.map(event => 
          event.id === selectedEvent.id ? { 
            ...cleanEventData, 
            ...eventData,
            start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
            end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`
          } : event
        );
        setEvents(updatedEvents);
        
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
        const newEvent = {
          id: Date.now().toString(),
          ...cleanEventData,
          start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
          end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`
        };
        
        if (isGoogleCalendarConnected) {
          try {
            const googleEvent = await googleCalendarService.exportEvent(newEvent);
            newEvent.googleEventId = googleEvent.id;
            newEvent.source = 'google';
          } catch (error) {
            console.error('Error creating event in Google Calendar:', error);
          }
        }
        
        setEvents([...events, newEvent]);
        
        setTimeout(() => {
          const singleEventStudyPlan = nudgerService.getStudyPlan([newEvent]);
          if (singleEventStudyPlan.eventCount > 0) {
            console.log('[KAIR-15] New event may require study time:', singleEventStudyPlan.events[0]);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
    
    closeModal();
  };

  const savePreparationHours = (eventId, hours) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              preparationHours: hours.toString(),
              requiresPreparation: true,
              needsPreparationInput: false
            } 
          : event
      )
    );
    
    setSyncStatus({
      status: 'success',
      message: `Added ${hours} preparation hours to event`
    });
    
    setTimeout(() => {
      setSyncStatus({ status: 'idle', message: '' });
    }, 3000);
  };
  
  const dismissPreparationPrompt = (eventId) => {
    // Set a reminder for 3 hours from now
    const reminderTime = new Date().getTime() + (3 * 60 * 60 * 1000);
    
    setDismissedEvents(prev => ({
      ...prev,
      [eventId]: reminderTime
    }));
    
    setSyncStatus({
      status: 'info',
      message: `You'll be reminded about this event in 3 hours`
    });
    
    setTimeout(() => {
      setSyncStatus({ status: 'idle', message: '' });
    }, 3000);
  };
  
  const closePreparationPrompt = () => {
    setShowPreparationPrompt(false);
    setEventsNeedingPreparation([]);
  };

  const deleteEvent = async (id) => {
    const eventToDelete = events.find(event => event.id === id);
    
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    
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
    <div className="calendar-container" data-testid="calendar-container">
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
      {showPreparationPrompt && eventsNeedingPreparation.length > 0 && (
        <PreparationPrompt
          events={eventsNeedingPreparation}
          onSave={savePreparationHours}
          onClose={closePreparationPrompt}
          onDismiss={dismissPreparationPrompt}
        />
      )}
    </div>
  );
};

export default Calendar;
