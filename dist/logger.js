'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @author    Martin Micunda {@link https://schedulino.com}
 * @copyright Copyright (c) 2016, Schedulino ltd.
 * @license   MIT
 *
 * The simple lambda logger that add the log level prefix for easy searching in CloudWatch
 * By binding the log level as a prefix, we can give the different log levels actual meaning in the context of cloudwatch
 * Export a `Mailer` for sending e-mails.
 *
 * @module @schedulino/lambda-logger
 * @example
 *  ```js
 *      import logger from '@schedulino/lambda-logger';
 *      logger.config({ level: 'DEBUG' });
 *
 *      logger.info('Hi');
 *  ```
 */
class Logger {
    constructor() {
        let level = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'INFO';

        this.levelValue = this.getLevelValue(level);
    }

    getLevelValue(level) {
        let levelValue = 100;
        switch (level) {
            case 'DEBUG':
                levelValue = 0;
                break;
            case 'INFO':
                levelValue = 1;
                break;
            case 'WARN':
                levelValue = 2;
                break;
            case 'ERROR':
                levelValue = 3;
                break;
        }

        return levelValue;
    }

    config(options) {
        this.levelValue = this.getLevelValue(options.level);
    }

    debug() {
        if (this.levelValue <= 0) {
            var _console;

            (_console = console).log.apply(_console, ['DEBUG: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    info() {
        if (this.levelValue <= 1) {
            var _console2;

            (_console2 = console).info.apply(_console2, ['INFO: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    warn() {
        if (this.levelValue <= 2) {
            var _console3;

            (_console3 = console).warn.apply(_console3, ['WARN: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    error() {
        if (this.levelValue <= 3) {
            var _console4;

            (_console4 = console).error.apply(_console4, ['ERROR: '].concat(Array.prototype.slice.call(arguments)));
        }
    }
}

exports.default = new Logger(process.env.LOGGER_LEVEL);