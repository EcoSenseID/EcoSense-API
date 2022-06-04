import * as admin from 'firebase-admin';
const serviceAccount = require("../../keys/ecosense-bangkit-firebase-adminsdk-dsbjn-2e72d5ff27.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ecosense-bangkit.firebaseio.com",
});

export default admin;