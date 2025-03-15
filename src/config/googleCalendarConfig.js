// Google Calendar API Configuration
// Replace these values with your actual Google API credentials
export const GOOGLE_API_CONFIG = {
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 'YOUR_API_KEY',
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
};

// Check if API credentials are configured
export const isConfigured = () => {
  return (
    GOOGLE_API_CONFIG.apiKey !== 'YOUR_API_KEY' && 
    GOOGLE_API_CONFIG.clientId !== 'YOUR_CLIENT_ID' &&
    GOOGLE_API_CONFIG.apiKey && 
    GOOGLE_API_CONFIG.clientId
  );
};

// Instructions to get API credentials:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project
// 3. Enable the Google Calendar API
// 4. Create OAuth 2.0 credentials (Web application type)
// 5. Add authorized JavaScript origins for your domain
// 6. Add authorized redirect URIs
// 7. Copy the API key and Client ID to this file
