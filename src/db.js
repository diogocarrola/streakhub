const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/streakhub';

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log(`MongoDB connection error: ${err}`);
});

module.exports = mongoose;