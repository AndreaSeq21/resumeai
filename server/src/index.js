const express = require('express');
const cors = require('cors');
require('dotenv').config();

const analyzeRoute = require('./routes/analyze');

const app = express();

// Middleware — runs on every request before your routes
app.use(cors({ origin: 'http://localhost:5173' })); // only allow your React app
app.use(express.json()); // parse JSON request bodies

// Routes
app.use('/api', analyzeRoute);

// Health check — useful for deployment platforms
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));