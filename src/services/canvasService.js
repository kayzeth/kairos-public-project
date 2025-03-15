// Canvas API Service
const canvasService = {
  testConnection: async () => {
    const token = localStorage.getItem('canvasToken');
    const domain = localStorage.getItem('canvasDomain');
    
    if (!token || !domain) {
      throw new Error('Canvas credentials not found');
    }

    try {
      // Use the proxy endpoint instead of direct Canvas API call
      const response = await fetch('/api/canvas/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          domain
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to connect to Canvas API');
      }

      return true;
    } catch (error) {
      console.error('Canvas API connection error:', error);
      throw error;
    }
  },

  setCredentials: (token, domain) => {
    localStorage.setItem('canvasToken', token);
    localStorage.setItem('canvasDomain', domain);
  },

  clearCredentials: () => {
    localStorage.removeItem('canvasToken');
    localStorage.removeItem('canvasDomain');
  }
};

export default canvasService;
