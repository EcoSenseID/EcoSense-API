import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Multer from 'multer';

import * as db_api from './sql-queries/q_mdapi.js';
import * as db_webapi from './sql-queries/q_webapi.js';

// import * as gcsMiddlewares from './middlewares/google-cloud-storage';
import {isAuthenticatedMobile, isAuthenticatedWeb} from './middlewares/auth-middleware.js';

// env
import { PORT } from './env_config.js';

// Initializing express
const app: Express = express();

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
    'https://ecosense.vercel.app',
    'https://ecosense-web-of7z476jgq-as.a.run.app',
  ],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
  preflightContinue: true
}
app.use(cors(corsOptions));

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum file size is 5MB
  },
});

// Sample method
app.get('/', (request: Request, response: Response) => {
    response.status(200).json({ 
      status: 'success',
      info: 'Welcome to EcoSense API! This API is built using Typescript, Node.js, Express and Postgres API.' 
    });
});

// favicon.ico
app.get('/favicon.ico', (req: Request, res: Response) => res.status(204).end());

// Endpoints based on API requirements
app.get('/campaign', isAuthenticatedMobile, db_api.getCampaign);
app.get('/dashboard', isAuthenticatedMobile, db_api.getDashboard);
app.get('/categories', isAuthenticatedMobile, db_api.getAllCategories);
app.get('/detail', isAuthenticatedMobile, db_api.getCampaignDetail);
app.get('/contributions', isAuthenticatedMobile, db_api.getContributions);
app.post('/proof', isAuthenticatedMobile, multer.single('photo'), db_api.postProof);
app.post('/completecampaign', isAuthenticatedMobile, db_api.postCompleteCampaign);
app.post('/joincampaign', isAuthenticatedMobile, db_api.joinCampaign);
app.get('/savedrecognisables', isAuthenticatedMobile, db_api.getRecognisables);
app.post('/saverecognisable', isAuthenticatedMobile, db_api.postRecognisables);

// Endpoints for Ecosense Web
// app.post('/uploadgcs', isAuthenticated, multer.single('image'), gcsMiddlewares.sendUploadToGCS, db_webapi.uploadFileToGCS);
app.get('/trendingCampaigns', db_webapi.getTrendingCampaigns);
app.get('/allCategories', isAuthenticatedWeb, db_webapi.getAllCategories);
app.post('/loginToWeb', isAuthenticatedWeb, db_webapi.loginToWeb);
app.post('/addNewCampaign', isAuthenticatedWeb, multer.single('uploadPoster'), db_webapi.addNewCampaign);
app.put('/editCampaign', isAuthenticatedWeb, multer.single('uploadPoster'), db_webapi.editCampaign);
app.delete('/deleteCampaign', isAuthenticatedWeb, db_webapi.deleteCampaign);
app.get('/myCampaigns', isAuthenticatedWeb, db_webapi.getMyCampaigns);
app.get('/campaignParticipants', isAuthenticatedWeb, db_webapi.getCampaignParticipant);

// Server listening for requests
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}.`);
});