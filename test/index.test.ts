import Boom from '@hapi/boom';
import { apiGatewayEventMock } from '@schedulino/aws-lambda-test-utils';

import {
  HttpHeader,
  HttpMethod,
  HttpStatusCode,
  logger,
  UtilsSvc,
} from '../src';

const event = apiGatewayEventMock();

test('should contains correct HttpStatusCode', () => {
  expect(HttpStatusCode.Ok).toBe(200);
  expect(HttpStatusCode.Created).toBe(201);
  expect(HttpStatusCode.NoContent).toBe(204);
});

test('should contains correct HttpMethod', () => {
  expect(HttpMethod.Delete).toBe('DELETE');
  expect(HttpMethod.Get).toBe('GET');
  expect(HttpMethod.Post).toBe('POST');
  expect(HttpMethod.Update).toBe('PUT');
});

test('should contains correct HttpHeader', () => {
  expect(HttpHeader['Access-Control-Allow-Origin']).toBe('*');
  expect(HttpHeader['Access-Control-Allow-Credentials']).toBe(true);
});

describe('responseBuilder', () => {
  test('should return resolved data with default status code 200', async () => {
    expect.assertions(1);
    const expectedResult = {
      headers: HttpHeader,
      body: JSON.stringify(event),
      statusCode: HttpStatusCode.Ok,
    };
    const result = await UtilsSvc.responseBuilder(() => Promise.resolve(event));

    expect(result).toEqual(expectedResult);
  });

  test('should return resolved data with custom status code 201', async () => {
    expect.assertions(1);
    const expectedResult = {
      headers: HttpHeader,
      body: JSON.stringify(event),
      statusCode: 201,
    };
    const result = await UtilsSvc.responseBuilder(
      () => Promise.resolve(event),
      201
    );

    expect(result).toEqual(expectedResult);
  });

  describe('handleError', () => {
    beforeAll(() => {
      logger.error = jest.fn();
    });

    test('should handle Boom error', async () => {
      expect.assertions(1);
      const expectedResult = {
        headers: HttpHeader,
        body: JSON.stringify({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Unauthorized',
        }),
        statusCode: 401,
      };
      const result = await UtilsSvc.responseBuilder(() =>
        Promise.reject(Boom.unauthorized())
      );

      expect(result).toEqual(expectedResult);
    });

    test('should returns 500 Internal Server Error when error message contains string', async () => {
      expect.assertions(2);
      const expectedResult = {
        headers: HttpHeader,
        body: JSON.stringify({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred',
        }),
        statusCode: 500,
      };
      const result = await UtilsSvc.responseBuilder(() =>
        Promise.reject(new Error('error test message'))
      );

      expect(result).toEqual(expectedResult);
      expect(logger.error).toBeCalledTimes(1);
    });

    test('should returns custom error when error message contains JSON parsed object', async () => {
      expect.assertions(1);
      const expectedResult = {
        headers: HttpHeader,
        body: JSON.stringify({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Bad Request Error Message',
        }),
        statusCode: 400,
      };
      const result = await UtilsSvc.responseBuilder(() =>
        Promise.reject(
          new Error(
            '{ "message": "Bad Request Error Message", "statusCode": 400 }'
          )
        )
      );

      expect(result).toEqual(expectedResult);
    });

    test('should returns 500 Internal Server Error when there is none error object', async () => {
      expect.assertions(1);
      const expectedResult = {
        headers: HttpHeader,
        body: JSON.stringify({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred',
        }),
        statusCode: 500,
      };
      const result = await UtilsSvc.responseBuilder(() =>
        Promise.reject('no-error-object')
      );

      expect(result).toEqual(expectedResult);
    });
  });
});

describe('handleUnrecognizedOperation', () => {
  test('returns unrecognized action error message', () => {
    const error = {
      headers: HttpHeader,
      body: JSON.stringify({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Unrecognized action command unrecognized-resource',
      }),
      statusCode: 400,
    };
    expect(
      UtilsSvc.handleUnrecognizedOperation({
        ...event,
        resource: 'unrecognized-resource',
      })
    ).toStrictEqual(error);
  });
});
