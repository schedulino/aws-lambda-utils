/**
 * An application config.
 *
 * @module config
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2015, Martin Micunda
 * @license	  GPL-3.0
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
const config = Object.freeze({
    loggerLevel: process.env.LOGGER_LEVEL,

    // i18n settings
    i18n: {
        defaultLocale: process.env.LOCALE_DEFAULT || 'en'
    },

    // Token settings
    token: {
        secret: process.env.TOKEN_SECRET || 'schedulino',
        // TODO: 24 hours is not ideal so implement long and short living token
        expiration: process.env.TOKEN_EXPIRATION || 60 * 60 * 24, // 24 hours
        issuer: 'schedulino.com'
    },

    // SendGrid settings
    sengrid: {
        apiKey: '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' //process.env.SENDGRID_API_KEY
    },

    // Email template settings
    email: {
        imageCDN: 'https://cdn.schedulino.com/email',
        noreply: 'no-reply@schedulino.com',
        appEndpoint: process.env.APP_ENDPOINT || 'http://demo.schedulino.com', //'http://localhost:8000'
        projectName: 'Schedulino',
        copyright: 'Schedulino s.r.o.',
        copyrightLink: 'https://www.schedulino.com',
        expiration: process.env.TOKEN_EMAIL_EXPIRATION || 60 * 60 * 24 // 24 hours
    },

    // DynamoDB settings
    dynamodb: {
        prefix: process.env.SERVERLESS_PROJECT ? `${ process.env.SERVERLESS_PROJECT }-` : 'schedulino-',
        postfix: process.env.SERVERLESS_STAGE ? `-${ process.env.SERVERLESS_STAGE }` : '-dev',
        region: process.env.SERVERLESS_REGION || 'eu-west-1',
        endpoint: process.env.IS_OFFLINE ? 'http://localhost:8000' : `https://dynamodb.${ process.env.SERVERLESS_REGION }.amazonaws.com`,
        apiVersion: process.env.AWS_API_VERSION || '2012-08-10',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    },

    // Redis settings
    redis: {
        host: process.env.IS_OFFLINE ? '192.168.99.100' : process.env.REDIS_HOST, //'127.0.0.1',
        port: process.env.REDIS_PORT || 6379
    },

    cdn: {
        avatar: 'https://raw.githubusercontent.com/martinmicunda/employee-scheduling-ui/master/src/images/avatar.png'
    }
});

exports.default = config;