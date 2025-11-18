# Urban Bhatti – Restaurant Web

Full-stack Next.js 14 (App Router) platform for Urban Bhatti with menu browsing, cart and ordering workflow, member dashboard, and an admin control panel featuring live order management and sales analytics.

## Features

- Next.js 14 App Router with TypeScript and Tailwind CSS
- MongoDB + Mongoose persistence with cached connections
- NextAuth (Credentials) authentication for admin and guests
- Guest registration with profile management
- Client-side cart with geolocation capture on checkout
- Admin dashboard for menu CRUD, order management, and Chart.js analytics
- Seed script to bootstrap admin credentials and sample menu items

## Tech Stack

- Next.js 14, React 18
- TypeScript, Tailwind CSS
- MongoDB, Mongoose
- NextAuth.js (Credentials provider)
- Chart.js & react-chartjs-2

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file** (`.env.local`)
   
   Create a `.env.local` file in the root directory with the following variables:
   
   ```bash
   # Firebase Configuration (Required)
   # Get these from Firebase Console: https://console.firebase.google.com/
   # Project Settings > General > Your apps > Web app
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   
   # Firebase Admin SDK (Required for server-side operations)
   # Get from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here
   ```
   
   **Note:** The build will work without these variables, but Firebase features (authentication, database, etc.) will not function. Make sure to set all Firebase variables for full functionality.

3. **Seed database** (creates admin + sample menu)
   ```bash
   npm run seed
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Scripts

- `npm run dev` – start Next.js dev server
- `npm run build` – create production build
- `npm run start` – run production server
- `npm run lint` – lint source
- `npm run seed` – execute `lib/seed.ts`

## Authentication

- **Admin** – seed uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables.
- **Guest** – register via the sign-up form on the homepage; credentials are stored securely using bcrypt hashes.

## Admin Dashboard

- Manage menu items (create, update, delete)
- Monitor orders and update statuses in real time
- Review sales analytics (daily + weekly) rendered with Chart.js

## Testing

- **TypeScript check**
  ```bash
  npx tsc --noEmit
  ```
- **Smoke test**
  ```bash
  npm run dev
  ```
  Verify home (`/`), menu API (`/api/menu`), and auth (`/api/auth/signin`).

## Deployment

Deploy to Vercel or any Node.js host:

1. Set environment variables (`MONGODB_URI`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXTAUTH_URL`).
2. Run `npm install && npm run build` on the server.
3. Start with `npm run start`.

Enjoy serving Urban Bhatti favorites online! 🍽️

