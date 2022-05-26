const dotenv = require('dotenv');
dotenv.config({
    silent: true
});

// console.log(__dirname);
// if (result.error) {
//     throw result.error;
// }

// const { parsed: envs } = result;
require('dotenv').config();
module.exports = {
    DB_USER: process.env.DB_USER,
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_PWD: process.env.DB_PWD,
    DB_PORT: process.env.DB_PORT,
    PORT: process.env.PORT
};