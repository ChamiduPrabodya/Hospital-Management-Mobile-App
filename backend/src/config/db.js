const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getTrimmedEnv = (name) => {
  const value = process.env[name];

  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

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

const normalizeConnectionMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return 'auto';
  }

  if (normalized === 'atles') {
    console.warn('MONGO_URI_SOURCE=atles is a typo. Using atlas mode instead.');
    return 'atlas';
  }

  if (['auto', 'local', 'atlas'].includes(normalized)) {
    return normalized;
  }

  console.warn(`Unknown MongoDB connection mode "${normalized}". Falling back to auto.`);
  return 'auto';
};

const getConnectionMode = () => normalizeConnectionMode(getTrimmedEnv('MONGO_URI_SOURCE') || getTrimmedEnv('MONGO_TARGET') || 'auto');

const getMongoUris = (mode = getConnectionMode()) => {
  const genericUri = getTrimmedEnv('MONGO_URI');
  const atlasUri = getTrimmedEnv('MONGO_URI_ATLAS') || genericUri;
  const localUri = getTrimmedEnv('MONGO_URI_LOCAL') || (mode === 'local' ? genericUri : '');

  return {
    atlasUri,
    localUri,
  };
};

const connectDB = async () => {
  const mode = getConnectionMode();
  const { atlasUri, localUri } = getMongoUris(mode);

  console.log(`MongoDB connection mode: ${mode}`);

  if (!atlasUri && !localUri) {
    throw new Error(
      'Missing MongoDB connection string. Set MONGO_URI_LOCAL for local MongoDB, or MONGO_URI / MONGO_URI_ATLAS for a remote database.'
    );
  }

  if (mode === 'local') {
    if (!localUri) {
      throw new Error('MONGO_URI_SOURCE=local requires MONGO_URI_LOCAL (or MONGO_URI) to be set.');
    }

    await connectWithRetry(localUri, 'MONGO_URI_LOCAL', { retries: 2 });
    return;
  }

  if (mode === 'atlas') {
    if (!atlasUri) {
      throw new Error('MONGO_URI_SOURCE=atlas requires MONGO_URI or MONGO_URI_ATLAS to be set.');
    }

    await connectWithRetry(atlasUri, 'MONGO_URI', { retries: 5 });
    return;
  }

  if (atlasUri) {
    try {
      await connectWithRetry(atlasUri, 'MONGO_URI', { retries: 1 });
      return;
    } catch (err) {
      if (!localUri) {
        console.error('MongoDB connection failed permanently');
        throw err;
      }

      console.warn(`Primary MongoDB connection failed. Falling back to local MongoDB: ${err.message}`);
    }
  }

  try {
    await connectWithRetry(localUri, 'MONGO_URI_LOCAL', { retries: 2 });
  } catch (err) {
    console.error('MongoDB connection failed permanently');
    throw err;
  }
};

module.exports = connectDB;
module.exports.getConnectionMode = getConnectionMode;
module.exports.getMongoUris = getMongoUris;
module.exports.normalizeConnectionMode = normalizeConnectionMode;
