// eslint-disable-next-line import/no-extraneous-dependencies
import express from 'express';
import { Logger } from '../Logger';


const app = express();
const port = 3000;

const logId = '4e5c2af0-17fe-4c73-9157-b2148d2a0c5e';
const logger = new Logger( {
  level: 'debug',
  tags: [],
  bodiesForAdaptive: {
    [ logId ]: 'return JSON.stringify(req.headers)',
  },
} );

app.get( '/', ( req, res ) => {
  // req.cookies;
  logger.log( {
    level: 'info',
    msg: {
      type: 'adaptive',
      args: [ { param: 'req', value: req } ],
      id: logId,
    },
  } );

  res.send( 'Hello World!' );
} );


app.get( '/reinit-logger', ( req, res ) => {
  const { body } = req.query;
  if ( typeof body === 'string' ) {
    logger.reinit( { bodiesForAdaptive: { [ logId ]: body } } );
  }

  res.send( 'reinit-logger' );
} );

app.listen( port, () => {
  // eslint-disable-next-line no-console
  console.info( `Example app listening on port ${ port }` );
} );
