const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class BookingService {
  async bookTicket({ eventId, userId, userName, userEmail, ticketQuantity = 1 }) {
    return await db.transaction(async (trx) => {
      // Lock the event row for update
      const event = await trx('events')
        .where({ id: eventId })
        .forUpdate()
        .first();

      if (!event) {
        throw new Error('Event not found');
      }

      // Check if tickets are available
      if (event.available_tickets >= ticketQuantity) {
        // Create booking
        const bookingId = uuidv4();
        const now = new Date().toISOString();

        await trx('bookings').insert({
          id: bookingId,
          event_id: eventId,
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          ticket_quantity: ticketQuantity,
          status: 'confirmed',
          booked_at: now
        });

        // Decrement available tickets
        await trx('events')
          .where({ id: eventId })
          .update({
            available_tickets: event.available_tickets - ticketQuantity,
            updated_at: now
          });

        return {
          bookingId,
          eventId,
          userId,
          status: 'confirmed',
          ticketQuantity,
          bookedAt: now
        };
      } else {
        // Add to waiting list
        const waitingListId = uuidv4();
        const now = new Date().toISOString();

        // Get current position
        const maxPosition = await trx('waiting_list')
          .where({ event_id: eventId })
          .max('position as max')
          .first();

        const position = (maxPosition.max || 0) + 1;

        await trx('waiting_list').insert({
          id: waitingListId,
          event_id: eventId,
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          position,
          added_at: now
        });

        return {
          waitingListId,
          eventId,
          userId,
          status: 'waiting',
          position,
          addedAt: now
        };
      }
    });
  }

  async cancelBooking(bookingId, userId) {
    return await db.transaction(async (trx) => {
      // Get and lock the booking
      const booking = await trx('bookings')
        .where({ id: bookingId, user_id: userId })
        .first();

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Delete the booking
      await trx('bookings').where({ id: bookingId }).del();

      // Lock the event
      const event = await trx('events')
        .where({ id: booking.event_id })
        .forUpdate()
        .first();

      // Increment available tickets
      const now = new Date().toISOString();
      await trx('events')
        .where({ id: booking.event_id })
        .update({
          available_tickets: event.available_tickets + booking.ticket_quantity,
          updated_at: now
        });

      // Check waiting list
      const nextInLine = await trx('waiting_list')
        .where({ event_id: booking.event_id })
        .orderBy('position', 'asc')
        .first();

      let assignedToUser = null;

      if (nextInLine) {
        // Create booking for waiting list user
        const newBookingId = uuidv4();
        
        await trx('bookings').insert({
          id: newBookingId,
          event_id: booking.event_id,
          user_id: nextInLine.user_id,
          user_name: nextInLine.user_name,
          user_email: nextInLine.user_email,
          ticket_quantity: 1,
          status: 'confirmed',
          booked_at: now
        });

        // Remove from waiting list
        await trx('waiting_list').where({ id: nextInLine.id }).del();

        // Decrement available tickets again
        await trx('events')
          .where({ id: booking.event_id })
          .update({
            available_tickets: event.available_tickets,
            updated_at: now
          });

        assignedToUser = {
          userId: nextInLine.user_id,
          bookingId: newBookingId,
          userName: nextInLine.user_name
        };
      }

      return {
        message: 'Booking cancelled successfully',
        cancelledBookingId: bookingId,
        assignedToUser
      };
    });
  }
}

module.exports = new BookingService();
