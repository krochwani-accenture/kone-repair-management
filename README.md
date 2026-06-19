# Kone Repair Offering & Pricing Management Tool

A consolidated documentation file for the Kone Repair Management project.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Backend API Reference](#backend-api-reference)
- [Deployment Options](#deployment-options)
  - [AWS SAM](#aws-sam)
  - [AWS Amplify](#aws-amplify)
  - [AWS EC2 (Legacy)](#aws-ec2-legacy)
- [Excel File Format](#excel-file-format)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)
- [Removed duplicate docs](#removed-duplicate-docs)
- [License](#license)

## Overview

This repository contains a full-stack application for uploading Excel repair pricing data, parsing it, and managing repair records.

- Frontend: Next.js + Material UI
- Backend: Express.js + Excel parsing + optional S3 upload URL generation
- Deployment support: AWS SAM for backend, AWS Amplify for frontend, and a legacy EC2 guide

## Project Structure

```
project/
├── app/                    # Next.js frontend
│   ├── page.tsx            # Main upload page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── backend/                # Express backend
│   ├── server.js           # Main server file
│   ├── auth.js             # JWT login + auth middleware
│   ├── routes/repairs.js   # Repair API routes
│   ├── utils/              # Database and helper utilities
│   ├── package.json        # Backend dependencies
│   └── .env                # Local backend env
├── public/                 # Static assets
├── template.yaml           # AWS SAM deployment template
├── package.json            # Frontend dependencies and scripts
└── README.md               # Consolidated documentation
```

## Prerequisites

- Node.js v16 or higher
- npm or pnpm package manager
- AWS SAM CLI for SAM deployments (optional)
- AWS account for cloud deployment (optional)

## Local Development

### Install dependencies

From the repository root:

```bash
pnpm install
```

From the backend directory:

```bash
cd backend
npm install
```

### Start the backend server

```bash
cd backend
npm run dev
```

Backend URL:

```bash
http://localhost:5000
```

### Start the frontend

From the repository root:

```bash
pnpm dev
```

Frontend URL:

```bash
http://localhost:3000
```

### Recommended local workflow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `pnpm dev`
3. Upload Excel files using the UI
4. Use the backend API for sheet metadata or repair CRUD operations

## Environment Variables

### Frontend

Create a `.env.local` file in the repository root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Optional if the frontend uses a separate repairs API endpoint:
# NEXT_PUBLIC_REPAIRS_API_URL=https://<your-api-endpoint>/api
```

### Backend

Create or update `backend/.env` with:

```bash
PORT=5000
NODE_ENV=development
AWS_REGION=ap-south-2
UPLOAD_BUCKET_NAME=<your-upload-bucket>
JWT_SECRET=your-secret
```

> The backend uses `dotenv` to load `backend/.env` in local development.

## Backend API Reference

### Authentication

#### POST `/api/auth/login`

Authenticate and receive a JWT token.

Request body:

```json
{
  "username": "user",
  "password": "pass"
}
```

Response:

```json
{
  "success": true,
  "token": "<jwt-token>",
  "user": {
    "username": "user",
    "role": "global",
    "regions": []
  }
}
```

### File Upload

#### POST `/api/upload`

Upload an Excel file and parse its contents.

Request:

- Method: `POST`
- Content-Type: `multipart/form-data`
- Field: `file`
- Optional field: `sheetName`

Response example:

```json
{
  "success": true,
  "sheets": { ... },
  "totalRowCount": 10,
  "availableSheets": ["Sheet1"]
}
```

#### POST `/api/upload/info`

Upload a file and return available sheet metadata.

Request:

- Method: `POST`
- Content-Type: `multipart/form-data`
- Field: `file`

Response example:

```json
{
  "success": true,
  "sheets": ["Sheet1"],
  "count": 1
}
```

#### GET `/api/upload/url`

Generate a presigned S3 upload URL.

Headers:

- `Authorization: Bearer <token>`

Query:

- `filename` (required)

Response example:

```json
{
  "success": true,
  "uploadUrl": "https://...",
  "objectKey": "uploads/12345_file.xlsx"
}
```

### Health Check

#### GET `/api/health`

Response:

```json
{
  "status": "Server is running"
}
```

### Repair Records (Authenticated)

All `/api/repairs` endpoints require `Authorization: Bearer <token>`.

#### POST `/api/repairs/save`

Save parsed repair data to the database.

Request body:

```json
{
  "data": [ ... ]
}
```

Response example:

```json
{
  "success": true,
  "message": "Successfully saved repair data",
  "data": {
    "inserted": 5,
    "skipped": 0,
    "total": 5,
    "errors": []
  }
}
```

#### GET `/api/repairs`

Fetch repair records. Region users only get repairs for their permitted regions.

Response example:

```json
{
  "success": true,
  "data": [ ... ],
  "count": 5,
  "message": "Retrieved 5 repairs from database (role: global)"
}
```

#### GET `/api/repairs/count/total`

Get the total repair count.

Response example:

```json
{
  "success": true,
  "data": {
    "total": 5
  }
}
```

#### GET `/api/repairs/:repairId`

Fetch a single repair by its Repair ID.

Response example:

```json
{
  "success": true,
  "data": { ... }
}
```

#### DELETE `/api/repairs/clear`

Delete all repairs (testing only).

Response example:

```json
{
  "success": true,
  "message": "Deleted 5 repairs from database",
  "data": {
    "deleted": 5
  }
}
```

## Deployment Options

### AWS SAM

The backend SAM template is defined in `template.yaml`.

It deploys:

- `RepairsTable` (DynamoDB table)
- `RepairUploadsBucket` (S3 bucket)
- `RepairsFunction`
- `S3UploadUrlFunction`
- `RepairProcessorFunction`

#### SAM build and deploy

```bash
cd backend
npm install
cd ..
sam build
sam deploy --guided
```

#### Notes

- The Lambda source code is packaged from `backend/`.
- Backend dependencies must be installed in `backend/node_modules`.
- After deployment, set `NEXT_PUBLIC_API_URL` in the frontend to the deployed API Gateway endpoint.

### AWS Amplify

To host the frontend on Amplify:

1. Push the repo to GitHub.
2. Create an Amplify app and connect the repository.
3. Use branch `main`.
4. Set build command: `npm run build`.
5. Set start command: `npm start`.
6. Add environment variable:

```bash
NEXT_PUBLIC_API_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/Prod
```

#### Recommended `.amplifyignore`

Ignore the following paths:

```
node_modules
.git
.env.local
.env.*.local
backend/
deploy-ec2.sh
deploy-ec2.ps1
```

### AWS EC2 (Legacy)

There is legacy EC2 deployment guidance in this repository, but for most projects, use AWS Amplify or local development instead.

Basic EC2 deployment steps:

1. Launch an EC2 instance in `ap-south-2`.
2. Install Node.js and Git.
3. Clone the repository.
4. Install dependencies with `pnpm install` and `npm install` in `backend/`.
5. Start the frontend and backend.
6. Open port `3000` in the EC2 security group.

## Excel File Format

The first row of each Excel sheet must contain column headers.

Example columns:

- `Repair ID`
- `Equipment Type`
- `Service Category`
- `Base Price`
- `Service Hours`
- `Availability`
- `Description`
- `Notes`

Sample row:

| Repair ID | Equipment Type | Service Category | Base Price | Service Hours | Availability | Description         | Notes               |
| --------- | -------------- | ---------------- | ---------- | ------------- | ------------ | ------------------- | ------------------- |
| RPR-001   | Escalator      | Maintenance      | 500        | 2             | Available    | Regular maintenance | Includes inspection |

## Troubleshooting

### Backend startup issues

- Confirm `backend/.env` exists and contains required values.
- Verify `npm install` succeeded in `backend/`.
- Check server output for error details.

### Frontend issues

- Confirm `pnpm install` succeeded in the project root.
- Ensure `NEXT_PUBLIC_API_URL` is set correctly for deployed builds.

### Authentication issues

- Protected endpoints require `Authorization: Bearer <token>`.
- Obtain the token using `/api/auth/login`.

## Future Enhancements

- Persist repair data to a proper database.
- Add inline editing and data validation.
- Add export to Excel/CSV.
- Add richer audit/change logging.
- Add UI authentication and role-based access.
- Add unit and integration tests.
- Improve error handling and logging.

## Removed duplicate docs

The following duplicate documentation files were removed, leaving only this consolidated `README.md`:

- `LOCAL_SETUP.md`
- `AMPLIFY_SETUP_STEPS.md`
- `AMPLIFY_MIGRATION_GUIDE.md`
- `API_DOCUMENTATION.md`
- `EC2_DEPLOYMENT.md`
- `PROJECT_SUMMARY.md`
- `MANUAL_VS_STREAMS_DECISION.md`
- `STREAMS_vs_MANUAL_LOGIC_LIMITATIONS.md`

## License

MIT
