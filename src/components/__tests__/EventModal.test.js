import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventModal from '../EventModal';
import { format } from 'date-fns';
import userEvent from '@testing-library/user-event';

describe('EventModal Component', () => {
  const mockDate = new Date(2025, 2, 15, 10, 0); // March 15, 2025, 10:00 AM
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Test Description',
    start: '2025-03-15T10:00:00',
    end: '2025-03-15T11:00:00',
    allDay: false,
    color: '#ff0000'
  };
  const mockEventNoTitle = {
    id: '1',
    title: '',
    description: 'Test Description',
    start: '2025-03-15T10:00:00',
    end: '2025-03-15T11:00:00',
    allDay: false,
    color: '#ff0000'
  };
  
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly for editing an existing event', async () => {
    await act(async () => {
      render(
        <EventModal 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          onDelete={mockOnDelete} 
          event={mockEvent} 
        />
      );
    });
    
    // Check if form fields are present
    expect(screen.getByPlaceholderText(/add title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/add description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Start$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^End$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/All Day/i)).toBeInTheDocument();
    
    // Check if buttons are present
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    
    // Delete button should not be present for a new event
    expect(screen.queryByText('Delete')).toBeInTheDocument();
  });

  test('renders correctly for editing an existing event', async () => {
    await act(async () => {
      render(
        <EventModal 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          onDelete={mockOnDelete} 
          event={mockEvent} 
        />
      );
    });
  
    // Ensure the modal is displaying the correct content
    expect(screen.getByText('Save')).toBeInTheDocument();
  
    // Check if form fields are pre-filled with mockEvent data
    expect(screen.getByPlaceholderText(/add title/i)).toHaveValue(mockEvent.title);
    expect(screen.getByPlaceholderText(/add description/i)).toHaveValue(mockEvent.description);
  
    // Check if the date inputs are populated correctly
    expect(screen.getByLabelText(/^Start$/i)).toHaveValue('2025-03-15');
    expect(screen.getByLabelText(/^End$/i)).toHaveValue('2025-03-15');
  
    // Check if time inputs are correctly set
    expect(screen.getByLabelText(/start time/i)).toHaveValue('10:00');
    expect(screen.getByLabelText(/end time/i)).toHaveValue('11:00');
  
    // Check if the all-day checkbox is unchecked
    const allDayCheckbox = screen.getByLabelText(/all day/i);
    expect(allDayCheckbox).not.toBeChecked();
  
    // Check if delete button is present (since it's an existing event)
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  
    // Simulate updating the event title
    const titleInput = screen.getByPlaceholderText(/add title/i);
    await act(async () => {
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Test Event');
    });
  
    // Simulate clicking the save button
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);
  
    // Ensure onSave is called with updated event data
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Test Event' }));
  });

  test('calls onSave when Save button is clicked', async () => {
    await act(async () => {
      render(
        <EventModal 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          onDelete={mockOnDelete} 
          event={mockEvent} 
        />
      );
    });
    
    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/add title/i), { target: { value: 'New Event' } });
      fireEvent.change(screen.getByPlaceholderText(/add description/i), { target: { value: 'New Description' } });
    });
    
    // Click the Save button
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });
    
    // Check if onSave was called with the correct data
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Event',
      description: 'New Description'
    }));
  });

  test('calls onClose when Cancel button is clicked', async () => {
    await act(async () => {
      render(
        <EventModal 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          onDelete={mockOnDelete} 
          event={mockEvent} 
        />
      );
    });
    
    // Click the Cancel button
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('calls onDelete when Delete button is clicked', async () => {
    window.confirm.mockImplementationOnce(() => true);
    
    await act(async () => {
      render(
        <EventModal 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          onDelete={mockOnDelete} 
          event={mockEvent} 
        />
      );
    });
    
    // Click the Delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // Check if confirmation was shown
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this event?');
    
    // Check if onDelete was called with the correct event ID
    expect(mockOnDelete).toHaveBeenCalledWith(mockEvent.id);
  });

  test('toggles all-day event functionality', async () => {
    await act(async () => {
      render(
        <EventModal 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          onDelete={mockOnDelete} 
          event={mockEvent} 
          selectedDate={mockDate} 
        />
      );
    });
    
    // Initially, time inputs should be visible
    const startTimeInput = screen.getByLabelText(/^Start$/i); // Matches only "Start"
    const endTimeInput = screen.getByLabelText(/^End$/i); // Matches only "End"
    expect(startTimeInput).toBeInTheDocument();
    expect(endTimeInput).toBeInTheDocument();
    
    // Toggle all-day checkbox
    const allDayCheckbox = screen.getByRole('checkbox', { name: /all day/i });
    await act(async () => {
      fireEvent.click(allDayCheckbox);
    });
    
    // Enter a title
    const titleInput = screen.getByPlaceholderText(/add title/i);
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'All Day Event' } });
    });
    
    // Save the event
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });
    
    // Verify the saved event
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'All Day Event',
      allDay: true
      }));
  });

  test('validates required fields before saving', async () => {
    await act(async () => {
      render(
        <EventModal 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
          onDelete={mockOnDelete} 
          event={mockEventNoTitle} 
          selectedDate={mockDate} 
        />
      );
    });
    
    // Get the title input using the correct role
    const titleInput = screen.getByPlaceholderText(/add title/i);
    // Verify it's required
    expect(titleInput).toBeRequired();

    // Try to save without entering a title
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });
    
    // onSave should not have been called since form validation will prevent submission
    expect(mockOnSave).not.toHaveBeenCalled();
    
    // Now enter a title and try again
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/add title/i), { target: { value: 'Valid Event' } });
      fireEvent.click(screen.getByText('Save'));
    });
    
    // onSave should now have been called
    expect(mockOnSave).toHaveBeenCalled();
  });
});
