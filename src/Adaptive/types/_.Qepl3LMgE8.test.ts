import { describe, test, expect } from '@jest/globals';
import { areConfigTagsEmpty, ConfigT } from './core';


describe( 'areConfigTagsEmpty', () => {
  type Payload = { arg: ConfigT['tags'], rtrn: boolean };
  const payloads: Payload[] = [
    { arg: [], rtrn: true },
    { arg: [ [] ], rtrn: true },
    { arg: [ [], [], [] ], rtrn: true },
    { arg: [ [ { tag: 'a', mode: 'excl' } ] ], rtrn: false },
  ];

  payloads.forEach( ( p, i ) => (
    test( `payload ${ i }`, () => (
      expect( areConfigTagsEmpty( p.arg ) ).toBe( p.rtrn )
    ) )
  ) );
} );
