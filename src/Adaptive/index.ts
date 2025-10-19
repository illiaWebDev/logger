import { createLogger, format, transports, Logger } from 'winston';
import type { ConfigSeverityLevel, LogSeverityLevel } from '../common';
import type { ConfigT, LogInfo, MessageT } from './types';
import {} from './filterByTags';

export class AdaptiveLogger {
  private __logger: Logger = createLogger();

  /**
   * this simply exists to prevent consumers from creating\
   * instances manually. All the setup will happen in init\
   * method. And singleton-oriented nature is handeled by\
   * static methods/properties
   */
  private constructor() { /** */ }

  public log( Sev: LogSeverityLevel, M_du: MessageT, T_incl: string[] ): void {
    const logInfo: LogInfo = { Sev, M_du, T_incl };

    this.__logger.log( Sev, logInfo );
  }

  public init( Sev: ConfigSeverityLevel, Sev_ign: LogSeverityLevel, C: ConfigT ): void {
    void [ Sev_ign, C ];

    this.__logger = createLogger( {
      format: format.combine(
        // filterByTags(),
        // transformMsg(),
        format.timestamp(),
        format.json(),
      ),
      transports: [ new transports.Console() ],
      ...( Sev === 'off' ? { silent: true } : { level: Sev } ),
    } );
  }

  // ===================================================================================

  private static __singleton: AdaptiveLogger | null;

  public static getAdaptiveLogger(): AdaptiveLogger {
    if ( this.__singleton === null ) {
      this.__singleton = new AdaptiveLogger();
    }

    return this.__singleton;
  }
}
