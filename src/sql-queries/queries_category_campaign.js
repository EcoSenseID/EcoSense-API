const pool = require('../pool');

const getAllCategoryCampaign = (request, response) => {
    pool.query('SELECT * FROM category_campaign ORDER BY id_category, id_campaign ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                category_campaign: results.rows
            }
        });
    })
};

const getCampaignListByCategoryId = (request, response) => {
    const id_category = parseInt(request.params.id_category);
  
    pool.query('SELECT * FROM category_campaign WHERE id_category = $1', [id_category], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                category_campaign: results.rows
            }
        });
    })
};

const getCategoryListByCampaignId = (request, response) => {
    const id_campaign = parseInt(request.params.id_campaign);
  
    pool.query('SELECT * FROM category_campaign WHERE id_campaign = $1', [id_campaign], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                category_campaign: results.rows
            }
        });
    })
};

const createNewCampaignCategory = (request, response) => {
    const { id_category, id_campaign, earned_experience_point } = request.body
  
    pool.query('INSERT INTO category_campaign (id_category, id_campaign, earned_experience_point) VALUES ($1, $2, $3)', 
        [id_category, id_campaign, earned_experience_point], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`New Category - Campaign entry added.`);
    });
};

const updateCampaignCategory = (request, response) => {
    const id_category = parseInt(request.params.id_category);
    const id_campaign = parseInt(request.params.id_campaign);
    const { earned_experience_point } = request.body;
  
    pool.query('UPDATE category_campaign SET earned_experience_point = $1 WHERE id_category = $2 AND id_campaign = $3', [earned_experience_point, id_category, id_campaign], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`CampaignCategory modified with Category ID: ${id_category} and Campaign ID: ${id_campaign}`);
      }
    )
};

const deleteCampaignCategory = (request, response) => {
    const id_category = parseInt(request.params.id_category);
    const id_campaign = parseInt(request.params.id_campaign);
  
    pool.query('DELETE FROM category_campaign WHERE id_category = $1 AND id_campaign = $2', [id_category, id_campaign], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`CampaignCategory deleted with Category ID: ${id_category} and Campaign ID: ${id_campaign}`);
    })
};

module.exports = {
    getAllCategoryCampaign,
    getCategoryListByCampaignId,
    getCampaignListByCategoryId,
    createNewCampaignCategory,
    updateCampaignCategory,
    deleteCampaignCategory
};