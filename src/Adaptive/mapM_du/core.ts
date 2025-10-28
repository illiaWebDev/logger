import Ajv from 'ajv';
import acorn from 'acorn';
import type { TransformableInfo } from 'logform';
import type { ConfigT, LogInfo } from '../types';


const ajv = new Ajv();


export const mapM_du = ( logInfo: LogInfo, C: ConfigT ): TransformableInfo => {
  const {
    M_du,
    Sev,
    T_incl,
    /**
     * because of how winston operates, this won't be exactly an empty object,\
     * but rather an object with some special service properties, that allow\
     * winston to properly log. So we can't just throw away this and have to\
     * persist it
     */
    ...rest
  } = logInfo;

  const message = ( (): string => {
    if ( M_du.type === 'static' ) return M_du.msg;

    try {
      const { ctx, bodyId } = M_du;
      const { M_dyn, M_dyn_schm } = C;

      const maybeBody = M_dyn[ bodyId ];
      if ( maybeBody === undefined ) return '';

      const maybeSchema = M_dyn_schm[ bodyId ];
      if ( maybeSchema !== undefined ) {
        const validate = ajv.compile( JSON.parse( maybeSchema ) );
        const ast = acorn.parse( maybeBody, { ecmaVersion: 6, allowReturnOutsideFunction: true } );

        if ( !validate( ast ) ) return '';
      }

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const func = new Function( 'ctx', maybeBody );
      return String( func( ctx ) );
    } catch ( e: unknown ) {
      return '';
    }
  } )();

  return {
    ...rest,
    level: Sev,
    message,
    /** we also want to pass this to identify call sties more easily */
    T_incl,
  };
};
