const express = require('express');
const eventController = require('./controllers/eventController');
const bookingController = require('./controllers/bookingController');

const app = express();

app.use(express.json());

// Routes
app.post('/initialize', eventController.initialize.bind(eventController));
app.get('/status/:eventId', eventController.getStatus.bind(eventController));
app.post('/book', bookingController.book.bind(bookingController));
app.post('/cancel', bookingController.cancel.bind(bookingController));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;
