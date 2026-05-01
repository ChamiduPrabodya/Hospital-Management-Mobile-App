const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isDnsSrvError = (error) => {
  const message = error?.message || '';

  return (
    message.includes('querySrv') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    message.includes('EAI_AGAIN')
  );
};

const connectWithRetry = async (uri, label) => {
  let retries = 5;

  while (retries) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB Connected (${label})`);
      return true;
    } catch (err) {
      retries--;

      if (retries === 0) {
        throw err;
      }

      console.log(`MongoDB connection failed (${label}: ${err.message}). Retrying...`, retries);
      await wait(5000);
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

    await connectWithRetry(fallbackUri, 'MONGO_URI_LOCAL');
    return;
  }

  if (mode === 'atlas') {
    if (!primaryUri) {
      throw new Error('MONGO_URI_SOURCE=atlas requires MONGO_URI to be set.');
    }

    await connectWithRetry(primaryUri, 'MONGO_URI');
    return;
  }

  if (primaryUri) {
    try {
      await connectWithRetry(primaryUri, 'MONGO_URI');
      return;
    } catch (err) {
      if (!fallbackUri || !isDnsSrvError(err)) {
        console.error('MongoDB connection failed permanently');
        throw err;
      }

      console.warn(`Atlas connection failed with DNS/SRV lookup error. Falling back to local MongoDB: ${err.message}`);
    }
  }

  try {
    await connectWithRetry(fallbackUri, 'MONGO_URI_LOCAL');
  } catch (err) {
    console.error('MongoDB connection failed permanently');
    throw err;
  }
};

module.exports = connectDB;
