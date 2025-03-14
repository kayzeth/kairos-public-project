import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';
import NudgeManager from '../utils/NudgeManager';

// Mock exam data for the next two weeks
const initialExams = [
  {
    id: '1',
    title: 'CS1060 Midterm Exam',
    description: 'Computer Science Midterm covering Algorithms and Data Structures',
    start: '2025-03-21T14:00',
    end: '2025-03-21T16:00',
    allDay: false,
    type: 'exam'
  },
  {
    id: '2',
    title: 'MATH2200 Final Exam',
    description: 'Linear Algebra Final Examination',
    start: '2025-03-25T10:00',
    end: '2025-03-25T12:00',
    allDay: false,
    type: 'exam'
  },
  {
    id: '3',
    title: 'PHYS1140 Midterm',
    description: 'Physics Midterm Examination - Mechanics and Waves',
    start: '2025-03-28T15:00',
    end: '2025-03-28T17:00',
    allDay: false,
    type: 'exam'
  }
];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', or 'day'
  const [events, setEvents] = useState(initialExams);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nudgeManager] = useState(() => new NudgeManager());
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Effect to analyze exams whenever events change
  useEffect(() => {
    // Delay the analysis to allow the UI to render first
    const timer = setTimeout(async () => {
      try {
        const analysis = await nudgeManager.analyzeUpcomingExams(events, currentDate);
        console.log('Current Exam Analysis:', {
          totalExams: analysis.length,
          examsNeedingAttention: analysis.filter(exam => exam.needsAttention).length,
          detailedAnalysis: analysis
        });
        setAnalysisComplete(true);
      } catch (error) {
        console.error('Error analyzing exams:', error);
        setAnalysisComplete(true);
      }
    }, 1000); // Delay of 1 second

    return () => clearTimeout(timer);
  }, [events, currentDate, nudgeManager]);

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
    // Remove any existing id from eventData
    const { id: _, ...cleanEventData } = eventData;
    
    if (selectedEvent) {
      // Edit existing event
      const updatedEvents = events.map(event => 
        event.id === selectedEvent.id ? { 
          ...event, 
          ...cleanEventData,
          start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
          end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`
        } : event
      );
      setEvents(updatedEvents);
    } else {
      // Add new event
      const newEvent = {
        id: Date.now().toString(),
        ...cleanEventData,
        start: cleanEventData.allDay ? cleanEventData.start : `${cleanEventData.start}T${cleanEventData.startTime}`,
        end: cleanEventData.allDay ? cleanEventData.end : `${cleanEventData.end}T${cleanEventData.endTime}`
      };
      setEvents([...events, newEvent]);
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
