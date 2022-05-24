const pool = require('../pool');
const getUid = require('../firebase-auth/getUid');

const getCampaign = (request, response) => {
    const categoryId = request.query.categoryId || null;
    const keyword = request.query.q || '';
    // console.log(categoryId, keyword);
    try {
        const queryString = `
            SELECT * FROM campaigns
            LEFT JOIN ( SELECT id_campaign, array_agg(id_category) as categories FROM category_campaign GROUP BY id_campaign) AS a
            ON campaigns.id = a.id_campaign
            LEFT JOIN ( SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
            ON campaigns.id = b.id_campaign
            ${`WHERE (LOWER(title) LIKE '%${keyword}%'`})
            ORDER BY id;
        `;
        // Fitur filter by categoryId pending, menunggu data category masuk ke DB.
        // console.log(queryString);
        pool.query(queryString, (error, results) => {
            // console.log(results);
            response.status(200).json({
                error: false,
                message: "Campaigns fetched successfully",
                currentDate: new Date(),
                campaigns: results.rows.map(data => ({
                    id: data.id,
                    posterUrl: data.poster_url,
                    title: data.title,
                    description: data.description,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    category: data.categories || [],
                    participantsCount: data.participant_count || 0,
                    isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                    isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7
                }))
            });
            if (error) throw error;
        })
    }
    catch(error) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

const getDashboard = (request, response) => {
    try {
        response.status(200).json({
            error: false,
            message: "Dashboard fetched successfully",
            tasks: [],
            completedCampaigns: []
        });
    }
    catch (err) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

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
        });
    }
    catch(error) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

const getCampaignDetail = (request, response) => {
    const id = parseInt(request.params.id);
    try {
        const queryString = `
            SELECT * FROM campaigns
            LEFT JOIN ( SELECT id_campaign, array_agg(id_category) as categories FROM category_campaign GROUP BY id_campaign) AS a
            ON campaigns.id = a.id_campaign
            LEFT JOIN ( SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
            ON campaigns.id = b.id_campaign
            LEFT JOIN ( SELECT id_campaign, array_agg(json_build_object('id', id, 'name', name)) as tasks FROM tasks GROUP BY id_campaign) AS c
            ON campaigns.id = c.id_campaign
            WHERE id = ${id};
        `;
        pool.query(queryString, (error, results) => {
            response.status(200).json({
                error: false,
                message: "Categories fetched successfully",
                ...results.rows.map(data => ({
                    id: data.id,
                    participantsCount: data.participant_count || 0,
                    category: data.categories || [],
                    title: data.title,
                    posterUrl: data.poster_url,
                    isTrending: !data.participant_count ? false : data.participant_count > 1000 ? true : false,
                    isNew: Math.round((new Date().getTime() - data.start_date.getTime())/(1000*60*60*24)) <= 7,
                    initiator: data.initiator,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    description: data.description,
                    joined: false,  // belum diganti, ini joined apa ya mksdnya?
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

const getContributions = (request, response) => {
    const id = parseInt(request.params.id);
    try {
        const queryString = `
            SELECT * FROM users 
            LEFT JOIN ( 
                SELECT id_user, array_agg(json_build_object('idCategory', id_category, 'userXp', experience_point)) as experience FROM user_experience_points GROUP BY id_user
            ) AS a
            ON users.id = a.id_user
            WHERE id = '${id}';
        `;
        pool.query(queryString, (error, results) => {
            response.status(200).json({
                error: false,
                message: "Profile fetched successfully",
                ...results.rows.map(data => ({
                    name: data.name,
                    email: data.email,
                    profilePicUrl: data.profile_picture_url,
                    experience: data.experience || [],
                    completedCampaigns: [] //edit soon
                }))[0]
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

const postProof = async (request, response) => {
    const { taskId, photo, caption } = request.body;
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