import { isLogSeverityLevel, isStrToStrMap, LogSeverityLevel } from '../../common';


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
export const isTagsAndSegment = ( v: unknown ): v is TagsAndSegment => {
  if ( typeof v !== 'object' || v === null || Object.keys( v ).length !== 2 ) return false;

  const { mode, tag } = v as { [ K in keyof TagsAndSegment ]?: unknown };
  const typedMode = mode as TagsAndSegment[ 'mode' ] | undefined;

  return true
    && typeof tag === 'string'
    && ( typedMode === 'excl' || typedMode === 'incl' );
};

export type TagsOrSegment = TagsAndSegment[];
export const isTagsOrSegment = ( v: unknown ): v is TagsOrSegment => (
  Array.isArray( v ) && v.every( ( it: unknown ) => isTagsAndSegment( it ) )
);

export type ConfigT = {
  tags: TagsOrSegment[];
  M_dyn: Record< string, string >;
  M_dyn_schm: Record< string, string >;
};
export const isConfigT = ( v: unknown ): v is ConfigT => {
  if ( typeof v !== 'object' || v === null || Object.keys( v ).length !== 3 ) return false;

  const { tags, M_dyn, M_dyn_schm } = v as { [ K in keyof ConfigT ]?: unknown };

  return true
    && ( Array.isArray( tags ) && tags.every( ( it: unknown ) => isTagsOrSegment( it ) ) )
    && isStrToStrMap( M_dyn )
    && isStrToStrMap( M_dyn_schm );
};
export const areConfigTagsEmpty = ( configTags: ConfigT['tags'] ): boolean => (
  configTags.every( orSegment => orSegment.length === 0 )
);
