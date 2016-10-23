/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

import config from './config';

class Logger {
    constructor(level = 'INFO') {
        this.level = level;
        switch(level) {
            case 'TRACE':
                this.levelValue = 0;
                break;
            case 'DEBUG':
                this.levelValue = 1;
                break;
            case 'INFO':
                this.levelValue = 2;
                break;
            case 'WARN':
                this.levelValue = 3;
                break;
            case 'ERROR':
                this.levelValue = 4;
                break;
            default:
                this.levelValue = 100;
        }

        // Override all logs if testing with mocha
        if(process.argv.join('').indexOf('mocha') > -1) {
            this.levelValue = 100;
        }
    }

    trace() {
        if(this.levelValue <= 0) {
            console.log('TRACE: ', ...arguments);
        }
    }


    debug() {
        if(this.levelValue <= 1) {
            console.log('DEBUG: ', ...arguments);
        }
    }

    info() {
        if(this.levelValue <= 2) {
            console.info('INFO: ', ...arguments);
        }
    }

    warn() {
        if(this.levelValue <= 3) {
            console.warn('WARN: ', ...arguments);
        }
    }

    error() {
        if(this.levelValue <= 4) {
            console.error('ERROR: ', ...arguments);
        }
    }

    newConsole(method) {
        var fn = console[method].bind(console);
        console[method] = () => {
            fn.apply(
                console,
                [new Date().toISOString()].concat(arguments)
            );
        };
    }
}

export default new Logger(config.loggerLevel);