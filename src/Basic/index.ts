import { createLogger, format, transports, Logger } from 'winston';
import type { ConfigSeverityLevel, LogSeverityLevel } from '../common';


export type BasicLoggerConstructorArg = {
  sev: ConfigSeverityLevel;
};


export class BasicLogger {
  private __logger: Logger;

  private constructor( arg: BasicLoggerConstructorArg ) {
    const { sev } = arg;

    this.__logger = createLogger( {
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
      transports: [ new transports.Console() ],
      ...( sev === 'off' ? { silent: true } : { level: sev } ),
    } );
  }

  // ===================================================================================

  private __log( level: LogSeverityLevel, msg: string ): void {
    this.__logger.log( level, msg );
  }

  public debug( msg: string ): void { this.__log( 'debug', msg ); }

  public info( msg: string ): void { this.__log( 'info', msg ); }

  public warn( msg: string ): void { this.__log( 'warn', msg ); }

  public error( msg: string ): void { this.__log( 'error', msg ); }

  // ===================================================================================

  private static __singleton: BasicLogger | null = null;

  public static getBasicLogger( arg: BasicLoggerConstructorArg ): BasicLogger {
    if ( BasicLogger.__singleton === null ) {
      BasicLogger.__singleton = new BasicLogger( arg );
    }

    return BasicLogger.__singleton;
  }
}
