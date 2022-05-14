const pool = require('./pool');

const getAllCompletedTasks = (request, response) => {
    pool.query('SELECT * FROM completed_tasks ORDER BY id_task, id_user ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                completed_tasks: results.rows
            }
        });
    })
};

const getCompletedTaskByTaskId = (request, response) => {
    const id_task = parseInt(request.params.id_task);
  
    pool.query('SELECT * FROM completed_tasks WHERE id_task = $1', [id_task], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                completed_task: results.rows
            }
        });
    })
};

const getCompletedTaskByUserId = (request, response) => {
    const id_user = parseInt(request.params.id_user);
  
    pool.query('SELECT * FROM completed_tasks WHERE id_user = $1', [id_user], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            command: results.command,
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                completed_task: results.rows
            }
        });
    })
};

const createNewCompletedTask = (request, response) => {
    const { id_task, id_user, photo_url, timestamp } = request.body
  
    pool.query('INSERT INTO completed_tasks (id_task, id_user, photo_url, timestamp) VALUES ($1, $2, $3, $4)', 
        [id_task, id_user, photo_url, timestamp], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`New Completed Task entry added.`);
    });
};

const updateCompletedTask = (request, response) => {
    const id_user = parseInt(request.params.id_user);
    const id_task = parseInt(request.params.id_task);
    const { photo_url, timestamp } = request.body;
  
    pool.query('UPDATE completed_tasks SET photo_url = $1, timestamp = $2 WHERE id_user = $3 AND id_task = $4', [photo_url, timestamp, id_user, id_task], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`Completed Task modified with User ID: ${id_user} and Task ID: ${id_task}`);
      }
    )
};

const deleteCompletedTask = (request, response) => {
    const id_user = parseInt(request.params.id_user);
    const id_task = parseInt(request.params.id_task);
  
    pool.query('DELETE FROM completed_tasks WHERE id_user = $1 AND id_task = $2', [id_user, id_task], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`Completed Task deleted with User ID: ${id_user} and Task ID: ${id_task}`);
    })
};

module.exports = {
    getAllCompletedTasks,
    getCompletedTaskByTaskId,
    getCompletedTaskByUserId,
    createNewCompletedTask,
    updateCompletedTask,
    deleteCompletedTask
};