/// <reference types="hapi__boom" />
/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
import Boom from '@hapi/boom';
import { APIGatewayEvent, Context } from 'aws-lambda';
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
declare function handleError(error: Boom | Error): string;
declare function respond(
  event: SchedulinoAPIGatewayEvent,
  context: Context,
  spec: Spec
): Promise<void>;
declare function handleUnrecognizedOperation(
  event: SchedulinoAPIGatewayEvent,
  context: Context
): void;
export { respond, handleUnrecognizedOperation, handleError };
