# Quick Start Guide

Get the Event Ticket Booking System up and running in 5 minutes.

## Prerequisites

- Node.js v18 or higher
- npm or yarn

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

The default configuration uses SQLite, which requires no additional setup.

### 3. Run Database Migrations
```bash
npm run migrate
```

### 4. Start the Server
```bash
npm start
```

The API will be available at `http://localhost:3000`

## Verify Installation

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok"}
```

## Quick Test

### 1. Create an Event
```bash
curl -X POST http://localhost:3000/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Test Concert",
    "eventDate": "2024-12-31T20:00:00Z",
    "totalTickets": 5
  }'
```

Save the `eventId` from the response.

### 2. Book a Ticket
```bash
curl -X POST http://localhost:3000/book \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "YOUR_EVENT_ID",
    "userId": "user1",
    "userName": "John Doe",
    "userEmail": "john@example.com"
  }'
```

### 3. Check Event Status
```bash
curl http://localhost:3000/status/YOUR_EVENT_ID
```

## Run Tests

```bash
npm test
```

Expected output: All tests pass with 95%+ coverage.

## Run Demo Script

```bash
npm install axios
node examples/demo.js
```

This will demonstrate the complete booking flow including:
- Event creation
- Multiple bookings
- Waiting list management
- Cancellation with auto-assignment

## Import Postman Collection

Import `postman_collection.json` into Postman for easy API testing.

## Development Mode

For auto-reload during development:
```bash
npm run dev
```

## Troubleshooting

### Port Already in Use
Change the port in `.env`:
```
PORT=3001
```

### Database Issues
Reset the database:
```bash
npm run migrate:rollback
npm run migrate
```

### Test Failures
Ensure no server is running on port 3000 during tests.

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Review the [API Documentation](README.md#api-documentation)
- Check out the [Architecture section](README.md#architecture--design-decisions)
- Explore concurrency tests in `tests/integration/concurrency.test.js`

## Support

For issues or questions, please refer to the main README.md file.
