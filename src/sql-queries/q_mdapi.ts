import pool from '../pool';
import getUid from '../firebase-auth/getUid';
import getIdCheckUserFromUid from '../helpers/check-user';
import { sendUploadToGCSFunc } from '../helpers/google-cloud-storage';
import { Request, Response } from 'express';
import getIdFromIdToken from '../helpers/get-id';
import { convertToUnixTimestamp } from '../helpers/helpers';

// TODO: DONE!
export const getCampaign = async (request: Request, response: Response) => {
    const reqQuery: any = request.query;
    const categoryId: any = parseInt(reqQuery.categoryId) || null;
    const keyword = request.query.q || '';

    try {
        const queryString = `
            SELECT * FROM categories ORDER BY id;
            SELECT * FROM campaigns
            LEFT JOIN (SELECT id_campaign, array_agg(id_category) as category FROM category_campaign GROUP BY id_campaign) AS a
            ON campaigns.id = a.id_campaign
            LEFT JOIN (SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
            ON campaigns.id = b.id_campaign
            ${`WHERE (LOWER(title) LIKE '%${keyword}%'`})
            ORDER BY id;
        `;
        // Fitur filter by categoryId pending, menunggu data category masuk ke DB.
        pool.query(queryString, (error: Error, results: any) => {
            // console.log(results[0].rows);
            const categoriesList = results[0].rows.map((data: { id: number; name: string; }) => ({
                id: data.id, name: data.name
            }))
            let campaignsList = [];
            if (categoryId) {
                campaignsList = results[1].rows.filter((data: { category: Array<number>; }) => (data.category || []).includes(categoryId));
            } else {
                campaignsList = results[1].rows;
            }
            response.status(200).json({
                error: false,
                message: "Campaigns fetched successfully",
                timestamp: new Date(),
                campaigns: campaignsList.map((data: any) => ({
                    id: data.id,
                    posterUrl: data.poster_url,
                    title: data.title,
                    description: data.description,
                    startDate: convertToUnixTimestamp(data.start_date),
                    endDate: convertToUnixTimestamp(data.end_date),
                    category: (data.category || []).map((data: number) => (
                        categoriesList.filter((category: { id: number; }) => category.id === data)[0].name
                    )),
                    participantsCount: data.participant_count || 0,
                    isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                    isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
                }))
                // campaigns: results.rows
            });
            // if (error) throw error;
        })
    }
    catch(error: any) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: Activate getIdFromUid and change completedCampaignList from dummy data to database
export const getDashboard = async (request: Request, response: Response) => {
    const { authorization } = request.headers;

    try {
        const { id } = await getIdFromIdToken(authorization!);

        const queryString = `
            SELECT * FROM categories ORDER BY id;
            SELECT * FROM campaigns
            LEFT JOIN (SELECT id_campaign, array_agg(id_category) as category FROM category_campaign GROUP BY id_campaign) AS a
            ON campaigns.id = a.id_campaign
            LEFT JOIN (SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
            ON campaigns.id = b.id_campaign
            ORDER BY id;
            SELECT * FROM campaign_participant WHERE id_user = ${id} ORDER BY id_campaign;
            SELECT * FROM tasks ORDER BY id_campaign;
            SELECT id_task FROM completed_tasks WHERE id_user = ${id} ORDER BY id_task;
        `;
        pool.query(queryString, (error: Error, results: any) => {
            // if (error) throw error;
            const categoriesList = results[0].rows.map((data: { id: number; name: string; }) => ({
                id: data.id, name: data.name
            }))
            const campaignList = results[1].rows.map((data: any) => ({
                id: data.id,
                posterUrl: data.poster_url,
                title: data.title,
                endDate: convertToUnixTimestamp(data.end_date),
                category: (data.category || []).map((data: number) => (
                    categoriesList.filter((category: { id: number; }) => category.id === data)[0].name
                )),
                participantsCount: data.participant_count || 0,
                isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
            }));
            const taskList = results[3].rows;
            const completedTaskList = results[4].rows.map((data: { id_task: number; }) => (data.id_task));
            // console.log(completedTaskList);
            // const completedCampaignsList = results[2].row;
            const completedCampaignsList = [
                {
                    id_campaign: 3,
                    id_user: 1,
                    is_completed: true,
                    joined_timestamp: "2022-01-08T06:34:18.598Z",
                    completed_timestamp: "2022-01-08T06:34:18.598Z"
                },
                {
                    id_campaign: 2,
                    id_user: 1,
                    is_completed: false,
                    joined_timestamp: "2022-05-08T06:34:18.598Z",
                    completed_timestamp: ""
                },
                {
                    id_campaign: 1,
                    id_user: 1,
                    is_completed: false,
                    joined_timestamp: "2022-05-08T06:34:18.598Z",
                    completed_timestamp: ""
                },
            ]
            response.status(200).json({
                error: false,
                message: "Dashboard fetched successfully",
                tasks: [
                    ...completedCampaignsList.filter(data => data.is_completed == false).map(data => ({
                        id: 1,
                        campaignId: data.id_campaign,
                        name: taskList.filter((task: { id_campaign: number; }) => task.id_campaign == data.id_campaign).filter((task: { id: number; }) => {
                            if (completedTaskList.includes(task.id)) return false;
                            return true;
                        })[0].name,
                        campaignName: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].title,
                        campaignEndDate: convertToUnixTimestamp(campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].endDate),
                        tasksLeft: taskList.filter((task: { id_campaign: number; }) => task.id_campaign == data.id_campaign).filter((task: { id: number; }) => {
                            if (completedTaskList.includes(task.id)) return false;
                            return true;
                        }).length,
                        completed: false
                    })),
                ],
                completedCampaigns: [
                    ...completedCampaignsList.filter(data => data.is_completed == true).map(data => ({
                        id: data.id_campaign,
                        posterUrl: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].posterUrl,
                        title: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].title,
                        endDate: convertToUnixTimestamp(campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].endDate),
                        category: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].category,
                        participantsCount: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].participantsCount,
                        isTrending: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].isTrending,
                        isNew: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].isNew
                    }))
                ]
            });
        });
    }
    catch (error: any) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: DONE!
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
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: Activate getIdFromUid and change completedCampaignList from dummy data to database
export const getCampaignDetail = async (request: Request, response: Response) => {
    const { authorization } = request.headers;
    const reqQuery: any = request.query;
    const campaignId = parseInt(reqQuery.id);

    if (!campaignId) {
        response.status(400).json({ error: true, message: "No campaign id!" });
        return;
    }
    try {
        const { id } = await getIdFromIdToken(authorization!);

        const queryString = `
            SELECT * FROM campaigns
            LEFT JOIN ( SELECT id_campaign, array_agg(id_category) as category FROM category_campaign GROUP BY id_campaign) AS a
            ON campaigns.id = a.id_campaign
            LEFT JOIN ( SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
            ON campaigns.id = b.id_campaign
            LEFT JOIN ( SELECT id_campaign, array_agg(json_build_object('id', id, 'name', name)) as tasks FROM tasks GROUP BY id_campaign) AS c
            ON campaigns.id = c.id_campaign
            WHERE id = ${campaignId};
            SELECT * FROM categories ORDER BY id;
            SELECT id_campaign FROM campaign_participant WHERE id_user = ${id}
        `;
        pool.query(queryString, (error: Error, results: any) => {
            const categoriesList = results[1].rows;
            // const campaign_participant = results[2].rows;
            const campaign_participant = [
                {
                    id_campaign: 3,
                },
                {
                    id_campaign: 2,
                },
                {
                    id_campaign: 1,
                },
            ]
            const joinedList = campaign_participant.map(data => data.id_campaign);
            console.log(joinedList);
            response.status(200).json({
                error: false,
                message: "Categories fetched successfully",
                ...results[0].rows.map((data: any) => ({
                    participantsCount: data.participant_count || 0,
                    category: (data.category || []).map((data: number) => (
                        categoriesList.filter((category: { id: number; }) => category.id === data)[0].name
                    )),
                    title: data.title,
                    posterUrl: data.poster_url,
                    isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                    isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7,
                    initiator: data.initiator,
                    startDate: convertToUnixTimestamp(data.start_date),
                    endDate: convertToUnixTimestamp(data.end_date),
                    description: data.description,
                    joined: joinedList.includes(campaignId),
                    tasks: data.tasks
                }))[0]
            });
        });
    }
    catch(error: any) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// Activate getIdFromUid and change completedCampaignList from dummy data to database
export const getContributions = async (request: Request, response: Response) => {
    const { authorization } = request.headers;

    try {
        const { id } = await getIdFromIdToken(authorization!);

        const queryString = `
            SELECT * FROM categories ORDER BY id;
            SELECT * FROM campaigns
            LEFT JOIN (SELECT id_campaign, array_agg(id_category) as category FROM category_campaign GROUP BY id_campaign) AS a
            ON campaigns.id = a.id_campaign
            LEFT JOIN (SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
            ON campaigns.id = b.id_campaign
            ORDER BY id;
            SELECT * FROM campaign_participant WHERE id_user = ${id} ORDER BY id_campaign;
            SELECT * FROM user_experience_points WHERE id_user = ${id} ORDER BY id_category;
        `;
        pool.query(queryString, (error: Error, results: any) => {
            const categoriesList = results[0].rows.map((data: { id: number; name: string; }) => ({
                id: data.id, name: data.name,
            }))
            // const campaign_participant = results[2].row;
            const campaign_participant = [
                {
                    id_campaign: 3,
                    id_user: 1,
                    is_completed: true,
                    joined_timestamp: "2022-01-08T06:34:18.598Z",
                    completed_timestamp: "2022-01-08T06:34:18.598Z"
                },
                {
                    id_campaign: 2,
                    id_user: 1,
                    is_completed: false,
                    joined_timestamp: "2022-05-08T06:34:18.598Z",
                    completed_timestamp: ""
                },
                {
                    id_campaign: 1,
                    id_user: 1,
                    is_completed: false,
                    joined_timestamp: "2022-05-08T06:34:18.598Z",
                    completed_timestamp: ""
                },
            ]
            const campaignList = results[1].rows.map((data: any) => ({
                id: data.id,
                posterUrl: data.poster_url,
                title: data.title,
                endDate: data.end_date,
                category: (data.category || []).map((data: number) => (
                    categoriesList.filter((category: { id: number; }) => category.id === data)[0].name
                )),
                participantsCount: data.participant_count || 0,
                isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
            }));
            const experiencePoints = results[3].rows.map((data: any) => ({
                categoryName: categoriesList.filter((category: { id: number; }) => category.id === data.id_category)[0].name,
                level: Math.floor(data.experience_point/100),
                currentExperience: data.experience_point % 100, // setiap level itu 100 points
                levelExperience: 100
            }))
            response.status(200).json({
                error: false,
                message: "Contributions fetched successfully",
                experiences: experiencePoints,
                completedCampaigns: [
                    ...campaign_participant.filter(data => data.is_completed == true).map(data => ({
                        id: data.id_campaign,
                        posterUrl: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].posterUrl,
                        title: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].title,
                        endDate: convertToUnixTimestamp(campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].endDate),
                        category: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].category,
                        participantsCount: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].participantsCount,
                        isTrending: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].isTrending,
                        isNew: campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0].isNew
                    }))
                ]
            });
            if (error) throw error;
        });
    }
    catch(error: any) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: Activate getIdCheckUserFromUid!
export const postProof = async (request: Request, response: Response) => {
    const { authorization } = request.headers;
    const taskId = parseInt(request.body.taskId);
    const photo = request.file;

    try {
        const { id } = await getIdFromIdToken(authorization!);

        if (!taskId) {
            response.status(400).json({ error: true, message: "No task ID given" });
            return;
        }

        // Check if the task requires proof or not
        const queryString1 = `SELECT require_proof FROM tasks WHERE id = ${taskId};`;
        let require_proof = true;
        pool.query(queryString1, (error: Error, results: any) => {
            require_proof = results.rows[0].require_proof;
        });
        
        let photoGCSURL = '';
        if (require_proof && !photo) {
            response.status(400).json({
                error: true, message: "This task requires proof!"
            });
            return;
        } else if (require_proof && photo) {
            // Upload file to GCS and retrieve URL
            const result = await sendUploadToGCSFunc(photo, 'ecosense-task-proofs');
            if (result.error) {
                throw result.error
            } else {
                photoGCSURL = result.gcsUrl
            }
        } else {
            photoGCSURL = '';
        }

        const currentDate = new Date().toISOString();
        // Insert to Database
        const queryString2 = `
            INSERT INTO completed_tasks (id_task, id_user, photo_url, timestamp) VALUES (${taskId}, ${id}, '${photoGCSURL}', '${currentDate}') RETURNING photo_url;
            SELECT * FROM completed_tasks WHERE photo_url = '${photoGCSURL}';
        `;
        // console.log(queryString2);
        pool.query(queryString2, (error: Error, results: any) => {
            // console.log(results);
            if (results[1].rows.length !== 0) {
                response.status(200).json({
                    error: false,
                    message: "Success"
                });
            } else {
                response.status(400).json({
                    error: true,
                    message: "Input to DB not successful"
                });
            }
        });
    }
    catch (err: any) {
        response.status(err.code || 400).json({
            error: true, message: err.message
        });
    }
}

// TODO: DONE!
export const postCompleteCampaign = async (request: Request, response: Response) => {
    const campaignId = parseInt(request.body.campaignId);
    const { authorization } = request.headers;

    try {
        const { id } = await getIdFromIdToken(authorization!);

        const currentDate = new Date().toISOString(); 
        const queryString = `
            UPDATE campaign_participant 
            SET is_completed = true, completed_timestamp = '${currentDate}'
            WHERE id_campaign = ${campaignId} AND id_user = ${id};
            SELECT is_completed FROM campaign_participant WHERE id_campaign = ${campaignId} AND id_user = ${id};
        `;
        pool.query(queryString, (error: Error, results: any) => {
            const isCompleted = results[1].rows[0].is_completed;
            if (isCompleted) {
                response.status(200).json({
                    error: false, message: "Success"
                });
            } else {
                response.status(400).json({
                    error: true,
                    message: "Update DB not successful"
                });
            }
        });
    }
    catch (err: any) {
        response.status(err.code || 400).json({
            error: true, message: err.message
        });
    }
}

// TODO: DONE!
export const joinCampaign = async (request: Request, response: Response) => {
    const campaignId = parseInt(request.body.campaignId);
    const { authorization } = request.headers;

    try {
        const { id } = await getIdFromIdToken(authorization!);

        const currentDate = new Date().toISOString();
        const queryString = `
            INSERT INTO campaign_participant (id_campaign, id_user, is_completed, joined_timestamp, completed_timestamp)
            VALUES (${campaignId}, ${id}, false, '${currentDate}', '');
            SELECT * FROM campaign_participant WHERE id_campaign = ${campaignId} AND id_user = ${id};
        `;
        pool.query(queryString, (error: Error, results: any) => {
            if (results[1].rows.length !== 0) {
                response.status(200).json({ error: false, message: "Success" });
            } else {
                response.status(400).json({ error: true, message: "Insert to DB not successful" });
            }
        })
    }
    catch (err: any) {
        response.status(err.code || 400).json({
            error: true, message: err.message
        });
    }
}

// module.exports = {
//     getCampaign,
//     getDashboard,
//     getAllCategories,
//     getCampaignDetail,
//     getContributions,
//     postProof,
//     postCompleteCampaign,
//     joinCampaign
// }