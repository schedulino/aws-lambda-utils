import Boom from '@hapi/boom';
import { apiGatewayEventMock } from '@schedulino/aws-lambda-test-utils';

import {
  HttpHeader,
  HttpMethod,
  HttpStatusCode,
  lambda,
  logger,
  UtilsSvc,
} from '../src';

const event = apiGatewayEventMock();

test('should contains correct HttpStatusCode', () => {
  expect(HttpStatusCode.Ok).toBe(200);
  expect(HttpStatusCode.Created).toBe(201);
  expect(HttpStatusCode.NoContent).toBe(204);
  expect(HttpStatusCode.BadRequest).toBe(400);
});

test('should contains correct HttpMethod', () => {
  expect(HttpMethod.Delete).toBe('DELETE');
  expect(HttpMethod.Get).toBe('GET');
  expect(HttpMethod.Post).toBe('POST');
  expect(HttpMethod.Update).toBe('PUT');
  expect(HttpMethod.Patch).toBe('PATCH');
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

    test('should returns 500 Internal Server Error when error is type of Error', async () => {
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
      expect(logger.error).toBeCalledTimes(2);
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

describe('lambdaInvoke', () => {
  const eventLambdaInvoke = {
    path: '/accounts/{id}',
    httpMethod: HttpMethod.Patch,
    pathParameters: { id: 'id' },
    requestContext: { authorizer: { principalId: 'principalID' } },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('throws error if an invalid function name is provided', () => {
    const expectedResult = {
      error: 'Internal Server Error',
      message: 'An internal server error occurred',
      statusCode: 500,
    };
    return expect(UtilsSvc.lambdaInvoke('', eventLambdaInvoke)).rejects.toEqual(
      expectedResult
    );
  });

  test('invoke should have been called with the correct params', async () => {
    expect.assertions(2);
    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Payload: JSON.stringify({ data: 'test data' }) }),
    });

    await UtilsSvc.lambdaInvoke('somefunctionarn', eventLambdaInvoke);
    expect(lambda.invoke).toHaveBeenCalledTimes(1);
    expect(lambda.invoke).toHaveBeenCalledWith({
      FunctionName: 'somefunctionarn',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(eventLambdaInvoke),
    });
  });

  test('invoke should have been called with the Qualifier params', async () => {
    expect.assertions(2);
    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Payload: JSON.stringify({ data: 'test data' }) }),
    });

    await UtilsSvc.lambdaInvoke('123456789876:foo:bar', eventLambdaInvoke);
    expect(lambda.invoke).toHaveBeenCalledTimes(1);
    expect(lambda.invoke).toHaveBeenCalledWith({
      FunctionName: '123456789876:foo',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(eventLambdaInvoke),
      Qualifier: 'bar',
    });
  });

  test('invoke returns success payload', async () => {
    const expectedResult = { data: 'test data' };
    expect.assertions(2);
    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({
          Payload: JSON.stringify({ body: JSON.stringify(expectedResult) }),
        }),
    });

    const result = await UtilsSvc.lambdaInvoke(
      'somefunctionarn',
      eventLambdaInvoke
    );

    expect(lambda.invoke).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(expectedResult);
  });

  test('invoke returns error exception payload', () => {
    const expectedResult = {
      error: 'Internal Server Error',
      message: 'An internal server error occurred',
      statusCode: 500,
    };
    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({
          Payload: JSON.stringify({
            body: JSON.stringify({ errorMessage: 'test data' }),
          }),
        }),
    });

    return expect(
      UtilsSvc.lambdaInvoke('somefunctionarn', eventLambdaInvoke)
    ).rejects.toEqual(expectedResult);
  });

  test('invoke returns error Boom payload', () => {
    const expectedResult = {
      error: 'Bad Request',
      message: 'test data',
      statusCode: 400,
    };
    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({
          Payload: JSON.stringify({
            body: JSON.stringify({ error: 'test data', statusCode: 400 }),
          }),
        }),
    });

    return expect(
      UtilsSvc.lambdaInvoke('somefunctionarn', eventLambdaInvoke)
    ).rejects.toEqual(expectedResult);
  });
});

describe('lambdaInvokeAsync', () => {
  const eventLambdaInvoke = {
    path: '/accounts/{id}',
    httpMethod: HttpMethod.Patch,
    pathParameters: { id: 'id' },
    requestContext: { authorizer: { principalId: 'principalID' } },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('throws error if an invalid function name is provided', () => {
    const expectedResult = {
      error: 'Internal Server Error',
      message: 'An internal server error occurred',
      statusCode: 500,
    };
    return expect(
      UtilsSvc.lambdaInvokeAsync('', eventLambdaInvoke)
    ).rejects.toEqual(expectedResult);
  });

  test('invoke should have been called with the correct params', async () => {
    expect.assertions(2);
    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Payload: JSON.stringify({ data: 'test data' }) }),
    });

    await UtilsSvc.lambdaInvokeAsync('somefunctionarn', eventLambdaInvoke);
    expect(lambda.invoke).toHaveBeenCalledTimes(1);
    expect(lambda.invoke).toHaveBeenCalledWith({
      FunctionName: 'somefunctionarn',
      InvocationType: 'Event',
      Payload: JSON.stringify(eventLambdaInvoke),
    });
  });

  test('invoke should have been called with the Qualifier params', async () => {
    expect.assertions(2);
    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({ Payload: JSON.stringify({ data: 'test data' }) }),
    });

    await UtilsSvc.lambdaInvokeAsync('123456789876:foo:bar', eventLambdaInvoke);
    expect(lambda.invoke).toHaveBeenCalledTimes(1);
    expect(lambda.invoke).toHaveBeenCalledWith({
      FunctionName: '123456789876:foo',
      InvocationType: 'Event',
      Payload: JSON.stringify(eventLambdaInvoke),
      Qualifier: 'bar',
    });
  });
});
