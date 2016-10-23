'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
class Logger {
    constructor() {
        let level = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'INFO';

        this.level = level;
        switch (level) {
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
    }

    trace() {
        if (this.levelValue <= 0) {
            var _console;

            (_console = console).log.apply(_console, ['TRACE: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    debug() {
        if (this.levelValue <= 1) {
            var _console2;

            (_console2 = console).log.apply(_console2, ['DEBUG: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    info() {
        if (this.levelValue <= 2) {
            var _console3;

            (_console3 = console).info.apply(_console3, ['INFO: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    warn() {
        if (this.levelValue <= 3) {
            var _console4;

            (_console4 = console).warn.apply(_console4, ['WARN: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    error() {
        if (this.levelValue <= 4) {
            var _console5;

            (_console5 = console).error.apply(_console5, ['ERROR: '].concat(Array.prototype.slice.call(arguments)));
        }
    }

    newConsole(method) {
        var fn = console[method].bind(console);
        console[method] = () => {
            fn.apply(console, [new Date().toISOString()].concat(arguments));
        };
    }
}

exports.default = new Logger(process.env.LOGGER_LEVEL);