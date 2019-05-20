/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
import Boom from '@hapi/boom';
import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
  CustomAuthorizerEvent,
} from 'aws-lambda';
import { LambdaLog } from 'lambda-log';

export { default as Boom } from '@hapi/boom';

// Type aliases to hide the 'aws-lambda' package and have consistent, short naming.
export type ApiContext = Context;
export type ApiEvent = APIGatewayEvent;
export type ApiHandler = APIGatewayProxyHandler;
export type ApiResponse = APIGatewayProxyResult;
export type AuthorizerEvent = CustomAuthorizerEvent;

export const logger = new LambdaLog({
  debug: process.env.LOGGER_LEVEL === 'DEBUG',
  dev: !!process.env.IS_OFFLINE,
});

export const HttpHeader = {
  'Access-Control-Allow-Origin': '*', // Required for CORS support to work
  'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
};

export const HttpStatusCode = {
  Ok: 200,
  Created: 201,
  NoContent: 204,
};

export const HttpMethod = {
  Delete: 'DELETE',
  Get: 'GET',
  Post: 'POST',
  Update: 'PUT',
};

export class UtilsSvc {
  static async responseBuilder(
    fn: Function,
    statusCode?: number
  ): Promise<APIGatewayProxyResult> {
    try {
      return {
        headers: HttpHeader,
        body: JSON.stringify(await fn()),
        statusCode: statusCode || HttpStatusCode.Ok,
      };
    } catch (error) {
      return UtilsSvc.handleError(error);
    }
  }

  static handleUnrecognizedOperation(
    event: APIGatewayEvent
  ): APIGatewayProxyResult {
    return UtilsSvc.handleError(
      Boom.badRequest(`Unrecognized action command ${event.resource}`)
    );
  }

  /**
   * This is custom app error handler.
   */
  private static handleError(error: Boom | Error): APIGatewayProxyResult {
    let boomPayload: Boom.Payload;

    if (Boom.isBoom(error)) {
      boomPayload = error.output.payload;
    } else if (error instanceof Error) {
      try {
        // if the error comes from another invoked-lambda we need to
        // parse this error object however if the error was throw somewhere
        // in the function e.g. exception it will contains string instead
        // of JSON object so we handle this error in catch block
        const errorObj: Boom.Payload = JSON.parse(error.message);
        boomPayload = new Boom(errorObj.message, {
          statusCode: errorObj.statusCode,
        }).output.payload;
      } catch (e) {
        logger.error(error);
        boomPayload = Boom.badImplementation(error.message).output.payload;
      }
    } else {
      boomPayload = Boom.badImplementation().output.payload;
    }

    return {
      headers: HttpHeader,
      body: JSON.stringify(boomPayload),
      statusCode: boomPayload.statusCode,
    };
  }
}
