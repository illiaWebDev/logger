export type LogSeverityLevel = 'error' | 'warn' | 'info' | 'debug';
export const isLogSeverityLevel = ( v: unknown ): v is LogSeverityLevel => {
  if ( typeof v !== 'string' ) return false;

  const typed = v as LogSeverityLevel;

  return false
    || typed === 'debug'
    || typed === 'error'
    || typed === 'info'
    || typed === 'warn';
};
/**
 * log severity levels placed in decreasing severity order
 */
export const logSeverityLevelsDesc: LogSeverityLevel[] = [ 'error', 'warn', 'info', 'debug' ];

export const CONFIG_SEVERITY_LEVEL_OFF = 'off';
export type ConfigSeverityLevel = LogSeverityLevel | typeof CONFIG_SEVERITY_LEVEL_OFF;
export const isConfigSeverityLevel = ( v: unknown ): v is ConfigSeverityLevel => (
  v === CONFIG_SEVERITY_LEVEL_OFF || isLogSeverityLevel( v )
);

export const isStrToStrMap = ( v: unknown ): v is Record< string, string > => {
  if ( typeof v !== 'object' || v === null ) return false;

  return Object.entries( v ).every( it => typeof it[ 0 ] === 'string' && typeof it[ 1 ] === 'string' );
};
