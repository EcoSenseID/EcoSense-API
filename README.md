# EcoSense App API
[![issues](https://img.shields.io/github/issues/EcoSenseID/EcoSense-API)](https://github.com/EcoSenseID/EcoSense-API/issues)
[![language](https://img.shields.io/github/languages/count/EcoSenseID/EcoSense-API)](https://github.com/EcoSenseID/EcoSense-API/search?l=typescript)
[![top-language](https://img.shields.io/github/languages/top/EcoSenseID/EcoSense-API)](https://github.com/EcoSenseID/EcoSense-API/search?l=typescript)
[![commit](https://img.shields.io/github/commit-activity/m/EcoSenseID/EcoSense-API)](https://github.com/EcoSenseID/EcoSense-API/commits/main)
[![last-commit](https://img.shields.io/github/last-commit/EcoSenseID/EcoSense-API)](https://github.com/EcoSenseID/EcoSense-API/commits/main)

## Introduction
A RESTful API built with ExpressJS and TypeScript for CRUD operation.\
This is the back-end for EcoSense capstone project, which is included in the Bangkit Academy 2022 program.

## Technologies
[![JavaScript](https://img.shields.io/badge/-JavaScript-black?style=for-the-badge&logo=javascript)](https://github.com/EcoSenseID?tab=repositories&language=javascript)
[![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white)](https://github.com/EcoSenseID?tab=repositories)
[![NodeJS](https://img.shields.io/badge/node.js-black?style=for-the-badge&logo=node.js&logoColor=6DA55F)](https://github.com/EcoSenseID?tab=repositories)
[![ExpressJS](https://img.shields.io/badge/express.js-black?style=for-the-badge&logo=express&logoColor=purple)](https://github.com/EcoSenseID?tab=repositories)
[![TypeScript](https://img.shields.io/badge/typescript-black?style=for-the-badge&logo=typescript&logoColor=%23007ACC)](https://github.com/EcoSenseID?tab=repositories&language=typescript)
[![Postgres](https://img.shields.io/badge/postgres-black.svg?style=for-the-badge&logo=postgresql&logoColor=%23316192)](https://github.com/EcoSenseID?tab=repositories)
[![Google Cloud](https://img.shields.io/badge/GoogleCloud-black.svg?style=for-the-badge&logo=google-cloud&logoColor=%234285F4)](https://github.com/EcoSenseID?tab=repositories)

## Dependencies
### Production
[![@google-cloud/secret-manager](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/@google-cloud/secret-manager)](https://www.npmjs.com/package/@google-cloud/secret-manager)
[![@google-cloud/storage](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/@google-cloud/storage)](https://www.npmjs.com/package/@google-cloud/storage)
[![cors](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/cors)](https://www.npmjs.com/package/cors)
[![dotenv](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/dotenv)](https://www.npmjs.com/package/dotenv)
[![express](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/express)](https://www.npmjs.com/package/express)
[![firebase-admin](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/firebase-admin)](https://www.npmjs.com/package/firebase-admin)
[![multer](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/multer)](https://www.npmjs.com/package/multer)
[![pg](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/pg)](https://www.npmjs.com/package/pg)

### Development
[![jest](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/dev/jest)](https://www.npmjs.com/package/jest)
[![supertest](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/dev/supertest)](https://www.npmjs.com/package/supertest)
[![concurrently](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/dev/concurrently)](https://www.npmjs.com/package/concurrently)
[![typescript](https://img.shields.io/github/package-json/dependency-version/EcoSenseID/EcoSense-API/dev/typescript)](https://www.npmjs.com/package/typescript)


[Go to List of Dependencies](https://github.com/EcoSenseID/EcoSense-API/network/dependencies)

## Endpoints for Android
- [x] `GET` `/campaigns`
  - [x] `GET` `/campaigns?q={<string>}`
  - [x] `GET` `/campaigns?categoryId={<int>}`
  - [x] `GET` `/campaigns?q={<string>}&categoryId={<int>}`
- [x] `GET` `/dashboard`
- [x] `GET` `/categories/?campaignId={<int>}`
- [x] `GET` `/detail`
- [x] `GET` `/contributions`
- [x] `POST` `/proof`
- [x] `POST` `/completecampaign`
- [x] `POST` `/joincampaign`
- [x] `GET` `/savedrecognisables`
- [x] `POST` `/saverecognisable`

## Endpoints for Web
- [x] `GET` `/trendingCampaigns`
- [x] `POST` `/loginToWeb` &#8594; call only when login with Google or sign up with Email & Password
- [x] `POST` `/addNewCampaign`
- [x] `PUT` `/editCampaign`
- [x] `DEL` `/deleteCampaign?campaignId={<int>}`
- [x] `GET` `/myCampaigns`
- [x] `GET` `/campaignParticipants?campaignId={<int>}`

## Try the API
To get the most trending campaigns, you can try to access [this link](https://ecosense-bangkit.uc.r.appspot.com/trendingCampaigns).

## Google Cloud Platform Infrastructure
- Cloud Source Repositories `ecosense-restapi:main`
- Cloud Build (Latest: `311c0172`)
- Cloud Build Trigger `ecosense-restapi`
- Google App Engine 
  - Service `default`
  - Latest Version `36` `20220702t173214` (July 03, 2022 00:32:14 GMT+7)
- Google Cloud Storage 
  - Bucket for Campaign Posters `ecosense-campaign-posters`
  - Bucket for Task Completion Proof `ecosense-task-proofs`

```mermaid
graph LR;
    A([Push to CSR])-->B([Cloud Build Trigger]);
    B([Cloud Build Trigger])-->C([Run Cloud Build]);
    C([Run Cloud Build])-->D([Google App Engine]);
```

## 
&#169; EcoSense 2022.