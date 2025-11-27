const eventService = require('../services/eventService');

class EventController {
  async initialize(req, res) {
    try {
      const { eventName, eventDate, totalTickets, eventDescription } = req.body;

      if (!eventName || !eventDate || !totalTickets) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'eventName, eventDate, and totalTickets are required'
          }
        });
      }

      if (totalTickets <= 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'totalTickets must be greater than 0'
          }
        });
      }

      const event = await eventService.createEvent({
        eventName,
        eventDate,
        totalTickets,
        eventDescription
      });

      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  async getStatus(req, res) {
    try {
      const { eventId } = req.params;

      const status = await eventService.getEventStatus(eventId);

      if (!status) {
        return res.status(404).json({
          error: {
            code: 'EVENT_NOT_FOUND',
            message: 'Event not found'
          }
        });
      }

      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new EventController();
