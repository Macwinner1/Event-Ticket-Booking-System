const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

describe('Concurrency Tests', () => {
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

  it('should handle concurrent bookings for last ticket correctly', async () => {
    const event = await request(app)
      .post('/initialize')
      .send({
        eventName: 'Concurrency Test',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 1
      });

    const eventId = event.body.eventId;

    // Simulate 10 concurrent booking requests
    const bookingPromises = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .post('/book')
        .send({
          eventId,
          userId: `user${i}`,
          userName: `User ${i}`,
          userEmail: `user${i}@example.com`
        })
    );

    const results = await Promise.all(bookingPromises);

    // Count confirmed and waiting
    const confirmed = results.filter(r => r.body.status === 'confirmed');
    const waiting = results.filter(r => r.body.status === 'waiting');

    expect(confirmed.length).toBe(1);
    expect(waiting.length).toBe(9);

    // Verify waiting list positions are sequential
    const positions = waiting.map(r => r.body.position).sort((a, b) => a - b);
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Verify database state
    const status = await request(app).get(`/status/${eventId}`);
    expect(status.body.availableTickets).toBe(0);
    expect(status.body.bookedTickets).toBe(1);
    expect(status.body.waitingListCount).toBe(9);
  });

  it('should handle concurrent cancellations correctly', async () => {
    const event = await request(app)
      .post('/initialize')
      .send({
        eventName: 'Cancel Test',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 5
      });

    const eventId = event.body.eventId;

    // Create 5 bookings
    const bookings = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/book')
          .send({
            eventId,
            userId: `user${i}`,
            userName: `User ${i}`,
            userEmail: `user${i}@example.com`
          })
      )
    );

    // Add 5 to waiting list
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/book')
          .send({
            eventId,
            userId: `waiting${i}`,
            userName: `Waiting ${i}`,
            userEmail: `waiting${i}@example.com`
          })
      )
    );

    // Cancel all bookings concurrently
    const cancellations = await Promise.all(
      bookings.map(b =>
        request(app)
          .post('/cancel')
          .send({
            bookingId: b.body.bookingId,
            userId: b.body.userId
          })
      )
    );

    // All cancellations should succeed
    expect(cancellations.every(c => c.status === 200)).toBe(true);

    // Verify final state
    const status = await request(app).get(`/status/${eventId}`);
    expect(status.body.bookedTickets).toBe(5);
    expect(status.body.waitingListCount).toBe(0);
    expect(status.body.availableTickets).toBe(0);
  });

  it('should maintain data integrity with mixed operations', async () => {
    const event = await request(app)
      .post('/initialize')
      .send({
        eventName: 'Mixed Ops Test',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 10
      });

    const eventId = event.body.eventId;

    // Create initial bookings
    const initialBookings = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/book')
          .send({
            eventId,
            userId: `initial${i}`,
            userName: `Initial ${i}`,
            userEmail: `initial${i}@example.com`
          })
      )
    );

    // Mix of new bookings and cancellations
    const mixedOps = [
      ...Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/book')
          .send({
            eventId,
            userId: `new${i}`,
            userName: `New ${i}`,
            userEmail: `new${i}@example.com`
          })
      ),
      ...initialBookings.slice(0, 3).map(b =>
        request(app)
          .post('/cancel')
          .send({
            bookingId: b.body.bookingId,
            userId: b.body.userId
          })
      )
    ];

    await Promise.all(mixedOps);

    // Verify consistency
    const status = await request(app).get(`/status/${eventId}`);
    const totalAccounted = status.body.bookedTickets + status.body.availableTickets;
    expect(totalAccounted).toBe(10);
  });
});
