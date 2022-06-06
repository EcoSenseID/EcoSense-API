import getUid from "../firebase-auth/getUid.js";
import pool from "../pool.js";

const getIdFromIdToken = async (authorization: string) => {
    if (!authorization)
        return ({ error: true, message: 'No token provided' });

    if (!authorization.startsWith('Bearer'))
        return ({ error: true, message: 'Invalid token' });

    const split = authorization.split('Bearer ')
    if (split.length !== 2)
        return ({ error: true, message: 'Invalid token' });
    
    try {
        const uid = await getUid(authorization!);
        const queryString = `SELECT id FROM users WHERE firebase_uid = '${uid}';`;
        const results = await pool.query(queryString);
        const id = parseInt(results.rows[0].id);
        return ({
            error: false,
            id: id
        })
    }
    catch (err: any) {
        const errMessage = `${err.code} - ${err.message}`;
        return ({ error: true, message: errMessage });
    }
}

export default getIdFromIdToken;