import React from 'react';
import { format, startOfWeek, endOfWeek, addDays, addHours, startOfDay, isSameDay, parseISO } from 'date-fns';

const WeekView = ({ currentDate, events, onAddEvent, onEditEvent }) => {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(weekStart);
  
  // Create time slots
  const timeSlots = [];
  for (let i = 0; i < 24; i++) {
    timeSlots.push(
      <div className="time-slot" key={i}>
        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
      </div>
    );
  }

  // Create day columns
  const dayColumns = [];
  let day = weekStart;
  
  while (day <= weekEnd) {
    const dayEvents = events.filter(event => {
      const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start;
      return isSameDay(eventStart, day);
    });
    
    const hourSlots = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = addHours(startOfDay(day), i);
      
      // Filter events for this hour
      const hourEvents = dayEvents.filter(event => {
        if (event.allDay) return false;
        
        const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start;
        const eventHour = eventStart.getHours();
        return eventHour === i;
      });
      
      hourSlots.push(
        <div 
          className="hour-slot" 
          key={i}
          onClick={() => {
            const newDate = addHours(startOfDay(day), i);
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
    
    // All-day events
    const allDayEvents = dayEvents.filter(event => event.allDay);
    
    dayColumns.push(
      <div className="week-day-column" key={day}>
        <div className="week-day-header">
          <div>{format(day, 'EEE')}</div>
          <div>{format(day, 'd')}</div>
        </div>
        <div className="week-day-content">
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
    );
    
    day = addDays(day, 1);
  }

  return (
    <div className="week-view">
      <div className="time-column">
        <div className="week-day-header"></div>
        {timeSlots}
      </div>
      {dayColumns}
    </div>
  );
};

export default WeekView;
