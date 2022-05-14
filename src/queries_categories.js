const pool = require('./pool');

const getCategories = (request, response) => {
    pool.query('SELECT * FROM categories ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                categories: results.rows
            }
        });
    })
};

const getCategoryById = (request, response) => {
    const id = parseInt(request.params.id);
  
    pool.query('SELECT * FROM categories WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json({
            status: 'success',
            rowProcessed: results.rowCount,
            rowCount: results.rows.length,
            data: {
                category: results.rows
            }
        });
    })
};

const createCategory = (request, response) => {
    const { name, photo_url, color_hex } = request.body
  
    pool.query('INSERT INTO categories (name, photo_url, color_hex) VALUES ($1, $2, $3) RETURNING id', 
        [name, photo_url, color_hex], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`Category added with ID: ${results.rows[0].id}`);
    });
};

const updateCategory = (request, response) => {
    const id = parseInt(request.params.id)
    const { name, photo_url, color_hex } = request.body
  
    pool.query('UPDATE categories SET name = $1, photo_url = $2, color_hex = $3 WHERE id = $4', [name, photo_url, color_hex, id], (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).send(`Category modified with ID: ${id}`);
      }
    )
};

const deleteCategory = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('DELETE FROM categories WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`Category deleted with ID: ${id}`);
    })
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};