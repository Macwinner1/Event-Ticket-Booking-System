const eventService = require('../../src/services/eventService');
const db = require('../../src/config/database');

describe('EventService', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db('events').del();
  });

  describe('createEvent', () => {
    it('should create an event with valid data', async () => {
      const eventData = {
        eventName: 'Test Concert',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 100,
        eventDescription: 'A test concert'
      };

      const result = await eventService.createEvent(eventData);

      expect(result).toHaveProperty('eventId');
      expect(result.eventName).toBe(eventData.eventName);
      expect(result.totalTickets).toBe(eventData.totalTickets);
      expect(result.availableTickets).toBe(eventData.totalTickets);
      expect(result).toHaveProperty('createdAt');
    });

    it('should create event without description', async () => {
      const eventData = {
        eventName: 'Test Event',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 50
      };

      const result = await eventService.createEvent(eventData);

      expect(result).toHaveProperty('eventId');
      expect(result.eventName).toBe(eventData.eventName);
    });
  });

  describe('getEventStatus', () => {
    it('should return event status', async () => {
      const event = await eventService.createEvent({
        eventName: 'Status Test',
        eventDate: '2024-12-31T20:00:00Z',
        totalTickets: 100
      });

      const status = await eventService.getEventStatus(event.eventId);

      expect(status.eventId).toBe(event.eventId);
      expect(status.totalTickets).toBe(100);
      expect(status.availableTickets).toBe(100);
      expect(status.bookedTickets).toBe(0);
      expect(status.waitingListCount).toBe(0);
    });

    it('should return null for non-existent event', async () => {
      const status = await eventService.getEventStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });
});
