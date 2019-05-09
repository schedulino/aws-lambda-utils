import Boom from '@hapi/boom';
import Joi from '@hapi/joi';

import { logger, SchedulinoAPIGatewayEvent, UtilsSvc } from '../src';

const event = {
  cmd: 'test',
  principalId: 'principalId',
  // tslint:disable-next-line:no-any
  path: { id: 'id', uuid: 'uuid' } as any,
} as SchedulinoAPIGatewayEvent;

const validateSchema = {
  findOne: {
    principalId: Joi.string().required(),
    path: {
      id: Joi.string().required(),
      uuid: Joi.string().required(),
    },
  },
};

beforeAll(() => {
  logger.error = jest.fn();
});

describe('respond', () => {
  test('should return resolved data without to run validation', () => {
    return expect(
      UtilsSvc.respond(event, {
        handler: () => Promise.resolve(event),
      })
    ).resolves.toEqual(event);
  });

  describe('validateInput', () => {
    test('should validate the input and return resolved data', () => {
      return expect(
        UtilsSvc.respond(event, {
          validate: validateSchema.findOne,
          handler: () => Promise.resolve(event),
        })
      ).resolves.toEqual(event);
    });

    test('should throw the error when validation input fail', () => {
      const error = new Error(
        JSON.stringify({
          statusCode: 400,
          error: 'Bad Request',
          message: '"id" must be a string',
          data: [
            { message: 'id must be a string', type: 'string.base' },
            { message: 'uuid is required', type: 'any.required' },
          ],
        })
      );

      return expect(
        UtilsSvc.respond(
          // tslint:disable-next-line:no-any
          { principalId: 'principalId', path: { id: true } } as any,
          {
            validate: validateSchema.findOne,
            handler: () => Promise.resolve(event),
          }
        )
      ).rejects.toEqual(error);
    });
  });

  describe('handleError', () => {
    test('should throw Boom error', () => {
      const error = new Error(
        JSON.stringify({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Unauthorized',
        })
      );
      return expect(
        UtilsSvc.respond(event, {
          handler: () => Promise.reject(Boom.unauthorized()),
        })
      ).rejects.toEqual(error);
    });

    test('should throw 500 Internal Server Error when error message contains string', async () => {
      const error = new Error(
        JSON.stringify({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred',
        })
      );

      await expect(
        UtilsSvc.respond(event, {
          handler: () => Promise.reject(new Error('error test message')),
        })
      ).rejects.toEqual(error);
      expect(logger.error).toBeCalledTimes(1);
    });

    test('should throw custom error when error message contains JSON parsed object', () => {
      const error = new Error(
        JSON.stringify({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Bad Request Error Message',
        })
      );

      return expect(
        UtilsSvc.respond(event, {
          handler: () =>
            Promise.reject(
              new Error(
                '{ "message": "Bad Request Error Message", "statusCode": 400 }'
              )
            ),
        })
      ).rejects.toEqual(error);
    });

    test('should throw 500 Internal Server Error when there is none error object', () => {
      const error = new Error(
        JSON.stringify({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred',
        })
      );

      return expect(
        UtilsSvc.respond(event, {
          handler: () => Promise.reject('no-error-object'),
        })
      ).rejects.toEqual(error);
    });
  });
});

describe('handleUnrecognizedOperation', () => {
  test('should throw 400 Bad Request error', () => {
    const error = new Error(
      JSON.stringify({
        statusCode: 400,
        error: 'Bad Request',
        message: `Unrecognized action command ${event.cmd}`,
      })
    );
    expect(() => UtilsSvc.handleUnrecognizedOperation(event)).toThrowError(
      error
    );
  });
});
