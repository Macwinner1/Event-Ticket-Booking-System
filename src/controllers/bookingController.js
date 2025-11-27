const bookingService = require('../services/bookingService');

class BookingController {
  async book(req, res) {
    try {
      const { eventId, userId, userName, userEmail, ticketQuantity } = req.body;

      if (!eventId || !userId || !userName || !userEmail) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'eventId, userId, userName, and userEmail are required'
          }
        });
      }

      const result = await bookingService.bookTicket({
        eventId,
        userId,
        userName,
        userEmail,
        ticketQuantity
      });

      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({
          error: {
            code: 'EVENT_NOT_FOUND',
            message: error.message
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  async cancel(req, res) {
    try {
      const { bookingId, userId } = req.body;

      if (!bookingId || !userId) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'bookingId and userId are required'
          }
        });
      }

      const result = await bookingService.cancelBooking(bookingId, userId);

      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Booking not found') {
        return res.status(404).json({
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: error.message
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new BookingController();
