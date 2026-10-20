# frontend

Frontend of Voice Office Booking: employees book office desks on an SVG map or by voice.

## Stack

React 18, Vite, TypeScript, Ant Design 5.

## Getting started

Requirements: Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Scripts

- `npm run dev`: start the development server
- `npm run lint`: check the code with ESLint
- `npm run build`: type-check and build for production

## Project structure (FSAA)

- `src/app`: app setup, providers, theme
- `src/pages`: pages
- `src/features`: user actions (for example booking)
- `src/entities`: business entities (seat, booking, user)
- `src/shared`: reusable UI and helpers

See CONTRIBUTING.md for branches, commits and pull requests.