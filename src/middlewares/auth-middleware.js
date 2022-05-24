const admin = require('../firebase-auth/admin');

// idToken comes from the client app
const isAuthenticated = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization)
        return res.status(401).send({ 
            error: true,
            message: 'No token provided' 
        });

    if (!authorization.startsWith('Bearer'))
        return res.status(401).send({ 
            error: true,
            message: 'Invalid token' 
        });

    const split = authorization.split('Bearer ')
    if (split.length !== 2)
        return res.status(401).send({ 
            error: true,
            message: 'Invalid token' 
        });

    const idToken = split[1];

    try {
        await admin.auth().verifyIdToken(idToken);
        next();
    }
    catch (err) {
        console.error(`${err.code} - ${err.message}`);
        return res.status(403).send({ 
            error: true,
            message: 'Could not authorize' 
        });
    }
}

module.exports = isAuthenticated;