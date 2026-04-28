module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
  ],
  testTimeout: 15000,
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js',
};
