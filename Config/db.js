const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoURL = process.env.MONGO_URL;

mongoose.connect(mongoURL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('MongoDB connection established');
});

module.exports = db;
