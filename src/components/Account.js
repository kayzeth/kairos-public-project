import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faFileImport, faFileExport, faSync, faCheck, faTimes, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import googleCalendarService from '../services/googleCalendarService';
import { isConfigured } from '../config/googleCalendarConfig';

const Account = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ status: 'idle', message: '' });
  const [apiConfigured, setApiConfigured] = useState(isConfigured());

  useEffect(() => {
    const initializeGoogleCalendar = async () => {
      // Check if API credentials are configured
      if (!apiConfigured) {
        setSyncStatus({
          status: 'error',
          message: 'Google Calendar API credentials are not configured. Please add your API credentials to continue.'
        });
        return;
      }
      
      setSyncStatus({ status: 'loading', message: 'Initializing Google Calendar...' });
      
      try {
        await googleCalendarService.initialize();
        
        // Set initial sign-in state
        const initialSignInState = googleCalendarService.isSignedIn();
        setIsSignedIn(initialSignInState);
        
        if (initialSignInState) {
          setUser(googleCalendarService.getCurrentUser());
          setSyncStatus({ status: 'success', message: 'Successfully connected to Google Calendar' });
          setTimeout(() => setSyncStatus({ status: 'idle', message: '' }), 3000);
        } else {
          setSyncStatus({ status: 'idle', message: '' });
        }
        
        // Add listener for sign-in state changes
        googleCalendarService.addSignInListener((isSignedIn) => {
          setIsSignedIn(isSignedIn);
          if (isSignedIn) {
            setUser(googleCalendarService.getCurrentUser());
            setSyncStatus({ status: 'success', message: 'Successfully signed in to Google Calendar' });
            setTimeout(() => setSyncStatus({ status: 'idle', message: '' }), 3000);
          } else {
            setUser(null);
            setSyncStatus({ status: 'idle', message: '' });
          }
        });
      } catch (error) {
        console.error('Error initializing Google Calendar service:', error);
        setSyncStatus({
          status: 'error',
          message: error.message || 'Failed to initialize Google Calendar API'
        });
      }
    };

    initializeGoogleCalendar();
  }, [apiConfigured]);

  // Handle sign-in button click
  const handleSignIn = async () => {
    try {
      setSyncStatus({ status: 'loading', message: 'Signing in...' });
      await googleCalendarService.signIn();
      // The sign-in process is handled by the callback in the Google Identity Services
      // The status will be updated by the sign-in listener in useEffect
    } catch (error) {
      console.error('Error signing in:', error);
      setSyncStatus({
        status: 'error',
        message: 'Failed to sign in with Google. Please try again.'
      });
    }
  };

  // Handle sign-out button click
  const handleSignOut = async () => {
    try {
      setSyncStatus({ status: 'loading', message: 'Signing out...' });
      await googleCalendarService.signOut();
      setSyncStatus({ status: 'idle', message: '' });
    } catch (error) {
      console.error('Error signing out:', error);
      setSyncStatus({
        status: 'error',
        message: 'Failed to sign out from Google. Please try again.'
      });
    }
  };

  // Import events from Google Calendar
  const importFromGoogleCalendar = async () => {
    if (!isSignedIn) {
      handleSignIn();
      return;
    }

    setSyncStatus({ status: 'loading', message: 'Importing events from Google Calendar...' });

    try {
      // Get events from Google Calendar (last 30 days to next 30 days)
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      const events = await googleCalendarService.importEvents(oneMonthAgo, oneMonthFromNow);
      
      // Process and store the events (you would need to implement this part)
      // This is a placeholder for where you would store the events in your app's state
      console.log('Imported events:', events);
      
      // For demonstration purposes, we'll just set a success message
      setSyncStatus({
        status: 'success',
        message: `Successfully imported ${events.length} events from Google Calendar`
      });
      
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Error importing events from Google Calendar:', error);
      setSyncStatus({
        status: 'error',
        message: 'Failed to import events from Google Calendar'
      });
    }
  };

  // Export events to Google Calendar
  const exportToGoogleCalendar = async () => {
    if (!isSignedIn) {
      handleSignIn();
      return;
    }

    setSyncStatus({ status: 'loading', message: 'Exporting events to Google Calendar...' });

    try {
      // This is a placeholder for where you would get events from your app's state
      // For demonstration purposes, we'll create a sample event
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const event = {
        title: 'Kairos Test Event',
        description: 'A test event created by Kairos Calendar App',
        location: 'Online',
        start: tomorrow.toISOString(),
        end: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
        allDay: false,
        color: '#d2b48c'
      };

      const result = await googleCalendarService.exportEvent(event);

      console.log('Event created:', result.htmlLink);
      setSyncStatus({
        status: 'success',
        message: 'Successfully exported event to Google Calendar'
      });
      
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Error exporting events to Google Calendar:', error);
      setSyncStatus({
        status: 'error',
        message: 'Failed to export events to Google Calendar'
      });
    }
  };

  // Sync with Google Calendar (both import and export)
  const syncWithGoogleCalendar = async () => {
    if (!isSignedIn) {
      handleSignIn();
      return;
    }

    setSyncStatus({ status: 'loading', message: 'Syncing with Google Calendar...' });

    try {
      // Get the current date for sync range
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      // Import events from Google Calendar
      const importedEvents = await googleCalendarService.importEvents(oneMonthAgo, oneMonthFromNow);
      console.log(`Imported ${importedEvents.length} events from Google Calendar`);
      
      // Here you would typically:  
      // 1. Get all local events
      // 2. Compare with imported events to avoid duplicates
      // 3. Add new Google events to local storage
      // 4. Export local events that don't exist in Google Calendar
      
      setSyncStatus({
        status: 'success',
        message: `Successfully synced with Google Calendar. Imported ${importedEvents.length} events.`
      });
      
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      setSyncStatus({
        status: 'error',
        message: 'Failed to sync with Google Calendar'
      });
    }
  };

  return (
    <div className="account-container">
      <h1 className="account-title">Account Settings</h1>
      
      {!apiConfigured && (
        <div className="api-credentials-warning">
          <h2>Google Calendar API Credentials Required</h2>
          <p>To use Google Calendar integration, you need to configure your API credentials:</p>
          <ol>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Create a new project</li>
            <li>Enable the Google Calendar API</li>
            <li>Create OAuth 2.0 credentials (Web application type)</li>
            <li>Add authorized JavaScript origins for your domain (e.g., http://localhost:3000 for development)</li>
            <li>Add authorized redirect URIs (e.g., http://localhost:3000 for development)</li>
            <li>Copy the API key and Client ID</li>
            <li>Add them to your project in one of these ways:
              <ul>
                <li>Create a <code>.env</code> file in your project root with:
                  <pre>REACT_APP_GOOGLE_API_KEY=your_api_key_here
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here</pre>
                </li>
                <li>Or update the values directly in <code>src/config/googleCalendarConfig.js</code></li>
              </ul>
            </li>
            <li>Restart your development server</li>
          </ol>
        </div>
      )}
      
      <div className="account-section">
        <h2 className="section-title">User Profile</h2>
        
        <div className="profile-section">
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-placeholder">
                  <FontAwesomeIcon icon={faCalendarAlt} size="2x" />
                </div>
              )}
            </div>
            <div className="profile-details">
              <h3>{user?.name || 'Kairos User'}</h3>
              <p>{user?.email || 'Sign in to sync your calendar'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="account-section">
        <h2 className="section-title">Google Calendar Integration</h2>
        
        <div className="google-auth-section">
          {!isSignedIn ? (
            <div className="auth-card">
              <div className="auth-card-content">
                <FontAwesomeIcon icon={faGoogle} size="3x" className="google-icon" />
                <h3>Connect with Google Calendar</h3>
                <p>Link your Google Calendar to import and export events</p>
                <button 
                  className="button button-primary google-button"
                  onClick={handleSignIn}
                >
                  <FontAwesomeIcon icon={faGoogle} /> Sign in with Google
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-card">
              <div className="auth-card-content">
                <div className="user-profile">
                  {user?.imageUrl && (
                    <img 
                      src={user.imageUrl} 
                      alt={user.name} 
                      className="profile-image" 
                    />
                  )}
                  <div className="user-info">
                    <h3>{user?.name}</h3>
                    <p>{user?.email}</p>
                  </div>
                </div>
                
                <div className="connected-status">
                  <FontAwesomeIcon icon={faCheck} className="status-icon success" />
                  <span>Connected to Google Calendar</span>
                </div>
                
                <div className="google-actions">
                  <button 
                    className="button button-secondary"
                    onClick={importFromGoogleCalendar}
                  >
                    <FontAwesomeIcon icon={faFileImport} /> Import Events
                  </button>
                  <button 
                    className="button button-secondary"
                    onClick={exportToGoogleCalendar}
                  >
                    <FontAwesomeIcon icon={faFileExport} /> Export Events
                  </button>
                  <button 
                    className="button button-primary"
                    onClick={syncWithGoogleCalendar}
                  >
                    <FontAwesomeIcon icon={faSync} /> Sync Calendar
                  </button>
                </div>
                
                <button 
                  className="button button-text"
                  onClick={handleSignOut}
                >
                  Disconnect Google Account
                </button>
              </div>
            </div>
          )}
        </div>
        
        {syncStatus.status !== 'idle' && (
          <div className={`sync-status ${syncStatus.status}`}>
            <FontAwesomeIcon 
              icon={
                syncStatus.status === 'loading' ? faSync :
                syncStatus.status === 'success' ? faCheck : faTimes
              } 
              className={`status-icon ${syncStatus.status === 'loading' ? 'fa-spin' : ''}`}
            />
            <span>{syncStatus.message}</span>
          </div>
        )}
        
        <div className="integration-note">
          <p>
            <strong>Note:</strong> To use Google Calendar integration, you need to:
          </p>
          <ol>
            <li>Sign in with your Google account</li>
            <li>Allow Kairos to access your Google Calendar</li>
            <li>Use the buttons above to import, export, or sync events</li>
          </ol>
          <p>
            Your calendar data is only transferred when you explicitly request it using the buttons above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Account;
