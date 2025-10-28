import { describe, test, expect } from '@jest/globals';
import type { JSONSchemaType } from 'ajv';
import { mapM_du } from './core';
import type { LogSeverityLevel } from '../../common';


const jsonSchemaForSimplePropAccessOnCtx: JSONSchemaType< object > = {
  type: 'object',
  properties: {
    type: { const: 'Program' },
    sourceType: { const: 'script' },
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { const: 'ReturnStatement' },
          argument: {
            type: 'object',
            properties: {
              type: { const: 'MemberExpression' },
              object: {
                type: 'object',
                properties: {
                  type: { const: 'Identifier' },
                  name: { const: 'ctx' },
                },
              },
              property: {
                type: 'object',
                properties: {
                  type: { const: 'Identifier' },
                },
              },
            },
          },
        },
      },
    },
  },
};

describe( 'mapM_du', () => {
  type Payload = { params: Parameters< typeof mapM_du >, rtrn: ReturnType< typeof mapM_du > };
  const payloads: Payload[] = [
    ( (): Payload => {
      const Sev: LogSeverityLevel = 'warn';
      const msg = 'test';
      const T_incl: string[] = [];

      return {
        params: [
          {
            Sev,
            M_du: { type: 'static', msg },
            T_incl,
          },
          {
            M_dyn: {},
            M_dyn_schm: {},
            tags: [],
          },
        ],
        rtrn: { level: Sev, message: msg, T_incl },
      };
    } )(),
    ( (): Payload => {
      const Sev: LogSeverityLevel = 'warn';
      const T_incl: string[] = [];

      return {
        params: [
          {
            Sev,
            M_du: { type: 'dynamic', bodyId: 'non-existent', ctx: {} },
            T_incl,
          },
          {
            M_dyn: {},
            M_dyn_schm: {},
            tags: [],
          },
        ],
        rtrn: { level: Sev, message: '', T_incl },
      };
    } )(),
    ( (): Payload => {
      const Sev: LogSeverityLevel = 'warn';
      const prop = 123;
      const bodyId = 'id1';
      const T_incl: string[] = [];

      return {
        params: [
          {
            Sev,
            M_du: { type: 'dynamic', bodyId, ctx: { prop } },
            T_incl,
          },
          {
            M_dyn: {
              [ bodyId ]: 'return ctx.prop;',
            },
            M_dyn_schm: {},
            tags: [],
          },
        ],
        rtrn: { level: Sev, message: String( prop ), T_incl },
      };
    } )(),
    ( (): Payload => {
      const Sev: LogSeverityLevel = 'warn';
      const prop = 789;
      const bodyId = 'id1';
      const T_incl: string[] = [];

      return {
        params: [
          {
            Sev,
            M_du: { type: 'dynamic', bodyId, ctx: { prop } },
            T_incl,
          },
          {
            M_dyn: {
              [ bodyId ]: 'return ctx.prop;',
            },
            M_dyn_schm: {
              [ bodyId ]: JSON.stringify( jsonSchemaForSimplePropAccessOnCtx ),
            },
            tags: [],
          },
        ],
        rtrn: { level: Sev, message: String( prop ), T_incl },
      };
    } )(),
    ( (): Payload => {
      const Sev: LogSeverityLevel = 'warn';
      const prop = 15742;
      const bodyId = 'id1';
      const T_incl: string[] = [];

      return {
        params: [
          {
            Sev,
            M_du: { type: 'dynamic', bodyId, ctx: { prop } },
            T_incl,
          },
          {
            M_dyn: {
              [ bodyId ]: 'return nonCtx.prop;',
            },
            M_dyn_schm: {
              [ bodyId ]: JSON.stringify( jsonSchemaForSimplePropAccessOnCtx ),
            },
            tags: [],
          },
        ],
        rtrn: { level: Sev, message: '', T_incl },
      };
    } )(),
  ];

  payloads.forEach( ( p, i ) => (
    test( `payload ${ i }`, () => (
      expect( mapM_du( ...p.params ) ).toStrictEqual( p.rtrn )
    ) )
  ) );
} );
