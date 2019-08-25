import Boom from '@hapi/boom';
import {
  apiGatewayEventMock,
  contextMock,
} from '@schedulino/aws-lambda-test-utils';
jest.mock('@sentry/node');
import * as Sentry from '@sentry/node';

import {
  HttpHeader,
  HttpMethod,
  HttpStatusCode,
  lambda,
  logger,
  UtilsSvc,
} from '../src';

const mockedSentry = Sentry as jest.Mocked<typeof Sentry>;
const context = contextMock();
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

  test('should return resolved data with empty string in the body', async () => {
    expect.assertions(1);
    const expectedResult = {
      headers: HttpHeader,
      body: '',
      statusCode: 201,
    };
    const result = await UtilsSvc.responseBuilder(() => Promise.resolve(), 201);

    expect(result).toEqual(expectedResult);
  });

  test('should throw the error', () => {
    return expect(
      UtilsSvc.responseBuilder(
        () => Promise.reject(new Error('test error')),
        201
      )
    ).rejects.toEqual(new Error('test error'));
  });
});

describe('errorHandler', () => {
  beforeAll(() => {
    logger.error = jest.fn();
  });

  test('should return success respond', async () => {
    expect.assertions(1);
    const expectedResult = {
      headers: HttpHeader,
      body: JSON.stringify({
        statusCode: 200,
        message: 'success',
      }),
      statusCode: 200,
    };
    const result = await UtilsSvc.errorHandler(() =>
      Promise.resolve(expectedResult)
    )(event, context, () => {});

    expect(result).toEqual(expectedResult);
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
    const result = await UtilsSvc.errorHandler(() =>
      Promise.reject(Boom.unauthorized())
    )(event, context, () => {});

    expect(result).toEqual(expectedResult);
  });

  // TODO: this test can be removed once ASW Authorizer start support custom responses
  test('should returns Error object when error message is Unauthorized when for Authorizer throw error', () => {
    return expect(
      UtilsSvc.errorHandler(() => Promise.reject(new Error('Unauthorized')))(
        event,
        context,
        () => {}
      )
    ).rejects.toEqual(new Error('Unauthorized'));
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
    const result = await UtilsSvc.errorHandler(() =>
      Promise.reject(new Error('error test message'))
    )(event, context, () => {});

    expect(result).toEqual(expectedResult);
    expect(logger.error).toBeCalledTimes(1);
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
    const result = await UtilsSvc.errorHandler(() =>
      Promise.reject('no-error-object')
    )(event, context, () => {});

    expect(result).toEqual(expectedResult);
  });

  describe('sentry', () => {
    let scope: { setExtras: Function; setUser: Function; setTag: Function };
    const expectedResult = {
      headers: HttpHeader,
      body: JSON.stringify(''),
      statusCode: 200,
    };

    beforeAll(() => {
      jest.resetAllMocks();
    });

    beforeEach(async () => {
      mockedSentry.configureScope.mockImplementationOnce(f =>
        f(scope as Sentry.Scope)
      );
      scope = {
        setUser: jest.fn(),
        setTag: jest.fn(),
        setExtras: jest.fn(),
      };
    });

    test('should set user with userId, accountId and role', async () => {
      expect.assertions(1);

      const requestContext = {
        ...event.requestContext,
        authorizer: { principalId: '124', userId: 'userID', userRole: 'admin' },
      };
      await UtilsSvc.errorHandler(() => Promise.resolve(expectedResult))(
        { ...event, requestContext },
        context,
        () => {}
      );

      expect(scope.setUser).toHaveBeenCalledWith({
        accountId: requestContext.authorizer.principalId,
        id: requestContext.authorizer.userId,
        role: requestContext.authorizer.userRole,
      });
    });

    test('should set only user accountId', async () => {
      expect.assertions(1);

      const requestContext = {
        ...event.requestContext,
        authorizer: { principalId: '124' },
      };
      await UtilsSvc.errorHandler(() => Promise.resolve(expectedResult))(
        { ...event, requestContext },
        context,
        () => {}
      );

      expect(scope.setUser).toHaveBeenCalledWith({
        accountId: requestContext.authorizer.principalId,
      });
    });

    test('should set tag', async () => {
      expect.assertions(1);

      await UtilsSvc.errorHandler(() => Promise.resolve(expectedResult))(
        event,
        { ...context, functionName: 'test-function' },
        () => {}
      );

      expect(scope.setTag).toHaveBeenCalledWith('lambda', 'test-function');
    });

    test('should set extras', async () => {
      expect.assertions(1);

      const mockedContext = {
        ...context,
        awsRequestId: 'awsRequestId test',
        remainingTimeInMillis: () => '10',
        logGroupName: 'logGroupName test',
        logStreamName: 'logStreamName test',
        invokedFunctionArn: 'invokedFunctionArn test',
        memoryLimitInMB: 20,
        clientContext: undefined,
      };

      await UtilsSvc.errorHandler(() => Promise.resolve(expectedResult))(
        event,
        mockedContext,
        () => {}
      );

      expect(scope.setExtras).toHaveBeenCalledWith({
        awsRequestId: mockedContext.awsRequestId,
        remainingTimeInMillis: mockedContext.getRemainingTimeInMillis(),
        logGroupName: mockedContext.logGroupName,
        logStreamName: mockedContext.logStreamName,
        invokedFunctionArn: mockedContext.invokedFunctionArn,
        memoryLimitInMB: mockedContext.memoryLimitInMB,
        clientContext: mockedContext.clientContext,
      });
    });
  });
});

describe('handleUnrecognizedOperation', () => {
  test('returns unrecognized action error message', () => {
    expect(() =>
      UtilsSvc.unrecognizedOperationHandler({
        ...event,
        resource: 'unrecognized-resource',
      })
    ).toThrow('Unrecognized action command unrecognized-resource');
  });
});

describe('lambdaInvoke', () => {
  const eventLambdaInvoke = {
    resource: '/accounts/{id}',
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
    const expectedResult = Boom.badImplementation('test data');
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
    const expectedResult = Boom.badRequest('test_data');

    lambda.invoke = jest.fn().mockReturnValue({
      promise: () =>
        Promise.resolve({
          Payload: JSON.stringify({
            body: JSON.stringify({ error: 'test_data', statusCode: 400 }),
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
    resource: '/accounts/{id}',
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
