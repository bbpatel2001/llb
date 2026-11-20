import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DATABASE = process.env.MONGODB_DB_NAME || 'llb_platform';

function getMongoUri() {
  const configuredUri = process.env.MONGODB_URI || process.env.CONNECTION_STRING;
  if (!configuredUri) {
    return 'mongodb://localhost:27017/llb';
  }

  if (process.env.MONGODB_URI || !process.env.MONGODB_USERNAME || !process.env.MONGODB_PASSWORD) {
    return configuredUri;
  }

  const uri = new URL(configuredUri);
  uri.username = process.env.MONGODB_USERNAME;
  uri.password = process.env.MONGODB_PASSWORD;
  if (!uri.pathname || uri.pathname === '/') {
    uri.pathname = `/${DEFAULT_DATABASE}`;
  }
  return uri.toString();
}

/**
 * Connect to MongoDB
 */
export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      return mongoose.connection;
    }
    await mongoose.connect(getMongoUri(), {
      retryWrites: true,
      w: 'majority',
      dbName: process.env.MONGODB_DB_NAME || undefined,
    });
    console.log('✅ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error);
  }
};

/**
 * Check connection status
 */
export const getDBStatus = () => {
  const state = mongoose.connection.readyState;
  const states: { [key: number]: string } = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };
  return states[state] || 'Unknown';
};
