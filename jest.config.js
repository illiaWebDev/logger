// @ts-check

const { NODE_ENV } = process.env;

const nodeEnvConst = 'DANGER_JEST_ONLY_NODE_ENV';
if ( NODE_ENV !== nodeEnvConst ) {
  throw new Error( `Must set NODE_ENV=${ nodeEnvConst } to run tests` );
}


/** @type { import( 'jest' ).Config } */
const config = {
  verbose: true,
  preset: 'ts-jest',
  modulePathIgnorePatterns: [ 'dist' ],
};

module.exports = config;
