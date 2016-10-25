/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// import config from './config';

// const dynamodbConfig = {
//     region: config.dynamodb.region,
//     endpoint: config.dynamodb.endpoint,
//     apiVersion: config.dynamodb.apiVersion
// };
// this is require only for locale Dynamo
// if(process.env.IS_OFFLINE) {
//     dynamodbConfig.accessKeyId = config.dynamodb.accessKeyId;
//     dynamodbConfig.secretAccessKey = config.dynamodb.secretAccessKey;
// }
// const db = new AWS.DynamoDB(dynamodbConfig);
const db = new _awsSdk2.default.DynamoDB();
const doc = new _awsSdk2.default.DynamoDB.DocumentClient({ service: db });
_bluebird2.default.promisifyAll(Object.getPrototypeOf(db));
_bluebird2.default.promisifyAll(Object.getPrototypeOf(doc));

class Internals {
    projectionExpression() {
        let fields = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

        fields = fields.split(',');
        if (!Array.isArray(fields)) {
            return '';
        }

        let projectionExpression = { ProjectionExpression: '', ExpressionAttributeNames: {} },
            i = 0;
        fields.forEach(field => {
            if (i === 0) {
                projectionExpression.ProjectionExpression += '#' + field;
            } else {
                projectionExpression.ProjectionExpression += ', #' + field;
            }
            projectionExpression.ExpressionAttributeNames['#' + field] = field;
            i++;
        });

        return projectionExpression;
    }
}
let config = {};
/**
 * An adapter class for dealing with a DynamoDB.
 *
 * @class DynamoDBAdapter
 */
class DynamoDBAdapter extends Internals {
    constructor(tableName, schema) {
        super();
        this.db = db;
        this.doc = doc;
        this.service = tableName;
        this.tableName = `${ config.prefix }${ tableName }${ config.postfix }`;
        this.schema = schema;
    }

    static config(options) {
        config = options;
        _awsSdk2.default.config.update({ region: config.region });
    }

    static model(modelName, schema) {
        return new DynamoDBAdapter(modelName.toLowerCase(), schema);
    }

    /**
     * Gets a list of available tables
     * @memberof DynamoDBAdapter
     * @returns {Object} promise
     */
    static listTables() {
        let params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return db.listTablesAsync(params);
    }

    createTable(params) {
        return this.db.createTableAsync(params);
    }

    /**
     * Delete DynamoDB table.
     *
     * @memberof DynamoDBAdapter
     * @param {Object} params - Parameters to find table and delete it
     * @param {String} params.TableName - The table name
     * @returns {Object} promise
     */
    deleteTable(params) {
        return this.db.deleteTableAsync(params);
    }

    findOne(key) {
        var _this = this;

        let params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this.service } DB_ACTION::get TABLE::${ _this.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`);
            if (params.ProjectionExpression) {
                params = Object.assign(params, _this.projectionExpression(params.ProjectionExpression));
            }
            params = _this.extendParams({ Key: key }, params);

            try {
                const data = yield _this.doc.getAsync(params);
                // throw 404 if item doesn't exist
                if (data.Item) {
                    return data.Item;
                }
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this.service } DB_ACTION::get TABLE::${ _this.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`, error.message);
                throw error;
            }

            const error = _this.handleError({ name: 'NotFound' });
            _logger2.default.error(`SERVICE::${ _this.service } DB_ACTION::get TABLE::${ _this.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`, error.message);

            throw error;
        })();
    }

    find() {
        var _this2 = this;

        let params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this2.service } DB_ACTION::query TABLE::${ _this2.tableName } ACCOUNT::${ params.ExpressionAttributeValues ? params.ExpressionAttributeValues[':accountId'] : '' }`);
            if (params.ProjectionExpression) {
                params = Object.assign(params, _this2.projectionExpression(params.ProjectionExpression));
            }
            params = _this2.extendParams(params);

            try {
                const data = yield _this2.doc.queryAsync(params);
                _logger2.default.debug('Count', data.Count);
                _logger2.default.debug('ScannedCount', data.ScannedCount);
                _logger2.default.debug('ConsumedCapacity', data.ConsumedCapacity);
                return data.Items;
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this2.service } DB_ACTION::query TABLE::${ _this2.tableName } ACCOUNT::${ params.ExpressionAttributeValues ? params.ExpressionAttributeValues[':accountId'] : '' }`, error.message);
                throw error;
            }
        })();
    }

    create(item) {
        var _this3 = this;

        let id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _nodeUuid2.default.v1();
        let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this3.service } DB_ACTION::create TABLE::${ _this3.tableName } ACCOUNT::${ item.accountId } ID::${ id }`);

            if (_this3.schema.id) {
                item.id = id;
            }
            if (_this3.schema.created) {
                item.created = new Date().toISOString();
            }
            if (_this3.schema.updated) {
                if (item.created) {
                    item.updated = item.created;
                } else {
                    item.updated = new Date().toISOString();
                }
            }
            const params = _this3.extendParams({ Item: item }, options);

            try {
                const data = yield _this3.doc.putAsync(params);
                if (_this3.schema.id) {
                    data.id = item.id;
                }
                if (_this3.schema.updated) {
                    data.updated = item.updated;
                }
                if (_this3.schema.created) {
                    data.created = item.created;
                }

                return data;
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this3.service } DB_ACTION::create TABLE::${ _this3.tableName } ACCOUNT::${ item.accountId } ID::${ id }`, error.message);
                throw error;
            }
        })();
    }

    update(key, item) {
        var _this4 = this;

        let params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this4.service } DB_ACTION::update TABLE::${ _this4.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`);

            if (_this4.schema.updated) {
                item.updated = new Date().toISOString();
            }
            params = _this4.extendParams({ Item: Object.assign(item, key) }, params);

            try {
                const data = yield _this4.doc.putAsync(params);
                if (_this4.schema.updated) {
                    data.updated = item.updated;
                }

                return data;
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this4.service } DB_ACTION::update TABLE::${ _this4.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`, error.message);
                throw _this4.handleError(error);
            }
        })();
    }

    updateWithAttributes(key, item) {
        var _this5 = this;

        let params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this5.service } DB_ACTION::updateAttributes TABLE::${ _this5.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`);

            if (_this5.schema.updated) {
                item.updated = new Date().toISOString();
            }

            const keys = Object.keys(key);
            keys.forEach(function (k) {
                if (item[k]) {
                    delete item[k];
                }
            });
            params = _this5.extendParams({
                Key: key,
                UpdateExpression: '',
                ExpressionAttributeNames: {},
                ExpressionAttributeValues: {}
            }, params);

            let i = 0,
                set = 0,
                remove = 0,
                UpdateExpressionSetAction = ' ',
                UpdateExpressionRemoveAction = ' ';
            Object.keys(item).forEach(function (valueKey) {
                i++;
                params.ExpressionAttributeNames['#param' + i] = valueKey;
                // update an attribute
                if (item[valueKey] !== '') {
                    set++;
                    params.ExpressionAttributeValues[':val' + i] = item[valueKey];
                    UpdateExpressionSetAction += set === 1 ? `SET #param${ i } = :val${ i }` : `, #param${ i } = :val${ i }`;
                } else {
                    // delete an attribute
                    remove++;
                    UpdateExpressionRemoveAction += remove === 1 ? `REMOVE #param${ i }` : `, #param${ i }`;
                }
            });
            if (set === 0) {
                delete params.ExpressionAttributeValues;
            }
            params.UpdateExpression += UpdateExpressionSetAction + UpdateExpressionRemoveAction;

            try {
                const data = yield _this5.doc.updateAsync(params);
                if (_this5.schema.updated) {
                    data.updated = item.updated;
                }
                // required for batch update e.g. publish shifts
                data.id = key.id;

                return data;
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this5.service } DB_ACTION::updateAttributes TABLE::${ _this5.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`, error.message);
                throw _this5.handleError(error);
            }
        })();
    }

    destroy(key) {
        var _this6 = this;

        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this6.service } DB_ACTION::delete TABLE::${ _this6.tableName } ACCOUNT::${ key.accountId } ID::${ key.id }`);

            const params = _this6.extendParams({ Key: key });

            try {
                return _this6.doc.deleteAsync(params);
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this6.service } DB_ACTION::delete TABLE::${ _this6.tableName } ACCOUNT::${ item.accountId } ID::${ item.id }`, error.message);
                throw error;
            }
        })();
    }

    batchWrite(params, accountId) {
        var _this7 = this;

        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this7.service } DB_ACTION::batchWrite TABLE::${ _this7.tableName } ACCOUNT::${ accountId }`);

            try {
                return _this7.doc.batchWriteAsync(params);
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this7.service } DB_ACTION::batchWrite TABLE::${ _this7.tableName } ACCOUNT::${ accountId }`, error.message);
                throw error;
            }
        })();
    }

    /**
     * Performs a full unfiltered scan.
     * @memberof DynamoDBAdapter
     * @param {Object} filterObject Filter criteria
     * @param {Object} options Miscellaneous options like version, limit or lastKey (for pagination)
     * @returns {Object} promise
     */
    scan() {
        var _this8 = this;

        let params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return _asyncToGenerator(function* () {
            _logger2.default.debug(`SERVICE::${ _this8.service } DB_ACTION::scan TABLE::${ _this8.tableName }`);

            params = _this8.extendParams(params);

            try {
                const data = yield _this8.doc.scanAsync(params);

                return data.Items;
            } catch (error) {
                _logger2.default.error(`SERVICE::${ _this8.service } DB_ACTION::scan TABLE::${ _this8.tableName }`, error.message);
                throw error;
            }
        })();
    }

    extendParams() {
        return Object.assign.apply(Object, Array.prototype.slice.call(arguments).concat([{ TableName: this.tableName, ReturnConsumedCapacity: 'INDEXES' }]));
    }

    handleError(error) {
        let dbError;

        switch (error.name) {
            case 'NotFound':
                dbError = _boom2.default.notFound('Requested resource not found.');
                break;
            case 'ConditionalCheckFailedException':
                dbError = _boom2.default.conflict('Requested resource already exists.');
                break;
            default:
                dbError = _boom2.default.badImplementation('Something went wrong with DB server.');
        }

        return dbError;
    }
}

exports.default = DynamoDBAdapter;
// https://java.awsblog.com/post/Tx2LVB1TA774M13/Snippet-Creating-Amazon-DynamoDB-Tables
// http://stackoverflow.com/questions/24067283/dynamodb-checking-for-uniqueness-across-primary-key-and-another-field
// !!http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ErrorHandling.html

// !!https://github.com/node-modli/modli-dynamodb/blob/master/src%2Findex.js