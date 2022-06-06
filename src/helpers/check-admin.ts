import pool from '../pool.js';

const checkAdminFromUid = async (uid: String) => {
    // console.log('uid getID', uid);
    if (!uid) {
        return { error: true, message: "No uid!" }
    }

    try {
        const queryString = `SELECT id FROM users WHERE firebase_uid = '${uid}';`;
        const results = await pool.query(queryString);
        // if (error) throw error;
        const id = parseInt(results.rows[0].id);
        // console.log('id getId', id);
        
        if (!id) {
            return { error: true, message: 'User not found!' }
        } else {
            const queryString1 = ` SELECT id_role FROM user_role WHERE id_user = ${id}`;
            const results = await pool.query(queryString1); 
            const isAdmin = results.rows[0].id_role === 1;
            // console.log('results', results.rows);
            if (isAdmin) {
                return {error: false, isAdmin: true };
            } else {
                return {error: false, isAdmin: false };
            }
        }
    }
    catch (error: any) {
        let errorMessage = 'Failed to get id and check admin.'
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { error: true, message: errorMessage }
    }
}

// module.exports = checkAdminFromUid;
export default checkAdminFromUid;