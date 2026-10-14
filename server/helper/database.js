const mongoose = require('mongoose');

let connectionPromise;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!process.env.CONNECTION_STRING) {
    throw new Error('CONNECTION_STRING is required');
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.CONNECTION_STRING, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}

module.exports = connectDatabase;
