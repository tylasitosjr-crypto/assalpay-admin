# Assalpay — Admin (Frontend)

Web administration console for the Assalpay platform. This is a single-page application built with **React 18** and **Vite 5**, consuming the backend REST API under the `/admin` route prefix.

## Features

- React Router for client-side navigation
- Axios for HTTP requests (shared instance with interceptors)
- Rich forms and content editing (React Quill, phone input, toast notifications)

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (or another compatible package manager)
- A running **Assalpay API** instance when you need real data (see `../server/README.md`)

## Getting started

### Install dependencies

```bash
cd admin
npm install
```

### Environment variables

Create a `.env` file in this directory (Vite loads it automatically). The app expects:

| Variable            | Description                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | Base URL of the backend API (no trailing slash required). Example: `http://localhost:3000` |

If `VITE_API_BASE_URL` is omitted, API calls may resolve to a relative origin; set it explicitly for local development against a separate API port or for production.

### Development server

```bash
npm run dev
```

By default Vite serves the app on **port 5173**. The dev server proxies requests to `/admin` to `http://localhost:3000`, so you can align the backend `PORT` with that target for a smooth local workflow.

### Production build

```bash
npm run build
```

Output is written to `dist/`. The backend can serve this folder as static assets when deployed together with the API (see the server README).

### Preview the production build locally

```bash
npm run preview
```

## Project layout

- `src/` — Application source (pages, components, API helpers, assets)
- `vite.config.js` — Vite and dev-server configuration (including the `/admin` proxy)
- `index.html` — Application shell

## Tech stack

React, React Router, Vite, Axios, React Toastify, SweetAlert2, and other UI-focused libraries as listed in `package.json`.
