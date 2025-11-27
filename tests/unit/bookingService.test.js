const bookingService = require('../../src/services/bookingService');
const eventService = require('../../src/services/eventService');
const db = require('../../src/config/database');

describe('BookingService', () => {
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

  describe('bookTicket', () => {
    it('should book a ticket when available', async () => {
      const event = await eventService.createEvent({
        eventName: 'Test Event',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 10
      });

      const booking = await bookingService.bookTicket({
        eventId: event.eventId,
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        ticketQuantity: 1
      });

      expect(booking.status).toBe('confirmed');
      expect(booking).toHaveProperty('bookingId');
      expect(booking.eventId).toBe(event.eventId);
      expect(booking.userId).toBe('user1');
    });

    it('should add to waiting list when sold out', async () => {
      const event = await eventService.createEvent({
        eventName: 'Test Event',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 1
      });

      // Book the only ticket
      await bookingService.bookTicket({
        eventId: event.eventId,
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com'
      });

      // Try to book another
      const waitingList = await bookingService.bookTicket({
        eventId: event.eventId,
        userId: 'user2',
        userName: 'Jane Doe',
        userEmail: 'jane@example.com'
      });

      expect(waitingList.status).toBe('waiting');
      expect(waitingList).toHaveProperty('waitingListId');
      expect(waitingList.position).toBe(1);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        bookingService.bookTicket({
          eventId: 'non-existent',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com'
        })
      ).rejects.toThrow('Event not found');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and increment available tickets', async () => {
      const event = await eventService.createEvent({
        eventName: 'Test Event',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 10
      });

      const booking = await bookingService.bookTicket({
        eventId: event.eventId,
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com'
      });

      const result = await bookingService.cancelBooking(booking.bookingId, 'user1');

      expect(result.message).toBe('Booking cancelled successfully');
      expect(result.cancelledBookingId).toBe(booking.bookingId);
      expect(result.assignedToUser).toBeNull();

      const status = await eventService.getEventStatus(event.eventId);
      expect(status.availableTickets).toBe(10);
    });

    it('should assign ticket to waiting list user on cancellation', async () => {
      const event = await eventService.createEvent({
        eventName: 'Test Event',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 1
      });

      const booking = await bookingService.bookTicket({
        eventId: event.eventId,
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com'
      });

      await bookingService.bookTicket({
        eventId: event.eventId,
        userId: 'user2',
        userName: 'Jane Doe',
        userEmail: 'jane@example.com'
      });

      const result = await bookingService.cancelBooking(booking.bookingId, 'user1');

      expect(result.assignedToUser).not.toBeNull();
      expect(result.assignedToUser.userId).toBe('user2');
      expect(result.assignedToUser.userName).toBe('Jane Doe');

      const status = await eventService.getEventStatus(event.eventId);
      expect(status.availableTickets).toBe(0);
      expect(status.waitingListCount).toBe(0);
    });

    it('should throw error for non-existent booking', async () => {
      await expect(
        bookingService.cancelBooking('non-existent', 'user1')
      ).rejects.toThrow('Booking not found');
    });
  });
});
