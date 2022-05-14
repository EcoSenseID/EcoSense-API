const pool = require('./pool');

const getCampaigns = (request, response) => {
    pool.query('SELECT * FROM campaigns ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                campaigns: results.rows
            }
        });
    })
};

const getCampaignById = (request, response) => {
    const id = parseInt(request.params.id);
  
    pool.query('SELECT * FROM campaigns WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                campaign: results.rows
            }
        });
    })
};

const createCampaign = (request, response) => {
    const { title, initiator, description, start_date, end_date, poster_url } = request.body
  
    pool.query('INSERT INTO campaigns (title, initiator, description, start_date, end_date, poster_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', 
        [title, initiator, description, start_date, end_date, poster_url], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`Campaign added with ID: ${results.rows[0].id}`);
    });
};

const updateCampaign = (request, response) => {
    const id = parseInt(request.params.id)
    const { title, initiator, description, start_date, end_date, poster_url } = request.body
  
    pool.query('UPDATE campaigns SET title = $1, initiator = $2, description = $3, start_date = $4, end_date = $5, poster_url = $6 WHERE id = $7', [title, initiator, description, start_date, end_date, poster_url, id], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`Campaign modified with ID: ${id}`);
      }
    )
};

const deleteCampaign = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('DELETE FROM campaigns WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`Campaign deleted with ID: ${id}`);
    })
};

module.exports = {
    getCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
};