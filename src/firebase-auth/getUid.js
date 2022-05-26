const admin = require('./admin');

// idToken comes from the client app
const getUid = async (authorization) => {
    if (!authorization) {
        const error = new Error('No token provided');
        error.code = 401;
        throw error;
    }

    if (!authorization.startsWith('Bearer')){
        const error = new Error('Invalid token');
        error.code = 401;
        throw error;
    }

    const split = authorization.split('Bearer ')
    if (split.length !== 2){
        const error = new Error('Invalid token');
        error.code = 401;
        throw error;
    }
    const idToken = split[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        return uid;
    }
    catch (err) {
        console.error(`${err.code} - ${err.message}`);
        const error = new Error('Could not authorize');
        error.code = 403;
        throw error;
    }
}

module.exports = getUid;