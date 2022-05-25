const pool = require('../pool');
const getUid = require('../firebase-auth/getUid');
const getIdFromUid = require('../helpers/get-id-from-uid');

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
            if (error) throw error;
        })
    }
    catch(error) {
        response.status(error.code || 400).json({
            error: true, message: error.message
        });
    }
}

// TODO: Not started
const getDashboard = async (request, response) => {
    const { authorization } = request.headers;

    try {
        const uid = await getUid(authorization);
        const id = await getIdFromUid(uid);

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

// TODO: Category should results in name, not id.
const getCampaignDetail = (request, response) => {
    const id = parseInt(request.query.id);

    if (!id) {
        response.status(400).json({ error: true, message: "No campaign id!" });
        return;
    }
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

const getContributions = async (request, response) => {
    const { authorization } = request.headers;

    try {
        const uid = await getUid(authorization);
        // const id = await getIdFromUid(uid);
        const id = 1;

        const queryString = `
            SELECT * FROM users 
            LEFT JOIN ( 
                SELECT id_user, array_agg(json_build_object('idCategory', id_category, 'userXp', experience_point)) as experience FROM user_experience_points GROUP BY id_user
            ) AS a
            ON users.id = a.id_user
            WHERE id = ${id};
        `;
        pool.query(queryString, (error, results) => {
            response.status(200).json({
                error: false,
                message: "Contributions fetched successfully (dummy data)",
                // ...results.rows.map(data => ({
                //     name: data.name,
                //     email: data.email,
                //     profilePicUrl: data.profile_picture_url,
                //     experience: data.experience || [],
                //     completedCampaigns: [] //edit soon
                // }))[0]
                experiences: [ //dummyData
                    {
                        "categoryName": "Air Pollution",
                        "level": 7,
                        "currentExperience": 69,
                        "levelExperience": 100
                    },
                    {
                        "categoryName": "Food Waste",
                        "level": 8,
                        "currentExperience": 40,
                        "levelExperience": 100
                    }
                ],
                completedCampaigns: [ //dummyData
                    {
                        "id": 1,
                        "posterUrl": "https://cdn.statically.io/og/food_waste_1.jpg",
                        "title": "No More Food Waste: Hassle-Free Compost",
                        "endDate": "2022-01-08T06:34:18.598Z",
                        "category": ["Air Pollution", "Food Waste"],
                        "participantsCount": 69420,
                        "isTrending": true,
                        "isNew": false
                    }
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