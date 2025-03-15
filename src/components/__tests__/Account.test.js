import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Account from '../Account';

// Mock the dependencies before importing them
jest.mock('../../services/googleCalendarService');
jest.mock('../../config/googleCalendarConfig');
jest.mock('../../services/canvasService');
jest.mock('../../config/canvasConfig');

// Import the mocked modules after mocking
import googleCalendarService from '../../services/googleCalendarService';
import { isConfigured } from '../../config/googleCalendarConfig';
import canvasService from '../../services/canvasService';
import { isConfigured as isCanvasConfigured } from '../../config/canvasConfig';

// Mock FontAwesome to avoid issues
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <div data-testid="mock-icon" />
}));

describe('Account Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set up mock implementations
    isConfigured.mockReturnValue(true);
    
    // Set up googleCalendarService mock implementations
    googleCalendarService.initialize = jest.fn().mockResolvedValue();
    googleCalendarService.isSignedIn = jest.fn().mockReturnValue(false);
    googleCalendarService.getCurrentUser = jest.fn().mockReturnValue(null);
    
    // Mock addSignInListener to store the callback
    googleCalendarService.addSignInListener = jest.fn((callback) => {
      googleCalendarService.signInCallback = callback;
    });
    
    googleCalendarService.signIn = jest.fn().mockResolvedValue();
    googleCalendarService.signOut = jest.fn().mockResolvedValue();
    googleCalendarService.syncEvents = jest.fn().mockResolvedValue({ imported: 5, exported: 3 });
  });

  test('renders account title', async () => {
    await act(() => {
      render(<Account />);
    });
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  test('shows API credentials warning when not configured', async () => {
    isConfigured.mockReturnValue(false);
    await act(() => {
      render(<Account />);
    });
    expect(screen.getByText('Google Calendar API Credentials Required')).toBeInTheDocument();
  });

  test('initializes Google Calendar service on mount', async () => {
    await act(() => {
      render(<Account />);
    });
    expect(googleCalendarService.initialize).toHaveBeenCalled();
  });

  test('shows sign-in button when not signed in', async () => {
    await act(() => {
      render(<Account />);
    });
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  test('shows user profile when signed in', async () => {
    // Mock signed-in state and user data
    const mockUser = {
      name: 'Test User',
      email: 'test@example.com',
      imageUrl: 'https://example.com/profile.jpg'
    };
    
    // Set up mocks before rendering
    googleCalendarService.isSignedIn.mockReturnValue(true);
    googleCalendarService.getCurrentUser.mockReturnValue(mockUser);
    
    // Store the sign-in listener to call it later
    let signInListener;
    googleCalendarService.addSignInListener.mockImplementation((callback) => {
      signInListener = callback;
      return jest.fn(); // Return a mock removal function
    });
    
    // Mock the initialize method to resolve immediately
    googleCalendarService.initialize.mockImplementation(() => {
      return Promise.resolve();
    });

    // Render component inside act to catch initial renders
    await act(async () => {
      render(<Account />);
    });
    
    // Trigger the sign-in callback inside act
    await act(async () => {
      if (signInListener) {
        signInListener(true);
      }
    });
    
    // Now check if user info is displayed correctly
    // These assertions don't need to be in act() since they don't cause state updates
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    
    // Check if auth card user info is displayed
    expect(screen.getByTestId('auth-user-name')).toHaveTextContent('Test User');
    expect(screen.getByTestId('auth-user-email')).toHaveTextContent('test@example.com');
    
    // Check if connection status is displayed
    expect(screen.getByText('Connected to Google Calendar')).toBeInTheDocument();
  });

  test('handles sign-in button click', async () => {
      await act(async () => {
      render(<Account />);
    });
    
    // Click the sign-in button
    await act(async () => {
      fireEvent.click(screen.getByText('Sign in with Google'));
    });
    
    expect(googleCalendarService.signIn).toHaveBeenCalled();
  });

  test('handles sign-out button click when signed in', async () => {
    // Mock signed-in state
    googleCalendarService.isSignedIn.mockReturnValue(true);
    googleCalendarService.getCurrentUser.mockReturnValue({
      name: 'Test User',
      email: 'test@example.com'
    });

    await act(async () => {
      render(<Account />);
    });
    
    // Click the sign-out button
    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect Google Account'));
    });
    
    expect(googleCalendarService.signOut).toHaveBeenCalled();
  });

  test('handles sync button click when signed in', async () => {
    // Mock signed-in state
    googleCalendarService.isSignedIn.mockReturnValue(true);
    googleCalendarService.getCurrentUser.mockReturnValue({
      name: 'Test User',
      email: 'test@example.com'
    });
  
    // Mock the initialize method to resolve immediately
    googleCalendarService.initialize.mockResolvedValue();
    
    // Mock the importEvents method
    googleCalendarService.importEvents.mockResolvedValue([{ id: '1', summary: 'Test Event' }]);
  
    // Render the component within act
    await act(async () => {
      render(<Account />);
    });
    
    // Wait for the component to finish initializing
    await act(async () => {
      // Manually trigger the sign-in callback that was registered
      if (googleCalendarService.signInCallback) {
        googleCalendarService.signInCallback(true);
      }
    });
    
    // Wait for the sync button to appear
    await waitFor(() => {
      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
    });
    
    // Click the sync button within act
    await act(async () => {
      fireEvent.click(screen.getByTestId('sync-button'));
    });
    
    // Wait for the import method to be called
    await waitFor(() => {
      expect(googleCalendarService.importEvents).toHaveBeenCalled();
    });
  });

  test('displays sync status messages', async () => {
    // Mock signed-in state
    googleCalendarService.isSignedIn.mockReturnValue(true);
    googleCalendarService.getCurrentUser.mockReturnValue({
      name: 'Test User',
      email: 'test@example.com'
    });
    
    // Mock the initialize method to resolve immediately
    googleCalendarService.initialize.mockResolvedValue();
  
    // Mock the importEvents method which is called by the component's syncWithGoogleCalendar function
    googleCalendarService.importEvents.mockResolvedValue([{ id: '1', summary: 'Test Event' }]);
  
    // Render the component within act
    await act(async () => {
      render(<Account />);
    });
    
    // Wait for the component to finish initializing
    await act(async () => {
      // Manually trigger the sign-in callback that was registered
      if (googleCalendarService.signInCallback) {
        googleCalendarService.signInCallback(true);
      }
    });
    
    // Wait for the sync button to appear
    await waitFor(() => {
      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
    });
    
    // Click the sync button to trigger status update
    await act(async () => {
      fireEvent.click(screen.getByTestId('sync-button'));
    });
    
    // Wait for success message - the component will set this message after successful import
    await waitFor(() => {
      expect(screen.getByTestId('sync-message')).toHaveTextContent('Successfully synced with Google Calendar');
    }, { timeout: 3000 });
  });

  test('updates UI when sign-in state changes', async () => {
    // Start with signed-out state
    googleCalendarService.isSignedIn.mockReturnValue(false);
    
    let signInListener;
    googleCalendarService.addSignInListener.mockImplementation((callback) => {
      signInListener = callback;
      return jest.fn(); // Return a mock removal function
    });
    
    await act(async () => {
      render(<Account />);
    });
    
    // Verify signed-out UI
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    
    // Simulate sign-in event
    const mockUser = {
      name: 'Test User',
      email: 'test@example.com'
    };
    
    googleCalendarService.isSignedIn.mockReturnValue(true);
    googleCalendarService.getCurrentUser.mockReturnValue(mockUser);
    
    // Call the stored callback
    await act(async () => {
      if (signInListener) {
        signInListener(true);
      }
    });
    
    // Verify signed-in UI
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });
});

describe('Canvas Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isCanvasConfigured.mockReturnValue(false);
    canvasService.testConnection.mockResolvedValue(true);
  });

  test('shows connect button when not connected', async () => {
    await act(async () => {
      render(<Account />);
    });
    
    expect(screen.getByTestId('canvas-connect-button')).toBeInTheDocument();
  });

  test('shows form when connect button is clicked', async () => {
    await act(async () => {
      render(<Account />);
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('canvas-connect-button'));
    });
    
    expect(screen.getByLabelText('Canvas Developer Token')).toBeInTheDocument();
    expect(screen.getByLabelText('School Domain')).toBeInTheDocument();
  });

  test('successfully connects with valid credentials', async () => {
    await act(async () => {
      render(<Account />);
    });
    
    // Click connect button to show form
    await act(async () => {
      fireEvent.click(screen.getByTestId('canvas-connect-button'));
    });
    
    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Canvas Developer Token'), {
        target: { value: 'valid-token' }
      });
      fireEvent.change(screen.getByLabelText('School Domain'), {
        target: { value: 'harvard' }
      });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Connect' }));
    });
    
    // Check that the service was called with correct values
    expect(canvasService.setCredentials).toHaveBeenCalledWith('valid-token', 'harvard');
    expect(canvasService.testConnection).toHaveBeenCalled();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Successfully connected to Canvas API')).toBeInTheDocument();
    });
  });

  test('shows error message with invalid credentials', async () => {
    // Mock the testConnection to fail
    canvasService.testConnection.mockRejectedValue(new Error('Invalid credentials'));
    
    await act(async () => {
      render(<Account />);
    });
    
    // Click connect button to show form
    await act(async () => {
      fireEvent.click(screen.getByTestId('canvas-connect-button'));
    });
    
    // Fill in the form with invalid credentials
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Canvas Developer Token'), {
        target: { value: 'invalid-token' }
      });
      fireEvent.change(screen.getByLabelText('School Domain'), {
        target: { value: 'invalid-domain' }
      });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Connect' }));
    });
    
    // Check that credentials were cleared after failure
    expect(canvasService.clearCredentials).toHaveBeenCalled();
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to connect to Canvas. Please check your credentials.')).toBeInTheDocument();
    });
  });

  test('can disconnect after successful connection', async () => {
    // Start with connected state
    isCanvasConfigured.mockReturnValue(true);
    
    await act(async () => {
      render(<Account />);
    });
    
    // Click disconnect button
    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect Canvas Account'));
    });
    
    expect(canvasService.clearCredentials).toHaveBeenCalled();
    expect(screen.getByTestId('canvas-connect-button')).toBeInTheDocument();
  });

  test('canceling form returns to connect button', async () => {
    await act(async () => {
      render(<Account />);
    });
    
    // Click connect button to show form
    await act(async () => {
      fireEvent.click(screen.getByTestId('canvas-connect-button'));
    });
    
    // Click cancel button
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    
    expect(screen.getByTestId('canvas-connect-button')).toBeInTheDocument();
    expect(screen.queryByLabelText('Canvas Developer Token')).not.toBeInTheDocument();
  });
});
