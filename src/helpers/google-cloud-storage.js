const { Storage } = require('@google-cloud/storage');
  
const GOOGLE_CLOUD_PROJECT_ID = 'ecosense-bangkit'; // Replace with your project ID
const GOOGLE_CLOUD_KEYFILE = __dirname + './../../keys/ecosense-bangkit-2ef1106a1a89.json'; // Replace with the path to the downloaded private key

const storage = new Storage({
    projectId: GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: GOOGLE_CLOUD_KEYFILE,
});

/**
   * Get public URL of a file. The file must have public access
   * @param {string} bucketName
   * @param {string} fileName
   * @return {string}
   */
const getPublicUrl = (bucketName, fileName) => `https://storage.googleapis.com/${bucketName}/${fileName}`;

/**
 * Copy file from local to a GCS bucket.
 * Uploaded file will be made publicly accessible.
 *
 * @param {string} localFilePath
 * @param {string} bucketName
 * @param {Object} [options]
 * @return {Promise.<string>} - The public URL of the uploaded file.
 */

exports.copyFileToGCS = (localFilePath, bucketName, options) => {
    options = options || {};
  
    const bucket = storage.bucket(bucketName);
    const fileName = path.basename(localFilePath);
    const file = bucket.file(fileName);
    console.log(fileName);
  
    return bucket.upload(localFilePath, options)
      .then(() => file.makePublic())
      .then(() => exports.getPublicUrl(bucketName, gcsName));
};

const sendUploadToGCSFunc = async (reqFile, bucketName) => {
    if (!reqFile || !bucketName) {
        throw new Error('File or bucket name not found');
    }

    const bucket = storage.bucket(bucketName);
    const gcsFileName = `${Date.now()}-${reqFile.originalname}`;
    const file = bucket.file(gcsFileName);
  
    const stream = file.createWriteStream({
        metadata: {
            contentType: reqFile.mimetype,
        },
    });
  
    stream.on('error', (err) => {
        reqFile.cloudStorageError = err;
        return {
            error: true,
            errorDetail: err
        }
    });

    stream.on('finish', async () => {
        reqFile.cloudStorageObject = gcsFileName;
    
        await file.makePublic();
        reqFile.gcsUrl = getPublicUrl(bucketName, gcsFileName);
        // console.log(reqFile.gcsUrl);
    });
  
    stream.end(reqFile.buffer);
    return {
        error: false,
        gcsUrl: getPublicUrl(bucketName, gcsFileName)
    };
};

module.exports = { storage, getPublicUrl, sendUploadToGCSFunc };