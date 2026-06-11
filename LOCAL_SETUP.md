# Local Setup & Run

This repository is configured to run locally only. It is not deployed to Vercel and should be started from your local machine.

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

## API Endpoints

### POST `/api/upload`
Upload an Excel file (.xlsx or .xls) to parse repair data.

### GET `/api/health`
Returns a simple health check response.

## Notes

- Do not deploy this repository to Vercel.
- The backend runs as a separate Node.js server.
- The frontend and backend communicate over `localhost`.
