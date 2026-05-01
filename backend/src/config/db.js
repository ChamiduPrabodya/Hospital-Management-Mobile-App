const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAtlasUri = () => {
  if (process.env.MONGO_URI_ATLAS) {
    return process.env.MONGO_URI_ATLAS;
  }

  if (process.env.MONGO_URI?.startsWith('mongodb+srv://')) {
    return process.env.MONGO_URI;
  }

  return null;
};

const getLocalUri = () => {
  if (process.env.MONGO_URI_LOCAL) {
    return process.env.MONGO_URI_LOCAL;
  }

  if (process.env.MONGO_URI?.startsWith('mongodb://')) {
    return process.env.MONGO_URI;
  }

  return null;
};

const buildCandidates = () => {
  const target = (process.env.MONGO_TARGET || 'auto').toLowerCase();
  const atlasUri = getAtlasUri();
  const localUri = getLocalUri();

  if (target === 'local') {
    return localUri ? [{ label: 'local', uri: localUri, retries: 1 }] : [];
  }

  if (target === 'atlas') {
    return atlasUri ? [{ label: 'atlas', uri: atlasUri, retries: 5 }] : [];
  }

  const candidates = [];

  if (atlasUri) {
    candidates.push({ label: 'atlas', uri: atlasUri, retries: 2 });
  }

  if (localUri) {
    candidates.push({ label: 'local', uri: localUri, retries: 1 });
  }

  return candidates;
};

const connectDB = async () => {
  const candidates = buildCandidates();

  if (candidates.length === 0) {
    throw new Error('No MongoDB connection string is configured. Set MONGO_TARGET and a matching MongoDB URI.');
  }

  let lastError;

  for (const candidate of candidates) {
    let retries = candidate.retries;

    while (retries) {
      try {
        await mongoose.connect(candidate.uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected (${candidate.label})`);
        return;
      } catch (err) {
        lastError = err;
        console.log(`MongoDB connection failed (${candidate.label}: ${err.message}). Retrying...`, retries);
        retries--;

        if (retries === 0) {
          break;
        }

        await wait(3000);
      }
    }
  }

  console.error('MongoDB connection failed permanently');
  throw lastError;
};

module.exports = connectDB;
