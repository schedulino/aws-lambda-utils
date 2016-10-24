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