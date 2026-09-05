# Chirpy Backend API

This is the backend web server for **Chirpy**, a social media platform. It is built using Node.js, Express, TypeScript, and PostgreSQL (via Drizzle ORM).

## Features
- **User Authentication**: Secure password hashing with Argon2, stateless authentication with JWTs, and long-lived sessions using refresh tokens.
- **Chirps**: Users can create, read, and delete short messages called "chirps". Includes a profanity filter to keep the platform clean!
- **Webhooks**: Integration with "Polka" (a mock third-party service) to automatically upgrade users to "Chirpy Red" status upon payment.
- **PostgreSQL + Drizzle**: Type-safe database queries and schema management.

## Project Structure
- `src/index.ts`: The main Express server and all route definitions.
- `src/auth.ts`: Authentication utilities (JWTs, Argon2, token extraction).
- `src/config.ts`: Environment variable validation and global config.
- `src/db/schema.ts`: Drizzle ORM schema definitions (`users`, `chirps`, `refresh_tokens`).
- `src/db/queries/`: Reusable, type-safe database queries.

## API Endpoints

### 👤 Users
- `POST /api/users`: Create a new user account.
- `POST /api/login`: Authenticate and receive an Access Token and Refresh Token.
- `PUT /api/users`: Update email and password (requires Access Token).
- `POST /api/refresh`: Get a new Access Token using a valid Refresh Token.
- `POST /api/revoke`: Revoke a Refresh Token, logging the user out.

### 🐦 Chirps
- `GET /api/chirps`: Fetch all chirps. Supports `?authorId=<uuid>` to filter, and `?sort=desc` to sort chronologically.
- `GET /api/chirps/:chirpId`: Fetch a specific chirp.
- `POST /api/chirps`: Create a new chirp (requires Access Token). Max length is 140 characters.
- `DELETE /api/chirps/:chirpId`: Delete your own chirp (requires Access Token).

### 🔗 Webhooks
- `POST /api/polka/webhooks`: Upgrades a user to Chirpy Red. Requires Polka API Key in the `Authorization` header.

## Setup & Running
1. Set up your `.env` file with `PLATFORM`, `SECRET`, `DB_URL`, and `POLKA_KEY`.
2. Run database migrations: `npm run migrate`
3. Start the dev server: `npm run dev`
