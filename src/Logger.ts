import { createLogger, format, transports } from 'winston';
import type { LoggerEnvVars } from './getLoggerEnvVars';


export type LoggerConstructorArg = {
  /** @see https://github.com/winstonjs/winston#logging-levels */
  level: LoggerEnvVars[ 'LOG_LEVEL' ];
  tags?: LoggerEnvVars[ 'LOG_TAGS' ];
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
export const filterByLogTags = ( envTagsEntries: [string, 0 | 1][], typedInfo: LogInfo ): boolean => {
  if ( envTagsEntries.length === 0 ) return true;

  const { tags: infoTags } = typedInfo;

  const decision = envTagsEntries.reduce< 'skip' | 'dontSkip' >(
    ( a, [ tagName, mode ] ) => {
      if ( a === 'skip' ) return 'skip';

      const skipThisTagName = mode === 0;
      if ( skipThisTagName ) {
        // we should skip this log call if this tagName is present
        return ( infoTags !== undefined && infoTags.some( it => it === tagName ) )
          ? 'skip'
          : 'dontSkip';
      }

      // here we should check that tagName is present
      return ( infoTags !== undefined && ( infoTags.some( it => it === tagName ) ) )
        ? 'dontSkip'
        : 'skip';
    },
    'dontSkip',
  );

  return decision !== 'skip';
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


  reinit( { level, tags }: Partial< LoggerConstructorArg > ) {
    const finalLogLevel = ( () => {
      if ( level !== undefined ) return level;

      const { __latestLoggerConstructorArg: arg } = this;

      return arg === null ? 'error' : arg.level;
    } )();

    const envTagsEntries = Object.entries( tags || [] );

    const filterByTags = format( info => filterByLogTags( envTagsEntries, info as LogInfo ) && info );

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
  }

  // ===================================================================================

  constructor( arg: LoggerConstructorArg ) {
    this.reinit( arg );
  }

  log = ( info: LogInfo ): void => {
    this.__logger.log( info.level || 'debug', info );
  };
}
