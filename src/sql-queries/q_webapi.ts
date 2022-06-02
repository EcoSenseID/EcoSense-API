import pool from '../pool';
import getUid from '../firebase-auth/getUid';
import getIdCheckAdminFromUid from '../helpers/check-admin';
import { sendUploadToGCSFunc } from '../helpers/google-cloud-storage';

import { Request, Response } from 'express';
import getIdFromIdToken from '../helpers/get-id';

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

export const getTrendingCampaigns = (request: Request, response: Response) => {
    try {
      const queryString = `
          SELECT * FROM campaigns
          LEFT JOIN ( SELECT id_campaign, array_agg(id_category) as categories FROM category_campaign GROUP BY id_campaign) AS a
          ON campaigns.id = a.id_campaign
          LEFT JOIN ( SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
          ON campaigns.id = b.id_campaign
          ORDER BY id;
      `;
      pool.query(queryString, (error: Error, results: any) => {
        // if (error) throw error;
        response.status(200).json({
            error: false,
            message: "Trending campaigns fetched successfully",
            campaigns: results.rows.map((data: { id: number; poster_url: string; title: string; description: string; }) => ({
              id: data.id,
              posterUrl: data.poster_url,
              title: data.title,
              description: data.description
          }))
        });
      })
    }
    catch (error: any) {
      response.status(error.code || 400).json({
        error: true, message: error.message
      });
    }
};

export const loginToWeb = async (request: Request, response: Response) => {
  const { authorization } = request.headers;

  try {
    const uid = await getUid(authorization!);

    // CHECK IF UID EXISTS IN TABLE
    let hasExisted = false;
    const queryString1 = `SELECT id FROM users WHERE firebase_uid = '${uid}';`;
    const results1 = await pool.query(queryString1);
    if (results1.rows.length === 0) {
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
      const results2: any = await pool.query(queryString2);
      if (results2[0].rows[0].id === results2[1].rows[0].id_user){
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
    }
  }
  catch(error: any) {
    response.status(error.code || 400).json({
      error: true, message: error.message
    });
  }
}

export const addNewCampaign = async (request: Request, response: Response) => {
  const { authorization } = request.headers;
  const newCampaignData = JSON.parse(request.body.newCampaignData);
  const posterFile = request.file;

  try {
    const { id } = await getIdFromIdToken(authorization!);
    const {
      campaignTitle,
      campaignDescription,
      campaignInitiator,
      campaignStartDate,
      campaignEndDate,
      campaignCategories,
      campaignTasks
    } = newCampaignData;

    let posterGCSURL = '';
    if (!posterFile) {
      response.status(400).json({
        error: true, message: 'Poster is mandatory!'
      });
    } else {
      const result = await sendUploadToGCSFunc(posterFile, 'ecosense-campaign-posters');
      if (result.error) {
        throw result.error
      } else {
        posterGCSURL = result.gcsUrl
      }
    }

    const queryString = `INSERT INTO campaigns (title, initiator, description, start_date, end_date, poster_url)
      VALUES ('${campaignTitle}', '${campaignInitiator}', '${campaignDescription}', '${campaignStartDate}', '${campaignEndDate}', '${posterGCSURL}')
      RETURNING id;
      ${campaignCategories.map((data: { id: number; earned_experience_point: number; }) => 
        (`INSERT INTO category_campaign (id_category, id_campaign, earned_experience_point) SELECT ${data.id}, id, ${data.earned_experience_point} FROM campaigns WHERE poster_url = '${posterGCSURL}';`)
      ).join(' ')}
      ${campaignTasks.map((data: { order_number: number; name: string; require_proof: boolean; }) => 
        (`INSERT INTO tasks (id_campaign, order_number, name, require_proof) SELECT id, ${data.order_number}, '${data.name}', ${data.require_proof} FROM campaigns WHERE poster_url = '${posterGCSURL}';`)
      ).join(' ')}
    `;
    // console.log(queryString);
    const results: any = await pool.query(queryString);
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
  catch (error: any) {
    response.status(error.code || 400).json({
      error: true, message: error.message
    }); return;
  }
}

export const getMyCampaigns = async (request: Request, response: Response) => {
  const { authorization } = request.headers;
  const { displayName } = request.query;

  try {
    const { id } = await getIdFromIdToken(authorization!);

    const queryString = `
      SELECT * FROM categories ORDER BY id;
      SELECT * FROM campaigns
      LEFT JOIN (SELECT id_campaign, array_agg(id_category) as category FROM category_campaign GROUP BY id_campaign) AS a
      ON campaigns.id = a.id_campaign
      LEFT JOIN (SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
      ON campaigns.id = b.id_campaign
      LEFT JOIN (SELECT id_campaign, array_agg(json_build_object('order_number', order_number, 'name', name, 'require_proof', require_proof)) as task FROM tasks GROUP BY id_campaign) AS c
      ON campaigns.id = c.id_campaign
      WHERE initiator LIKE '${displayName}%'
      ORDER BY id;
    `;
    // console.log(queryString);
    const results: any = await pool.query(queryString);
    if (results) {
      const categoriesList = results[0].rows.map((data: { id: number; name: string; color_hex: string; }) => ({
          id: data.id, name: data.name, color_hex: data.color_hex
      }))
      const campaignsList = results[1].rows;
      // console.log(categoriesList);
      // console.log(campaignsList);
      response.status(200).json({
          error: false,
          message: "Campaigns fetched successfully",
          timestamp: new Date(),
          campaigns: campaignsList.map((data: any) => ({
              id: data.id,
              posterUrl: data.poster_url,
              title: data.title,
              description: data.description,
              startDate: data.start_date,
              endDate: data.end_date,
              categories: (data.category || []).map((data: number) => (
                  categoriesList.filter((category: { id: number; }) => category.id === data)[0]
              )),
              tasks: data.task,
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
  catch (error: any) {
    response.status(400).json({
      error: true, message: error.message
    }); 
    return;
  }
}

// module.exports = {
//     getTrendingCampaigns,
//     loginToWeb,
//     addNewCampaign,
//     getMyCampaigns
// }