# Kone Repair Offering & Pricing Management Tool

A full-stack React + Express JS application for uploading and managing Excel data with repair offerings and pricing information.

This repository is configured for local development only.

See `LOCAL_SETUP.md` for the complete local-only setup and run instructions.

## Project Structure

```
project/
├── app/                    # Next.js frontend (React)
│   ├── page.tsx           # Main upload page
│   ├── layout.tsx         # Root layout with Material-UI provider
│   └── globals.css        # Global styles
├── lib/
│   ├── theme.ts           # Material-UI theme configuration
│   └── utils.ts           # Utility functions
├── backend/               # Express.js server
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env               # Backend environment variables
├── public/                # Static assets
└── package.json           # Frontend dependencies
```

## Features

- **Excel File Upload**: Upload Excel files (.xlsx, .xls) with repair data
- **Data Parsing**: Automatic parsing of Excel data using XLSX library
- **Data Display**: Beautiful table view with Material-UI components
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Works on desktop and mobile devices

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm package manager

### Frontend Setup

```bash
# Install dependencies
pnpm install
# or
npm install
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

## Running the Application

### 1. Start the Backend Server (Terminal 1)
```bash
cd backend
npm run dev
```

### 2. Start the Frontend (Terminal 2)
```bash
pnpm dev
# or
npm run dev
```

The frontend will run on `http://localhost:3000`

## Excel File Format

Your Excel file should contain the following columns:

| Repair ID | Equipment Type | Service Category | Base Price | Service Hours | Availability | Description | Notes |
|-----------|----------------|------------------|------------|---------------|--------------|---------------------------------|--------------------------|
| RPR-001   | Escalator      | Maintenance      | 500        | 2             | Available    | Regular escalator maintenance   | Includes inspection     |
| RPR-002   | Elevator       | Emergency Repair | 1200       | 4             | On-Call      | Emergency elevator repair       | 24/7 availability       |

### Column Descriptions:
- **Repair ID**: Unique identifier for the repair service
- **Equipment Type**: Type of equipment (Escalator, Elevator, etc.)
- **Service Category**: Category of service (Maintenance, Repair, etc.)
- **Base Price**: Base price for the service
- **Service Hours**: Estimated hours to complete the service
- **Availability**: Availability status (Available, On-Call, etc.)
- **Description**: Description of the repair service
- **Notes**: Additional notes or information

## API Endpoints

### POST `/api/upload`
Upload an Excel file for processing.

**Request:**
- Content-Type: multipart/form-data
- Body: File field containing the Excel file

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "Repair ID": "RPR-001",
      "Equipment Type": "Escalator",
      "Service Category": "Maintenance",
      "Base Price": 500,
      "Service Hours": 2,
      "Availability": "Available",
      "Description": "Regular escalator maintenance",
      "Notes": "Includes inspection"
    }
  ],
  "rowCount": 1,
  "columns": ["Repair ID", "Equipment Type", "Service Category", "Base Price", "Service Hours", "Availability", "Description", "Notes"]
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "Server is running"
}
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Next.js 16** - React framework with server-side rendering
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **TypeScript** - Type safety

### Backend
- **Express.js** - Web framework
- **XLSX** - Excel file parsing
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Future Enhancements

- Database integration for storing repair data
- Edit functionality for cells in the table
- Export data back to Excel
- Advanced filtering and search
- User authentication and authorization
- Data validation before upload
- Bulk operations
- API documentation (Swagger/OpenAPI)

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Use `npm run dev -- -p <port_number>`

### CORS Error
Ensure the backend is running on `http://localhost:5000` and the frontend is on `http://localhost:3000`

### File Upload Error
- Check that the file is in Excel format (.xlsx or .xls)
- Ensure the first row contains column headers
- Check browser console for specific error messages

## Notes

- Currently, data is displayed in memory and not persisted to a database
- To add database persistence, integrate with your preferred database (PostgreSQL, MongoDB, etc.)
- This is a starter template that can be extended with additional features

## License

MIT
