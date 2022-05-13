const dotenv = require('dotenv');
const result = dotenv.config({silent: true});

if (result.error) {
    throw result.error;
}

const { parsed: envs } = result;
module.exports = envs;