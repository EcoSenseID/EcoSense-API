const db_users = require('./queries_users');
const express = require('express');
const bodyParser = require('body-parser');

// Initializing express
const app = express()
const port = 3000

// Middlewares
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Sample method
app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
});

// Methods for users
app.get('/users', db_users.getUsers)
app.get('/users/:id', db_users.getUserById)
app.post('/users', db_users.createUser)
app.put('/users/:id', db_users.updateUser)
app.delete('/users/:id', db_users.deleteUser)

// Server listening for requests
app.listen(port, () => {
    console.log(`App running on port ${port}.`)
});