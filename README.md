# Goldera File Management

A full-stack file management app for registering users, uploading and organizing files, viewing file details, and managing users and uploads as an administrator.

**GitHub repository:** [Elsawy200/file-managment](https://github.com/Elsawy200/file-managment)

## Project overview

Goldera provides a Next.js web interface and an Express REST API. Users can create an account, verify their email, sign in, upload and browse files, and view extracted text for supported document and spreadsheet formats. The API stores file records and extracted text in PostgreSQL and uploads file assets to Cloudinary. Admin routes provide user and file management.

Supported uploads are controlled by `backend/src/middlewares/file.middleware.ts`. The current allowlist includes PDF, DOC/DOCX, XLS/XLSX, TXT, CSV, JSON, JPG, PNG, WEBP, and GIF. Text extraction is implemented for PDF, Word documents, spreadsheets, and text-based files.

## Technologies used

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, Axios, Framer Motion, Lucide icons
- **Backend:** Node.js, Express 5, TypeScript, Zod, JWT, bcrypt, Multer
- **Database:** PostgreSQL with Prisma ORM 7 and the PostgreSQL driver adapter
- **File storage:** Cloudinary
- **Email:** Nodemailer with an SMTP provider
- **Content extraction:** `pdf-parse`, Mammoth, SheetJS (`xlsx`)

## Folder structure

```text
.
├── backend/
│   ├── prisma/
│   │   ├── migrations/       # Versioned database migrations
│   │   ├── schema/           # Prisma model files
│   │   └── seed.ts           # Creates or updates the configured admin user
│   └── src/
│       ├── config/           # Environment validation
│       ├── lib/              # Prisma, tokens, mail, and Cloudinary setup
│       ├── middlewares/      # Authentication, validation, upload, errors
│       └── modules/          # Auth, OTP, files, and admin features
└── frontend/
    └── src/
        ├── app/              # Next.js routes and pages
        ├── components/       # Shared UI and feature components
        ├── hooks/            # API/query hooks
        ├── lib/              # API client and utilities
        ├── providers/        # Auth and query providers
        └── types/            # Frontend TypeScript types
```

## Setup instructions

### Requirements

- Node.js 24 or a compatible version supported by Prisma 7
- npm
- A PostgreSQL database (local or hosted)
- Cloudinary credentials for persistent file uploads
- SMTP credentials for email verification and password reset

### Install dependencies

Install each app separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env` and `frontend/.env.local` using the environment variable lists below. Do not commit either file.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production`; defaults to `development` |
| `PORT` | No | API port; defaults to `3000` (the hosting provider may set this automatically) |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `JWT_ACCESS_SECRET` | Yes | Secret used to sign access tokens; use a long random value |
| `JWT_REFRESH_SECRET` | Yes | Secret used to sign refresh tokens; use a separate long random value |
| `JWT_ACCESS_EXPIRES_IN` | No | Access-token lifetime; defaults to `15m` |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | No | Refresh-token lifetime in days; defaults to `7` |
| `OTP_SECRET` | Yes | Long random secret used to hash email verification and password reset codes |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP server port |
| `SMTP_USER` | Yes | SMTP username/login |
| `SMTP_PASS` | Yes | SMTP password or provider SMTP key |
| `MAIL_FROM` | Yes | Verified sender email address |
| `CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For uploads | Cloudinary API secret |
| `ADMIN_NAME` | For seed | Admin name; has a development default |
| `ADMIN_EMAIL` | For seed | Admin email; has a development default |
| `ADMIN_PASSWORD` | For seed | Admin password; set a strong value before running the seed script |

Generate unique random values for the JWT and OTP secrets. Never use the development admin defaults in a deployed environment.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | API base URL including `/api`, e.g. `http://localhost:3000/api` |

For production, set this in the frontend host's environment settings to the deployed backend URL, such as `https://your-api.example.com/api`.

## Database migration steps

Prisma configuration is in `backend/prisma.config.ts`; schema files are in `backend/prisma/schema/`.

1. Set `DATABASE_URL` in `backend/.env`.
2. Generate the Prisma Client:

   ```bash
   cd backend
   npx prisma generate
   ```

3. Apply the checked-in migrations to the database:

   ```bash
   npm run db:deploy
   ```

4. To create a new migration while developing after editing the schema, run:

   ```bash
   npm run db:migrate -- --name describe_your_change
   ```

5. Optionally create/update the admin account using `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, then run:

   ```bash
   npm run db:seed
   ```

Use `db:deploy` for staging and production. Do not use `migrate dev` against a production database.

## Running locally

Start the API in one terminal:

```bash
cd backend
npm run dev
```

Start the web app in another terminal:

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:3000` by default and the backend at `http://localhost:3000` by default, so change one port to avoid a conflict. For example, set `PORT=3001` in `backend/.env` and set `NEXT_PUBLIC_API_URL=http://localhost:3001/api` in `frontend/.env.local`.

## Deployment instructions

The app can be deployed as three services: Next.js frontend, Express backend, and PostgreSQL database. For example, use Vercel for the frontend, Render for the API, and Neon for PostgreSQL.

### Database

1. Create a PostgreSQL database with your provider.
2. Copy its connection URL into the backend host as `DATABASE_URL`.
3. Ensure the production deploy runs `npx prisma migrate deploy` before the API starts.

### Backend API

For a Render Web Service connected to this repository:

- Root directory: `backend`
- Build command: `npm ci --include=dev && npx prisma generate`
- Start command: `npx prisma migrate deploy && npx tsx src/index.ts`
- Add all required backend environment variables in the Render dashboard.

The API reads the host-provided `PORT`. Uploaded files are stored in Cloudinary because free web-service filesystems may be temporary. Render free services may sleep while idle, so the first request after inactivity can be slow. Render free services also block outbound SMTP on ports 25, 465, and 587; configure an SMTP provider and port reachable from the host (for example, Brevo on port 2525).

### Frontend

For a Vercel deployment:

- Root directory: `frontend`
- Framework preset: Next.js
- Add `NEXT_PUBLIC_API_URL=https://<your-backend-host>/api` in the Vercel project environment variables.
- Deploy and redeploy whenever the API URL changes.

These are example provider settings; free-tier limits and policies can change. The Vercel Hobby plan is intended for personal, non-commercial use. Check each provider's current terms and usage limits before deploying.

## Assumptions made

- The frontend and backend are deployed separately from their respective subdirectories.
- PostgreSQL, Cloudinary, and an SMTP provider are provisioned separately; this repository does not include production credentials.
- Uploaded files are expected to use Cloudinary for durable storage; local upload files are temporary.
- Email verification and password reset require a correctly configured SMTP sender.
- The `db:seed` command sets the admin account's name, email, password, role, and verified status to the configured `ADMIN_*` values each time it runs.
- Hosting provider interfaces, free plans, and limits can change; deployment commands above describe the current app structure and should be checked against provider documentation.
