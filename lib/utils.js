/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
import Joi from 'joi';
import Boom from 'boom';
import logger from 'lambda-log';

// this is custom app error handler
function handleError(error) {
    if (error.isBoom) {
        error = error.output.payload;
    } else if (error instanceof Error) {
        try {
            // if the error comes from another invoked-lambda we need to
            // parse this error object however if the error was throw somewhere
            // in the function e.g. exception it will contains string instead
            // of JSON object so we handle this error in catch block
            error = JSON.parse(error.message);
            error = Boom.create(error.statusCode, error.message).output.payload;
        } catch (e) {
            logger.error('APPLICATION EXCEPTION', error.stack);
            error = Boom.badImplementation(error.message).output.payload;
        }
    } else {
        error = Boom.badImplementation().output.payload;
    }

    return JSON.stringify(error);
}

/**
 * Validates event data with the defined validation schema.
 *
 * @param {event} event - lambda event data
 * @param {Object} validate - validation schema
 * @throws {Error} Will throw an error if it failed to validate schema.
 * @api private
 */
function validateInput(event, validate) {
    const props = Object.keys(validate);

    for (let i = 0; i < props.length; i += 1) {
        const prop = props[i];
        const error = Joi.validate(event[prop], validate[prop]).error;

        if (error) {
            throw Boom.badRequest(error);
        }
    }
}

async function respond(event, context, spec) {
    try {
        if (spec.validate) {
            validateInput(event, spec.validate);
        }

        const data = await spec.handler();
        context.succeed(data);
    } catch (error) {
        context.fail(handleError(error));
    }
}

function handleUnrecognizedOperation(event, context) {
    context.fail(handleError(Boom.badRequest(`Unrecognized action command ${event.operation}`)));
}

export { respond, handleUnrecognizedOperation, handleError };
