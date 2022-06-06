import { Storage } from '@google-cloud/storage';
import path from 'path';
import { storageInit } from './secret-manager';

export const getPublicUrl = (bucketName: string, fileName: string): string => `https://storage.googleapis.com/${bucketName}/${fileName}`;

exports.copyFileToGCS = async (localFilePath: string, bucketName: string, options: Object) => {
    options = options || {};
  
    const storage: Storage = await storageInit();
    const bucket = storage.bucket(bucketName);
    const fileName = path.basename(localFilePath);
    const gcsName = `${Date.now()}-${fileName}`;
    const file = bucket.file(gcsName);
    console.log(fileName);
  
    return bucket.upload(localFilePath, options)
      .then(() => file.makePublic())
      .then(() => exports.getPublicUrl(bucketName, gcsName));
};

export const sendUploadToGCSFunc = async (reqFile: Express.Multer.File, bucketName: string) => {
    if (!reqFile || !bucketName) {
        throw new Error('File or bucket name not found');
    }

    const storage: Storage = await storageInit();
    const bucket = storage.bucket(bucketName);
    const gcsFileName = `${Date.now()}-${reqFile.originalname}`;
    const file = bucket.file(gcsFileName);
  
    const stream = file.createWriteStream({
        metadata: {
            contentType: reqFile.mimetype,
        },
    });
  
    stream.on('error', (err) => {
        return {
            error: true,
            errorDetail: err
        }
    });

    let gcsUrl = '';
    stream.on('finish', async () => {
        await file.makePublic();
        gcsUrl = getPublicUrl(bucketName, gcsFileName);
    });
  
    stream.end(reqFile.buffer);
    return {
        error: false,
        gcsUrl: getPublicUrl(bucketName, gcsFileName)
    };
};

// module.exports = { storage, getPublicUrl, sendUploadToGCSFunc };