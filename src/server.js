const express = require('express');
const bodyParser = require('body-parser');

const db_users = require('./queries_users');
const db_campaigns = require('./queries_campaigns');
const db_tasks = require('./queries_tasks');
const db_categories = require('./queries_categories');
const db_user_exp_points = require('./queries_user_xp_points');

// env
const { PORT } = require('./env_config');

// Initializing express
const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Sample method
app.get('/', (request, response) => {
    response.json({ info: 'Welcome to EcoSense API! This API is built using Node.js, Express and Postgres API.' })
});

// Methods for users
app.get('/users', db_users.getUsers);
app.get('/users/:id', db_users.getUserById);
app.post('/users', db_users.createUser);
app.put('/users/:id', db_users.updateUser);
app.delete('/users/:id', db_users.deleteUser);

// Methods for campaigns
app.get('/campaigns', db_campaigns.getCampaigns);
app.get('/campaigns/:id', db_campaigns.getCampaignById);
app.post('/campaigns', db_campaigns.createCampaign);
app.put('/campaigns/:id', db_campaigns.updateCampaign);
app.delete('/campaigns/:id', db_campaigns.deleteCampaign);

// Methods for tasks
app.get('/tasks', db_tasks.getTasks);
app.get('/tasks/:id', db_tasks.getTaskById);
app.post('/tasks', db_tasks.createTask);
app.put('/tasks/:id', db_tasks.updateTask);
app.delete('/tasks/:id', db_tasks.deleteTask);

// Methods for categories
app.get('/categories', db_categories.getCategories);
app.get('/categories/:id', db_categories.getCategoryById);
app.post('/categories', db_categories.createCategory);
app.put('/categories/:id', db_categories.updateCategory);
app.delete('/categories/:id', db_categories.deleteCategory);

// Methods for user experience points
app.get('/user_exp_points', db_user_exp_points.getAllUserExpPoints);
app.get('/user_exp_points/user/:id_user', db_user_exp_points.getUserExpPointByUserId);
app.get('/user_exp_points/category/:id_category', db_user_exp_points.getUserExpPointByCategoryId);
app.post('/user_exp_points', db_user_exp_points.createUserExpPoint);
app.put('/user_exp_points/:id_user/:id_category', db_user_exp_points.updateUserExpPoint);
app.delete('/user_exp_points/:id_user/:id_category', db_user_exp_points.deleteUserExpPoint);

// Server listening for requests
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}.`);
});