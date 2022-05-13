const pool = require('./pool');

const getAllUserExpPoints = (request, response) => {
    pool.query('SELECT * FROM user_experience_points ORDER BY id_category, id_user ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            data: {
                user_experience_points: results.rows
            }
        });
    })
};

const getUserExpPointByUserId = (request, response) => {
    const id_user = parseInt(request.params.id_user);
  
    pool.query('SELECT * FROM user_experience_points WHERE id_user = $1', [id_user], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            data: {
                user_experience_point: results.rows
            }
        });
    })
};

const getUserExpPointByCategoryId = (request, response) => {
    const id_category = parseInt(request.params.id_category);
  
    pool.query('SELECT * FROM user_experience_points WHERE id_category = $1', [id_category], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            data: {
                user_experience_point: results.rows
            }
        });
    })
};

const createUserExpPoint = (request, response) => {
    const { id_category, id_user, experience_point } = request.body
  
    pool.query('INSERT INTO user_experience_points (id_category, id_user, experience_point) VALUES ($1, $2, $3)', 
        [id_category, id_user, experience_point], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`New User Experience Point entry added.`);
    });
};

const updateUserExpPoint = (request, response) => {
    const id_user = parseInt(request.params.id_user);
    const id_category = parseInt(request.params.id_category);
    const { experience_point } = request.body
  
    pool.query('UPDATE user_experience_points SET experience_point = $1 WHERE id_user = $2 AND id_category = $3', [experience_point, id_user, id_category], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`User Experience Point modified with User ID: ${id_user} and Category ID: ${id_category}`);
      }
    )
};

const deleteUserExpPoint = (request, response) => {
    const id_user = parseInt(request.params.id_user);
    const id_category = parseInt(request.params.id_category);
  
    pool.query('DELETE FROM user_experience_points WHERE id_user = $1 AND id_category = $2', [id_user, id_category], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`Category deleted with User ID: ${id_user} and Category ID: ${id_category}`);
    })
};

module.exports = {
    getAllUserExpPoints,
    getUserExpPointByUserId,
    getUserExpPointByCategoryId,
    createUserExpPoint,
    updateUserExpPoint,
    deleteUserExpPoint
};