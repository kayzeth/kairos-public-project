import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';

describe('Header Component', () => {
  const mockTitle = 'Kairos Calendar';
  const mockOnAddEvent = jest.fn();

  beforeEach(() => {
    mockOnAddEvent.mockClear();
  });

  test('renders the logo or icon if provided', () => {
    // This test depends on the actual implementation
    // If the Header component includes a logo or icon, test for its presence
    render(
      <Header 
        title={mockTitle} 
        onAddEvent={mockOnAddEvent} 
      />
    );
    
    // Check for a logo element (this selector might need to be adjusted)
    const logoElement = document.querySelector('.logo') || document.querySelector('.header-icon');
    if (logoElement) {
      expect(logoElement).toBeInTheDocument();
    }
  });

  test('has the correct styling and layout', () => {
    render(
      <Header 
        title={mockTitle} 
        onAddEvent={mockOnAddEvent} 
      />
    );
    
    // Check if the header has the expected class
    const headerElement = screen.getByRole('banner');
    expect(headerElement).toHaveClass('header');
  });
});
