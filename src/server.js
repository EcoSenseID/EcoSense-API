const db_users = require('./queries_users');
const db_campaigns = require('./queries_campaigns');
const db_tasks = require('./queries_tasks');
const { PORT } = require('./env_config');

const express = require('express');
const bodyParser = require('body-parser');

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

// Server listening for requests
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}.`);
});