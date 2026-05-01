const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const atlasFallbacks = {
  'victoriahospital.4q585ys.mongodb.net': {
    hosts: [
      'ac-twf43lm-shard-00-00.4q585ys.mongodb.net:27017',
      'ac-twf43lm-shard-00-01.4q585ys.mongodb.net:27017',
      'ac-twf43lm-shard-00-02.4q585ys.mongodb.net:27017',
    ],
    options: {
      authSource: 'admin',
      replicaSet: 'atlas-wqthmy-shard-0',
      retryWrites: 'true',
      ssl: 'true',
      w: 'majority',
    },
  },
};

const buildAtlasFallbackUri = (uri) => {
  try {
    const parsedUri = new URL(uri);
    const fallback = atlasFallbacks[parsedUri.hostname];

    if (parsedUri.protocol !== 'mongodb+srv:' || !fallback) {
      return null;
    }

    const params = new URLSearchParams(parsedUri.search);

    Object.entries(fallback.options).forEach(([key, value]) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });

    const credentials = parsedUri.username
      ? `${parsedUri.username}:${parsedUri.password}@`
      : '';

    return `mongodb://${credentials}${fallback.hosts.join(',')}${parsedUri.pathname}?${params.toString()}`;
  } catch {
    return null;
  }
};

const buildCandidates = () => {
  const target = (process.env.MONGO_TARGET || (process.env.USE_LOCAL_MONGO === 'true' ? 'local' : 'auto')).toLowerCase();
  const candidates = [];

  if (process.env.MONGO_URI_ATLAS) {
    candidates.push({ label: 'MONGO_URI_ATLAS', uri: process.env.MONGO_URI_ATLAS });
  }

  if (process.env.MONGO_URI) {
    if (process.env.MONGO_URI.startsWith('mongodb+srv://') || target !== 'local') {
      candidates.push({ label: 'MONGO_URI', uri: process.env.MONGO_URI });
    }

    const fallbackUri = buildAtlasFallbackUri(process.env.MONGO_URI);
    if (fallbackUri) {
      candidates.push({ label: 'Atlas direct connection fallback', uri: fallbackUri });
    }
  }

  const localCandidate = process.env.MONGO_URI_LOCAL
    ? { label: 'MONGO_URI_LOCAL', uri: process.env.MONGO_URI_LOCAL }
    : null;

  if (target === 'local') {
    return localCandidate ? [localCandidate] : [];
  }

  if (target === 'atlas') {
    return candidates;
  }

  if (localCandidate) {
    candidates.push(localCandidate);
  }

  return candidates;
};

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  let retries = Number(process.env.MONGO_RETRIES || (isProduction ? 5 : 2));
  const serverSelectionTimeoutMS = Number(process.env.MONGO_TIMEOUT_MS || (isProduction ? 10000 : 5000));
  const candidates = buildCandidates();

  if (candidates.length === 0) {
    throw new Error('No MongoDB connection string is configured. Set MONGO_TARGET and a matching MongoDB URI.');
  }

  while (retries) {
    let lastError;

    for (const { label, uri } of candidates) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS });
        console.log(`MongoDB Connected using ${label}`);
        return;
      } catch (err) {
        lastError = err;
        console.log(`MongoDB connection failed using ${label} (${err.message})`);
      }
    }

    retries--;

    if (retries === 0) {
      console.error('MongoDB connection failed permanently');
      throw lastError;
    }

    console.log('Retrying MongoDB connection...', retries);
    await wait(5000);
  }
};

module.exports = connectDB;
