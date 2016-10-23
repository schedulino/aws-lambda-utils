/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

import AWS from 'aws-sdk';
import Boom from 'boom';
import uuid from 'node-uuid';
import Promise from 'bluebird';
import logger from './logger';
import config from './config';

const dynamodbConfig = {
    region: config.dynamodb.region,
    endpoint: config.dynamodb.endpoint,
    apiVersion: config.dynamodb.apiVersion
};
// this is require only for locale Dynamo
if(process.env.IS_OFFLINE) {
    dynamodbConfig.accessKeyId = config.dynamodb.accessKeyId;
    dynamodbConfig.secretAccessKey = config.dynamodb.secretAccessKey;
}
const db = new AWS.DynamoDB(dynamodbConfig);
const doc = new AWS.DynamoDB.DocumentClient({service: db});
Promise.promisifyAll(Object.getPrototypeOf(db));
Promise.promisifyAll(Object.getPrototypeOf(doc));


class Internals {
    projectionExpression(fields = '') {
        fields = fields.split(',');
        if(!Array.isArray(fields)) {
            return '';
        }

        let projectionExpression = {ProjectionExpression: '', ExpressionAttributeNames: {}}, i = 0;
        fields.forEach(field => {
            if (i === 0) {
                projectionExpression.ProjectionExpression  += '#' + field;
            } else {
                projectionExpression.ProjectionExpression  += ', #' + field;
            }
            projectionExpression.ExpressionAttributeNames['#' + field] = field;
            i++;
        });

        return projectionExpression;
    }
}

/**
 * An adapter class for dealing with a DynamoDB.
 *
 * @class DynamoDBAdapter
 */
class DynamoDBAdapter extends Internals{
    constructor(tableName, schema) {
        super();
        this.db = db;
        this.doc = doc;
        this.service = tableName;
        this.tableName = `${config.dynamodb.prefix}${tableName}${config.dynamodb.postfix}`;
        this.schema = schema;
    }

    static model(modelName, schema) {
        return new DynamoDBAdapter(modelName.toLowerCase(), schema);
    }

    /**
     * Gets a list of available tables
     * @memberof DynamoDBAdapter
     * @returns {Object} promise
     */
    static listTables(params = {}) {
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

    async findOne(key, params = {}) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::get TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`);
        if(params.ProjectionExpression) {
            params = Object.assign(params, this.projectionExpression(params.ProjectionExpression))
        }
        params = this.extendParams({Key: key}, params);

        try {
            const data = await this.doc.getAsync(params);
            // throw 404 if item doesn't exist
            if(data.Item) {
                return data.Item;
            }
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::get TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`, error.message);
            throw error;
        }

        const error = this.handleError({name: 'NotFound'});
        logger.error(`SERVICE::${this.service} DB_ACTION::get TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`, error.message);

        throw error;
    }

    async find(params = {}) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::query TABLE::${this.tableName} ACCOUNT::${params.ExpressionAttributeValues ? params.ExpressionAttributeValues[':accountId'] : ''}`);
        if(params.ProjectionExpression) {
            params = Object.assign(params, this.projectionExpression(params.ProjectionExpression))
        }
        params = this.extendParams(params);

        try {
            const data = await this.doc.queryAsync(params);
            logger.debug('Count', data.Count);
            logger.debug('ScannedCount', data.ScannedCount);
            logger.debug('ConsumedCapacity', data.ConsumedCapacity);
            return data.Items;
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::query TABLE::${this.tableName} ACCOUNT::${params.ExpressionAttributeValues ? params.ExpressionAttributeValues[':accountId'] : ''}`, error.message);
            throw error;
        }
    }

    async create(item, id = uuid.v1(), options = {}) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::create TABLE::${this.tableName} ACCOUNT::${item.accountId} ID::${id}`);

        if(this.schema.id) {
            item.id = id;
        }
        if(this.schema.created) {
            item.created = new Date().toISOString();
        }
        if(this.schema.updated) {
            if(item.created) {
                item.updated = item.created;
            } else {
                item.updated = new Date().toISOString();
            }
        }
        const params = this.extendParams({Item: item}, options);

        try {
            const data = await this.doc.putAsync(params);
            if(this.schema.id) {
                data.id = item.id;
            }
            if(this.schema.updated) {
                data.updated = item.updated;
            }
            if(this.schema.created) {
                data.created = item.created;
            }

            return data;
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::create TABLE::${this.tableName} ACCOUNT::${item.accountId} ID::${id}`, error.message);
            throw error;
        }
    }

    async update(key, item, params = {}) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::update TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`);

        if(this.schema.updated) {
            item.updated = new Date().toISOString();
        }
        params = this.extendParams({Item: Object.assign(item, key)}, params);

        try {
            const data = await this.doc.putAsync(params);
            if(this.schema.updated) {
                data.updated = item.updated;
            }

            return data;
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::update TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`, error.message);
            throw this.handleError(error);
        }
    }

    async updateWithAttributes(key, item, params = {}) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::updateAttributes TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`);

        if(this.schema.updated) {
            item.updated = new Date().toISOString();
        }

        const keys = Object.keys(key);
        keys.forEach((k) => {
            if (item[k]) {
                delete item[k];
            }
        });
        params = this.extendParams({
            Key: key,
            UpdateExpression: '',
            ExpressionAttributeNames: {},
            ExpressionAttributeValues: {}
        }, params);

        let i = 0, set = 0, remove = 0, UpdateExpressionSetAction = ' ', UpdateExpressionRemoveAction = ' ';
        Object.keys(item).forEach(valueKey => {
            i++;
            params.ExpressionAttributeNames['#param' + i] = valueKey;
            // update an attribute
            if(item[valueKey] !== '') {
                set++;
                params.ExpressionAttributeValues[':val' + i] = item[valueKey];
                UpdateExpressionSetAction += set === 1 ? `SET #param${i} = :val${i}` : `, #param${i} = :val${i}`;
            } else { // delete an attribute
                remove++;
                UpdateExpressionRemoveAction += remove === 1 ? `REMOVE #param${i}` : `, #param${i}`;
            }
        });
        if(set === 0) {
            delete params.ExpressionAttributeValues;
        }
        params.UpdateExpression += UpdateExpressionSetAction + UpdateExpressionRemoveAction;

        try {
            const data = await this.doc.updateAsync(params);
            if(this.schema.updated) {
                data.updated = item.updated;
            }
            // required for batch update e.g. publish shifts
            data.id = key.id;

            return data;
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::updateAttributes TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`, error.message);
            throw this.handleError(error);
        }
    }

    async destroy(key) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::delete TABLE::${this.tableName} ACCOUNT::${key.accountId} ID::${key.id}`);

        const params = this.extendParams({Key: key});

        try {
            return this.doc.deleteAsync(params);
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::delete TABLE::${this.tableName} ACCOUNT::${item.accountId} ID::${item.id}`, error.message);
            throw error;
        }
    }

    async batchWrite(params, accountId) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::batchWrite TABLE::${this.tableName} ACCOUNT::${accountId}`);
        
        try {
            return this.doc.batchWriteAsync(params);
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::batchWrite TABLE::${this.tableName} ACCOUNT::${accountId}`, error.message);
            throw error;
        }
    }

    /**
     * Performs a full unfiltered scan.
     * @memberof DynamoDBAdapter
     * @param {Object} filterObject Filter criteria
     * @param {Object} options Miscellaneous options like version, limit or lastKey (for pagination)
     * @returns {Object} promise
     */
    async scan(params = {}) {
        logger.debug(`SERVICE::${this.service} DB_ACTION::scan TABLE::${this.tableName}`);

        params = this.extendParams(params);

        try {
            const data = await this.doc.scanAsync(params);

            return data.Items;
        } catch(error) {
            logger.error(`SERVICE::${this.service} DB_ACTION::scan TABLE::${this.tableName}`, error.message);
            throw error;
        }
    }

    extendParams() {
        return Object.assign(...arguments, {TableName: this.tableName, ReturnConsumedCapacity: 'INDEXES'});
    }

    handleError(error) {
        let dbError;

        switch(error.name) {
            case 'NotFound':
                dbError = Boom.notFound('Requested resource not found.');
                break;
            case 'ConditionalCheckFailedException':
                dbError = Boom.conflict('Requested resource already exists.');
                break;
            default:
                dbError = Boom.badImplementation('Something went wrong with DB server.');
        }

        return dbError;
    }
}

export default DynamoDBAdapter;
// https://java.awsblog.com/post/Tx2LVB1TA774M13/Snippet-Creating-Amazon-DynamoDB-Tables
// http://stackoverflow.com/questions/24067283/dynamodb-checking-for-uniqueness-across-primary-key-and-another-field
// !!http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ErrorHandling.html

// !!https://github.com/node-modli/modli-dynamodb/blob/master/src%2Findex.js