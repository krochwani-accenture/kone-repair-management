# Local Setup & Run

This repository is configured to run locally only. It should be started from your local machine.

## Prerequisites

- Node.js v16 or higher
- npm or pnpm

## Install Dependencies

### Frontend
```bash
pnpm install
```

### Backend
```bash
cd backend
npm install
```

## Start the Backend

Open a terminal and run:
```bash
cd backend
npm run dev
```

The backend will start on:

`http://localhost:5000`

## Start the Frontend

Open a second terminal from the project root and run:
```bash
pnpm dev
```

The frontend will start on:

`http://localhost:3000`

## Environment Variables

The backend may optionally use a `.env` file in `/backend` with:

```bash
PORT=5000
NODE_ENV=development
```

## Local Access

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- API base URL: `http://localhost:5000/api`

## SAM / DynamoDB and Frontend configuration

This SAM template creates a DynamoDB table named `Repairs`.

If you deploy the repairs API with AWS SAM, set the frontend API base URL as an environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_REPAIRS_API_URL=https://<your-sam-api-endpoint>/api
```

The frontend uses `NEXT_PUBLIC_REPAIRS_API_URL` for repairs CRUD calls and `NEXT_PUBLIC_API_URL` for file upload endpoints.

If you use the migration script, set `DYNAMO_TABLE_NAME=Repairs` before running it, or set it to your existing table name if you deployed a different table.

## API Endpoints

### POST `/api/upload`
Upload an Excel file (.xlsx or .xls) to parse repair data.

### GET `/api/health`
Returns a simple health check response.

## Notes

- The backend runs as a separate Node.js server.
- The frontend and backend communicate over `localhost`.
