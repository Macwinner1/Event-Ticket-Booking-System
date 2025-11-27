require('dotenv').config();
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

// Run migrations and start server
db.migrate.latest()
  .then(() => {
    console.log('Database migrations completed');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  });
