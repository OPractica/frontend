# Voice Office Booking: frontend

Web client of Voice Office Booking: employees book office desks and meeting rooms on an SVG floor map, by typing a request, or by voice through an AI assistant. It talks to the API from [OPractica/backend](https://github.com/OPractica/backend).

## Stack

React 18, Vite 8, TypeScript 6, Ant Design 5 with `@ant-design/icons`, dayjs. ESLint with `typescript-eslint` and the React Hooks rules.

## Requirements

- Node.js 20.19+ or 22.13+, with npm
- The backend API, running locally (see the [backend README](https://github.com/OPractica/backend#readme)) or the deployed one

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173. Signing in, booking and the AI assistant need the backend. Without signing in you can browse the map as a guest.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, including `/api/v1` |

`.env.example` sets it to the deployed backend on Render. If `VITE_API_URL` isn't set, `npm run dev` uses `http://localhost:8000/api/v1` and a production build uses the Render URL (see `src/shared/api/client.ts`).

- To work against your local backend, don't create `.env`, or set `VITE_API_URL=http://localhost:8000/api/v1` in it.
- To work against the deployed backend, run `cp .env.example .env`.
- Don't leave the variable empty: an empty value is used as is, and requests go to the frontend's own address.

The backend allows `http://localhost:5173` by default. A different origin has to be added to the backend's `CORS_ORIGINS`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Type-check with `tsc -b` and build for production into `dist/` |
| `npm run preview` | Serve the production build from `dist/` locally |
| `npm run lint` | Check the code with ESLint |

There are no automated tests yet.

## Architecture

[![Frontend architecture: app renders pages; pages use the booking features, the app-wide features and the AI assistant; features and entities call the backend through the shared API client, which keeps the tokens in localStorage](docs/architecture.svg)](docs/architecture.svg)

*Each layer imports only from the layers below it. All requests to the backend go through `request()` in `src/shared/api/client.ts`. Click the image to open it at full size.*

## Project structure

The code follows Feature-Sliced Design: `app → pages → features → entities → shared`.

| Folder | What's inside |
|---|---|
| `src/app` | `App.tsx`: providers (theme, language, auth, bookings, notifications), the side menu and switching between views |
| `src/pages` | `BookingPage` (floor map, booking panel, AI assistant) and `MyBookingsPage` (your desk and meeting room bookings) |
| `src/features` | `floor-plan`, `booking-panel`, `check-in`, `ai-assistant`, `auth`, `notifications`, `office-list`, `theme` |
| `src/entities` | `seat`, `booking`, `meeting-room`: types and API calls. `office`: the list of offices and floors |
| `src/shared` | `api` (HTTP client and tokens), `i18n` (ro/ru/en texts and formatting), `ui` (the `Calendar` component) |

## Features

- **Floor map.** An SVG plan of the 7th floor, block A, of the Zity Mall office with desks and meeting rooms. Free and booked places are coloured for the chosen date and time. A filter highlights free desks by attributes such as window, quiet, dual monitor or dock, and free meeting rooms by the number of people and the equipment. The other offices and floors in the office list don't have a plan yet.
- **Calendar.** Pick a day, then book the whole day (09:00–18:00) or a range of hours.
- **Desk and meeting room booking.** Click a place on the map and confirm in the booking panel. Desks are booked with `POST /bookings`, meeting rooms with `POST /meeting/bookings`. Guests can look at the map but have to sign in to book.
- **My bookings.** A list of your desk and meeting room bookings, where you can cancel them.
- **Check-in.** For a desk booking, the check-in button works from 5 minutes before the start to 10 minutes after it. Without a check-in, the backend cancels the booking.
- **AI assistant.** A round button in the corner of the booking page opens a text chat or starts a voice recording (up to 60 seconds). The recording goes to `POST /voice/transcribe`, and the recognised text is sent to `POST /ai/chat` like a typed message. The assistant can find, book and cancel desks and meeting rooms. After every answer the map reloads, and desk bookings the assistant made or cancelled show up as notifications. The assistant needs a signed-in user.
- **Notifications.** Booking, cancellation and same-day reminder notices, kept in the browser for each user.
- **Light and dark theme.** Switch in the side menu. The choice is saved in the browser.
- **Languages.** Romanian, Russian and English, switched in the side menu. Ant Design components and dates follow the chosen language.

## How it talks to the backend

All API calls go through `request()` in `src/shared/api/client.ts`:

- It prefixes the path with `VITE_API_URL` and sends JSON. For file uploads (`FormData`) the browser sets the content type.
- After login it adds `Authorization: Bearer <access_token>`. The access and refresh tokens are stored in `localStorage` (`src/shared/api/tokens.ts`).
- When a request gets `401`, it calls `POST /auth/refresh` once, saves the new token pair and repeats the request. A refresh token works only once, so parallel requests that get `401` wait for the same refresh. If the refresh fails, the tokens are cleared.
- Errors become an `ApiError` with the HTTP status and the backend's `detail` and `code`, which the UI turns into translated messages.

The available endpoints and their data are in the backend's `/docs` page and its `API_CONTRACT.md`.

## Contributing

Branches, commit messages, pull requests and CI checks are described in [CONTRIBUTING.md](CONTRIBUTING.md). Rules for AI coding agents are in [AGENTS.md](AGENTS.md).
