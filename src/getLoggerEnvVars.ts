export const loggerEnvVarNames = {
  LOG_LEVEL: 'LOG_LEVEL',
  LOG_TAGS: 'LOG_TAGS',
} as const;

export type LoggerEnvVars = {
  /**
   * Two things to consider:
   * - we don't want to make this mandatory env variable\
   *   (because it's logging)
   * - if we do forget/omit it, I strongly believe that we \
   *   are ALWAYS interested in `error` level logs
   *
   * =====================\
   * default (i.e. not provided, undefined): "error" \
   * (because we want to see errors most of the time, \
   * except for when we specifically pass "off")
   */
  [ loggerEnvVarNames.LOG_LEVEL ]: (
    | 'error'
    | 'warn'
    | 'info'
    | 'http'
    | 'verbose'
    | 'debug'
    | 'silly'
    | 'off'
  );
  /**
   * derived from env var string shaped like `"tag1:0;tag2:1"`\
   * we don't want to use stringified object because that has\
   * proven to be really verbose, having too much noisy info:\
   * brackets, quotes, whatever.\
   *
   * Values are:
   * - 0: exclude logs that have this tag;
   * - 1: include logs that have this tag;
   *
   * NOTE 0 takes precedence over 1
   *
   * @example { tag1: 0, tag2: 1 }
   */
  [ loggerEnvVarNames.LOG_TAGS ]?: Record< string, 0 | 1 >;
};

const levels: LoggerEnvVars[ 'LOG_LEVEL' ][] = [
  'error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly', 'off',
];

export const getLoggerEnvVars = ( env: Record< string, string | undefined > ): LoggerEnvVars => ( {
  [ loggerEnvVarNames.LOG_LEVEL ]: ( () => {
    const maybeLevel = env[ loggerEnvVarNames.LOG_LEVEL ] as LoggerEnvVars[ 'LOG_LEVEL' ] | undefined;

    return ( maybeLevel === undefined || levels.indexOf( maybeLevel ) === -1 )
      ? 'error'
      : maybeLevel;
  } )(),
  [ loggerEnvVarNames.LOG_TAGS ]: ( () => {
    const v = env[ loggerEnvVarNames.LOG_TAGS ];
    if ( v === undefined ) return undefined;

    const pairs = v.split( ';' ).filter( Boolean );
    const defaultAcc: LoggerEnvVars[ 'LOG_TAGS' ] = {};

    const logTags = pairs.reduce(
      ( a, it ) => {
        const [ tagName, mode ] = it.split( ':' );
        if ( tagName === undefined || tagName === '' || ( mode !== '0' && mode !== '1' ) ) return a;

        const nextAcc: typeof a = { ...a, [ tagName ]: mode === '1' ? 1 : 0 };
        return nextAcc;
      },
      defaultAcc,
    );

    return logTags === defaultAcc ? undefined : logTags;
  } )(),
} );
