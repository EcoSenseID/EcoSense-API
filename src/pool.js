const Pool = require('pg').Pool;
const fs = require('fs');
const { DB_USER, DB_HOST, DB_NAME, DB_PWD, DB_PORT } = require('./env_config');

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PWD,
  port: DB_PORT,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('./ssl/server-ca.pem').toString(),
    key: fs.readFileSync('./ssl/client-key.pem').toString(),
    cert: fs.readFileSync('./ssl/client-cert.pem').toString(),
  }
});

module.exports = pool;