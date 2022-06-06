import { poolInit } from "./helpers/secret-manager.js";
const pool = await poolInit(); 

export default pool;