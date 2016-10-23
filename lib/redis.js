/**
 * Redis configuration.
 *
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2016, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

import redis from 'redis';
import config from './config';

// class RedisClient {
//     constructor() {
//         this.client = redis.createClient(config.redis.port, config.redis.host);
//     }
//
//     setex(key, ttl, value) {
//         return new Promise((resolve, reject) => {
//             this.client.setex(key, ttl, value, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         });
//     }
//
//     get(key) {
//         return new Promise((resolve, reject) => {
//             this.client.get(key, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         });
//     }
//
//     set(key, value) {
//         return new Promise((resolve, reject) => {
//             this.client.set(key, value, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         });
//     }
//
//     del(key) {
//         return new Promise((resolve, reject) => {
//             this.client.del(key, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         });
//     }
//    
//     cleanUp() {
//         console.log('Got SIGTERM or SIGINT, gracefully exiting');
//         this.client.quit();
//     }
// }
//
// const redisClient = new RedisClient();
// redisClient.client.on('connect', () => console.log('Redis connected to ' + config.redis.host + ':' + config.redis.port));
// redisClient.client.on('error', err => console.error('Redis ' + err));
// redisClient.client.on('end', err => console.log('Redis is shutting down. This might be ok if you chose not to run it in your dev environment.'));
// redisClient.client.on('warning', err => console.warn('Redis warning ' + err));
// // if the Node process ends, close the Redis connection gracefully
// process.on('SIGTERM', redisClient.cleanUp).on('SIGINT', redisClient.cleanUp);
//
// export default redisClient;

export default {};