import React from 'react';
import { format, addHours, startOfDay, parseISO } from 'date-fns';

const DayView = ({ currentDate, events, onAddEvent, onEditEvent }) => {
  // Create time slots
  const timeSlots = [];
  for (let i = 0; i < 24; i++) {
    timeSlots.push(
      <div className="time-slot" key={i}>
        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
      </div>
    );
  }

  // Filter events for this day
  const dayEvents = events.filter(event => {
    const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start;
    const eventDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
    const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    return eventDay.getTime() === currentDay.getTime();
  });

  // All-day events
  const allDayEvents = dayEvents.filter(event => event.allDay);
  
  // Time-based events
  const timeEvents = dayEvents.filter(event => !event.allDay);
  
  // Create hour slots
  const hourSlots = [];
  for (let i = 0; i < 24; i++) {
    const hourStart = addHours(startOfDay(currentDate), i);
    
    // Filter events for this hour
    const hourEvents = timeEvents.filter(event => {
      const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start;
      const eventHour = eventStart.getHours();
      return eventHour === i;
    });
    
    hourSlots.push(
      <div 
        className="hour-slot" 
        key={i}
        onClick={() => {
          const newDate = addHours(startOfDay(currentDate), i);
          onAddEvent(newDate);
        }}
      >
        {hourEvents.map(event => (
          <div
            key={event.id}
            className="time-event"
            onClick={(e) => {
              e.stopPropagation();
              onEditEvent(event);
            }}
            style={{ 
              backgroundColor: event.color || 'var(--primary-color)',
              top: `${(parseISO(event.start).getMinutes() / 60) * 100}%`,
              height: '30px'
            }}
          >
            {event.title}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="day-view">
      <div className="time-column">
        <div className="day-header"></div>
        {timeSlots}
      </div>
      <div className="day-column">
        <div className="day-header">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </div>
        <div>
          {allDayEvents.map(event => (
            <div
              key={event.id}
              className="event"
              onClick={(e) => {
                e.stopPropagation();
                onEditEvent(event);
              }}
              style={{ backgroundColor: event.color || 'var(--primary-color)' }}
            >
              {event.title}
            </div>
          ))}
          {hourSlots}
        </div>
      </div>
    </div>
  );
};

export default DayView;
