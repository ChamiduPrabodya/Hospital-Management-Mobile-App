module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testMatch: ['**/src/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
};

