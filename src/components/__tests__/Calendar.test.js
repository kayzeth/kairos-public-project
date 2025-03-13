import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calendar from '../Calendar';

// Mock child components to isolate Calendar component testing
jest.mock('../MonthView', () => () => <div data-testid="month-view">Month View</div>);
jest.mock('../WeekView', () => () => <div data-testid="week-view">Week View</div>);
jest.mock('../DayView', () => () => <div data-testid="day-view">Day View</div>);
jest.mock('../EventModal', () => ({ onClose, onSave, onDelete, event, selectedDate }) => (
  <div data-testid="event-modal">
    <button onClick={onClose}>Close</button>
    <button onClick={() => onSave({ title: 'Test Event' })}>Save</button>
    {event && <button onClick={() => onDelete(event.id)}>Delete</button>}
  </div>
));

describe('Calendar Component', () => {
  test('renders the calendar with month view by default', () => {
    render(<Calendar />);
    
    // Check if the month view is rendered by default
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
    expect(screen.queryByTestId('week-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('day-view')).not.toBeInTheDocument();
  });

  test('changes view when view buttons are clicked', () => {
    render(<Calendar />);
    
    // Switch to week view
    fireEvent.click(screen.getByText('Week'));
    expect(screen.getByTestId('week-view')).toBeInTheDocument();
    
    // Switch to day view
    fireEvent.click(screen.getByText('Day'));
    expect(screen.getByTestId('day-view')).toBeInTheDocument();
    
    // Switch back to month view
    fireEvent.click(screen.getByText('Month'));
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
  });

  test('navigates to next and previous periods', () => {
    render(<Calendar />);
    
    // Get the initial title text
    const initialTitle = screen.getByText(/\w+ \d{4}/); // Month YYYY format
    const initialTitleText = initialTitle.textContent;
    
    // Click next button
    fireEvent.click(screen.getByText('Today').nextSibling);
    
    // Title should have changed
    expect(initialTitle.textContent).not.toBe(initialTitleText);
    
    // Click previous button to go back
    fireEvent.click(screen.getByText('Today').previousSibling);
    
    // Title should be back to initial
    expect(initialTitle.textContent).toBe(initialTitleText);
  });

  test('opens event modal when add event button is clicked', () => {
    render(<Calendar />);
    
    // Modal should not be visible initially
    expect(screen.queryByTestId('event-modal')).not.toBeInTheDocument();
    
    // Click add event button
    fireEvent.click(screen.getByText('Add Event'));
    
    // Modal should now be visible
    expect(screen.getByTestId('event-modal')).toBeInTheDocument();
  });

  test('adds a new event when save is clicked in modal', () => {
    render(<Calendar />);
    
    // Open the modal
    fireEvent.click(screen.getByText('Add Event'));
    
    // Save the event
    fireEvent.click(screen.getByText('Save'));
    
    // Modal should be closed
    expect(screen.queryByTestId('event-modal')).not.toBeInTheDocument();
  });

  test('closes modal when close button is clicked', () => {
    render(<Calendar />);
    
    // Open the modal
    fireEvent.click(screen.getByText('Add Event'));
    
    // Close the modal
    fireEvent.click(screen.getByText('Close'));
    
    // Modal should be closed
    expect(screen.queryByTestId('event-modal')).not.toBeInTheDocument();
  });
});
