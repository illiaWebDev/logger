import { createLogger, format, transports } from 'winston';
import acorn from 'acorn';
import { ValidateFunction } from 'ajv';
import { LoggerEnvVars, levels } from './getLoggerEnvVars';


// ===================================================================================

type MatchType = (
  /** andObj contains <tagName>: 0 */
  | 'explicitExclude'
  /**
   * andObj contains at least one <tagName> that is\
   * not present in iTagsHash
   */
  | 'implicitExclude'
  /**
   * - no iTagsHash tagname is excluded with 0
   * - all "include" tags from andObj are present in iTagsHash
   */
  | 'include'
);
const computeMatchTypeWithOrSegment = (
  iTagsHash: Record< string, true >,
  orSegment: LoggerEnvVars[ 'LOG_TAGS' ][ 0 ],
): MatchType => {
  const orSegmentEntries = Object.entries( orSegment );
  if ( orSegmentEntries.some( it => iTagsHash[ it[ 0 ] ] !== undefined && it[ 1 ] === 0 ) ) {
    return 'explicitExclude';
  }

  if ( orSegmentEntries.some( it => iTagsHash[ it[ 0 ] ] === undefined && it[ 1 ] === 1 ) ) {
    return 'implicitExclude';
  }

  return 'include';
};

// ===================================================================================

export type LoggerConstructorArg = {
  /** @see https://github.com/winstonjs/winston#logging-levels */
  level: LoggerEnvVars[ 'LOG_LEVEL' ];
  tags: LoggerEnvVars[ 'LOG_TAGS' ];
  /**
   * while log filtering is useful for when we want to see\
   * "debug" logs but only from part of the applicaiton (as lots\
   * of those can be logging with "debug" severity), perhaps\
   * there is something else. It seems that there also should\
   * exist the ability to say that "okay, I did specified those\
   * tags and that severity level I am currently interested in,\
   * BUT we also want severity from this and higher to be logged\
   * ignoring the tags". E.g. we may want to look at info logs\
   * from user auth part of the app, but we also want to see \
   * ANY "warn" or "error" level logs from wherever. This is \
   * what this config setting does.
   */
  ignoreTagsIfGteSeverity?: LoggerEnvVars[ 'LOG_IGNORE_TAGS_IF_GTE_SEVERITY' ];
  bodiesForAdaptive?: Record< string, string | null >;
  adpBodyValidators?: Record< string, ValidateFunction >;
};


export type LogInfo = {
  msg?: (
    | { type: 'string'; value: string }
    | {
      type: 'adaptive';
      args: Array<{ param: string; value: unknown }>;
      id: string;
    }
  );
  /**
   * used to describe log call in more detail, e.g.
   * - what service this corresponds to
   * - what action it corresponds to
   * - ...
   *
   * @example ['user', 'createOnApiStartup', ...]
   */
  tags?: string[];
  /**
   * we want default "debug" here because generally when we\
   * console.log during development it's rarther temporary \
   * solution. And for something more permanent we should\
   * explicitly specify log level
   *
   * @default 'debug'
   */
  level?: Exclude< LoggerConstructorArg[ 'level' ], 'off' >;
};


const defaultLogger = createLogger();

/**
 * @returns `false` - filter out this log call, `true` - continue with this call
 */
export const filterByLogTags = (
  logTags: LoggerEnvVars[ 'LOG_TAGS' ],
  typedInfo: LogInfo,
  ignoreTagsIfGteSeverity?: LoggerEnvVars[ 'LOG_IGNORE_TAGS_IF_GTE_SEVERITY' ],
): boolean => {
  /** no logTags configured - allow logging everything */
  if ( logTags.length === 0 ) return true;

  /**
   * if we have ignoreTagsIfGteSeverity present, let's check if typedInfo.level\
   * is more severe and if it is = we can return true right away
   */
  if ( ignoreTagsIfGteSeverity !== undefined ) {
    const ignoreTagsSevIndex = levels.indexOf( ignoreTagsIfGteSeverity );
    const typedInfoSevIndex = levels.indexOf( typedInfo.level || 'debug' );

    if ( typedInfoSevIndex <= ignoreTagsSevIndex ) return true;
  }

  const { tags: infoTags } = typedInfo;
  const infoTagsHash = infoTags === undefined
    ? {}
    : infoTags.reduce< Record< string, true > >(
      ( a, tag ) => ( { ...a, [ tag ]: true } ),
      {},
    );

  const orSegmentMatcheTypes = logTags.map( orSegment => computeMatchTypeWithOrSegment( infoTagsHash, orSegment ) );

  /**
   * if at least one or segment states explicit exclusion - we\
   * exclude this whole log invocation.\
   * And if there are no or segments that result in inclusion -\
   * we also exclude this log invocation
   */
  if (
    orSegmentMatcheTypes.some( it => it === 'explicitExclude' )
    || orSegmentMatcheTypes.some( it => it === 'include' ) === false
  ) {
    return false;
  }

  /**
   *  here we are sure:
   * - there is no explicit exclusion orSegment
   * - there is at least one orSegment that matches infoTagsHash
   *
   * so we allow this invocation to proceed
   */
  return true;
};

export class Logger {
  __logger = defaultLogger;

  /**
   * to be as flexible as possible with our reinit logic\
   * during runtime of the application, we want to store\
   * latest logger constructor arg (meaning latest log \
   * level and log tags) so that we can call reinit with\
   * only those exact changes that we want, not being \
   * forced to pass log level each and every time.
   */
  __latestLoggerConstructorArg: LoggerConstructorArg | null = null;


  reinit( arg: Partial< LoggerConstructorArg > ) {
    if ( Object.keys( arg ).length === 0 ) return;

    const {
      level,
      tags,
      ignoreTagsIfGteSeverity,
      bodiesForAdaptive,
      adpBodyValidators,
    } = arg;
    const { __latestLoggerConstructorArg: latestArg } = this;


    const finalLogLevelInConfig: LoggerConstructorArg[ 'level' ] = ( () => {
      if ( level !== undefined ) return level;

      return latestArg === null ? 'error' : latestArg.level;
    } )();
    const finalTagsInConfig: LoggerConstructorArg[ 'tags' ] = ( () => {
      if ( tags !== undefined ) return tags;

      return latestArg === null ? [] : latestArg.tags;
    } )();
    const finalIgnoreTagsIfGteInConfig: LoggerConstructorArg[ 'ignoreTagsIfGteSeverity' ] = ( () => {
      if ( ignoreTagsIfGteSeverity !== undefined ) return ignoreTagsIfGteSeverity;

      return latestArg === null ? undefined : latestArg.ignoreTagsIfGteSeverity;
    } )();
    const finalBodiesForAdaptive: LoggerConstructorArg[ 'bodiesForAdaptive' ] = ( () => {
      const lastBodiesForAdaptive = latestArg === null ? undefined : latestArg.bodiesForAdaptive;

      if ( lastBodiesForAdaptive === undefined ) {
        return bodiesForAdaptive;
      }

      return {
        ...lastBodiesForAdaptive,
        ...bodiesForAdaptive,
      };
    } )();
    const finalAdpBodyValidators: LoggerConstructorArg[ 'adpBodyValidators' ] = ( () => {
      const latestAdpBodyValidators = latestArg === null ? undefined : latestArg.adpBodyValidators;

      if ( latestAdpBodyValidators === undefined ) return adpBodyValidators;

      return {
        ...latestAdpBodyValidators,
        ...adpBodyValidators,
      };
    } )();


    const filterByTags = format(
      info => filterByLogTags( finalTagsInConfig, info as LogInfo, finalIgnoreTagsIfGteInConfig ) && info,
    );
    const transformMsg = format(
      info => {
        const { msg } = info as LogInfo;

        ( () => {
          if ( msg === undefined ) return;

          if ( msg.type === 'string' ) {
            // eslint-disable-next-line no-param-reassign
            info.msg = msg.value;

            return;
          }

          /**
           * 100% "adaptive" here, but if finalMapOfBodiesForAdaptive is\
           * undefined, no matter what we do - we can't properly proceed.\
           * So we will fall back to an empty message. Same should happen\
           * if there is no matching entry in finalMapOfBodiesForAdaptive.
           */
          const definedBodiesForAdaptive: NonNullable< typeof finalBodiesForAdaptive > = (
            finalBodiesForAdaptive || {}
          );
          const funcBody = definedBodiesForAdaptive[ msg.id ];

          if ( funcBody === undefined || funcBody === null ) {
            // eslint-disable-next-line no-param-reassign
            info.msg = '';

            return;
          }

          const { args } = msg;
          const params = args.map( it => it.param );
          const vals = args.map( it => it.value );

          const bodyValidator = ( finalAdpBodyValidators || {} )[ msg.id ];

          try {
            const ast = acorn.parse( funcBody, { ecmaVersion: 2024, allowReturnOutsideFunction: true } );
            console.log( 5555, 'ast', JSON.stringify( ast, null, 2 ) );

            if ( bodyValidator && bodyValidator( ast ) === false ) {
              // eslint-disable-next-line no-param-reassign
              info.msg = `Logger - (msg.id: ${ msg.id }) |`
                + ` Body validation failed: ${ JSON.stringify( bodyValidator.errors ) }`;

              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            const func = new Function( ...params.concat( `return ${ funcBody }` ) );

            // eslint-disable-next-line no-param-reassign
            info.msg = String( func( ...vals ) );
          } catch ( e ) {
            const errMsg = ( () => {
              if ( !( e instanceof Error ) ) return JSON.stringify( e );
              if ( e instanceof SyntaxError ) return `Logger - syntax error (msg.id: ${ msg.id }) | ${ e.message }`;

              return `Logger - (msg.id: ${ msg.id }) | ${ e.message }`;
            } )();

            // eslint-disable-next-line no-param-reassign
            info.msg = errMsg;
          }
        } )();

        return info;
      },
    );

    const logger = createLogger( {
      format: format.combine(
        filterByTags(),
        transformMsg(),
        format.timestamp(),
        format.json(),
      ),
      transports: [ new transports.Console() ],
      ...( finalLogLevelInConfig === 'off' ? { silent: true } : { level: finalLogLevelInConfig } ),
    } );

    this.__logger = logger;
    this.__latestLoggerConstructorArg = {
      level: finalLogLevelInConfig,
      tags: finalTagsInConfig,
      ignoreTagsIfGteSeverity: finalIgnoreTagsIfGteInConfig,
      bodiesForAdaptive: finalBodiesForAdaptive,
    };
  }

  // ===================================================================================

  constructor( arg: LoggerConstructorArg ) {
    this.reinit( arg );
  }

  log = ( info: LogInfo ): void => {
    this.__logger.log( info.level || 'debug', info );
  };
}
