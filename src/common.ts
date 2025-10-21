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

export type ConfigSeverityLevel = LogSeverityLevel | 'off';
