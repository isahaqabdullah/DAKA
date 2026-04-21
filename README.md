# DAKA V2.0

DAKA V2.0 currently contains:

- `Frontend/`: the Vite + React prototype used to model admin and student workflows
- `backend/`: the API scaffold aligned to `API_CONTRACTS.md` and `BACKEND_SCHEMA.md`
- `API_CONTRACTS.md`: the production API contract
- `BACKEND_SCHEMA.md`: the production PostgreSQL schema design

## Current Status

The frontend is still prototype-backed and persists data in browser storage.

The backend package is scaffolded for the next phase: replacing local prototype state with contract-aligned API endpoints.

## Package Layout

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Next Implementation Track

1. Implement auth and current-user endpoints
2. Implement admin cohort/student/session flows
3. Replace frontend `localStorage` writes with API calls
4. Add database migrations and persistence
