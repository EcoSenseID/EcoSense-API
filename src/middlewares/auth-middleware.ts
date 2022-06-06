import admin from '../firebase-auth/admin.js';
import { Request, Response, NextFunction } from 'express';
import checkUserFromUid from '../helpers/check-user.js';
import getUid from '../firebase-auth/getUid.js';
import pool from '../pool.js';
import checkAdminFromUid from '../helpers/check-admin.js';

// idToken comes from the client app
export const isAuthenticatedMobile = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization)
        return res.status(401).send({ error: true, message: 'No token provided' });

    if (!authorization.startsWith('Bearer'))
        return res.status(401).send({ error: true, message: 'Invalid token' });

    const split = authorization.split('Bearer ')
    if (split.length !== 2)
        return res.status(401).send({ error: true, message: 'Invalid token' });

    const idToken = split[1];
    try {
        // VERIFY ID TOKEN FROM FIREBASE
        await admin.auth().verifyIdToken(idToken);
        const uid = await getUid(authorization);
        
        // CHECK IF UID EXISTS IN TABLE
        let hasExisted = false;
        const queryString1 = `SELECT id FROM users WHERE firebase_uid = '${uid}'`;
        const results1 = await pool.query(queryString1);
        if (results1.rows.length === 0) {
            hasExisted = false;
        } else {
            hasExisted = true;
        }
    
        if (!hasExisted) {
            const queryString2 = `
                INSERT INTO users (firebase_uid) VALUES ('${uid}') RETURNING id;
                INSERT INTO user_role (id_user, id_role) SELECT id, 2 FROM users WHERE firebase_uid = '${uid}' RETURNING id_user;
            `;
            const results2: any = await pool.query(queryString2);
            if (results2[0].rows[0].id !== results2[1].rows[0].id_user){
                res.status(400).json({ error: true, message: "Add UID failed!" });
                return;
            }
        }
        const checkResult = await checkUserFromUid(uid);
        const isUser = checkResult.isUser;
        if (isUser) { next(); }
    }
    catch (err: any) {
        const errMessage = `${err.code} - ${err.message}`;
        return res.status(403).send({ error: true, message: errMessage });
    }
}

export const isAuthenticatedWeb = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization)
        return res.status(401).send({ error: true, message: 'No token provided' });

    if (!authorization.startsWith('Bearer'))
        return res.status(401).send({ error: true, message: 'Invalid token' });

    const split = authorization.split('Bearer ')
    if (split.length !== 2)
        return res.status(401).send({ error: true, message: 'Invalid token' });

    const idToken = split[1];
    try {
        await admin.auth().verifyIdToken(idToken);
        const uid = await getUid(authorization);
        const checkResult = await checkAdminFromUid(uid);
        const isAdmin = checkResult.isAdmin;
        if (isAdmin) { next(); }
        else {
            res.status(403).json({
                error: true, message: 'Forbidden. Admin only!'
            });
        }
    }
    catch (err: any) {
        const errMessage = `${err.code} - ${err.message}`;
        return res.status(403).send({ error: true, message: errMessage });
    }
}