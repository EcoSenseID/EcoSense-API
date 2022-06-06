import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Storage } from '@google-cloud/storage';
import * as admin from 'firebase-admin';

const client = new SecretManagerServiceClient();
let credentials: admin.app.App;

export const firebaseInit = async (): Promise<admin.app.App> => {
    const [version] = await client.accessSecretVersion({
        name: 'projects/700975405784/secrets/ecosense-bangkit-firebase-adminsdk/versions/1', // enter the copied resource id here
    });
    const result: any = await JSON.parse(version.payload!.data!.toString());
    // console.log(result);
    const serviceAccount = {
        type: result.type,
        projectId: result.project_id,
        privateKeyId: result.private_key_id,
        privateKey: result.private_key,
        clientEmail: result.client_email,
        clientId: result.client_id,
        authUri: result.auth_uri,
        tokenUri: result.token_uri,
        authProviderX509CertUrl: result.auth_provider_x509_cert_url,
        clientC509CertUrl: result.client_x509_cert_url,
    };

    credentials = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://ecosense-bangkit.firebaseio.com",
    })
    return credentials;
};

export const storageInit = async (): Promise<Storage> => {
    const [version] = await client.accessSecretVersion({
        name: 'projects/700975405784/secrets/ecosense-bangkit-gcs/versions/1'
    });
    // console.log(version.payload!.data);
    const result: any = await JSON.parse(version.payload!.data!.toString());
    const storage = new Storage({
        projectId: 'ecosense-bangkit',
        credentials: result,
    });
    return storage;
}