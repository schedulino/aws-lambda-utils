/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
import Boom from '@hapi/boom';
import Joi from '@hapi/joi';
import { APIGatewayEvent, Context } from 'aws-lambda';
import { LambdaLog } from 'lambda-log';

export const logger = new LambdaLog({
  debug: process.env.LOGGER_LEVEL === 'DEBUG',
});

export interface SchedulinoAPIGatewayEvent extends APIGatewayEvent {
  principalId: string;
  cmd: string;
}

export interface Validate {
  // tslint:disable-next-line:no-any
  [name: string]: any;
}

export interface Spec {
  validate: Validate;
  // tslint:disable-next-line:no-any
  handler: () => any;
}

export class UtilsSvc {
  /**
   * This is custom app error handler.
   */
  static handleError(error: Boom | Error): string {
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
        logger.error('APPLICATION EXCEPTION', error.stack);
        boomPayload = Boom.badImplementation(error.message).output.payload;
      }
    } else {
      boomPayload = Boom.badImplementation().output.payload;
    }

    return JSON.stringify(boomPayload);
  }

  static async respond(
    event: SchedulinoAPIGatewayEvent,
    context: Context,
    spec: Spec
  ) {
    try {
      if (spec.validate) {
        UtilsSvc.validateInput(event, spec.validate);
      }

      const data = await spec.handler();
      context.succeed(data);
    } catch (error) {
      context.fail(UtilsSvc.handleError(error));
    }
  }

  static handleUnrecognizedOperation(
    event: SchedulinoAPIGatewayEvent,
    context: Context
  ) {
    context.fail(
      UtilsSvc.handleError(
        Boom.badRequest(`Unrecognized action command ${event.cmd}`)
      )
    );
  }

  /**
   * Validates event data with the defined validation schema.
   */
  private static validateInput(
    event: SchedulinoAPIGatewayEvent,
    validate: Validate
  ) {
    const props = Object.keys(validate);

    for (let i = 0; i < props.length; i += 1) {
      const prop = props[i];
      // FIXME: what type is error
      // tslint:disable-next-line:no-any
      const error = Joi.validate((event as any)[prop], validate[prop]) // tslint:disable-next-line:no-any
        .error as any;

      if (error) {
        throw Boom.badRequest(error);
      }
    }
  }
}
