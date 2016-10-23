/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

import db from './dynamo';
import logger from './logger';

async function deleteTable(params, model) {
    logger.info(`    DELETE TABLE ${params.TableName} STARTED`);

    try {
        await model.deleteTable(params);
    } catch(error) {
        logger.error(`    DELETE TABLE ${params.TableName} FAILED`);
        throw error;
    }

    logger.info(`    DELETE TABLE ${params.TableName} COMPLETED`);
}

async function createTable(params, model) {
    logger.info(`    CREATE TABLE ${params.TableName} STARTED`);

    try {
        await model.createTable(params);
    } catch(error) {
        logger.error(`    CREATE TABLE ${params.TableName} FAILED`);
        throw error;
    }

    logger.info(`    CREATE TABLE ${params.TableName} COMPLETED`);
}

async function populateTable(model, collection) {
    logger.info(`    POPULATE TABLE ${model.tableName} STARTED`);
    let totalInsertedRecords = 0;

    try {
        await Promise.all(collection.map(async o => {
            await model.create(o, o.id);
            totalInsertedRecords++;
        }));
    } catch(error) {
        logger.error(`   POPULATE TABLE ${model.tableName} FAILED`);
        throw error;
    }

    logger.info(`    POPULATE TABLE ${model.tableName} COMPLETED`);

    return totalInsertedRecords;
}

async function provisionTable(params, model, collection) {
    try {
        const tables = await db.listTables();
        if(tables.TableNames.indexOf(params.TableName) > -1) {
            await deleteTable({TableName: params.TableName}, model);
        }
        await createTable(params, model);
        return await populateTable(model, collection);
    } catch(error) {
        throw error;
    }
}

export {provisionTable, createTable, deleteTable};