const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
    throw error;
}

const { parsed: envs } = result;
module.exports = envs;