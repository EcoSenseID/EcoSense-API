import pool from '../pool.js';
import getUid from '../firebase-auth/getUid.js';
import { sendUploadToGCSFunc } from '../helpers/google-cloud-storage.js';

import { Request, Response } from 'express';
import getIdFromIdToken from '../helpers/get-id.js';

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
      response.status(400).json({
        error: true, message: error.message
      });
    }
};

export const loginToWeb = async (request: Request, response: Response) => {
  const { authorization } = request.headers;

  try {
    const { displayName } = request.body;
    const uid = await getUid(authorization!);

    // CHECK IF UID EXISTS IN TABLE
    let hasExisted = false;
    const queryString1 = `SELECT id, name FROM users WHERE firebase_uid = '${uid}';`;
    const results1 = await pool.query(queryString1);
    if (results1.rows.length === 0) {
      hasExisted = false;
    } else {
      hasExisted = true;
      if (results1.rows[0].name && results1.rows[0].name == displayName) {
        response.status(200).json({
          error: false,
          message: "UID existed. Login success!"
        });
        return;
      } else {
        const queryString3 = `UPDATE users SET name = '${displayName}' WHERE firebase_uid = '${uid}';`;
        const results3 = await pool.query(queryString3);
        response.status(200).json({
          error: false,
          message: "UID existed and name updated. Login success!"
        });
        return;
      }
    }

    if (!hasExisted) {
      const queryString2 = `
        INSERT INTO users (firebase_uid, name) VALUES ('${uid}', '${displayName}') RETURNING id;
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
    response.status(400).json({
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

    const queryString = `INSERT INTO campaigns (title, id_initiator, description, start_date, end_date, poster_url)
      VALUES ('${campaignTitle}', '${id}', '${campaignDescription}', '${campaignStartDate}', '${campaignEndDate}', '${posterGCSURL}')
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
    response.status(400).json({
      error: true, message: error.message
    }); return;
  }
}

export const editCampaign = async (request: Request, response: Response) => {
  const { authorization } = request.headers;
  const newCampaignData = JSON.parse(request.body.newCampaignData);
  const posterChanged = JSON.parse(request.body.posterChanged);
  const previousNoOfTask = JSON.parse(request.body.previousNoOfTask);
  const posterFile = request.file;
  // console.log('posterChanged', posterChanged);
  // console.log('posterFile', posterFile);

  try {
    const { id: userId } = await getIdFromIdToken(authorization!);
    // console.log(newCampaignData);
    const {
      id,
      title,
      description,
      categories,
      tasks,
      startDate,
      endDate,
      posterUrl,
      canEditTask
    } = newCampaignData;
    const currentNoOfTask = tasks.length;

    let posterGCSURL = posterUrl;
    if (posterChanged === true) {
      if (!posterFile) {
        response.status(400).json({
          error: true, message: 'Poster not detected!'
        });
      } else {
        const result = await sendUploadToGCSFunc(posterFile, 'ecosense-campaign-posters');
        if (result.error) {
          throw result.error
        } else {
          posterGCSURL = result.gcsUrl
        }
      }
    }

    let queryString: string;
    if (canEditTask) {
      let taskQueryString: string = '';
      if (previousNoOfTask < currentNoOfTask) {
        for (let i = 1; i <= previousNoOfTask; i++) {
          const currentTask = tasks.filter((task: { order_number: number; }) => task.order_number == i)[0];
          taskQueryString += `UPDATE tasks SET name = '${currentTask.name}', require_proof = ${currentTask.require_proof} WHERE id_campaign = ${id} AND order_number = ${currentTask.order_number}; `;
        }
        for (let i = previousNoOfTask + 1; i <= currentNoOfTask; i++) {
          const currentTask = tasks.filter((task: { order_number: number; }) => task.order_number == i)[0];
          taskQueryString += `INSERT INTO tasks (id_campaign, order_number, name, require_proof) VALUES (${id}, ${i}, '${currentTask.name}', ${currentTask.require_proof}); `;
        }
      } else if (previousNoOfTask === currentNoOfTask) {
        for (let i = 1; i <= previousNoOfTask; i++) {
          const currentTask = tasks.filter((task: { order_number: number; }) => task.order_number == i)[0];
          taskQueryString += `UPDATE tasks SET name = '${currentTask.name}', require_proof = ${currentTask.require_proof} WHERE id_campaign = ${id} AND order_number = ${currentTask.order_number}; `;
        }
      } else {
        for (let i = 1; i <= previousNoOfTask; i++) {
          const currentTask = tasks.filter((task: { order_number: number; }) => task.order_number == i)[0];
          taskQueryString += `UPDATE tasks SET name = '${currentTask.name}', require_proof = ${currentTask.require_proof} WHERE id_campaign = ${id} AND order_number = ${currentTask.order_number}; `;
        }
        for (let i = previousNoOfTask + 1; i <= currentNoOfTask; i++) {
          const currentTask = tasks.filter((task: { order_number: number; }) => task.order_number == i)[0];
          taskQueryString += `DELETE FROM tasks WHERE id_campaign = ${id} AND order_number = ${currentTask.order_number}; `;
        }
      }
      queryString = `UPDATE campaigns 
        SET title = '${title}', description = '${description}', start_date = '${startDate}', end_date = '${endDate}', poster_url = '${posterGCSURL}'
        WHERE id = ${id}
        RETURNING id;
        DELETE FROM category_campaign WHERE id_campaign = ${id};
        ${categories.map((data: { id: number; earned_experience_point: number; }) => 
          (`INSERT INTO category_campaign (id_category, id_campaign, earned_experience_point) VALUES (${data.id}, ${id}, ${data.earned_experience_point});`)
        ).join(' ')}
        SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
        ${taskQueryString}
      `;
    } else {
      queryString = `UPDATE campaigns 
        SET title = '${title}', description = '${description}', start_date = '${startDate}', end_date = '${endDate}', poster_url = '${posterGCSURL}'
        WHERE id = ${id}
        RETURNING id;
        DELETE FROM category_campaign WHERE id_campaign = ${id};
        ${categories.map((data: { id: number; earned_experience_point: number; }) => 
          (`INSERT INTO category_campaign (id_category, id_campaign, earned_experience_point) VALUES (${data.id}, ${id}, ${data.earned_experience_point});`)
        ).join(' ')}
      `;
    }
    
    // console.log(queryString);
    const results: any = await pool.query(queryString);
    if (results[0].rows[0].id){
    // if (true) {
      response.status(200).json({
        error: false, 
        message: 'Edit campaign success!'
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
    response.status(400).json({
      error: true, message: error.message
    }); return;
  }
}

export const deleteCampaign = async (request: Request, response: Response) => {
  const { authorization } = request.headers;
  const { campaignId: id } = request.query; 

  try {
    const queryString = `DELETE from campaigns WHERE id=${id}; DELETE FROM category_campaign WHERE id_campaign = ${id}; DELETE FROM tasks WHERE id_campaign = ${id};`;
    const results: any = await pool.query(queryString);
    if (results[0].rows[0].id){
      response.status(200).json({
        error: false, 
        message: 'Delete campaign success!'
      });
      return;
    } else {
      response.status(403).json({
        error: true, message: 'Delete campaign from DB failed!'
      });
      return;
    }
  }
  catch (error: any) {
    response.status(400).json({
      error: true, message: error.message
    }); return;
  }
}

export const getAllCategories = (request: Request, response: Response) => {
  try {
      const queryString = `SELECT * FROM categories ORDER BY id;`;
      pool.query(queryString, (error: Error, results: any) => {
          response.status(200).json({
              error: false,
              message: "Categories fetched successfully",
              categories: results.rows.map((data: { id: number; photo_url: string; name: string; color_hex: string; }) => ({
                  id: data.id, photoUrl: data.photo_url, name: data.name, colorHex: data.color_hex
              }))
          });
          if (error) throw error;
      });
  }
  catch(error: any) {
      response.status(400).json({
          error: true, message: error.message
      });
  }
}

export const getMyCampaigns = async (request: Request, response: Response) => {
  const { authorization } = request.headers;
  // const { displayName } = request.query;

  try {
    const { id } = await getIdFromIdToken(authorization!);

    const queryString = `
      SELECT * FROM categories ORDER BY id;
      SELECT * FROM campaigns
      LEFT JOIN (SELECT id_campaign, array_agg(json_build_object('id_category', id_category, 'earned_experience_point', earned_experience_point)) as category FROM category_campaign GROUP BY id_campaign) AS a
      ON campaigns.id = a.id_campaign
      LEFT JOIN (SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
      ON campaigns.id = b.id_campaign
      LEFT JOIN (SELECT id_campaign, array_agg(json_build_object('id_task', id, 'order_number', order_number, 'name', name, 'require_proof', require_proof)) as task FROM tasks GROUP BY id_campaign) AS c
      ON campaigns.id = c.id_campaign
      WHERE id_initiator = ${id}
      ORDER BY id;
      SELECT completed_tasks.id_task, e.id_campaign FROM completed_tasks LEFT JOIN (SELECT id_campaign, id FROM tasks) as e ON completed_tasks.id_task = e.id; 
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
          campaigns: campaignsList.map((data: any) => {
            return ({
              id: data.id,
              posterUrl: data.poster_url,
              title: data.title,
              description: data.description,
              startDate: data.start_date,
              endDate: data.end_date,
              categories: (data.category || []).map((data: { id_category: number; earned_experience_point: number}) => ({
                  ...categoriesList.filter((category: { id: number; }) => category.id === data.id_category)[0],
                  earned_experience_point: data.earned_experience_point
              })),
              tasks: data.task,
              participantsCount: parseInt(data.participant_count) || 0,
              isTrending: !data.participant_count ? false : parseInt(data.participant_count) > 100 ? true : false,
              isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7,
              canEditTask: results[2].rows.filter((completedTask: { id_campaign: any; }) => completedTask.id_campaign === data.id).length === 0
            })
          })
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

export const getCampaignParticipant = async (request: Request, response: Response) => {
  const { authorization } = request.headers;
  const { campaignId } = request.query;
  // console.log(campaignId);

  try {
    const { id } = await getIdFromIdToken(authorization!);
    // console.log(id);

    const queryString = `
      SELECT id_campaign, joined_timestamp, COUNT(id_user) AS user_count 
      FROM campaign_participant 
      WHERE id_campaign = ${campaignId} GROUP BY id_campaign, joined_timestamp ORDER BY joined_timestamp;
      SELECT * FROM completed_tasks LEFT JOIN (SELECT id_campaign, tasks.id AS id_task, tasks.name, tasks.order_number FROM tasks) as e ON completed_tasks.id_task = e.id_task 
      WHERE e.id_campaign = ${campaignId};
    `;
    // const currentDate = new Date(new Date().getTime() - 2*24*60*60*1000).toISOString();
    // const queryString = `
    //   INSERT INTO campaign_participant (id_campaign, id_user, is_completed, joined_timestamp, completed_timestamp)
    //   VALUES (${campaignId}, 1, false, '${currentDate}', '${currentDate}');
    //   SELECT * FROM campaign_participant WHERE id_campaign = ${campaignId} AND id_user = 1;
    // `;
    // console.log(queryString);
    const results: any = await pool.query(queryString);
    // if (results[1].rows.length !== 0) {
    //   response.status(200).json({ error: false, message: "Success" });
    // } else {
    //     response.status(400).json({ error: true, message: "Insert to DB not successful" });
    // }
    if (results) {
      // console.log(results.rows);
      response.status(200).json({
        error: false,
        message: 'Campaign Participants fetched successfully',
        id_campaign: campaignId,
        participants: [
          ...results[0].rows.map((data: { joined_timestamp: Date; user_count: string; }) => {
            let dateOnly = data.joined_timestamp.toISOString().split('T')[0];
            return {
              date: `${parseInt(dateOnly.split('-')[2])}/${parseInt(dateOnly.split('-')[1])}`,
              registrationCount: parseInt(data.user_count)
            }
          })
        ],
        completed_tasks: results[1].rows
      });
    } else {
      response.status(400).json({
        error: true, message: 'Fetch from DB failed.'
      }); return;
    }
  }
  catch (error: any) {
    response.status(400).json({ error: true, message: error.message }); 
    return;
  }
}

// New API TODO: updateDisplayName, so that name in users table updates when user change name in firebase.

// module.exports = {
//     getTrendingCampaigns,
//     loginToWeb,
//     addNewCampaign,
//     getMyCampaigns
// }