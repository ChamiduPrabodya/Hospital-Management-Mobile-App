const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async (
  uri,
  label,
  {
    retries = 5,
    retryDelayMs = 5000,
    serverSelectionTimeoutMS = 5000,
  } = {}
) => {
  let remainingRetries = retries;

  while (remainingRetries) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS });
      console.log(`MongoDB Connected (${label})`);
      return true;
    } catch (err) {
      remainingRetries--;

      if (remainingRetries === 0) {
        throw err;
      }

      console.log(`MongoDB connection failed (${label}: ${err.message}). Retrying...`, remainingRetries);
      await wait(retryDelayMs);
    }
  }

  return false;
};

const getConnectionMode = () =>
  (process.env.MONGO_URI_SOURCE || process.env.MONGO_TARGET || 'auto').trim().toLowerCase();

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_LOCAL;
  const mode = getConnectionMode();

  console.log(`MongoDB connection mode: ${mode}`);

  if (!primaryUri && !fallbackUri) {
    throw new Error('Missing MongoDB connection string. Set MONGO_URI or MONGO_URI_LOCAL.');
  }

  if (mode === 'local') {
    if (!fallbackUri) {
      throw new Error('MONGO_URI_SOURCE=local requires MONGO_URI_LOCAL to be set.');
    }

    await connectWithRetry(fallbackUri, 'MONGO_URI_LOCAL', { retries: 2 });
    return;
  }

  if (mode === 'atlas') {
    if (!primaryUri) {
      throw new Error('MONGO_URI_SOURCE=atlas requires MONGO_URI to be set.');
    }

    await connectWithRetry(primaryUri, 'MONGO_URI', { retries: 5 });
    return;
  }

  if (primaryUri) {
    try {
      await connectWithRetry(primaryUri, 'MONGO_URI', { retries: 1 });
      return;
    } catch (err) {
      if (!fallbackUri) {
        console.error('MongoDB connection failed permanently');
        throw err;
      }

      console.warn(`Primary MongoDB connection failed. Falling back to local MongoDB: ${err.message}`);
    }
  }

  try {
    await connectWithRetry(fallbackUri, 'MONGO_URI_LOCAL', { retries: 2 });
  } catch (err) {
    console.error('MongoDB connection failed permanently');
    throw err;
  }
};

module.exports = connectDB;
