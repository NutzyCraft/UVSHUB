const app = require('../src/app');
const connectDB = require('../src/config/db');

// Initialize the database connection.
// In a serverless environment, the instance might be cached/reused.
connectDB().catch(console.error);

module.exports = app;
