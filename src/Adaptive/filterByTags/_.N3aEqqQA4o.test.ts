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
    // no tags in config - accep
    { params: [ [], baseInfo ], rtrn: true },
    // no tags in config - accept
    { params: [ [], { ...baseInfo, Sev: 'warn' } ], rtrn: true },
    // no tags in config - accept
    { params: [ [], { ...baseInfo, T_incl: [ 't1', 't2' ] } ], rtrn: true },
    // matched explicit exclude  - filter out
    {
      params: [ [ [ { tag: 't1', mode: 'excl' } ] ], { ...baseInfo, T_incl: [ 't1' ] } ],
      rtrn: false,
    },
    // matched explicit exclude + matched include - still filter out
    {
      params: [
        [ [ { tag: 't1', mode: 'excl' }, { tag: 't2', mode: 'incl' } ] ],
        { ...baseInfo, T_incl: [ 't1', 't2' ] },
      ],
      rtrn: false,
    },
    // no include in config at all + unmatched exclude - accept
    {
      params: [ [ [ { tag: 't1', mode: 'excl' } ] ], { ...baseInfo, T_incl: [ 't2' ] } ],
      rtrn: true,
    },
    // existing include, but no match - filter out
    {
      params: [ [ [ { tag: 't1', mode: 'incl' } ] ], { ...baseInfo, T_incl: [ 't2' ] } ],
      rtrn: false,
    },
    // sev is more or equally severe to ignoreTagsIfGteSeverity + exisitng include
    // + no match with include - still accept
    {
      params: [ [ [ { tag: 't1', mode: 'incl' } ] ], { ...baseInfo, T_incl: [ 't2' ], Sev: 'warn' }, 'warn' ],
      rtrn: true,
    },
    // sev is more or equally severe to ignoreTagsIfGteSeverity + matched exclude - still accept
    {
      params: [ [ [ { tag: 't1', mode: 'excl' } ] ], { ...baseInfo, T_incl: [ 't1' ], Sev: 'warn' }, 'warn' ],
      rtrn: true,
    },
  ];

  payloads.forEach( ( p, i ) => (
    test( `payload ${ i }`, () => (
      expect( filterByTags( ...p.params ) ).toBe( p.rtrn )
    ) )
  ) );
} );
