const eventController = require('../../src/controllers/eventController');
const bookingController = require('../../src/controllers/bookingController');
const eventService = require('../../src/services/eventService');
const bookingService = require('../../src/services/bookingService');

jest.mock('../../src/services/eventService');
jest.mock('../../src/services/bookingService');

describe('EventController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should handle service errors', async () => {
      req.body = {
        eventName: 'Test',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 10
      };

      eventService.createEvent.mockRejectedValue(new Error('Database error'));

      await eventController.initialize(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database error'
        }
      });
    });
  });

  describe('getStatus', () => {
    it('should handle service errors', async () => {
      req.params = { eventId: 'test-id' };
      eventService.getEventStatus.mockRejectedValue(new Error('Database error'));

      await eventController.getStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database error'
        }
      });
    });
  });
});

describe('BookingController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('book', () => {
    it('should handle service errors', async () => {
      req.body = {
        eventId: 'test-id',
        userId: 'user1',
        userName: 'Test User',
        userEmail: 'test@example.com'
      };

      bookingService.bookTicket.mockRejectedValue(new Error('Database error'));

      await bookingController.book(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database error'
        }
      });
    });
  });

  describe('cancel', () => {
    it('should handle service errors', async () => {
      req.body = {
        bookingId: 'booking-id',
        userId: 'user1'
      };

      bookingService.cancelBooking.mockRejectedValue(new Error('Database error'));

      await bookingController.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database error'
        }
      });
    });
  });
});
