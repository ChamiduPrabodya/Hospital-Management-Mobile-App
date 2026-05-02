const { getConnectionMode, getMongoUris } = require('../config/db');

describe('backend config/db helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MONGO_URI_SOURCE;
    delete process.env.MONGO_TARGET;
    delete process.env.MONGO_URI;
    delete process.env.MONGO_URI_LOCAL;
    delete process.env.MONGO_URI_ATLAS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults the connection mode to auto', () => {
    expect(getConnectionMode()).toBe('auto');
  });

  it('uses MONGO_URI as a local fallback in local mode', () => {
    process.env.MONGO_URI_SOURCE = 'local';
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/hospital_management';

    expect(getMongoUris('local')).toEqual({
      atlasUri: 'mongodb://127.0.0.1:27017/hospital_management',
      localUri: 'mongodb://127.0.0.1:27017/hospital_management',
    });
  });

  it('prefers the explicit local MongoDB URI when present', () => {
    process.env.MONGO_URI = 'mongodb+srv://cluster.example/hospital_management';
    process.env.MONGO_URI_LOCAL = 'mongodb://127.0.0.1:27017/hospital_management';

    expect(getMongoUris('auto')).toEqual({
      atlasUri: 'mongodb+srv://cluster.example/hospital_management',
      localUri: 'mongodb://127.0.0.1:27017/hospital_management',
    });
  });

  it('supports the MONGO_URI_ATLAS alias for remote databases', () => {
    process.env.MONGO_URI_ATLAS = 'mongodb+srv://cluster.example/hospital_management';

    expect(getMongoUris('atlas')).toEqual({
      atlasUri: 'mongodb+srv://cluster.example/hospital_management',
      localUri: '',
    });
  });
});
