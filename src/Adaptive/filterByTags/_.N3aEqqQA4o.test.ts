import { describe, test, expect } from '@jest/globals';
import { filterByTags } from './core';
import type { LogInfo } from '../types';


const baseInfo: LogInfo = {
  M_du: { type: 'static', msg: '' },
  Sev: 'error',
  T_incl: [],
};
describe( 'filterByTags', () => {
  type Payload = {
    params: Parameters< typeof filterByTags >,
    rtrn: boolean
  };
  const payloads: Payload[] = [
    { params: [ [], baseInfo ], rtrn: true },
    { params: [ [], { ...baseInfo, Sev: 'warn' } ], rtrn: true },
    { params: [ [], { ...baseInfo, T_incl: [ 't1', 't2' ] } ], rtrn: true },
    {
      params: [ [ [ { tag: 't1', mode: 'excl' } ] ], { ...baseInfo, T_incl: [ 't1' ] } ],
      rtrn: false,
    },
    {
      params: [ [ [ { tag: 't1', mode: 'excl' } ] ], { ...baseInfo, T_incl: [ 't2' ] } ],
      rtrn: true,
    },
  ];

  payloads.forEach( ( p, i ) => (
    test( `payload ${ i }`, () => (
      expect( filterByTags( ...p.params ) ).toBe( p.rtrn )
    ) )
  ) );
} );
