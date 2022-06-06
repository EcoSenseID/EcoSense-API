import admin from './admin.js';

// idToken comes from the client app
const getUid = async (authorization: string) => {
    if (!authorization) {
        throw new Error('No token provided');
    }

    if (!authorization.startsWith('Bearer')){
        throw new Error('Invalid token');
    }

    const split = authorization.split('Bearer ')
    if (split.length !== 2) {
        throw new Error('Invalid token');
    }
    const idToken = split[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        return uid;
    }
    catch (err: any) {
        console.error(`${err.code} - ${err.message}`);
        throw new Error('Could not authorize');
    }
}

// module.exports = getUid;
export default getUid;