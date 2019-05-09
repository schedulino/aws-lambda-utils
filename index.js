"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
const boom_1 = __importDefault(require("@hapi/boom"));
const joi_1 = __importDefault(require("@hapi/joi"));
const lambda_log_1 = require("lambda-log");
exports.logger = new lambda_log_1.LambdaLog({
    debug: process.env.LOGGER_LEVEL === 'DEBUG'
});
class UtilsSvc {
    /**
     * This is custom app error handler.
     */
    static handleError(error) {
        let boomPayload;
        if (boom_1.default.isBoom(error)) {
            boomPayload = error.output.payload;
        }
        else if (error instanceof Error) {
            try {
                // if the error comes from another invoked-lambda we need to
                // parse this error object however if the error was throw somewhere
                // in the function e.g. exception it will contains string instead
                // of JSON object so we handle this error in catch block
                const errorObj = JSON.parse(error.message);
                boomPayload = new boom_1.default(errorObj.message, {
                    statusCode: errorObj.statusCode,
                }).output.payload;
            }
            catch (e) {
                exports.logger.error('APPLICATION EXCEPTION', error.stack);
                boomPayload = boom_1.default.badImplementation(error.message).output.payload;
            }
        }
        else {
            boomPayload = boom_1.default.badImplementation().output.payload;
        }
        return JSON.stringify(boomPayload);
    }
    static async respond(event, context, spec) {
        try {
            if (spec.validate) {
                UtilsSvc.validateInput(event, spec.validate);
            }
            const data = await spec.handler();
            context.succeed(data);
        }
        catch (error) {
            context.fail(UtilsSvc.handleError(error));
        }
    }
    static handleUnrecognizedOperation(event, context) {
        context.fail(UtilsSvc.handleError(boom_1.default.badRequest(`Unrecognized action command ${event.cmd}`)));
    }
    /**
     * Validates event data with the defined validation schema.
     */
    static validateInput(event, validate) {
        const props = Object.keys(validate);
        for (let i = 0; i < props.length; i += 1) {
            const prop = props[i];
            // FIXME: what type is error
            // tslint:disable-next-line:no-any
            const error = joi_1.default.validate(event[prop], validate[prop]) // tslint:disable-next-line:no-any
                .error;
            if (error) {
                throw boom_1.default.badRequest(error);
            }
        }
    }
}
exports.UtilsSvc = UtilsSvc;
