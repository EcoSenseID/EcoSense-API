const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Multer = require('multer');

const db_api = require('./sql-queries/q_mdapi');
const db_webapi = require('./sql-queries/q_webapi');

const gcsMiddlewares = require('./middlewares/google-cloud-storage');
const isAuthenticated = require('./middlewares/auth-middleware');

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

const corsOptions = {
  origin: [
    // 'https://ecosense-web.herokuapp.com', 
    'http://localhost:3000', 
    'https://ecosense.vercel.app'
  ],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum file size is 5MB
  },
});

// Sample method
app.get('/', (request, response) => {
    response.status(200).json({ 
      status: 'success',
      info: 'Welcome to EcoSense API! This API is built using Node.js, Express and Postgres API.' 
    });
});

// favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Endpoints based on API requirements
app.get('/campaign', isAuthenticated, db_api.getCampaign);
app.get('/dashboard', isAuthenticated, db_api.getDashboard);
app.get('/categories', isAuthenticated, db_api.getAllCategories);
app.get('/detail', isAuthenticated, db_api.getCampaignDetail);
app.get('/contributions', isAuthenticated, db_api.getContributions);
app.post('/proof', isAuthenticated, multer.single('photo'), db_api.postProof);
app.post('/completecampaign', isAuthenticated, db_api.postCompleteCampaign);
app.post('/joincampaign', isAuthenticated, db_api.joinCampaign);

// Endpoints for Ecosense Web
// app.post('/uploadgcs', isAuthenticated, multer.single('image'), gcsMiddlewares.sendUploadToGCS, db_webapi.uploadFileToGCS);
app.get('/trendingCampaigns', db_webapi.getTrendingCampaigns);
app.post('/loginToWeb', isAuthenticated, db_webapi.loginToWeb);
app.post('/addNewCampaign', isAuthenticated, multer.single('uploadPoster'), db_webapi.addNewCampaign);
app.get('/myCampaigns', isAuthenticated, db_webapi.getMyCampaigns);

// Server listening for requests
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}.`);
});