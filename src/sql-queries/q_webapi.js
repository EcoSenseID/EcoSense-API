const pool = require('../pool');
const getUid = require('../firebase-auth/getUid');
const getIdFromUid = require('../helpers/get-id-from-uid');

// const uploadFileToGCS = (req, res, next) => {
//     if (req.file && req.file.gcsUrl) {
//       return res.status(200).json({
//         error: false,
//         message: 'File uploaded successfully to GCS',
//         gcsUrl: req.file.gcsUrl
//       });
//     }

//     return res.status(500).json({
//       error: true,
//       message: 'Unable to upload'
//     });
// }

const getTrendingCampaigns = (request, response) => {
    try {
      const queryString = `
          SELECT * FROM campaigns
          LEFT JOIN ( SELECT id_campaign, array_agg(id_category) as categories FROM category_campaign GROUP BY id_campaign) AS a
          ON campaigns.id = a.id_campaign
          LEFT JOIN ( SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
          ON campaigns.id = b.id_campaign
          ORDER BY id;
      `;
      pool.query(queryString, (error, results) => {
        // if (error) throw error;
        response.status(200).json({
            error: false,
            message: "Trending campaigns fetched successfully",
            campaigns: results.rows.map(data => ({
              id: data.id,
              posterUrl: data.poster_url,
              title: data.title,
              description: data.description
          }))
        });
      })
    }
    catch (error) {
      response.status(error.code || 400).json({
        error: true, message: error.message
      });
    }
};

const loginToWeb = async (request, response) => {
  const { authorization } = request.headers;

  try {
    const uid = await getUid(authorization);

    // CHECK IF UID EXISTS IN TABLE
    let hasExisted = false;
    const queryString1 = `
      SELECT id FROM users WHERE firebase_uid = '${uid}';
    `;
    pool.query(queryString1, (error, results) => {
      if (results.rows.length === 0) {
        hasExisted = false;
      } else {
        hasExisted = true;
        response.status(200).json({
          error: false,
          message: "UID existed. Login success!"
        });
        return;
      }

      if (!hasExisted) {
        const queryString2 = `
          INSERT INTO users (firebase_uid) VALUES ('${uid}') RETURNING id;
          INSERT INTO user_role (id_user, id_role) SELECT id, 1 FROM users WHERE firebase_uid = '${uid}' RETURNING id_user;
        `;
        pool.query(queryString2, (error, results) => {
          if (results[0].rows[0].id === results[1].rows[0].id_user){
            response.status(200).json({
              error: false,
              message: "Add UID and login to Web success!"
            });
            return;
          } else {
            response.status(400).json({
              error: false,
              message: "Add UID failed but login to Web success!"
            });
            return;
          }
        });
      }
    });
  }
  catch(error) {
    response.status(error.code || 400).json({
      error: true, message: error.message
    });
  }
}

module.exports = {
    // uploadFileToGCS,
    getTrendingCampaigns,
    loginToWeb
}