import * as admin from 'firebase-admin';

// idToken comes from the client app
const isAuthenticated = async (req, res) => {
    const { authorization } = req.headers

    if (!authorization)
        return res.status(401).send({ message: 'Unauthorized' });

    if (!authorization.startsWith('Bearer'))
        return res.status(401).send({ message: 'Unauthorized' });

    const split = authorization.split('Bearer ')
    if (split.length !== 2)
        return res.status(401).send({ message: 'Unauthorized' });

    const idToken = split[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = await decodedToken.uid;
        await console.log(uid);
        return res.status(200).send({ message: 'User authenticated!' });
    }
    catch (err) {
        console.error(`${err.code} - ${err.message}`);
        return res.status(401).send({ message: 'Unauthorized' });
    }
}

module.exports = { 
    isAuthenticated 
};