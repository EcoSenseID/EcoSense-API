const pool = require('../pool');
const getUid = require('../firebase-auth/getUid');
const getIdcheckAdminFromUid = require('../helpers/get-id-check-admin');
const { sendUploadToGCSFunc } = require('../helpers/google-cloud-storage');
// const checkIsAdmin = require('../helpers/check-is-admin');

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

const addNewCampaign = async (request, response) => {
  const { authorization } = request.headers;
  // console.log('reqbody', request.body);
  const newCampaignData = JSON.parse(request.body.newCampaignData);
  const posterFile = request.file;
  // console.log('newCampaignData', newCampaignData);
  // console.log('poster', posterFile);

  try {
    const uid = await getUid(authorization);
    const checkResult = await getIdcheckAdminFromUid(uid);
    const isAdmin = checkResult.isAdmin;
    const id = checkResult.id;

    const {
      campaignTitle,
      campaignDescription,
      campaignInitiator,
      campaignStartDate,
      campaignEndDate,
      campaignCategories,
      campaignTasks
  } = newCampaignData;

    if (isAdmin) {
      let posterGCSURL = '';
      if (!posterFile) {
        response.status(400).json({
          error: true, message: 'Poster is mandatory!'
        });
      } else {
        const result = await sendUploadToGCSFunc(posterFile, 'ecosense-campaign-posters');
        if (result.error) {
          throw result.error.errorDetail
        } else {
          posterGCSURL = result.gcsUrl
        }
      }

      const queryString = `INSERT INTO campaigns (title, initiator, description, start_date, end_date, poster_url)
        VALUES ('${campaignTitle}', '${campaignInitiator}', '${campaignDescription}', '${campaignStartDate}', '${campaignEndDate}', '${posterGCSURL}')
        RETURNING id;
        ${campaignCategories.map(data => (`INSERT INTO category_campaign (id_category, id_campaign, earned_experience_point) SELECT ${data.id}, id, ${data.earned_experience_point} FROM campaigns WHERE poster_url = '${posterGCSURL}';`)).join(' ')}
        ${campaignTasks.map(data => (`INSERT INTO tasks (id_campaign, order_number, name, require_proof) SELECT id, ${data.order_number}, '${data.name}', ${data.require_proof} FROM campaigns WHERE poster_url = '${posterGCSURL}';`)).join(' ')}
      `;
      // console.log(queryString);
      const results = await pool.query(queryString);
      if (results[0].rows[0].id){
        response.status(200).json({
          error: false, 
          message: 'Add new campaign success!'
        });
        return;
      } else {
        response.status(403).json({
          error: true, message: 'Input to DB failed!'
        });
        return;
      }
    }
    else {
      response.status(403).json({
        error: true, message: 'Forbidden. Admin only!'
      });
      return;
    }
  }
  catch (error) {
    response.status(error.code || 400).json({
      error: true, message: error.message
    }); return;
  }
}

const getMyCampaigns = async (request, response) => {
  const { authorization } = request.headers;
  const { displayName } = request.query;
  // console.log(request.query.displayName);

  try {
    const uid = await getUid(authorization);
    const checkResult = await getIdcheckAdminFromUid(uid);
    const isAdmin = checkResult.isAdmin;
    const id = checkResult.id;

    if (!isAdmin) {
      response.status(403).json({
        error: true, message: 'Forbidden. Admin only!'
      });
      return;
    }
    else {
      const queryString = `
        SELECT * FROM categories ORDER BY id;
        SELECT * FROM campaigns
        LEFT JOIN (SELECT id_campaign, array_agg(id_category) as category FROM category_campaign GROUP BY id_campaign) AS a
        ON campaigns.id = a.id_campaign
        LEFT JOIN (SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
        ON campaigns.id = b.id_campaign
        WHERE initiator LIKE '${displayName}%'
        ORDER BY id;
      `;
      // console.log(queryString);
      const results = await pool.query(queryString);
      if (results) {
        const categoriesList = results[0].rows.map(data => ({
            id: data.id, name: data.name
        }))
        const campaignsList = results[1].rows;
        // console.log(categoriesList);
        // console.log(campaignsList);
        response.status(200).json({
            error: false,
            message: "Campaigns fetched successfully",
            timestamp: new Date(),
            campaigns: campaignsList.map(data => ({
                id: data.id,
                posterUrl: data.poster_url,
                title: data.title,
                description: data.description,
                startDate: data.start_date,
                endDate: data.end_date,
                category: (data.category || []).map((data, idx) => (
                    categoriesList.filter(category => category.id === data)[0].name
                )),
                participantsCount: data.participant_count || 0,
                isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
            }))
        });
      } else {
        response.status(400).json({
          error: true, message: 'Fetch from DB failed.'
        }); return;
      }
    }
  }
  catch (error) {
    response.status(400).json({
      error: true, message: error.message
    }); 
    return;
  }
}

module.exports = {
    // uploadFileToGCS,
    getTrendingCampaigns,
    loginToWeb,
    addNewCampaign,
    getMyCampaigns
}