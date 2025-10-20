import { JSONSchemaType } from 'ajv';
import type { LogSeverityLevel } from '../../common';

export type MessageT = (
  | { type: 'static'; msg: string }
  | {
    type: 'dynamic';
    ctx: Record< string, unknown >;
    bodyId: string;
  }
);
export type LogInfo = {
  Sev: LogSeverityLevel;
  M_du: MessageT;
  T_incl: string[];
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
