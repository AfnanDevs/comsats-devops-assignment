const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devopsdb';

// Only connect to DB and start the live listener if NOT running unit tests
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

app.get('/', (req, res) => {
  res.status(200).send('<h1>Welcome to the DevOps Automated Web App!</h1><p>Status: Online</p>');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', database: 'CONNECTED' });
});

// Export the app instance directly
module.exports = app;