import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/llb';

/**
 * Connect to MongoDB
 */
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
    });
    console.log('✅ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
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
