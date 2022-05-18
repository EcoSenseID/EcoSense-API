const pool = require('../pool');

const getTasks = (request, response) => {
    pool.query('SELECT * FROM tasks ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                tasks: results.rows
            }
        });
    })
};

const getTaskById = (request, response) => {
    const id = parseInt(request.params.id);
  
    pool.query('SELECT * FROM tasks WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                task: results.rows
            }
        });
    })
};

const createTask = (request, response) => {
    const { id_campaign, order_number, name, require_proof } = request.body
  
    pool.query('INSERT INTO tasks (id_campaign, order_number, name, require_proof) VALUES ($1, $2, $3, $4) RETURNING id', 
        [id_campaign, order_number, name, require_proof], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`Task added with ID: ${results.rows[0].id}`);
    });
};

const updateTask = (request, response) => {
    const id = parseInt(request.params.id)
    const { id_campaign, order_number, name, require_proof } = request.body
  
    pool.query('UPDATE tasks SET id_campaign = $1, order_number = $2, name = $3, require_proof = $4 WHERE id = $5', [id_campaign, order_number, name, require_proof, id], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`Task modified with ID: ${id}`);
      }
    )
};

const deleteTask = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('DELETE FROM tasks WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`Task deleted with ID: ${id}`);
    })
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
};