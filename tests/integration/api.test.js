const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db('waiting_list').del();
    await db('bookings').del();
    await db('events').del();
  });

  describe('POST /initialize', () => {
    it('should create a new event', async () => {
      const response = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Rock Concert',
          eventDate: '2024-12-31T20:00:00Z',
          totalTickets: 100,
          eventDescription: 'Amazing concert'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('eventId');
      expect(response.body.eventName).toBe('Rock Concert');
      expect(response.body.totalTickets).toBe(100);
      expect(response.body.availableTickets).toBe(100);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Test Event'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid totalTickets', async () => {
      const response = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Test Event',
          eventDate: '2024-12-31T20:00:00Z',
          totalTickets: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /status/:eventId', () => {
    it('should return event status', async () => {
      const createResponse = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Test Event',
          eventDate: '2024-12-31T20:00:00Z',
          totalTickets: 50
        });

      const eventId = createResponse.body.eventId;

      const response = await request(app)
        .get(`/status/${eventId}`);

      expect(response.status).toBe(200);
      expect(response.body.eventId).toBe(eventId);
      expect(response.body.totalTickets).toBe(50);
      expect(response.body.availableTickets).toBe(50);
      expect(response.body.bookedTickets).toBe(0);
      expect(response.body.waitingListCount).toBe(0);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/status/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EVENT_NOT_FOUND');
    });
  });

  describe('POST /book', () => {
    it('should book a ticket successfully', async () => {
      const event = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Test Event',
          eventDate: '2024-12-31T20:00:00Z',
          totalTickets: 10
        });

      const response = await request(app)
        .post('/book')
        .send({
          eventId: event.body.eventId,
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('confirmed');
      expect(response.body).toHaveProperty('bookingId');
    });

    it('should add to waiting list when sold out', async () => {
      const event = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Test Event',
          eventDate: '2024-12-31T20:00:00Z',
          totalTickets: 1
        });

      await request(app)
        .post('/book')
        .send({
          eventId: event.body.eventId,
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com'
        });

      const response = await request(app)
        .post('/book')
        .send({
          eventId: event.body.eventId,
          userId: 'user2',
          userName: 'Jane Doe',
          userEmail: 'jane@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('waiting');
      expect(response.body.position).toBe(1);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/book')
        .send({
          userId: 'user1'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('POST /cancel', () => {
    it('should cancel booking successfully', async () => {
      const event = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Test Event',
          eventDate: '2024-12-31T20:00:00Z',
          totalTickets: 10
        });

      const booking = await request(app)
        .post('/book')
        .send({
          eventId: event.body.eventId,
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com'
        });

      const response = await request(app)
        .post('/cancel')
        .send({
          bookingId: booking.body.bookingId,
          userId: 'user1'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking cancelled successfully');
      expect(response.body.cancelledBookingId).toBe(booking.body.bookingId);
    });

    it('should assign to waiting list on cancellation', async () => {
      const event = await request(app)
        .post('/initialize')
        .send({
          eventName: 'Test Event',
          eventDate: '2024-12-31T20:00:00Z',
          totalTickets: 1
        });

      const booking = await request(app)
        .post('/book')
        .send({
          eventId: event.body.eventId,
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com'
        });

      await request(app)
        .post('/book')
        .send({
          eventId: event.body.eventId,
          userId: 'user2',
          userName: 'Jane Doe',
          userEmail: 'jane@example.com'
        });

      const response = await request(app)
        .post('/cancel')
        .send({
          bookingId: booking.body.bookingId,
          userId: 'user1'
        });

      expect(response.status).toBe(200);
      expect(response.body.assignedToUser).not.toBeNull();
      expect(response.body.assignedToUser.userId).toBe('user2');
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .post('/cancel')
        .send({
          bookingId: 'non-existent',
          userId: 'user1'
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('BOOKING_NOT_FOUND');
    });
  });
});
