import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isAfter, isBefore } from 'date-fns';

const MonthView = ({ currentDate, events, onAddEvent, onEditEvent }) => {
  const [cellHeight, setCellHeight] = useState('auto');
  
  // Calculate the height of each cell based on the available space
  useEffect(() => {
    const calculateCellHeight = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = 180; // Approximate header height including margins
      const availableHeight = viewportHeight - headerHeight;
      const rowCount = 6; // Maximum number of rows in a month view
      const dayNameHeight = 40; // Approximate height of day names row
      
      // Calculate height per cell and subtract borders
      const height = Math.floor((availableHeight - dayNameHeight) / rowCount) - 2;
      setCellHeight(`${height}px`);
    };
    
    calculateCellHeight();
    window.addEventListener('resize', calculateCellHeight);
    
    return () => {
      window.removeEventListener('resize', calculateCellHeight);
    };
  }, []);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  // Create day name headers
  const dayNames = [];
  for (let i = 0; i < 7; i++) {
    dayNames.push(
      <div className="day-name" key={i}>
        {format(addDays(startDate, i), 'EEE')}
      </div>
    );
  }

  // Create calendar days
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dayNumber = format(day, 'd');
      
      // Helper function to check if an event should appear on a specific day
      const shouldShowEventOnDay = (event, day) => {
        // Parse event start date
        const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start;
        
        // If it's not a recurring event, just check if it's on the same day
        if (!event.recurring) {
          return isSameDay(eventStart, day);
        }
        
        // For recurring events, check if the day of week matches
        const eventDayOfWeek = eventStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const targetDayOfWeek = day.getDay();
        
        // If days of week don't match, event doesn't occur on this day
        if (eventDayOfWeek !== targetDayOfWeek) {
          return false;
        }
        
        // Check if the target day is after the event start date
        if (isBefore(day, eventStart)) {
          return false;
        }
        
        // Check if the event has an end date for recurrence
        if (event.repeatUntil) {
          let repeatUntilDate;
          
          // Parse the repeatUntil date
          if (typeof event.repeatUntil === 'string') {
            // Handle ISO string or date string
            try {
              repeatUntilDate = parseISO(event.repeatUntil);
            } catch (e) {
              console.error('Failed to parse repeatUntil date:', e);
              return false;
            }
          } else if (event.repeatUntil instanceof Date) {
            repeatUntilDate = event.repeatUntil;
          } else {
            // If repeatUntil is not a valid format, ignore it
            return true;
          }
          
          // Check if the target day is before or on the repeatUntil date
          return !isAfter(day, repeatUntilDate);
        }
        
        // If no repeatUntil is specified, the event recurs indefinitely
        return true;
      };
      
      // Filter events for this day, including recurring events
      const dayEvents = events.filter(event => shouldShowEventOnDay(event, cloneDay));

      days.push(
        <div
          className={`calendar-day ${
            !isSameMonth(day, monthStart) ? 'other-month' : ''
          } ${isSameDay(day, new Date()) ? 'today' : ''}`}
          key={day}
          onClick={() => onAddEvent(cloneDay)}
          style={{ height: cellHeight, overflow: 'hidden' }}
        >
          <div className="day-number">{dayNumber}</div>
          <div>
            {dayEvents.slice(0, 3).map(event => (
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
            {dayEvents.length > 3 && (
              <div className="more-events">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="calendar-grid" key={`row-${format(day, 'yyyy-MM-dd')}`}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div>
      <div className="calendar-day-names">{dayNames}</div>
      {rows}
    </div>
  );
};

export default MonthView;
