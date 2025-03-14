import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the Calendar component to isolate App testing
jest.mock('./components/Calendar', () => () => <div data-testid="calendar-component">Calendar Component</div>);

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
  });

  test('renders with the correct structure', () => {
    render(<App />);
  
    // Use getByTestId instead of querySelector
    expect(screen.getByTestId('app-container')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
  });  
});
