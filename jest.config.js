/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

export default {
  clearMocks: true,
  // coverageProvider: "v8",
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "node", "json"],

  roots: [
    "<rootDir>/src",
    // "D:\\[HTMLProjects]\\ecosense-rest-api\\src"
  ],
  // modulePaths: [
  //   "<rootDir>/src",
  //   "D:\\[HTMLProjects]\\ecosense-rest-api\\src"
  // ],
  moduleDirectories: [
    "node_modules", 
    "src",
    "src/sql-queries"
  ],

  testMatch: ['**/__tests__/**/*.test.(ts|js)', '**/?(*.)+(spec|test).(ts|js)'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    '^./sql-queries/(.*).js': '<rootDir>/src/sql-queries/$1.ts',
    '^../pool.js': '<rootDir>/src/pool.ts'
  }
};