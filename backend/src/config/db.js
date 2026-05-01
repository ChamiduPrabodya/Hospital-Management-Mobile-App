const mongoose = require('mongoose');

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

const getMongoUris = () => {
  const uris = [];

  if (process.env.MONGO_URI) {
    uris.push({ label: 'MONGO_URI', uri: process.env.MONGO_URI });

    const fallbackUri = buildAtlasFallbackUri(process.env.MONGO_URI);
    if (fallbackUri) {
      uris.push({ label: 'Atlas direct connection fallback', uri: fallbackUri });
    }
  }

  if ((!process.env.MONGO_URI || process.env.USE_LOCAL_MONGO === 'true') && process.env.MONGO_URI_LOCAL) {
    uris.push({ label: 'MONGO_URI_LOCAL', uri: process.env.MONGO_URI_LOCAL });
  }

  return uris;
};

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  let retries = Number(process.env.MONGO_RETRIES || (isProduction ? 5 : 1));
  const serverSelectionTimeoutMS = Number(process.env.MONGO_TIMEOUT_MS || (isProduction ? 10000 : 5000));
  const uris = getMongoUris();

  if (uris.length === 0) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  while (retries) {
    let lastError;

    for (const { label, uri } of uris) {
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

      if (!isProduction) {
        console.error('Starting API without MongoDB because NODE_ENV is not production.');
        console.error('Database routes will fail until MongoDB is reachable.');
        return;
      }

      throw lastError;
    }

    console.log('Retrying MongoDB connection...', retries);
    await new Promise(res => setTimeout(res, 5000));
  }
};

module.exports = connectDB;
