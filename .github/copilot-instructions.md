# Copilot Instructions for Station-Quality-Control

## Project Overview
This is a full-stack JavaScript project with a React frontend (`client/`) and an Express backend (`server/`). The client and server are developed and run independently, but communicate via HTTP API calls. The client is configured to proxy API requests to the backend during development.

## Architecture & Data Flow
- **Frontend (`client/`)**: Built with Create React App. UI components are in `src/components/`. Styling uses Tailwind CSS (see `tailwind.config.js`, `postcss.config.js`).
- **Backend (`server/`)**: Minimal Express server exposing API endpoints (see `server.js`).
- **Communication**: The React app proxies API requests to the Express server at `http://localhost:5000` (see `client/package.json` `proxy` field).

## Developer Workflows
- **Start Frontend**: `cd client && npm start` (runs on port 3000)
- **Start Backend**: `cd server && npm run dev` (uses nodemon for hot reload, runs on port 5000)
- **Build Frontend**: `cd client && npm run build`
- **Test Frontend**: `cd client && npm test`
- **No backend tests currently defined**

## Key Conventions & Patterns
- **Component Structure**: Place reusable React components in `client/src/components/`. Example: `dropdown.jsx` uses hooks and Lucide icons.
- **Styling**: Use Tailwind utility classes in JSX. Global styles in `client/src/index.css`.
- **API Endpoints**: Add new Express routes in `server/server.js`. Example endpoint: `/api` returns a static user list.
- **Proxy Setup**: For local development, React requests to `/api/*` are forwarded to Express automatically.
- **No custom middleware or authentication implemented yet.**

## External Dependencies
- **Frontend**: React, Lucide React, Tailwind CSS, Testing Library
- **Backend**: Express, Nodemon (dev)

## Integration Points
- **API Contract**: Keep API responses in JSON format. Update both frontend and backend if changing data shape.
- **Static Assets**: Place images and icons in `client/public/`.

## Example: Adding a New API Endpoint
1. Edit `server/server.js` to add a new route.
2. Restart backend if not using nodemon.
3. Call the endpoint from React using `fetch` or `axios`.

## Example: Adding a New Component
1. Create a new file in `client/src/components/`.
2. Import and use it in `client/src/App.js` or other pages.

---
For questions about unclear conventions or missing documentation, ask the user for clarification or examples.
