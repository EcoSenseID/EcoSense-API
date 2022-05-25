const pool = require('../pool');

const getIdFromUid = async (uid) => {
    if (!uid) {
        return {
            error: true,
            message: "No uid!"
        }
    }

    try {
        const queryString = `SELECT id FROM users WHERE firebase_uid = ${uid}`;
        let id;
        pool.query(queryString, (error, results) => {
            if (error) throw error;
            id = results.row
        });
        return {
            error: false,
            id: id
        };
    }
    catch (error) {
        return {
            error: true,
            message: error.message
        }
    }
}

module.exports = getIdFromUid;