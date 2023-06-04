// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import * as getEnvVarsNS from './getLoggerEnvVars';
import { filterByLogTags } from './Logger';


describe( 'Logger', () => {
  describe( 'getEnvVarsNS', () => {
    test( 'returns correct defaults if env does not provide necessary variables', () => {
      const { LOG_LEVEL, LOG_TAGS } = getEnvVarsNS.getLoggerEnvVars( {} );

      expect( LOG_LEVEL ).toBe( 'error' );
      expect( LOG_TAGS ).toBeUndefined();
    } );

    test( 'log level fallbacks to "error" for incorrect severity in env', () => {
      const { LOG_LEVEL } = getEnvVarsNS.getLoggerEnvVars( {
        [ getEnvVarsNS.loggerEnvVarNames.LOG_LEVEL ]: 'does not exist',
      } );

      expect( LOG_LEVEL ).toBe( 'error' );
    } );

    test( 'returns LOG_TAGS as undefined if we pass incorrect shape in env', () => {
      const incorrectShapes = [
        '',
        'qweqwe;qweqwe',
        'qweqwe:;qwe',
        ':1;qweqwe:02',
      ];
      const results = incorrectShapes.map( it => getEnvVarsNS.getLoggerEnvVars( {
        [ getEnvVarsNS.loggerEnvVarNames.LOG_TAGS ]: it,
      } ).LOG_TAGS );

      expect( results.some( it => it !== undefined ) ).toBe( false );
    } );

    test( 'returns LOG_TAGS as undefined if we pass correct pairs string but values are of incorrect type', () => {
      const incorrectObjectShapes = [
        'tag1:;tag2:85',
        'tag1:{};tag2:true',
        'tag1:null;tag2:undefined',
      ];
      const results = incorrectObjectShapes.map( it => getEnvVarsNS.getLoggerEnvVars( {
        [ getEnvVarsNS.loggerEnvVarNames.LOG_TAGS ]: it,
      } ).LOG_TAGS );

      expect( results.some( it => it !== undefined ) ).toBe( false );
    } );

    test( 'returns correct LOG_TAGS for correctly stringified env var', () => {
      const { LOG_TAGS: parsedTags } = getEnvVarsNS.getLoggerEnvVars( {
        [ getEnvVarsNS.loggerEnvVarNames.LOG_TAGS ]: 'a:1',
      } );

      expect( parsedTags ).toStrictEqual( { a: 1 } );
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
      expect( filterByLogTags( [ [ 'sometag', 0 ] ], {} ) ).toBe( true );
    } );

    test( 'allows tagged info that does not include restricted tag from env', () => {
      expect( filterByLogTags( [ [ 'sometag', 0 ] ], { tags: [ 'test' ] } ) ).toBe( true );
    } );

    test( 'disallows tagged info that has restricted tag', () => {
      const restrictedTag = 'sometag';
      const res = filterByLogTags( [ [ restrictedTag, 0 ] ], { tags: [ restrictedTag ] } );

      expect( res ).toBe( false );
    } );

    test( 'disallows tagged info that does not have required tag', () => {
      expect( filterByLogTags( [ [ 'sometag', 1 ] ], { tags: [ 'another' ] } ) ).toBe( false );
    } );

    test( 'allows tagged info that has required tag', () => {
      const requiredTag = 'sometag';
      expect( filterByLogTags( [ [ requiredTag, 1 ] ], { tags: [ requiredTag ] } ) ).toBe( true );
    } );

    test( 'disallows info that has restricted tag even though it also has required one', () => {
      const requiredTag = 'required';
      const restrictedTag = 'restricted';

      expect(
        filterByLogTags(
          [ [ requiredTag, 1 ], [ restrictedTag, 0 ] ],
          { tags: [ requiredTag, restrictedTag ] },
        ),
      ).toBe( false );
    } );
  } );
} );
