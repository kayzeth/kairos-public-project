const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/canvas/test-connection', async (req, res) => {
  const { token, domain } = req.body;
  
  if (!token || !domain) {
    return res.status(400).json({ error: 'Token and domain are required' });
  }

  try {
    const response = await fetch(`https://canvas.${domain}.edu/api/v1/users/self`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).send(error);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Canvas API error:', error);
    res.status(500).send('Failed to connect to Canvas API');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
