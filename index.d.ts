/// <reference types="hapi__boom" />
/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
import Boom from '@hapi/boom';
import { APIGatewayEvent, Context } from 'aws-lambda';
import { LambdaLog } from 'lambda-log';
export declare const logger: LambdaLog;
export interface SchedulinoAPIGatewayEvent extends APIGatewayEvent {
  principalId: string;
  cmd: string;
}
export interface Validate {
  [name: string]: any;
}
export interface Spec {
  validate: Validate;
  handler: () => any;
}
export declare class UtilsSvc {
  /**
   * This is custom app error handler.
   */
  static handleError(error: Boom | Error): string;
  static respond(
    event: SchedulinoAPIGatewayEvent,
    context: Context,
    spec: Spec
  ): Promise<void>;
  static handleUnrecognizedOperation(
    event: SchedulinoAPIGatewayEvent,
    context: Context
  ): void;
  /**
   * Validates event data with the defined validation schema.
   */
  private static validateInput;
}
