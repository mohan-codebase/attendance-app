# Attendance App

A collaborative attendance-tracking application built by students of Schools of Techies. The project brings together designers, content creators and developers to create an interface for managing attendance and viewing reports.

**Live site:** [attendance-app-black-omega.vercel.app](https://attendance-app-black-omega.vercel.app)

## Features

- Account registration, login and password reset, with Google sign-in support.
- Attendance, courses, a dashboard, calendar and reports.
- Light and dark themes and responsive interface components.

## Technology

- **Frontend:** React, React Router, Bootstrap, Axios and Chart.js.
- **Backend:** Node.js, Express and MongoDB with Mongoose.
- **Authentication:** JSON Web Tokens and Google authentication.

## Running locally

The backend requires Node.js 22 or newer and a MongoDB connection. Configure the example environment files before starting the servers; Google sign-in and password-reset email also require their respective credentials.

```bash
# Backend
cd backend
cp .env.example .env
npm ci
npm start
```

In a second terminal:

```bash
# Frontend
cd frontend
cp .env.example .env
npm ci
npm start
```

The example configuration uses port 5000 for the API and port 3000 for the frontend. See `backend/.env.example` and `frontend/.env.example` for the available settings. Do not commit real credentials.

## Project structure

```text
frontend/  React application and interface components
backend/   Express API, routes, models, controllers and migrations
```

## Contributors

A Schools of Techies team project. [Mohan](https://github.com/mohan-codebase) and [Abidev17](https://github.com/Abidev17) have contributed commits; see the repository history for details.
