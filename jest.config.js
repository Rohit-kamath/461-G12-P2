module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'], // Adjust the path as needed
    coverageReporters: ['lcov', 'text-summary'],
  };