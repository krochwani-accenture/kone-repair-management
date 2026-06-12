# Kone Repair Management - API Documentation

## Overview
This document describes all available API endpoints for the Kone Repair Offering & Pricing Management application.

## Base URL
```
http://localhost:5000/api
```

## Endpoints

### 1. Upload Excel File
**Endpoint:** `POST /upload`

**Description:** Upload an Excel file containing repair data. The file is parsed and returned as JSON without saving to database.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: File upload with key `file`

**Example:**
```bash
curl -X POST -F "file=@repairs.xlsx" http://localhost:5000/api/upload
```

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
      "Notes": "Includes inspection and lubrication"
    }
  ],
  "rowCount": 1,
  "columns": ["Repair ID", "Equipment Type", "Service Category", "Base Price", "Service Hours", "Availability", "Description", "Notes"]
}
```

---

### 2. Save Repairs to Database
**Endpoint:** `POST /repairs/save`

**Description:** Save repair records to the SQLite database. Duplicates (based on Repair ID) are skipped automatically.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body: JSON object with `data` array containing repair records

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "data": [
      {
        "Repair ID": "RPR-001",
        "Equipment Type": "Escalator",
        "Service Category": "Maintenance",
        "Base Price": 500,
        "Service Hours": 2,
        "Availability": "Available",
        "Description": "Regular maintenance",
        "Notes": "Includes inspection"
      }
    ]
  }' \
  http://localhost:5000/api/repairs/save
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully saved repair data",
  "data": {
    "inserted": 1,
    "skipped": 0,
    "total": 1,
    "errors": []
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid data format
- `500 Internal Server Error` - Database error

---

### 3. Get All Repairs
**Endpoint:** `GET /repairs`

**Description:** Retrieve all repairs from the database, ordered by creation date (newest first).

**Request:**
- Method: `GET`

**Example:**
```bash
curl http://localhost:5000/api/repairs
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "repair_id": "RPR-001",
      "equipment_type": "Escalator",
      "service_category": "Maintenance",
      "base_price": 500,
      "service_hours": 2,
      "availability": "Available",
      "description": "Regular escalator maintenance",
      "notes": "Includes inspection and lubrication",
      "created_at": "2026-06-11 06:57:38",
      "updated_at": "2026-06-11 06:57:38"
    }
  ],
  "count": 1,
  "message": "Retrieved 1 repairs from database"
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

### 4. Get Repair by ID
**Endpoint:** `GET /repairs/:repairId`

**Description:** Retrieve a specific repair record by its Repair ID.

**Request:**
- Method: `GET`
- Parameters:
  - `repairId` (path): The Repair ID to fetch (e.g., RPR-001)

**Example:**
```bash
curl http://localhost:5000/api/repairs/RPR-001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "repair_id": "RPR-001",
    "equipment_type": "Escalator",
    "service_category": "Maintenance",
    "base_price": 500,
    "service_hours": 2,
    "availability": "Available",
    "description": "Regular escalator maintenance",
    "notes": "Includes inspection and lubrication",
    "created_at": "2026-06-11 06:57:38",
    "updated_at": "2026-06-11 06:57:38"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing Repair ID
- `404 Not Found` - Repair not found
- `500 Internal Server Error` - Database error

---

### 5. Get Repair Count
**Endpoint:** `GET /repairs/count/total`

**Description:** Get the total number of repairs in the database.

**Request:**
- Method: `GET`

**Example:**
```bash
curl http://localhost:5000/api/repairs/count/total
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

### 6. Clear All Repairs
**Endpoint:** `DELETE /repairs/clear`

**Description:** Delete all repair records from the database. **Use with caution!**

**Request:**
- Method: `DELETE`

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/repairs/clear
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 5 repairs from database",
  "data": {
    "deleted": 5
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

### 7. Health Check
**Endpoint:** `GET /health`

**Description:** Check if the backend server is running.

**Request:**
- Method: `GET`

**Example:**
```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "Server is running"
}
```

---

## Database Schema

### Repairs Table

```sql
CREATE TABLE repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repair_id TEXT UNIQUE NOT NULL,           -- Unique identifier for the repair
  equipment_type TEXT NOT NULL,              -- Type of equipment (e.g., Escalator, Elevator)
  service_category TEXT NOT NULL,            -- Service category (e.g., Maintenance, Emergency Repair)
  base_price REAL NOT NULL,                  -- Base price in currency
  service_hours REAL NOT NULL,               -- Service hours required
  availability TEXT,                         -- Availability status (e.g., Available, On-Call)
  description TEXT,                          -- Description of the repair
  notes TEXT,                                -- Additional notes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_repair_id` on `repair_id` (for fast lookups)

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Cases

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid data format | Request body format is incorrect |
| 400 | No file provided | File upload endpoint received no file |
| 400 | No data to save | Empty data array provided |
| 404 | Repair not found | Repair ID doesn't exist in database |
| 500 | Database error | SQLite operation failed |

---

## Duplicate Handling

When saving repairs to the database:
- Records with the same `repair_id` are considered duplicates
- Duplicate records are skipped (not inserted)
- A summary is returned showing inserted vs. skipped counts
- No error is raised for duplicates; they are silently skipped

**Example:**
```json
{
  "inserted": 2,
  "skipped": 1,
  "total": 3,
  "errors": []
}
```

---

## Rate Limiting & Constraints

- **File Upload Size:** Limited by multer (default 100MB)
- **Database:** SQLite with UNIQUE constraint on `repair_id`
- **API Response Time:** Typically < 100ms for small datasets

---

## Integration Example

### Complete Workflow

```bash
# 1. Upload Excel file and get preview
curl -X POST -F "file=@repairs.xlsx" http://localhost:5000/api/upload > preview.json

# 2. Extract data from preview and save to database
curl -X POST -H "Content-Type: application/json" \
  -d @preview.json \
  http://localhost:5000/api/repairs/save

# 3. Fetch all saved repairs
curl http://localhost:5000/api/repairs

# 4. Fetch specific repair
curl http://localhost:5000/api/repairs/RPR-001

# 5. Get total count
curl http://localhost:5000/api/repairs/count/total
```

---

## Frontend Integration

The React frontend (`app/page.tsx`) integrates with these API endpoints through two main tabs:

### Upload Tab
1. User selects Excel file
2. Frontend calls `POST /api/upload`
3. Preview is shown in a table
4. User clicks "Save to Database"
5. Frontend calls `POST /api/repairs/save`
6. Success/error message is displayed

### View Database Tab
1. User clicks on "View Database" tab
2. Frontend calls `GET /api/repairs`
3. All records are displayed in a table
4. User can click "Refresh" to reload data

---

## Environment Variables

Backend configuration (`.env` file):
```
PORT=5000
NODE_ENV=development
```

Frontend configuration (`.env.local` file):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Support & Troubleshooting

### Database File Location
- SQLite database is stored at: `backend/repairs.db`
- This file is created automatically on first run

### Reset Database
To delete all data and start fresh:
```bash
rm backend/repairs.db
# Restart backend server - database will be recreated empty
```

### View Database Directly
Using SQLite CLI:
```bash
sqlite3 backend/repairs.db
SELECT * FROM repairs;
```
