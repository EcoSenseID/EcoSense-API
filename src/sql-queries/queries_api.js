const pool = require('../pool');
const getUid = require('../firebase-auth/getUid');
const getIdFromUid = require('../helpers/get-id-from-uid');
const { sendUploadToGCSFunc } = require('../helpers/google-cloud-storage');

// TODO: DONE!
const getCampaign = async (request, response) => {
    const categoryId = parseInt(request.query.categoryId) || null;
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
        pool.query(queryString, (error, results) => {
            // console.log(results[0].rows);
            const categoriesList = results[0].rows.map(data => ({
                id: data.id, name: data.name
            }))
            let campaignsList = [];
            if (categoryId) {
                campaignsList = results[1].rows.filter(data => (data.category || []).includes(categoryId));
            } else {
                campaignsList = results[1].rows;
            }
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
                // campaigns: results.rows
            });
            // if (error) throw error;
        })
    }
    catch(error) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: Activate getIdFromUid and change completedCampaignList from dummy data to database
const getDashboard = async (request, response) => {
    const { authorization } = request.headers;

    try {
        const uid = await getUid(authorization);
        // const id = await getIdFromUid(uid);
        const id = 1;

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
        pool.query(queryString, (error, results) => {
            // if (error) throw error;
            const categoriesList = results[0].rows.map(data => ({
                id: data.id, name: data.name
            }))
            const campaignList = results[1].rows.map(data => ({
                id: data.id,
                posterUrl: data.poster_url,
                title: data.title,
                endDate: data.end_date,
                category: (data.category || []).map((data, idx) => (
                    categoriesList.filter(category => category.id === data)[0].name
                )),
                participantsCount: data.participant_count || 0,
                isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
            }));
            const taskList = results[3].rows;
            const completedTaskList = results[4].rows.map(data => (data.id_task));
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
                    completed_timestamp: "2022-06-08T06:34:18.598Z"
                },
                {
                    id_campaign: 1,
                    id_user: 1,
                    is_completed: false,
                    joined_timestamp: "2022-05-08T06:34:18.598Z",
                    completed_timestamp: "2022-06-08T06:34:18.598Z"
                },
            ]
            response.status(200).json({
                error: false,
                message: "Dashboard fetched successfully",
                tasks: [
                    ...completedCampaignsList.filter(data => data.is_completed == false).map(data => ({
                        id: 1,
                        campaignId: data.id_campaign,
                        name: taskList.filter(task => task.id_campaign == data.id_campaign).filter(task => {
                            if (completedTaskList.includes(task.id)) return false;
                            return true;
                        })[0].name,
                        campaignName: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].title,
                        campaignEndDate: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].endDate,
                        tasksLeft: taskList.filter(task => task.id_campaign == data.id_campaign).filter(task => {
                            if (completedTaskList.includes(task.id)) return false;
                            return true;
                        }).length,
                        completed: false
                    })),
                ],
                completedCampaigns: [
                    ...completedCampaignsList.filter(data => data.is_completed == true).map(data => ({
                        id: data.id_campaign,
                        posterUrl: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].posterUrl,
                        title: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].title,
                        endDate: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].endDate,
                        category: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].category,
                        participantsCount: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].participantsCount,
                        isTrending: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].isTrending,
                        isNew: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].isNew
                    }))
                ]
            });
        });
    }
    catch (err) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: DONE!
const getAllCategories = (request, response) => {
    try {
        const queryString = `SELECT * FROM categories ORDER BY id;`;
        pool.query(queryString, (error, results) => {
            response.status(200).json({
                error: false,
                message: "Categories fetched successfully",
                categories: results.rows.map(data => ({
                    id: data.id, photoUrl: data.photo_url, name: data.name, colorHex: data.color_hex
                }))
            });
            if (error) throw error;
        });
    }
    catch(error) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: Activate getIdFromUid and change completedCampaignList from dummy data to database
const getCampaignDetail = async (request, response) => {
    const { authorization } = request.headers;
    const campaignId = parseInt(request.query.id);

    if (!campaignId) {
        response.status(400).json({ error: true, message: "No campaign id!" });
        return;
    }
    try {
        const uid = await getUid(authorization);
        // const id = await getIdFromUid(uid);
        const id = 1;

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
        pool.query(queryString, (error, results) => {
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
                ...results[0].rows.map(data => ({
                    participantsCount: data.participant_count || 0,
                    category: (data.category || []).map((data, idx) => (
                        categoriesList.filter(category => category.id === data)[0].name
                    )),
                    title: data.title,
                    posterUrl: data.poster_url,
                    isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                    isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7,
                    initiator: data.initiator,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    description: data.description,
                    joined: joinedList.includes(campaignId),
                    tasks: data.tasks
                }))[0]
            });
        });
    }
    catch(error) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// Activate getIdFromUid and change completedCampaignList from dummy data to database
const getContributions = async (request, response) => {
    const { authorization } = request.headers;

    try {
        const uid = await getUid(authorization);
        // const id = await getIdFromUid(uid);
        const id = 1;

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
        pool.query(queryString, (error, results) => {
            const categoriesList = results[0].rows.map(data => ({
                id: data.id, name: data.name
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
                    completed_timestamp: "2022-06-08T06:34:18.598Z"
                },
                {
                    id_campaign: 1,
                    id_user: 1,
                    is_completed: false,
                    joined_timestamp: "2022-05-08T06:34:18.598Z",
                    completed_timestamp: "2022-06-08T06:34:18.598Z"
                },
            ]
            const campaignList = results[1].rows.map(data => ({
                id: data.id,
                posterUrl: data.poster_url,
                title: data.title,
                endDate: data.end_date,
                category: (data.category || []).map((data, idx) => (
                    categoriesList.filter(category => category.id === data)[0].name
                )),
                participantsCount: data.participant_count || 0,
                isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
            }));
            const experiencePoints = results[3].rows.map(data => ({
                categoryName: categoriesList.filter(category => category.id === data.id_category)[0].name,
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
                        posterUrl: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].posterUrl,
                        title: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].title,
                        endDate: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].endDate,
                        category: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].category,
                        participantsCount: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].participantsCount,
                        isTrending: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].isTrending,
                        isNew: campaignList.filter(campaign => campaign.id == data.id_campaign)[0].isNew
                    }))
                ]
            });
            if (error) throw error;
        });
    }
    catch(error) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: DONE!
const postProof = async (request, response) => {
    // console.log(request.body);
    const rawData = request.body;
    const { authorization } = request.headers;
    const taskId = parseInt(rawData.taskId);
    const photo = request.file;

    try {
        const uid = await getUid(authorization);
        // const id = await getIdFromUid(uid);
        const id = 2;

        if (!taskId) {
            response.status(400).json({ error: true, message: "No task ID given" });
            return;
        }

        // Check if the task requires proof or not
        const queryString1 = `SELECT require_proof FROM tasks WHERE id = ${taskId};`;
        let require_proof = true;
        pool.query(queryString1, (error, results) => {
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
                throw result.error.errorDetail
            } else {
                photoGCSURL = result.gcsUrl
            }
        } else {
            photoGCSURL = null;
        }

        const currentDate = new Date().toISOString();
        // Insert to Database
        const queryString2 = `
            INSERT INTO completed_tasks (id_task, id_user, photo_url, timestamp) VALUES (${taskId}, ${id}, '${photoGCSURL}', '${currentDate}') RETURNING photo_url;
            SELECT * FROM completed_tasks WHERE photo_url = '${photoGCSURL}';
        `;
        // console.log(queryString2);
        pool.query(queryString2, (error, results) => {
            // console.log(results);
            if (results[1].rows.length !== 0) {
                response.status(200).json({
                    error: false,
                    message: "Success",
                    data: results.rows
                });
            } else {
                response.status(400).json({
                    error: true,
                    message: "Input to DB not successful"
                });
            }
        });
    }
    catch (err) {
        response.status(err.code || 400).json({
            error: true, message: err.message
        });
    }
}

const postCompleteCampaign = async (request, response) => {
    const { campaignId } = request.body;
    const { authorization } = request.headers;
    const uid = await getUid(authorization);

    try {
        response.status(200).json({
            error: false,
            message: "Success",
            uid: uid
        });
    }
    catch (err) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

const joinCampaign = async (request, response) => {
    const { campaignId } = request.body;
    const { authorization } = request.headers;
    const uid = await getUid(authorization);

    try {
        response.status(200).json({
            error: false,
            message: "Success",
            uid: uid
        });
    }
    catch (err) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

module.exports = {
    getCampaign,
    getDashboard,
    getAllCategories,
    getCampaignDetail,
    getContributions,
    postProof,
    postCompleteCampaign,
    joinCampaign
}