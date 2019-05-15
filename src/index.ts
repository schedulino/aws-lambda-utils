/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
import Boom from '@hapi/boom';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaLog } from 'lambda-log';

export { default as Boom } from '@hapi/boom';

export const logger = new LambdaLog({
  debug: process.env.LOGGER_LEVEL === 'DEBUG',
});

export interface SchedulinoAPIGatewayEvent extends APIGatewayEvent {
  principalId: string;
  cmd: string;
}

const headers = {
  'Access-Control-Allow-Origin': '*', // This is required to make CORS work with AWS API Gateway Proxy Integration.
};

export class UtilsSvc {
  static async responseBuilder(
    fn: Function,
    statusCode?: number
  ): Promise<APIGatewayProxyResult> {
    try {
      return {
        headers,
        body: JSON.stringify(await fn()),
        statusCode: statusCode || 200,
      };
    } catch (error) {
      return UtilsSvc.handleError(error);
    }
  }

  // static async respond(event: SchedulinoAPIGatewayEvent, spec: Spec) {
  //   try {
  //     if (spec.validate) {
  //       UtilsSvc.validateInput(event, spec.validate);
  //     }
  //
  //
  //     return await spec.handler();
  //   } catch (error) {
  //     throw UtilsSvc.handleError(error);
  //   }
  // }

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
      if (error.data) {
        // tslint:disable-next-line:no-any
        (boomPayload as any).data = error.data;
      }
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
        logger.error('APPLICATION EXCEPTION', error.stack);
        boomPayload = Boom.badImplementation(error.message).output.payload;
      }
    } else {
      boomPayload = Boom.badImplementation().output.payload;
    }

    return {
      headers,
      body: JSON.stringify(boomPayload),
      statusCode: boomPayload.statusCode,
    };
  }

  /**
   * Validates event data with the defined validation schema.
   */
  // private static validateInput(
  //   event: SchedulinoAPIGatewayEvent,
  //   validate: Validate
  // ) {
  //   const props = Object.keys(validate);
  //
  //   for (let i = 0; i < props.length; i += 1) {
  //     const prop = props[i];
  //     const error: ValidationError = Joi.validate(
  //       // tslint:disable-next-line:no-any
  //       (event as any)[prop],
  //       validate[prop],
  //       { abortEarly: false }
  //     ).error;
  //
  //     if (error) {
  //       throw Boom.badRequest(
  //         error.details[0].message,
  //         error.details.map(detail => ({
  //           message: detail.message.replace(/['"]/g, ''),
  //           type: detail.type,
  //         }))
  //       );
  //     }
  //   }
  // }
}
