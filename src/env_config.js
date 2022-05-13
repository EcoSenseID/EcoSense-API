const dotenv = require('dotenv');
const result = dotenv.config({
    silent: true,
    path: __dirname + '/.env'
});

console.log(__dirname);
if (result.error) {
    throw result.error;
}

const { parsed: envs } = result;
module.exports = envs;