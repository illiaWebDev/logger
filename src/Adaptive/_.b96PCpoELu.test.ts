import { describe, test } from '@jest/globals';
import { AdaptiveLogger } from './index';


const logger = AdaptiveLogger.getAdaptiveLogger();
logger.init(
  'info',
  null,
  {
    isProd: false,
    tags: [],
    M_dyn: {
      id1: 'return ctx.headers.authorization',
    },
    M_dyn_schm: {},
  },
);
logger.log(
  'info',
  {
    type: 'dynamic',
    bodyId: 'id1',
    ctx: { headers: { authorization: 'Bearer q123' } },
  },
  [],
);


describe( '123', () => {
  test.todo( 'todo' );
} );
