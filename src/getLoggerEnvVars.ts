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
   * derived from env var string shaped like:
   * - `"tag1:0;tag2:1"`
   * - `"tag1:0;tag2:1|tag3:0;tag4:1"`\
   *
   * where
   * - ":" is a separator between tag name and inclusion modifier,\
   * 1 means "include", 0 means "exclude" (0 takes precedence over 1)
   * - ";" is a separator like && in typescript, meaning that both sides\
   * must to be true for a given log invocation to match
   * - "|" is a ||-like operator, giving us the ability to target \
   * different tags combinations.
   *
   * We don't want to use stringified object because that has\
   * proven to be really verbose, having too much noisy info:\
   * brackets, quotes, whatever.\
   *
   * On terminology: \
   * in this tags string "tag1:0;tag2:1|tag3:0;tag4:1"
   * - "tag1:0;tag2:1" and "tag3:0;tag4:1" are OR segments, meaning\
   * they exist kinda in parallel, and log invocation might succeed\
   * if matched by at least one of those
   * - "tag1:0" is an AND segment, for a log invocation to succeed,\
   * its tags must match all AND segments in at least one OR segment.
   * - if there exists at least one OR segment that contains AND \
   * segment explicitly excluding [tagName] present in current log\
   * invocation - log invocation is excluded even if there exists\
   * OR segment that it matches.
   *
   * **IMPORTANT** exclude takes precedence over include
   *
   * @example [{ tag1: 0, tag2: 1 }, { tag3: 0, tag4: 1 }]
   */
  [ loggerEnvVarNames.LOG_TAGS ]: Array< Record< string, 0 | 1 > >;
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

    const logTags = v.split( '|' ).filter( Boolean ).reduce< LoggerEnvVars[ 'LOG_TAGS' ] >(
      ( a, orPart ) => {
        const tagsWithModifiers = orPart.split( ';' ).filter( Boolean );
        const l = tagsWithModifiers.reduce< LoggerEnvVars[ 'LOG_TAGS' ][0] >(
          ( innerA, tagAndModifierStr ) => {
            const [ tag, modifier ] = tagAndModifierStr.split( ':' );
            if ( tag === undefined || tag === '' || ( modifier !== '1' && modifier !== '0' ) ) return innerA;

            return { ...innerA, [ tag ]: modifier === '0' ? 0 : 1 };
          },
          {},
        );

        return Object.keys( l ).length === 0 ? a : a.concat( l );
      },
      [],
    );

    return logTags.length === 0 ? undefined : logTags;
  } )(),
} );

export const getLoggerEnvVars = ( arg: GetLoggerEnvVarsArg ): LoggerEnvVars => {
  const { LOG_LEVEL, LOG_TAGS } = getPartialLoggerEnvVars( arg );

  return {
    [ loggerEnvVarNames.LOG_LEVEL ]: LOG_LEVEL === undefined
      ? 'error'
      : LOG_LEVEL,
    [ loggerEnvVarNames.LOG_TAGS ]: LOG_TAGS === undefined
      ? []
      : LOG_TAGS,
  };
};
