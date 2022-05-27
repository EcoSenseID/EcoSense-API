import * as dotenv from 'dotenv';

dotenv.config();

// console.log(__dirname);
// if (result.error) {
//     throw result.error;
// }

// const { parsed: envs } = result;
require('dotenv').config();
export const DB_USER = process.env.DB_USER;
export const DB_HOST = process.env.DB_HOST;
export const DB_NAME = process.env.DB_NAME;
export const DB_PWD = process.env.DB_PWD;
export const DB_PORT = process.env.DB_PORT;
export const PORT = process.env.PORT;