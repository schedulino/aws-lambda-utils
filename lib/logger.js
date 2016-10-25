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
    constructor(level = 'INFO') {
        this.levelValue = this.getLevelValue(level);
    }

    getLevelValue(level) {
        let levelValue = 100;
        switch(level) {
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
        if(this.levelValue <= 0) {
            console.log('DEBUG: ', ...arguments);
        }
    }

    info() {
        if(this.levelValue <= 1) {
            console.info('INFO: ', ...arguments);
        }
    }

    warn() {
        if(this.levelValue <= 2) {
            console.warn('WARN: ', ...arguments);
        }
    }

    error() {
        if(this.levelValue <= 3) {
            console.error('ERROR: ', ...arguments);
        }
    }
}

export default new Logger(process.env.LOGGER_LEVEL);