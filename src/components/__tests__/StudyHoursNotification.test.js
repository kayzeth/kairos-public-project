import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventModal from '../EventModal';
import NudgeManager from '../../utils/NudgeManager';

// Mock NudgeManager
jest.mock('../../utils/NudgeManager');

describe('Study Hours Input and Validation', () => {
  let mockNudgeManager;
  const mockDate = new Date('2025-03-14T12:00:00');

  beforeEach(() => {
    mockNudgeManager = {
      setStudyHours: jest.fn(),
      getStudyHours: jest.fn(),
      getExamsNeedingAttention: jest.fn()
    };
    NudgeManager.mockImplementation(() => mockNudgeManager);
  });

  it('should only show study hours input for exam events', () => {
    const mockEvent = {
      type: 'event',
      title: 'Regular Event',
      start: mockDate,
      end: mockDate
    };
    
    render(<EventModal event={mockEvent} />);
    expect(screen.queryByPlaceholderText('Study hours needed (optional)')).not.toBeInTheDocument();

    const examEvent = {
      type: 'exam',
      title: 'Math Exam',
      start: mockDate,
      end: mockDate
    };
    
    render(<EventModal event={examEvent} />);
    expect(screen.getByPlaceholderText('Study hours needed (optional)')).toBeInTheDocument();
  });

  it('should allow exam creation without study hours', () => {
    const mockOnSave = jest.fn();
    render(
      <EventModal 
        onSave={mockOnSave} 
        event={{ 
          type: 'exam', 
          start: mockDate, 
          end: mockDate,
          title: 'Test Exam'
        }} 
      />
    );
    
    const form = screen.getByTestId('event-form');
    fireEvent.submit(form);
    
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      type: 'exam',
      title: 'Test Exam',
      studyHours: undefined
    }));
  });

  it('should validate study hours as positive numbers when provided', () => {
    const mockOnSave = jest.fn();
    render(
      <EventModal 
        onSave={mockOnSave} 
        event={{ 
          type: 'exam', 
          start: mockDate, 
          end: mockDate,
          title: 'Test Exam'
        }} 
      />
    );
    
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    const form = screen.getByTestId('event-form');
    
    // Test negative number
    fireEvent.change(studyHoursInput, { target: { value: '-5' } });
    fireEvent.submit(form);
    expect(mockOnSave).not.toHaveBeenCalled();
    
    // Test valid number
    fireEvent.change(studyHoursInput, { target: { value: '10' } });
    fireEvent.submit(form);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      studyHours: 10,
      type: 'exam'
    }));
  });

  it('should persist study hours when editing exam events', () => {
    const examEvent = {
      id: '123',
      type: 'exam',
      title: 'Math Final',
      studyHours: '15', // String because it comes from form input
      start: mockDate,
      end: mockDate
    };
    
    render(<EventModal event={examEvent} />);
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    expect(studyHoursInput.value).toBe('15');
  });

  it('should clear study hours when changing from exam to non-exam', () => {
    const examEvent = {
      type: 'exam',
      studyHours: '10',
      title: 'Test Exam',
      start: mockDate,
      end: mockDate
    };
    
    render(<EventModal event={examEvent} />);
    const typeSelect = screen.getByRole('combobox');
    
    // Verify study hours input is initially present
    expect(screen.getByPlaceholderText('Study hours needed (optional)')).toBeInTheDocument();
    
    // Change to regular event
    fireEvent.change(typeSelect, { target: { value: 'event' } });
    expect(screen.queryByPlaceholderText('Study hours needed (optional)')).not.toBeInTheDocument();
  });
});

describe('Notification State Management', () => {
  let mockNudgeManager;
  const mockDate = new Date('2025-03-14T12:00:00');

  beforeEach(() => {
    mockNudgeManager = {
      setStudyHours: jest.fn(),
      getStudyHours: jest.fn(),
      getExamsNeedingAttention: jest.fn()
    };
    NudgeManager.mockImplementation(() => mockNudgeManager);
  });

  it('should update study hours when changed', () => {
    const examEvent = {
      id: '123',
      type: 'exam',
      title: 'Physics Final',
      studyHours: '20',
      start: mockDate,
      end: mockDate
    };
    
    const mockOnSave = jest.fn();
    render(<EventModal event={examEvent} onSave={mockOnSave} />);
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    const form = screen.getByTestId('event-form');
    
    fireEvent.change(studyHoursInput, { target: { value: '25' } });
    fireEvent.submit(form);
    
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      studyHours: 25
    }));
  });

  it('should initialize with existing study hours', () => {
    const examEvent = {
      id: '123',
      type: 'exam',
      title: 'Chemistry Final',
      studyHours: '15',
      start: mockDate,
      end: mockDate
    };
    
    render(<EventModal event={examEvent} />);
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    expect(studyHoursInput.value).toBe('15');
  });

  it('should handle exam deletion', () => {
    const examEvent = {
      id: '123',
      type: 'exam',
      title: 'Biology Final',
      start: mockDate,
      end: mockDate
    };
    
    const mockOnDelete = jest.fn();
    window.confirm = jest.fn(() => true); // Mock confirm dialog to return true
    
    render(<EventModal event={examEvent} onDelete={mockOnDelete} />);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith('123');
  });
});

describe('User Interface', () => {
  let mockNudgeManager;
  const mockDate = new Date('2025-03-14T12:00:00');

  beforeEach(() => {
    mockNudgeManager = {
      setStudyHours: jest.fn(),
      getStudyHours: jest.fn(),
      getExamsNeedingAttention: jest.fn()
    };
    NudgeManager.mockImplementation(() => mockNudgeManager);
  });

  it('should validate study hours input', () => {
    render(<EventModal 
      event={{ 
        type: 'exam', 
        title: 'Test Exam',
        start: mockDate, 
        end: mockDate 
      }} 
    />);
    
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    
    // Test negative number
    fireEvent.change(studyHoursInput, { target: { value: '-5' } });
    expect(studyHoursInput.validity.valid).toBe(false);
    
    // Test valid number
    fireEvent.change(studyHoursInput, { target: { value: '10' } });
    expect(studyHoursInput.validity.valid).toBe(true);
  });

  it('should handle non-numeric input', () => {
    render(<EventModal 
      event={{ 
        type: 'exam', 
        title: 'Test Exam',
        start: mockDate, 
        end: mockDate 
      }} 
    />);
    
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    
    // HTML5 number input automatically handles non-numeric input
    fireEvent.change(studyHoursInput, { target: { value: 'abc' } });
    expect(studyHoursInput.value).toBe(''); // Non-numeric input is cleared
  });

  it('should enable save button with valid input', () => {
    render(<EventModal 
      event={{ 
        type: 'exam', 
        title: 'Test Exam',
        start: mockDate, 
        end: mockDate 
      }} 
    />);
    
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    const saveButton = screen.getByRole('button', { name: /save/i });
    
    fireEvent.change(studyHoursInput, { target: { value: '10' } });
    expect(saveButton).not.toBeDisabled();
  });
});

describe('Performance', () => {
  let mockNudgeManager;
  const mockDate = new Date('2025-03-14T12:00:00');

  beforeEach(() => {
    mockNudgeManager = {
      setStudyHours: jest.fn(),
      getStudyHours: jest.fn(),
      getExamsNeedingAttention: jest.fn()
    };
    NudgeManager.mockImplementation(() => mockNudgeManager);
  });

  it('should handle rapid study hour updates efficiently', async () => {
    const examEvent = {
      id: '123',
      type: 'exam',
      title: 'Performance Test Exam',
      start: mockDate,
      end: mockDate
    };
    
    render(<EventModal event={examEvent} />);
    const studyHoursInput = screen.getByPlaceholderText('Study hours needed (optional)');
    
    const startTime = performance.now();
    
    // Simulate rapid updates
    for (let i = 1; i <= 100; i++) {
      fireEvent.change(studyHoursInput, { target: { value: i.toString() } });
    }
    
    const endTime = performance.now();
    const updateTime = endTime - startTime;
    
    // Updates should complete in under 200ms
    expect(updateTime).toBeLessThan(200);
    
    // Verify final value is set
    expect(studyHoursInput.value).toBe('100');
  });
});
