const pool = require('../pool');

const uploadFileToGCS = (req, res, next) => {
    if (req.file && req.file.gcsUrl) {
      return res.status(200).send(req.file.gcsUrl);
    }

    return res.status(500).send('Unable to upload');
}

module.exports = {
    uploadFileToGCS
}