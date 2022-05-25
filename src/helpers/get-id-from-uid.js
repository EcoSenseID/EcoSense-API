const pool = require('../pool');

const getIdFromUid = async (uid) => {
    if (!uid) {
        const error = new Error('No uid!');
        error.code = 400;
        throw error;
    }

    try {
        const queryString = `SELECT id FROM users WHERE firebase_uid = ${uid}`;
        let id;
        pool.query(queryString, (error, results) => {
            if (error) throw error;
            id = results.row
        });
        return id;
    }
    catch (error) {
        throw error;
    }
}

module.exports = getIdFromUid;