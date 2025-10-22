import { createLogger, format, transports, Logger } from 'winston';
import type { ConfigSeverityLevel, LogSeverityLevel } from '../common';
import { isLogInfo, ConfigT, LogInfo, M_du_T, LogInfoExtra } from './types';
import { filterByTags as filterBytagsF } from './filterByTags';
import { mapM_du } from './mapM_du';


export class AdaptiveLogger {
  private __logger: Logger = createLogger();

  /**
   * this simply exists to prevent consumers from creating\
   * instances manually. All the setup will happen in init\
   * method. And singleton-oriented nature is handeled by\
   * static methods/properties
   */
  private constructor() { /** */ }

  public log( Sev: LogSeverityLevel, M_du: M_du_T, T_incl: string[] ): void {
    const logInfo: LogInfo = { Sev, M_du, T_incl };

    this.__logger.log( Sev, logInfo );
  }

  public init( Sev: ConfigSeverityLevel, Sev_ign: LogSeverityLevel | null, C: ConfigT ): void {
    const filterByTagsFormat = format(
      ( info: unknown ): false | LogInfoExtra => {
        if ( !isLogInfo( info ) || !filterBytagsF( C.tags, info, Sev_ign || undefined ) ) return false;

        return { ...info, level: info.Sev, message: '' };
      },
    );

    this.__logger = createLogger( {
      format: format.combine(
        filterByTagsFormat(),
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
