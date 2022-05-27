const Pool = require('pg').Pool;
import fs from 'fs';
import { DB_USER, DB_HOST, DB_NAME, DB_PWD, DB_PORT } from './env_config';

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PWD,
  port: parseInt(DB_PORT!),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('./ssl/server-ca.pem').toString(),
    key: fs.readFileSync('./ssl/client-key.pem').toString(),
    cert: fs.readFileSync('./ssl/client-cert.pem').toString(),
  },
  allowExitOnIdle: true
});

export default pool;