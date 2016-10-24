/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
class Logger {
    constructor(level = 'INFO') {
        this.level = level;
        switch(level) {
            case 'DEBUG':
                this.levelValue = 0;
                break;
            case 'INFO':
                this.levelValue = 1;
                break;
            case 'WARN':
                this.levelValue = 2;
                break;
            case 'ERROR':
                this.levelValue = 3;
                break;
            default:
                this.levelValue = 100;
        }
    }

    config(options) {
        this.level = options.level;
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