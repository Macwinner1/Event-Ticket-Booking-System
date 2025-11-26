const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class EventService {
  async createEvent({ eventName, eventDate, totalTickets, eventDescription }) {
    const eventId = uuidv4();
    const now = new Date().toISOString();

    const event = {
      id: eventId,
      event_name: eventName,
      event_date: eventDate,
      total_tickets: totalTickets,
      available_tickets: totalTickets,
      description: eventDescription || null,
      created_at: now,
      updated_at: now
    };

    await db('events').insert(event);

    return {
      eventId: event.id,
      eventName: event.event_name,
      totalTickets: event.total_tickets,
      availableTickets: event.available_tickets,
      createdAt: event.created_at
    };
  }

  async getEventStatus(eventId) {
    const event = await db('events').where({ id: eventId }).first();
    
    if (!event) {
      return null;
    }

    const bookedTickets = await db('bookings')
      .where({ event_id: eventId, status: 'confirmed' })
      .count('* as count')
      .first();

    const waitingListCount = await db('waiting_list')
      .where({ event_id: eventId })
      .count('* as count')
      .first();

    return {
      eventId: event.id,
      eventName: event.event_name,
      totalTickets: event.total_tickets,
      availableTickets: event.available_tickets,
      bookedTickets: bookedTickets.count,
      waitingListCount: waitingListCount.count,
      lastUpdated: event.updated_at
    };
  }
}

module.exports = new EventService();
