const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      autoIndex: true,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.warn(`[Database] MongoDB connection warning: ${err.message}. Running with in-memory persistence fallback for offline use.`);
    return null;
  }
};

const isDbConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = {
  connectDB,
  isDbConnected,
};
