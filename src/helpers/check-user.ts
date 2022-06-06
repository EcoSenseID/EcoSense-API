import pool from '../pool.js';

const getIdCheckUserFromUid = async (uid: String) => {
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
            const isUser = results.rows.filter((data: { id_role: number; }) => data.id_role === 2).length > 0;
            if (isUser) {
                return {error: false, id: id, isUser: true };
            } else {
                return {error: false, id: id, isUser: false };
            }
        }
    }
    catch (error: any) {
        let errorMessage = 'Failed to get id and check user role.'
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { error: true, message: errorMessage }
    }
}

// module.exports = getIdcheckUserFromUid;
export default getIdCheckUserFromUid;