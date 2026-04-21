# DAKA Admin Dashboard

This package is the current DAKA admin and student prototype frontend.

It is a Vite + React app used to model:

- cohort management
- schedule and syllabus planning
- attendance workflows
- student progress reporting
- announcements
- student-facing dashboard views

## Current State

The UI is production-shaped, but the data layer is still prototype-backed:

- seed data lives in `src/app/seed-data.ts`
- runtime persistence uses `localStorage`
- backend integration is not wired yet

## Development

```bash
npm install
npm run dev
```

If you want to point the frontend at the backend scaffold, set:

```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

## Build

```bash
npm run build
npm run preview
```
