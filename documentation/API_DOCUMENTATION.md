# API Documentation

This document provides comprehensive documentation for all API endpoints in the Osapiens Backend Challenge application.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required for API endpoints.

## Endpoints

### 1. Create Workflow

Creates a new workflow with tasks based on the provided GeoJSON data.

**Endpoint:** `POST /analysis`

**Request Body:**
```json
{
  "clientId": "string",
  "geoJson": {
    "type": "Polygon",
    "coordinates": [
      [
        [longitude, latitude],
        [longitude, latitude],
        [longitude, latitude],
        [longitude, latitude],
        [longitude, latitude]
      ]
    ]
  }
}
```

**Validation Rules:**
- `clientId`: Required, non-empty string
- `geoJson`: Required, valid GeoJSON Polygon
  - Must be a closed polygon (first and last coordinates must be identical)
  - Must have at least 4 coordinate pairs
  - Coordinates must be valid longitude/latitude values

**Success Response (201):**
```json
{
  "success": true,
  "message": "Workflow created successfully",
  "data": {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "queued",
    "tasks": [
      {
        "taskId": "task-1-id",
        "taskType": "polygonArea",
        "status": "queued"
      },
      {
        "taskId": "task-2-id", 
        "taskType": "dataAnalysis",
        "status": "queued"
      },
      {
        "taskId": "task-3-id",
        "taskType": "reportGeneration", 
        "status": "queued"
      }
    ]
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "The provided data is not valid",
  "errors": [
    {
      "field": "clientId",
      "message": "Client ID is required"
    }
  ]
}
```

**500 - Server Error:**
```json
{
  "success": false,
  "message": "Error processing workflow definition",
  "error": "Internal server error"
}
```

### 2. Get Workflow Status

Retrieves the current status of a workflow.

**Endpoint:** `GET /workflow/:id/status`

**URL Parameters:**
- `id`: Workflow ID (UUID format)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "in_progress",
    "completedTasks": 2,
    "totalTasks": 3,
    "progress": 66.67
  }
}
```

**Error Responses:**

**400 - Invalid ID:**
```json
{
  "success": false,
  "message": "Invalid workflow ID format"
}
```

**404 - Workflow Not Found:**
```json
{
  "success": false,
  "message": "Workflow not found"
}
```

### 3. Get Workflow Results

Retrieves the final results of a completed workflow.

**Endpoint:** `GET /workflow/:id/results`

**URL Parameters:**
- `id`: Workflow ID (UUID format)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "completed",
    "finalResult": {
      "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
      "tasks": [
        {
          "taskId": "task-1-id",
          "type": "polygonArea",
          "output": "1234567.89"
        },
        {
          "taskId": "task-2-id",
          "type": "dataAnalysis", 
          "output": "Analysis completed successfully"
        },
        {
          "taskId": "task-3-id",
          "type": "reportGeneration",
          "output": "Final report generated"
        }
      ],
      "finalReport": "Aggregated data and results"
    }
  }
}
```

**Error Responses:**

**400 - Invalid ID:**
```json
{
  "success": false,
  "message": "Invalid workflow ID format"
}
```

**404 - Workflow Not Found:**
```json
{
  "success": false,
  "message": "Workflow not found"
}
```

**400 - Workflow Not Completed:**
```json
{
  "success": false,
  "message": "Workflow has not finished yet"
}
```

### 4. Dashboard API Endpoints

#### Get Dashboard Statistics

**Endpoint:** `GET /api/stats`

**Success Response (200):**
```json
{
  "totalWorkflows": 15,
  "completedWorkflows": 8,
  "inProgressWorkflows": 3,
  "failedWorkflows": 4,
  "totalTasks": 45,
  "completedTasks": 32,
  "inProgressTasks": 3,
  "failedTasks": 10
}
```

#### Get All Workflows

**Endpoint:** `GET /api/workflows`

**Success Response (200):**
```json
{
  "workflows": [
    {
      "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "completedTasks": 3,
      "totalTasks": 3
    }
  ]
}
```

#### Get Workflow Tasks

**Endpoint:** `GET /api/workflows/:id/tasks`

**URL Parameters:**
- `id`: Workflow ID (UUID format)

**Success Response (200):**
```json
{
  "tasks": [
    {
      "taskId": "task-1-id",
      "taskType": "polygonArea",
      "status": "completed",
      "progress": 100,
      "output": "1234567.89",
      "error": null
    },
    {
      "taskId": "task-2-id",
      "taskType": "dataAnalysis",
      "status": "completed", 
      "progress": 100,
      "output": "Analysis completed successfully",
      "error": null
    }
  ]
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific field error"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented.

## CORS

CORS is enabled for all origins in development mode.

## Testing the API

You can test the API endpoints using:

1. **cURL:**
```bash
curl -X POST http://localhost:3000/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-client",
    "geoJson": {
      "type": "Polygon",
      "coordinates": [[
        [-63.624885020050996, -10.311050368263523],
        [-63.624885020050996, -10.367865108370523],
        [-63.61278302732815, -10.367865108370523],
        [-63.61278302732815, -10.311050368263523],
        [-63.624885020050996, -10.311050368263523]
      ]]
    }
  }'
```

2. **Postman/Insomnia:** Import the endpoints and test with the provided examples.

3. **Dashboard:** Use the web interface at `http://localhost:3000/dashboard` for interactive testing.
