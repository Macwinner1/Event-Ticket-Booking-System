# Event Ticket Booking System

A scalable, concurrent event ticket booking system built with Node.js that handles ticket inventory, concurrent bookings, waiting lists, and ensures data integrity under high-load conditions.

## Features

- **Event Management**: Create events with configurable ticket inventory
- **Concurrent Booking**: Handle multiple simultaneous booking requests without race conditions
- **Automatic Waiting List**: Users are automatically added to waiting list when tickets are sold out
- **Smart Cancellation**: Cancelled tickets are automatically assigned to waiting list users
- **ACID Transactions**: Database-level locking ensures data consistency
- **High Test Coverage**: 80%+ code coverage with comprehensive unit and integration tests

## Technology Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: SQLite (easily swappable to PostgreSQL/MySQL)
- **Query Builder**: Knex.js
- **Testing**: Jest + Supertest
- **UUID Generation**: uuid

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd event-ticket-booking-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run database migrations:
```bash
npm run migrate
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Running Tests

### All Tests with Coverage
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

## API Documentation

### 1. Initialize Event

Create a new event with ticket inventory.

**Endpoint**: `POST /initialize`

**Request Body**:
```json
{
  "eventName": "Rock Concert 2024",
  "eventDate": "2024-12-31T20:00:00Z",
  "totalTickets": 100,
  "eventDescription": "Amazing rock concert" 
}
```

**Response** (201):
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventName": "Rock Concert 2024",
  "totalTickets": 100,
  "availableTickets": 100,
  "createdAt": "2024-11-26T10:00:00.000Z"
}
```

### 2. Book Ticket

Book a ticket or join the waiting list if sold out.

**Endpoint**: `POST /book`

**Request Body**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "ticketQuantity": 1
}
```

**Response - Confirmed** (200):
```json
{
  "bookingId": "660e8400-e29b-41d4-a716-446655440001",
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "status": "confirmed",
  "ticketQuantity": 1,
  "bookedAt": "2024-11-26T10:05:00.000Z"
}
```

**Response - Waiting List** (200):
```json
{
  "waitingListId": "770e8400-e29b-41d4-a716-446655440002",
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user456",
  "status": "waiting",
  "position": 1,
  "addedAt": "2024-11-26T10:10:00.000Z"
}
```

### 3. Cancel Booking

Cancel a booking with automatic ticket reassignment.

**Endpoint**: `POST /cancel`

**Request Body**:
```json
{
  "bookingId": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "user123"
}
```

**Response** (200):
```json
{
  "message": "Booking cancelled successfully",
  "cancelledBookingId": "660e8400-e29b-41d4-a716-446655440001",
  "assignedToUser": {
    "userId": "user456",
    "bookingId": "880e8400-e29b-41d4-a716-446655440003",
    "userName": "Jane Doe"
  }
}
```

### 4. Get Event Status

Retrieve current event status and availability.

**Endpoint**: `GET /status/:eventId`

**Response** (200):
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventName": "Rock Concert 2024",
  "totalTickets": 100,
  "availableTickets": 45,
  "bookedTickets": 55,
  "waitingListCount": 10,
  "lastUpdated": "2024-11-26T10:15:00.000Z"
}
```

### Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

**Error Codes**:
- `INVALID_INPUT` (400): Missing or invalid request parameters
- `EVENT_NOT_FOUND` (404): Event does not exist
- `BOOKING_NOT_FOUND` (404): Booking does not exist
- `INTERNAL_ERROR` (500): Server error

## Architecture & Design Decisions

### Concurrency Handling

The system uses **database-level pessimistic locking** to prevent race conditions:

1. **SELECT ... FOR UPDATE**: Locks event rows during booking/cancellation
2. **Transactions**: All operations wrapped in ACID transactions
3. **Row-level Locking**: Only affected records are locked, not entire tables

### Database Schema

**Events Table**: Stores event details and available ticket count
**Bookings Table**: Records confirmed ticket bookings
**Waiting List Table**: Manages queue with position tracking

### Code Organization

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── config/          # Database configuration
└── app.js           # Express app setup

tests/
├── unit/            # Unit tests for services
└── integration/     # API and concurrency tests

migrations/          # Database schema migrations
```

### Key Design Patterns

- **Service Layer Pattern**: Business logic separated from controllers
- **Transaction Script**: Each operation wrapped in database transaction
- **Repository Pattern**: Database access abstracted through Knex.js

## Testing Strategy

### Unit Tests
- Event service logic
- Booking service with transaction handling
- Waiting list management
- Cancellation with reassignment

### Integration Tests
- Full API endpoint workflows
- Database transaction verification
- Error handling scenarios

### Concurrency Tests
- 100 simultaneous bookings for last ticket
- Multiple concurrent cancellations
- Mixed operations (bookings + cancellations)
- Data integrity validation

## Performance Considerations

- **Database Indexing**: Composite indexes on frequently queried columns
- **Connection Pooling**: Knex.js manages connection pool automatically
- **Transaction Isolation**: READ COMMITTED level for optimal performance
- **Atomic Operations**: Single database round-trip for critical operations

## Future Enhancements

- Rate limiting for API endpoints
- Authentication and authorization
- Event expiration and cleanup
- Email notifications for waiting list promotions
- Multiple ticket types per event
- Booking expiration timeouts
- Caching layer for event status
- WebSocket support for real-time updates

## License

MIT
