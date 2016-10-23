/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.invokeAsync = exports.invoke = undefined;

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const lambda = new _awsSdk2.default.Lambda({
    region: _config2.default.dynamodb.region,
    apiVersion: '2015-03-31'
});

function parse(arn) {
    if (typeof arn !== 'string') {
        throw new TypeError('Expected a string');
    }

    const regex = [/^([0-9]{12}:[a-z0-9\-_]+):?([a-z0-9\-_]+)?$/i, /^([a-z0-9\-_]+):?([a-z0-9\-_]+)?$/i, /^(arn:aws:lambda:[a-z0-9\-]+:[0-9]{12}:function:[a-z0-9\-_]+):?([a-zA-Z0-9-_]+)?$/i];

    for (var i = 0; i < regex.length; i++) {
        var match = arn.match(regex[i]);

        if (match) {
            if (!match[2]) {
                return { functionName: match[1] };
            }

            return { functionName: match[1], qualifier: match[2] };
        }
    }

    return undefined;
}

function invokeLambda(name, payload, type) {
    if (!name) {
        return Promise.reject(new TypeError('Please provide a name'));
    }

    const parsed = parse(name);

    if (!parsed) {
        return Promise.reject(new Error('Please provide a valid function name'));
    }

    const params = {
        FunctionName: parsed.functionName,
        InvocationType: type,
        Payload: JSON.stringify(payload),
        Qualifier: process.env.SERVERLESS_STAGE
    };

    if (parsed.qualifier) {
        params.Qualifier = parsed.qualifier;
    }

    // return lambda.invoke(params).promise().then(data => {
    //     const payload = JSON.parse(data.Payload);
    //
    //     if (payload && payload.errorMessage) {
    //         return Promise.reject(JSON.parse(payload.errorMessage));
    //     }
    //
    //     return Promise.resolve(payload);
    // });

    return new Promise((resolve, reject) => {
        lambda.invoke(params, (error, data) => {
            if (error) {
                return reject(error);
            }

            let payload;
            try {
                payload = data.Payload ? JSON.parse(data.Payload) : data.Payload;
            } catch (error) {
                console.error('Unable to parse lambda response', data);
                return reject(error);
            }

            try {
                if (payload && payload.errorMessage) {
                    return reject(JSON.parse(payload.errorMessage));
                }
            } catch (error) {
                console.error('Unable to parse lambda response error message', payload.errorMessage);
                return reject(error);
            }

            return resolve(payload);
        });
    });
}

function invoke(name, payload) {
    return invokeLambda(name, payload, 'RequestResponse');
}

function invokeAsync(name, payload) {
    return invokeLambda(name, payload, 'Event');
}

exports.invoke = invoke;
exports.invokeAsync = invokeAsync;
// https://github.com/SamVerschueren/aws-lambda-invoke