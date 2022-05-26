const pool = require('../pool');

const getIdcheckAdminFromUid = async (uid) => {
    // console.log('uid getID', uid);
    if (!uid) {
        return { error: true, message: "No uid!" }
    }

    try {
        const queryString = `SELECT id FROM users WHERE firebase_uid = '${uid}';`;
        const results = await pool.query(queryString);
        // if (error) throw error;
        const id = results.rows[0].id;
        // console.log('id getId', id);
        
        if (!id) {
            return { error: true, message: 'User not found!' }
        } else {
            const queryString1 = ` SELECT id_role FROM user_role WHERE id_user = ${parseInt(id)}`;
            const results = await pool.query(queryString1); 
            const isAdmin = results.rows[0].id_role === 1;
            // console.log('results', results.rows);
            if (isAdmin) {
                return {error: false, id: id, isAdmin: true };
            } else {
                return {error: false, id: id, isAdmin: false };
            }
        }
    }
    catch (error) {
        return { error: true, message: error.message }
    }
}

module.exports = getIdcheckAdminFromUid;