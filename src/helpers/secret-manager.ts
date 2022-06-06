import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Storage } from '@google-cloud/storage';
import admin from 'firebase-admin';

import pg from 'pg';
// import fs from 'fs';
import { DB_USER, DB_HOST, DB_NAME, DB_PWD, DB_PORT } from '../env_config.js';

const client = new SecretManagerServiceClient();
let credentials: admin.app.App;

export const firebaseInit = async (): Promise<admin.app.App> => {
    const [version] = await client.accessSecretVersion({
        name: 'projects/700975405784/secrets/ecosense-bangkit-firebase-adminsdk/versions/2', // enter the copied resource id here
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
        name: 'projects/700975405784/secrets/ecosense-bangkit-gcs/versions/2'
    });
    // console.log(version.payload!.data);
    const result: any = await JSON.parse(version.payload!.data!.toString());
    const storage = new Storage({
        projectId: 'ecosense-bangkit',
        credentials: result,
    });
    return storage;
}

export const poolInit = async (): Promise<any> => {
    const [version1] = await client.accessSecretVersion({
        name: 'projects/700975405784/secrets/cloud-sql-clientkey/versions/2'
    });
    const keyResult = version1.payload!.data!.toString();

    const [version2] = await client.accessSecretVersion({
        name: 'projects/700975405784/secrets/cloud-sql-serverca/versions/1'
    })
    const caResult = version2.payload!.data!.toString();

    const [version3] = await client.accessSecretVersion({
        name: 'projects/700975405784/secrets/cloud-sql-clientcert/versions/1'
    })
    const certResult = version3.payload!.data!.toString();

    const pool = new pg.Pool({
        user: DB_USER,
        host: DB_HOST,
        database: DB_NAME,
        password: DB_PWD,
        port: parseInt(DB_PORT!),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: {
          rejectUnauthorized: false,
          ca: caResult,
          key: keyResult,
          cert: certResult,
        },
        allowExitOnIdle: true
    });
    return pool;
}