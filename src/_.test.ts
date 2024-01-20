// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import * as getEnvVarsNS from './getLoggerEnvVars';
import { filterByLogTags } from './Logger';


describe( 'getEnvVarsNS', () => {
  describe( 'getLoggerEnvVars', () => {
    test( 'returns correct defaults if env does not provide necessary variables', () => {
      const { LOG_LEVEL, LOG_TAGS } = getEnvVarsNS.getLoggerEnvVars( { env: {} } );

      expect( LOG_LEVEL ).toBe( 'error' );
      expect( LOG_TAGS ).toStrictEqual( [] );
    } );

    test( 'log level fallbacks to "error" for incorrect severity in env', () => {
      const { LOG_LEVEL } = getEnvVarsNS.getLoggerEnvVars( {
        env: {
          [ getEnvVarsNS.loggerEnvVarNames.LOG_LEVEL ]: 'does not exist',
        },
      } );

      expect( LOG_LEVEL ).toBe( 'error' );
    } );

    test( 'extracts correct log level from env', () => {
      const allowedLogLevels: getEnvVarsNS.LoggerEnvVars[ 'LOG_LEVEL' ][] = [
        'error',
        'warn',
        'info',
        'http',
        'verbose',
        'debug',
        'silly',
        'off',
      ];

      allowedLogLevels.forEach( level => {
        const { LOG_LEVEL } = getEnvVarsNS.getLoggerEnvVars( {
          env: {
            [ getEnvVarsNS.loggerEnvVarNames.LOG_LEVEL ]: level,
          },
        } );

        expect( LOG_LEVEL ).toBe( level );
      } );
    } );

    test( 'correctly extracts LOG_LEVEL from customized env var name', () => {
      const customizedLogLevelEnvVarName = 'API_LOG_LEVEL';
      const { LOG_LEVEL } = getEnvVarsNS.getLoggerEnvVars( {
        env: {
          [ customizedLogLevelEnvVarName ]: 'silly',
        },
        envVarNames: {
          LOG_LEVEL: customizedLogLevelEnvVarName,
          LOG_TAGS: 'API_LOG_TAGS',
        },
      } );

      expect( LOG_LEVEL ).toBe( 'silly' );
    } );

    // ===================================================================================

    test( 'returns LOG_TAGS as [] if we pass incorrect shape in env', () => {
      const incorrectShapes = [
        '',
        'qweqwe',
        'qweqwe:',
        'qweqwe:11',
        'qweqwe:11|',
        'qweqwe:11|qweqwe',
        'qweqwe:11|qweqwe:',
        'qweqwe:11|qweqwe:3',
        'qweqwe;qweqwe',
        'qweqwe:;qwe',
        ':1;qweqwe:02',
        'qweqwe|qw:22',
      ];
      const results = incorrectShapes.map( it => getEnvVarsNS.getLoggerEnvVars( {
        env: {
          [ getEnvVarsNS.loggerEnvVarNames.LOG_TAGS ]: it,
        },
      } ).LOG_TAGS );

      expect( results.some( it => JSON.stringify( it ) !== '[]' ) ).toBe( false );
    } );

    test( 'returns LOG_TAGS as [] if we pass correct pairs string but values are of incorrect type', () => {
      const incorrectObjectShapes = [
        'tag1:;tag2:85',
        'tag1:{};tag2:true',
        'tag1:null;tag2:undefined',
        'tag1:null;tag2:undefined|tag3',
        'tag1:null;tag2:undefined|tag3:',
        'tag1:null;tag2:undefined|tag3:6',
      ];
      const results = incorrectObjectShapes.map( it => getEnvVarsNS.getLoggerEnvVars( {
        env: {
          [ getEnvVarsNS.loggerEnvVarNames.LOG_TAGS ]: it,
        },
      } ).LOG_TAGS );

      expect( results.some( it => JSON.stringify( it ) !== '[]' ) ).toBe( false );
    } );

    test( 'returns correct LOG_TAGS for correctly stringified env vars', () => {
      type Payload = { arg: string; rtrn: getEnvVarsNS.LoggerEnvVars[ 'LOG_TAGS' ] };
      const payloads: Payload[] = [
        { arg: 'a:1', rtrn: [ { a: 1 } ] },
        { arg: 'a:1;b:0', rtrn: [ { a: 1, b: 0 } ] },
        { arg: 'a:1;b:0|c:1', rtrn: [ { a: 1, b: 0 }, { c: 1 } ] },
      ];

      payloads.forEach( ( { arg, rtrn } ) => {
        const { LOG_TAGS: parsedTags } = getEnvVarsNS.getLoggerEnvVars( {
          env: {
            [ getEnvVarsNS.loggerEnvVarNames.LOG_TAGS ]: arg,
          },
        } );

        expect( parsedTags ).toStrictEqual( rtrn );
      } );
    } );

    test( 'correctly extracts LOG_TAGS from customized env var name', () => {
      const customizedLogTagsEnvVarName = 'API_LOG_TAGS';
      const { LOG_TAGS } = getEnvVarsNS.getLoggerEnvVars( {
        env: {
          [ customizedLogTagsEnvVarName ]: 'a:1',
        },
        envVarNames: {
          LOG_LEVEL: 'API_LOG_LEVEL',
          LOG_TAGS: customizedLogTagsEnvVarName,
        },
      } );

      expect( LOG_TAGS ).toStrictEqual( [ { a: 1 } ] );
    } );
  } );

  describe( 'getPartialLoggerEnvVars', () => {
    test( 'returns correct defaults if env does not provide necessary variables', () => {
      const { LOG_LEVEL, LOG_TAGS } = getEnvVarsNS.getPartialLoggerEnvVars( { env: {} } );

      expect( LOG_LEVEL ).toBeUndefined( );
      expect( LOG_TAGS ).toBeUndefined( );
    } );
  } );
} );

describe( 'filterByTagsRaw', () => {
  test( 'allows untagged info if there are no tags in env', () => {
    expect( filterByLogTags( [], {} ) ).toBe( true );
  } );

  test( 'allows tagged info if there are no tags in env', () => {
    expect( filterByLogTags( [], { tags: [ '1', '2', '3' ] } ) ).toBe( true );
  } );

  test( 'allows untagged info when there is a restricted tag in env', () => {
    expect( filterByLogTags( [ { sometag: 0 } ], {} ) ).toBe( true );
  } );

  test( 'allows tagged info that does not include restricted tag from env', () => {
    expect( filterByLogTags( [ { sometag: 0 } ], { tags: [ 'test' ] } ) ).toBe( true );
  } );

  test( 'disallows tagged info that has restricted tag', () => {
    const restrictedTag = 'sometag';
    const res = filterByLogTags( [ { [ restrictedTag ]: 0 } ], { tags: [ restrictedTag ] } );

    expect( res ).toBe( false );
  } );

  test( 'disallows tagged info that does not have required tag', () => {
    expect( filterByLogTags( [ { sometag: 1 } ], { tags: [ 'another' ] } ) ).toBe( false );
  } );

  test( 'allows tagged info that has required tag', () => {
    const requiredTag = 'sometag';
    expect( filterByLogTags( [ { [ requiredTag ]: 1 } ], { tags: [ requiredTag ] } ) ).toBe( true );
  } );

  test( 'disallows info that has restricted tag even though it also has required one', () => {
    const requiredTag = 'required';
    const restrictedTag = 'restricted';

    expect(
      filterByLogTags(
        [ { [ requiredTag ]: 1, [ restrictedTag ]: 0 } ],
        { tags: [ requiredTag, restrictedTag ] },
      ),
    ).toBe( false );
  } );

  test( 'disallows info that has restricted tag at least in one or segment', () => {
    const requiredTag = 'required';
    const restrictedTag = 'restricted';

    expect(
      filterByLogTags(
        [ { [ requiredTag ]: 1 }, { [ restrictedTag ]: 0 } ],
        { tags: [ requiredTag, restrictedTag ] },
      ),
    ).toBe( false );
  } );

  test( 'allows info that matches no restricted tags and has at least one matching orSegemnt', () => {
    const requiredTag = 'required';

    expect(
      filterByLogTags(
        [ { a: 1 }, { [ requiredTag ]: 1 } ],
        { tags: [ requiredTag ] },
      ),
    ).toBe( true );
  } );
} );
