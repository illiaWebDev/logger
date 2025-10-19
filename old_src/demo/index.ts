// eslint-disable-next-line import/no-extraneous-dependencies
import express from 'express';
import Ajv, { JSONSchemaType } from 'ajv';
import { Logger } from '../Logger';


const ajv = new Ajv();

const app = express();
const port = 3000;

const logId = '4e5c2af0-17fe-4c73-9157-b2148d2a0c5e';

type ExpressionOnlyProgram = {
  type: 'Program';
  body: Array<{
    type: 'ExpressionStatement',
    expression: { type: 'Identifier' }
  }>
};
const expressionOnlySchema: JSONSchemaType< ExpressionOnlyProgram > = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: [ 'Program' ] },
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: [ 'ExpressionStatement' ] },
          expression: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: [ 'Identifier' ] },
            },
            required: [ 'type' ],
          },
        },
        required: [ 'expression', 'type' ],
      },
    },
  },
  required: [ 'type', 'body' ],
};

type MemberExpressionOnlyProgram = {
  type: 'Program';
  body: Array<{
    type: 'ExpressionStatement',
    expression: {
      type: 'MemberExpression',
      object: { type: 'Identifier' },
      property: { type: 'Identifier' },
    }
  }>
};
const memberExpressionOnlySchema: JSONSchemaType< MemberExpressionOnlyProgram > = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: [ 'Program' ] },
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: [ 'ExpressionStatement' ] },
          expression: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: [ 'MemberExpression' ] },
              object: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: [ 'Identifier' ] },
                },
                required: [ 'type' ],
              },
              property: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: [ 'Identifier' ] },
                },
                required: [ 'type' ],
              },
            },
            required: [ 'type', 'object', 'property' ],
          },
        },
        required: [ 'expression', 'type' ],
      },
    },
  },
  required: [ 'type', 'body' ],
};

const logger = new Logger( {
  level: 'debug',
  tags: [],
  bodiesForAdaptive: {
    [ logId ]: 'req.originalUrl',
  },
  adpBodyValidators: {
    [ logId ]: ajv.compile( { oneOf: [ expressionOnlySchema, memberExpressionOnlySchema ] } ),
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
