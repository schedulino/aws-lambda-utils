/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.deleteTable = exports.createTable = exports.provisionTable = undefined;

let deleteTable = (() => {
    var _ref = _asyncToGenerator(function* (params, model) {
        _logger2.default.info(`    DELETE TABLE ${ params.TableName } STARTED`);

        try {
            yield model.deleteTable(params);
        } catch (error) {
            _logger2.default.error(`    DELETE TABLE ${ params.TableName } FAILED`);
            throw error;
        }

        _logger2.default.info(`    DELETE TABLE ${ params.TableName } COMPLETED`);
    });

    return function deleteTable(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

let createTable = (() => {
    var _ref2 = _asyncToGenerator(function* (params, model) {
        _logger2.default.info(`    CREATE TABLE ${ params.TableName } STARTED`);

        try {
            yield model.createTable(params);
        } catch (error) {
            _logger2.default.error(`    CREATE TABLE ${ params.TableName } FAILED`);
            throw error;
        }

        _logger2.default.info(`    CREATE TABLE ${ params.TableName } COMPLETED`);
    });

    return function createTable(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
})();

let populateTable = (() => {
    var _ref3 = _asyncToGenerator(function* (model, collection) {
        _logger2.default.info(`    POPULATE TABLE ${ model.tableName } STARTED`);
        let totalInsertedRecords = 0;

        try {
            yield Promise.all(collection.map((() => {
                var _ref4 = _asyncToGenerator(function* (o) {
                    yield model.create(o, o.id);
                    totalInsertedRecords++;
                });

                return function (_x7) {
                    return _ref4.apply(this, arguments);
                };
            })()));
        } catch (error) {
            _logger2.default.error(`   POPULATE TABLE ${ model.tableName } FAILED`);
            throw error;
        }

        _logger2.default.info(`    POPULATE TABLE ${ model.tableName } COMPLETED`);

        return totalInsertedRecords;
    });

    return function populateTable(_x5, _x6) {
        return _ref3.apply(this, arguments);
    };
})();

let provisionTable = (() => {
    var _ref5 = _asyncToGenerator(function* (params, model, collection) {
        try {
            const tables = yield _dynamo2.default.listTables();
            if (tables.TableNames.indexOf(params.TableName) > -1) {
                yield deleteTable({ TableName: params.TableName }, model);
            }
            yield createTable(params, model);
            return yield populateTable(model, collection);
        } catch (error) {
            throw error;
        }
    });

    return function provisionTable(_x8, _x9, _x10) {
        return _ref5.apply(this, arguments);
    };
})();

var _dynamo = require('./dynamo');

var _dynamo2 = _interopRequireDefault(_dynamo);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.provisionTable = provisionTable;
exports.createTable = createTable;
exports.deleteTable = deleteTable;