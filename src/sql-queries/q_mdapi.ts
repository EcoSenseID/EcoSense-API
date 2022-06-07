import pool from '../pool.js';
import { sendUploadToGCSFunc } from '../helpers/google-cloud-storage.js';
import { query, Request, Response } from 'express';
import getIdFromIdToken from '../helpers/get-id.js';
import { convertToUnixTimestamp } from '../helpers/helpers.js';

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
        
        const results = await pool.query(queryString);
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
                isTrending: !data.participant_count ? false : data.participant_count > 100 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
            }))
        });
    }
    catch(error: any) {
        response.status(400).json({
            error: true, message: error.message
        });
    }
}

// TODO: DONE!
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
        const results = await pool.query(queryString);
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
            isTrending: !data.participant_count ? false : data.participant_count > 100 ? true : false,
            isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
        }));
        const joinedList = results[2].rows;
        console.log(joinedList);
        const taskList = results[3].rows;
        const completedTaskList = results[4].rows.map((data: { id_task: number; }) => (data.id_task));
        
        response.status(200).json({
            error: false,
            message: "Dashboard fetched successfully",
            tasks: [
                ...joinedList.filter((data: { is_completed: boolean; }) => data.is_completed == false).map(
                    (currentCampaign: any) => {
                        const tasksFromThisCampaign = taskList.filter(
                            (task: { id_campaign: number; }) => task.id_campaign === currentCampaign.id_campaign
                        );
                        const undoneTasks = tasksFromThisCampaign.filter((task: { id: number; }) => {
                            if (completedTaskList.includes(task.id)) return false;
                            return true;
                        }).sort((a: { order_number: number; }, b: { order_number: number; }) => a.order_number - b.order_number);

                        return ({
                            id: undoneTasks[0].id,
                            campaignId: undoneTasks[0].id_campaign,
                            name: undoneTasks[0].name,
                            campaignName: campaignList.filter((campaign: { id: number; }) => campaign.id == currentCampaign.id_campaign)[0].title,
                            campaignEndDate: campaignList.filter((campaign: { id: number; }) => campaign.id == currentCampaign.id_campaign)[0].endDate,
                            tasksLeft: undoneTasks.length,
                            completed: false
                        })
                    }
                ),
            ],
            completedCampaigns: [
                ...joinedList.filter((data: { is_completed: boolean; }) => data.is_completed == true).map(
                    (data: { id_campaign: number; }) => {
                        const currentCampaignDetail = campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0];

                        return ({
                            id: data.id_campaign,
                            posterUrl: currentCampaignDetail.posterUrl,
                            title: currentCampaignDetail.title,
                            endDate: currentCampaignDetail.endDate,
                            category: currentCampaignDetail.category,
                            participantsCount: currentCampaignDetail.participantsCount,
                            isTrending: currentCampaignDetail.isTrending,
                            isNew: currentCampaignDetail.isNew
                        });
                    }
                )
            ]
        });
    }
    catch (error: any) {
        response.status(400).json({
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
        response.status(400).json({
            error: true, message: error.message
        });
    }
}

// TODO: DONE!
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
            LEFT JOIN ( SELECT id_campaign, array_agg(json_build_object('id', id, 'name', name, 'require_proof', require_proof)) as tasks FROM tasks GROUP BY id_campaign) AS c
            ON campaigns.id = c.id_campaign
            LEFT JOIN ( SELECT id, name FROM users) AS d ON campaigns.id_initiator = d.id
            WHERE id = ${campaignId};
            SELECT * FROM categories ORDER BY id;
            SELECT id_campaign FROM campaign_participant WHERE id_user = ${id};
            SELECT * FROM completed_tasks LEFT JOIN (SELECT id_campaign, id FROM tasks) as e ON completed_tasks.id_task = e.id 
            WHERE e.id_campaign = ${campaignId} AND completed_tasks.id_user = ${id};
        `;
        const results = await pool.query(queryString);
        const categoriesList = results[1].rows;
        const campaign_participant = results[2].rows;
        const completed_tasks = results[3].rows;
        // console.log(completed_tasks);
        const joinedList = campaign_participant.map((data: { id_campaign: number; }) => data.id_campaign);
        // console.log(joinedList);

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
                isTrending: !data.participant_count ? false : data.participant_count > 100 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7,
                initiator: data.id_initiator,
                startDate: convertToUnixTimestamp(data.start_date),
                endDate: convertToUnixTimestamp(data.end_date),
                description: data.description,
                joined: joinedList.includes(campaignId),
                tasks: data.tasks.map((data: any) => {
                    const completedTaskForThisTaskId = completed_tasks.filter((task: { id_task: number; }) => task.id_task === data.id);

                    if (completedTaskForThisTaskId.length > 0) {
                        if (data.require_proof) {
                            return ({
                                id: data.id,
                                name: data.name,
                                completed: true,
                                proofPhotoUrl: completedTaskForThisTaskId[0].photo_url || '',
                                proofCaption: '',
                                completedTimeStamp: convertToUnixTimestamp(completedTaskForThisTaskId[0].timestamp)
                            })
                        } else {
                            return ({
                                id: data.id,
                                name: data.name,
                                completed: true,
                                proofCaption: '',
                                completedTimeStamp: convertToUnixTimestamp(completedTaskForThisTaskId[0].timestamp)
                            })
                        }
                    } else {
                        return ({
                            id: data.id,
                            name: "Water any trees near your house",
                            completed: false
                        })
                    }
                })
            }))[0]
        });
    }
    catch(error: any) {
        response.status(400).json({
            error: true, message: error.message
        });
    }
}

// TODO: DONE!
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
            const campaignList = results[1].rows.map((data: any) => ({
                id: data.id,
                posterUrl: data.poster_url,
                title: data.title,
                endDate: data.end_date,
                category: (data.category || []).map((data: number) => (
                    categoriesList.filter((category: { id: number; }) => category.id === data)[0].name
                )),
                participantsCount: data.participant_count || 0,
                isTrending: !data.participant_count ? false : data.participant_count > 100 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
            }));
            const joinedList = results[2].rows;
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
                    ...joinedList.filter((data: { is_completed: boolean; }) => data.is_completed == true).map(
                        (data: { id_campaign: number; }) => {
                            const currentCampaignDetail = campaignList.filter((campaign: { id: number; }) => campaign.id == data.id_campaign)[0];
    
                            return ({
                                id: data.id_campaign,
                                posterUrl: currentCampaignDetail.posterUrl,
                                title: currentCampaignDetail.title,
                                endDate: currentCampaignDetail.endDate,
                                category: currentCampaignDetail.category,
                                participantsCount: currentCampaignDetail.participantsCount,
                                isTrending: currentCampaignDetail.isTrending,
                                isNew: currentCampaignDetail.isNew
                            });
                        }
                    )
                ]
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

// TODO: DONE!
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
        response.status(400).json({
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
        response.status(400).json({
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
            VALUES (${campaignId}, ${id}, false, '${currentDate}', '${currentDate}');
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
        response.status(400).json({
            error: true, message: err.message
        });
    }
}

// TO DO: DONE and TESTED!
export const getRecognisables = async (request: Request, response: Response) => {
    const { authorization } = request.headers;

    try {
        const { id } = await getIdFromIdToken(authorization!);

        const queryString = `SELECT * FROM histories WHERE id_user = ${id} ORDER BY timestamp;`;
        const results: any = await pool.query(queryString);

        if (results) {
            response.status(200).json({ 
                error: false, 
                message: "Saved recognisables fetched successfully",
                recognisables: [
                    ...results.rows.map((data: { id: number; timestamp: string | Date; label: string; confidence_percent: number; }) => {
                        return {
                            id: data.id,
                            savedAt: convertToUnixTimestamp(data.timestamp),
                            label: data.label,
                            confidencePercent: data.confidence_percent
                        }
                    })
                ]
            });
        } else {
            response.status(400).json({ error: true, message: "Get Recognisables not successful" });
        }
    }
    catch (err: any) {
        response.status(400).json({
            error: true, message: err.message
        });
    }
}

// TO DO: DONE and TESTED!
export const postRecognisables = async (request:Request, response:Response) => {
    const { authorization } = request.headers;
    const reqBody = request.body;
    const label:string = reqBody.label;
    const confidencePercent:number = parseInt(reqBody.confidencePercent);

    try {
        const { id } = await getIdFromIdToken(authorization!);
        const currentDate = new Date().toISOString();

        const queryString = `
            INSERT INTO histories (id_user, label, timestamp, confidence_percent)
            VALUES (${id}, '${label}', '${currentDate}', ${confidencePercent}) RETURNING id;
            SELECT id FROM histories WHERE id_user = ${id} AND timestamp = '${currentDate}';
        `;
        console.log(queryString);
        const results: any = await pool.query(queryString);
        if (results[0].rows[0].id === results[1].rows[0].id) {
            response.status(200).json({ error: false, message: "Success", recognisableId: results[0].rows[0].id });
        } else {
            response.status(400).json({ error: true, message: "Save Recognisables not successful" });
        }
    }
    catch (err: any) {
        response.status(400).json({
            error: true, message: err.message
        });
    }
}