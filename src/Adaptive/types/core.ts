import type { JSONSchemaType } from 'ajv';
import { isLogSeverityLevel, LogSeverityLevel } from '../../common';


export type MessageTStatic = { type: 'static'; msg: string };
export type MessageTDynamic = {
  type: 'dynamic';
  ctx: Record< string, unknown >;
  bodyId: string;
};
export type MessageT = (
  | MessageTStatic
  | MessageTDynamic
);
export const isMessageT = ( v: unknown ): v is MessageT => {
  if ( typeof v !== 'object' || v === null || !( 'type' in v ) ) return false;

  const { type } = v as Partial< Pick< MessageT, 'type' > >;
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
  M_du: MessageT;
  T_incl: string[];
};
export const isLogInfo = ( v: unknown ): v is LogInfo => {
  if ( typeof v !== 'object' || v === null || Object.keys( v ).length !== 3 ) return false;

  const { M_du, Sev, T_incl } = v as { [ K in keyof LogInfo ]?: unknown };

  return true
    && isMessageT( M_du )
    && isLogSeverityLevel( Sev )
    && ( Array.isArray( T_incl ) && T_incl.every( it => typeof it === 'string' ) );
};


export type TagsAndSegment = { tag: string; mode: 'incl' | 'excl' };
export type TagsOrSegment = TagsAndSegment[];
export type ConfigT = {
  tags: TagsOrSegment[];
  M_dyn: Record< string, string >;
  M_dyn_schm: Record< string, JSONSchemaType< unknown > >;
};
export const areConfigTagsEmpty = ( configTags: ConfigT['tags'] ): boolean => (
  configTags.every( orSegment => orSegment.length === 0 )
);
