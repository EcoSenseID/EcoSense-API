const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecosense-db-sql',
  password: '12345678',
  port: 5432,
});

const getCampaigns = (request, response) => {
    pool.query('SELECT * FROM campaigns ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
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
            data: {
                campaigns: results.rows
            }
        });
    })
};

const createCampaign = (request, response) => {
    const { name, email, profile_picture_url } = request.body
  
    pool.query('INSERT INTO campaigns (name, email, profile_picture_url) VALUES ($1, $2, $3) RETURNING id', [name, email, profile_picture_url], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`User added with ID: ${results.rows[0].id}`);
    });
};

const updateCampaign = (request, response) => {
    const id = parseInt(request.params.id)
    const { name, email, profile_picture_url } = request.body
  
    pool.query('UPDATE campaigns SET name = $1, email = $2, profile_picture_url = $3 WHERE id = $4', [name, email, profile_picture_url, id], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`User modified with ID: ${id}`);
      }
    )
};

const deleteCampaign = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('DELETE FROM campaigns WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`User deleted with ID: ${id}`);
    })
};

module.exports = {
    getCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
};