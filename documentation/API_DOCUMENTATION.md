# API Documentation

This document provides comprehensive documentation for all API endpoints in the Osapiens Backend Challenge application.

## Base URL

```
/ (relative to your deployment)
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

**Success Response (202):**

```json
{
  "success": true,
  "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
  "message": "Workflow created and tasks queued from YAML definition.",
  "clientId": "test-client-123",
  "geoJsonType": "Polygon",
  "timestamp": "2024-01-15T10:30:00.000Z"
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

**422 - Workflow Processing Error:**

```json
{
  "success": false,
  "message": "Error processing workflow definition",
  "error": {
    "originalError": "YAML parsing failed"
  }
}
```

**503 - Database Connection Error:**

```json
{
  "success": false,
  "message": "Database connection error",
  "error": {
    "retryAfter": 30
  }
}
```

**500 - Internal Server Error:**

```json
{
  "success": false,
  "message": "Internal server error while creating workflow"
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
  "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
  "status": "in_progress",
  "completedTasks": 2,
  "failedTasks": 0,
  "totalTasks": 3,
  "progress": 67,
  "timestamp": "2024-01-15T10:30:00.000Z"
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
  "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
  "status": "completed",
  "finalResult": {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "completed",
    "hasFailures": false,
    "completedAt": "2024-01-15T10:35:00.000Z",
    "tasks": [
      {
        "taskId": "task-1-id",
        "type": "polygonArea",
        "output": "1234567.89",
        "status": "completed"
      },
      {
        "taskId": "task-2-id",
        "type": "dataAnalysis",
        "output": "Analysis completed successfully",
        "status": "completed"
      },
      {
        "taskId": "task-3-id",
        "type": "reportGeneration",
        "output": "Final report generated",
        "status": "completed"
      }
    ],
    "summary": {
      "totalTasks": 3,
      "completedTasks": 3,
      "failedTasks": 0
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
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
  "message": "Workflow has not finished yet",
  "error": {
    "currentStatus": "in_progress",
    "message": "Results are only available for completed or failed workflows"
  }
}
```

### 4. Dashboard API Endpoints

#### Get Dashboard Statistics

**Endpoint:** `GET /api/stats`

**Success Response (200):**

```json
{
  "totalWorkflows": 15,
  "totalTasks": 45,
  "workflowsByStatus": [
    { "status": "completed", "count": "8" },
    { "status": "in_progress", "count": "3" },
    { "status": "failed", "count": "4" }
  ],
  "tasksByStatus": [
    { "status": "completed", "count": "32" },
    { "status": "in_progress", "count": "3" },
    { "status": "failed", "count": "10" }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get All Workflows

**Endpoint:** `GET /api/workflows`

**Success Response (200):**

```json
[
  {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "clientId": "test-client-123",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "totalTasks": 3,
    "completedTasks": 3,
    "failedTasks": 0,
    "inProgressTasks": 0,
    "queuedTasks": 0,
    "progress": 100
  }
]
```

#### Get Workflow Tasks

**Endpoint:** `GET /api/workflows/:id/tasks`

**URL Parameters:**

- `id`: Workflow ID (UUID format)

**Success Response (200):**

```json
[
  {
    "taskId": "task-1-id",
    "taskType": "polygonArea",
    "status": "completed",
    "stepNumber": 1,
    "progress": 100,
    "dependency": null,
    "result": {
      "areaSqMeters": 1234567.89,
      "units": "square meters"
    },
    "createdAt": "task-1-id"
  },
  {
    "taskId": "task-2-id",
    "taskType": "dataAnalysis",
    "status": "completed",
    "stepNumber": 2,
    "progress": 100,
    "dependency": "task-1-id",
    "result": "Analysis completed successfully",
    "createdAt": "task-2-id"
  }
]
```

#### Get Workflow Details

**Endpoint:** `GET /api/workflows/:id/details`

**URL Parameters:**

- `id`: Workflow ID (UUID format)

**Success Response (200):**

```json
{
  "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
  "clientId": "test-client-123",
  "status": "completed",
  "finalResult": {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "completed",
    "hasFailures": false,
    "completedAt": "2024-01-15T10:35:00.000Z",
    "tasks": [...],
    "summary": {...}
  },
  "createdAt": "3433c76d-f226-4c91-afb5-7dfc7accab24"
}
```

**Error Responses:**

**404 - Workflow Not Found:**

```json
{
  "error": "Workflow not found"
}
```

### 5. Debug Endpoints

#### Get Recent Tasks (Debug)

**Endpoint:** `GET /debug/tasks`

**Description:** Returns the 10 most recent tasks with their results. Useful for debugging and monitoring.

**Success Response (200):**

```json
[
  {
    "taskId": "task-1-id",
    "taskType": "polygonArea",
    "status": "completed",
    "stepNumber": 1,
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "result": {
      "areaSqMeters": 1234567.89,
      "units": "square meters"
    }
  }
]
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
- `202` - Accepted (workflow created and queued)
- `400` - Bad Request (validation errors, workflow not completed)
- `404` - Not Found (workflow not found)
- `422` - Unprocessable Entity (workflow processing errors)
- `500` - Internal Server Error
- `503` - Service Unavailable (database connection errors)

## Rate Limiting

Currently, no rate limiting is implemented.

## CORS

CORS is enabled for all origins in development mode.

## Testing the API

You can test the API endpoints using:

1. **cURL:**

```bash
curl -X POST /analysis \
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

3. **Dashboard:** Use the web interface at `/dashboard` for interactive testing.
