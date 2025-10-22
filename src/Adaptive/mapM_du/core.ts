import type { TransformableInfo } from 'logform';
import type { M_du_T, ConfigT, LogInfo } from '../types';
import type { LogSeverityLevel } from '../../common';


export const mapM_du = ( logInfo: LogInfo, C: ConfigT ): TransformableInfo => {
  const { M_du, Sev, T_incl } = logInfo;

  const message = ( (): string => {
    if ( M_du.type === 'static' ) return M_du.msg;

    try {
      const { ctx, bodyId } = M_du;
      const { M_dyn, M_dyn_schm } = C;

      const maybeBody = M_dyn[ bodyId ];
      if ( maybeBody === undefined ) return '';

      const maybeSchema = M_dyn_schm[ bodyId ];
      if ( maybeSchema !== undefined ) {
        return '';
      }

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const func = new Function( 'ctx', maybeBody );
      return String( func( ctx ) );
    } catch ( e: unknown ) {
      return '';
    }
  } )();

  return { level: Sev, message, T_incl };
};
