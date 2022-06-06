import { getPublicUrl } from '../helpers/google-cloud-storage.js';
import { Request, Response, NextFunction } from 'express';
import { storageInit } from '../helpers/secret-manager.js';
import { Storage } from '@google-cloud/storage';

const DEFAULT_BUCKET_NAME = 'ecosense-campaign-posters'; // Replace with the name of your bucket

exports.sendUploadToGCS = async (req: Request, res: Object, next: Function) => {
    if (!req.file) {
        return next();
    }
  
    const storage: Storage = await storageInit();
    const bucketName = req.body.bucketName || DEFAULT_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    const gcsFileName = `${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(gcsFileName);
  
    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });
  
    stream.on('error', (err) => {
        // req.file.cloudStorageError = err;
        next(err);
    });
  
    stream.on('finish', () => {
        // req.file.cloudStorageObject = gcsFileName;
    
        let gcsUrl = '';
        return file.makePublic().then(() => {
            // req.file.gcsUrl = getPublicUrl(bucketName, gcsFileName);
            gcsUrl = getPublicUrl(bucketName, gcsFileName);
            next();
        });
    });
  
    stream.end(req.file.buffer);
};