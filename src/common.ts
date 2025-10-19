export type LogSeverityLevel = 'error' | 'warn' | 'info' | 'debug';
/**
 * log severity levels placed in decreasing severity order
 */
export const logSeverityLevelsDesc: LogSeverityLevel[] = [ 'error', 'warn', 'info', 'debug' ];

export type ConfigSeverityLevel = LogSeverityLevel | 'off';
