// @ts-check

/** @type { import( 'jest' ).Config } */
const config = {
  verbose: true,
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testPathIgnorePatterns: [ '/node_modules/', '_UNUSED_', '_DEPRECATED_', 'dist' ],
};

module.exports = config;
