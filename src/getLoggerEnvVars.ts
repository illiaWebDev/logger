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
   * brackets, quotes, whatever.
   *
   * Values are:
   * - 0: exclude logs that have this tag;
   * - 1: include logs that have this tag;
   *
   * NOTE 0 takes precedence over 1
   *
   * @example { tag1: 0, tag2: 1 }
   */
  [ loggerEnvVarNames.LOG_TAGS ]: Record< string, 0 | 1 >;
};

const levels: LoggerEnvVars[ 'LOG_LEVEL' ][] = [
  'error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly', 'off',
];

export type GetLoggerEnvVarsArg = {
  env: Record< string, string | undefined >;
  /**
   * sometimes we cannot rely on env vars being named \
   * as they are defined in "loggerEnvVarNames" (for \
   * example when we have common environment for both \
   * website and api, so they share env vars, and so we\
   * will try to use smth like API_LOG_LEVEL and \
   * WEBSITE_LOG_LEVEL. That's why we need this property
   */
  envVarNames?: {
    [ loggerEnvVarNames.LOG_LEVEL ]: string;
    [ loggerEnvVarNames.LOG_TAGS ]: string;
  };
};

/**
 * this should be used when we implement reinit \
 * strategies, as for reinit we sometimes want to \
 * have tags or level as undefined, as that means\
 * "don't override previous value"
 */
export const getPartialLoggerEnvVars = ( { env, envVarNames }: GetLoggerEnvVarsArg ): Partial< LoggerEnvVars > => ( {
  [ loggerEnvVarNames.LOG_LEVEL ]: ( () => {
    const logLevelEnvVarName = envVarNames === undefined
      ? loggerEnvVarNames.LOG_LEVEL
      : envVarNames.LOG_LEVEL;

    const maybeLevel = env[ logLevelEnvVarName ];

    if ( maybeLevel === undefined || levels.indexOf( maybeLevel as typeof levels[0] ) === -1 ) {
      return undefined;
    }

    const typedLevel = maybeLevel as typeof levels[0];

    return typedLevel;
  } )(),
  [ loggerEnvVarNames.LOG_TAGS ]: ( () => {
    const logTagsEnvVarName = envVarNames === undefined
      ? loggerEnvVarNames.LOG_TAGS
      : envVarNames.LOG_TAGS;

    const v = env[ logTagsEnvVarName ];
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

export const getLoggerEnvVars = ( arg: GetLoggerEnvVarsArg ): LoggerEnvVars => {
  const { LOG_LEVEL, LOG_TAGS } = getPartialLoggerEnvVars( arg );

  return {
    [ loggerEnvVarNames.LOG_LEVEL ]: LOG_LEVEL === undefined
      ? 'error'
      : LOG_LEVEL,
    [ loggerEnvVarNames.LOG_TAGS ]: LOG_TAGS === undefined
      ? {}
      : LOG_TAGS,
  };
};
