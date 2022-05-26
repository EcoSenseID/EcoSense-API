const pool = require('../pool');

const getAllCampaignParticipant = (request, response) => {
    pool.query('SELECT * FROM campaign_participant ORDER BY id_campaign, id_user ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                campaign_participant: results.rows
            }
        });
    })
};

const getUserListByCampaignId = (request, response) => {
    const id_campaign = parseInt(request.params.id_campaign);
  
    pool.query('SELECT * FROM campaign_participant WHERE id_campaign = $1', [id_campaign], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                campaign_participant: results.rows
            }
        });
    })
};

const getCampaignListByUserId = (request, response) => {
    const id_user = parseInt(request.params.id_user);
  
    pool.query('SELECT * FROM campaign_participant WHERE id_user = $1', [id_user], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                campaign_participant: results.rows
            }
        });
    })
};

const createNewCampaignParticipantDetails = (request, response) => {
    const { id_campaign, id_user, is_completed, joined_timestamp, completed_timestamp } = request.body
  
    pool.query('INSERT INTO campaign_participant (id_campaign, id_user, is_completed, joined_timestamp, completed_timestamp) VALUES ($1, $2, $3, $4, $5)', 
        [id_campaign, id_user, is_completed, joined_timestamp, completed_timestamp], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`New Campaign Participant entry added.`);
    });
};

const updateCampaignParticipantDetails = (request, response) => {
    const id_user = parseInt(request.params.id_user);
    const id_campaign = parseInt(request.params.id_campaign);
    const { is_completed, joined_timestamp, completed_timestamp } = request.body;
  
    pool.query('UPDATE campaign_participant SET is_completed = $1, joined_timestamp = $2, completed_timestamp = $3 WHERE id_user = $4 AND id_campaign = $5', [is_completed, joined_timestamp, completed_timestamp, id_user, id_campaign], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`Campaign Participant entry modified with User ID: ${id_user} and Campaign ID: ${id_campaign}`);
      }
    )
};

const deleteCampaignParticipantDetails = (request, response) => {
    const id_user = parseInt(request.params.id_user);
    const id_campaign = parseInt(request.params.id_campaign);
  
    pool.query('DELETE FROM campaign_participant WHERE id_user = $1 AND id_campaign = $2', [id_user, id_campaign], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`CampaignCategory deleted with User ID: ${id_user} and Campaign ID: ${id_campaign}`);
    })
};

module.exports = {
    getAllCampaignParticipant,
    getCampaignListByUserId,
    getUserListByCampaignId,
    createNewCampaignParticipantDetails,
    updateCampaignParticipantDetails,
    deleteCampaignParticipantDetails
};