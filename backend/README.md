# DAKA Backend Scaffold

This package is the starting point for the production API described in:

- [`../API_CONTRACTS.md`](../API_CONTRACTS.md)
- [`../BACKEND_SCHEMA.md`](../BACKEND_SCHEMA.md)

## What Exists

- Express server bootstrap
- request ID and error-envelope middleware
- contract-aligned route modules under `/api/v1`
- placeholder handlers that return stable `501` responses
- shared DTO types for the next implementation phase

## What Does Not Exist Yet

- database connectivity
- migrations
- authentication
- authorization
- business logic
- persistent read/write models

## Development

```bash
npm install
npm run dev
```

## Route Groups

- `auth`
- `admin/cohorts`
- `admin/students`
- `admin/sessions`
- `admin/attendance`
- `admin/progress`
- `admin/announcements`
- `student`
- `devices`
