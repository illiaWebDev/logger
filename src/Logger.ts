import { createLogger, format, transports } from 'winston';
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
};


export type LogInfo = {
  msg?: string;
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

    const { level, tags, ignoreTagsIfGteSeverity } = arg;
    const { __latestLoggerConstructorArg: latestArg } = this;


    const finalLogLevel: LoggerConstructorArg[ 'level' ] = ( () => {
      if ( level !== undefined ) return level;

      return latestArg === null ? 'error' : latestArg.level;
    } )();
    const finalTags: LoggerConstructorArg[ 'tags' ] = ( () => {
      if ( tags !== undefined ) return tags;

      return latestArg === null ? [] : latestArg.tags;
    } )();
    const finalIgnoreTagsIfGte: LoggerConstructorArg[ 'ignoreTagsIfGteSeverity' ] = ( () => {
      if ( ignoreTagsIfGteSeverity !== undefined ) return ignoreTagsIfGteSeverity;

      return latestArg === null ? undefined : latestArg.ignoreTagsIfGteSeverity;
    } )();


    const filterByTags = format(
      info => filterByLogTags( finalTags, info as LogInfo, finalIgnoreTagsIfGte ) && info,
    );

    const logger = createLogger( {
      format: format.combine(
        filterByTags(),
        format.timestamp(),
        format.json(),
      ),
      transports: [ new transports.Console() ],
      ...( finalLogLevel === 'off' ? { silent: true } : { level: finalLogLevel } ),
    } );

    this.__logger = logger;
    this.__latestLoggerConstructorArg = {
      level: finalLogLevel,
      tags: finalTags,
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
