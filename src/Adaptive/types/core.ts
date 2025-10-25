import { isLogSeverityLevel, LogSeverityLevel } from '../../common';


export type MessageTStatic = { type: 'static'; msg: string };
export type MessageTDynamic = {
  type: 'dynamic';
  ctx: Record< string, unknown >;
  bodyId: string;
};
export type M_du_T = (
  | MessageTStatic
  | MessageTDynamic
);
export const isM_du = ( v: unknown ): v is M_du_T => {
  if ( typeof v !== 'object' || v === null || !( 'type' in v ) ) return false;

  const { type } = v as Partial< Pick< M_du_T, 'type' > >;
  if ( type === 'static' ) {
    if ( Object.keys( v ).length !== 2 ) return false;

    const { msg } = v as Partial< MessageTStatic >;
    return typeof msg === 'string';
  }

  if ( type === 'dynamic' ) {
    if ( Object.keys( v ).length !== 3 ) return false;

    const { bodyId, ctx } = v as Partial< MessageTDynamic >;
    return typeof bodyId === 'string' && typeof ctx === 'object' && ctx !== null;
  }

  return false;
};
export type LogInfo = {
  Sev: LogSeverityLevel;
  M_du: M_du_T;
  T_incl: string[];
};
export const isLogInfo = ( v: unknown ): v is LogInfo => {
  if ( typeof v !== 'object' || v === null ) return false;

  const { M_du, Sev, T_incl } = v as { [ K in keyof LogInfo ]?: unknown };
  return (
    true
    && isM_du( M_du )
    && isLogSeverityLevel( Sev )
    && ( Array.isArray( T_incl ) && T_incl.every( it => typeof it === 'string' ) )
  );
};

export type LogInfoExtra = LogInfo & { message: string; level: LogInfo['Sev'] };
export const isLogInfoExtra = ( v: unknown ): v is LogInfoExtra => {
  if ( typeof v !== 'object' || v === null ) return false;

  const { level, message, ...rest } = v as { [ K in keyof LogInfoExtra ]?: unknown };

  return true
    && isLogSeverityLevel( level )
    && typeof message === 'string'
    && isLogInfo( rest );
};


export type TagsAndSegment = { tag: string; mode: 'incl' | 'excl' };
export type TagsOrSegment = TagsAndSegment[];
export type ConfigT = {
  tags: TagsOrSegment[];
  M_dyn: Record< string, string >;
  M_dyn_schm: Record< string, string >;
};
export const areConfigTagsEmpty = ( configTags: ConfigT['tags'] ): boolean => (
  configTags.every( orSegment => orSegment.length === 0 )
);
