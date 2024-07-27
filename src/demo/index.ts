// eslint-disable-next-line import/no-extraneous-dependencies
import express from 'express';
import { Logger } from '../Logger';


const app = express();
const port = 3000;

const logger = new Logger( {
  level: 'debug',
  tags: [],
} );

app.get( '/', ( req, res ) => {
  // req.hostname
  logger.log( {
    level: 'info',
    msg: {
      type: 'adaptive',
      args: [ { param: 'req', value: req } ],
      body: 'return Object.keys(req).join(\',\')',
    },
  } );
  res.send( 'Hello World!' );
} );

app.listen( port, () => {
  // eslint-disable-next-line no-console
  console.info( `Example app listening on port ${ port }` );
} );
