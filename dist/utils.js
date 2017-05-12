'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.handleError = exports.handleUnrecognizedOperation = exports.respond = undefined;

var respond = function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(event, context, spec) {
        var data;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.prev = 0;

                        if (spec.validate) {
                            validateInput(event, spec.validate);
                        }

                        _context.next = 4;
                        return spec.handler();

                    case 4:
                        data = _context.sent;

                        context.succeed(data);
                        _context.next = 11;
                        break;

                    case 8:
                        _context.prev = 8;
                        _context.t0 = _context['catch'](0);

                        context.fail(handleError(_context.t0));

                    case 11:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[0, 8]]);
    }));

    return function respond(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

var _lambdaLogger = require('@schedulino/lambda-logger');

var _lambdaLogger2 = _interopRequireDefault(_lambdaLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * @author    Martin Micunda {@link http://martinmicunda.com}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * @copyright Copyright (c) 2016, Martin Micunda
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * @license   GPL-3.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            */


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
            error = _boom2.default.create(error.statusCode, error.message).output.payload;
        } catch (e) {
            _lambdaLogger2.default.error('APPLICATION EXCEPTION', error.stack);
            error = _boom2.default.badImplementation(error.message).output.payload;
        }
    } else {
        error = _boom2.default.badImplementation().output.payload;
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
    var props = Object.keys(validate);

    for (var i = 0; i < props.length; i += 1) {
        var prop = props[i];
        var error = _joi2.default.validate(event[prop], validate[prop]).error;

        if (error) {
            throw _boom2.default.badRequest(error);
        }
    }
}

function handleUnrecognizedOperation(event, context) {
    context.fail(handleError(_boom2.default.badRequest('Unrecognized action command ' + event.operation)));
}

exports.respond = respond;
exports.handleUnrecognizedOperation = handleUnrecognizedOperation;
exports.handleError = handleError;