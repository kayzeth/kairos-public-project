import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';

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
      
      // Filter events for this day
      const dayEvents = events.filter(event => {
        const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start;
        return isSameDay(eventStart, cloneDay);
      });

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
