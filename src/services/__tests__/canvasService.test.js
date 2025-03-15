import canvasService from '../canvasService';

// Mock fetch globally
global.fetch = jest.fn();

describe('Canvas Service', () => {
  const TEST_TOKEN = process.env.REACT_APP_CANVAS_TEST_TOKEN;
  const TEST_DOMAIN = process.env.REACT_APP_CANVAS_TEST_DOMAIN || 'harvard';

  // Set up localStorage mock before each test
  beforeEach(() => {
    // Create storage mock
    const storageMock = {
      store: {},
      getItem: jest.fn((key) => storageMock.store[key] || null),
      setItem: jest.fn((key, value) => { storageMock.store[key] = value; }),
      removeItem: jest.fn((key) => { delete storageMock.store[key]; }),
      clear: jest.fn(() => { storageMock.store = {}; })
    };

    // Replace localStorage with our mock
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      writable: true
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    test('successfully connects with valid credentials', async () => {
      // Skip test if no test token is provided
      if (!TEST_TOKEN) {
        console.warn('Skipping Canvas API test: No test token provided');
        return;
      }

      // Set up localStorage with test credentials
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'canvasToken') return TEST_TOKEN;
        if (key === 'canvasDomain') return TEST_DOMAIN;
        return null;
      });

      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Test User' })
      });

      const result = await canvasService.testConnection();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        '/api/canvas/test-connection',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: TEST_TOKEN,
            domain: TEST_DOMAIN
          })
        }
      );
    });

    test('fails with invalid credentials', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'canvasToken') return 'invalid-token';
        if (key === 'canvasDomain') return TEST_DOMAIN;
        return null;
      });

      fetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Invalid token')
      });

      await expect(canvasService.testConnection()).rejects.toThrow('Invalid token');
    });

    test('fails when credentials are missing', async () => {
      localStorage.getItem.mockReturnValue(null);

      await expect(canvasService.testConnection()).rejects.toThrow('Canvas credentials not found');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('handles network errors', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'canvasToken') return TEST_TOKEN || 'test-token';
        if (key === 'canvasDomain') return TEST_DOMAIN;
        return null;
      });

      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(canvasService.testConnection()).rejects.toThrow('Network error');
    });
  });

  describe('credential management', () => {
    test('setCredentials stores token and domain', () => {
      canvasService.setCredentials('test-token', TEST_DOMAIN);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('canvasToken', 'test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('canvasDomain', TEST_DOMAIN);
    });

    test('clearCredentials removes token and domain', () => {
      canvasService.clearCredentials();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('canvasToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('canvasDomain');
    });
  });
});
