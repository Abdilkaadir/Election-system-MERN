# Zamzam University Election System

A MERN election app for managing candidates and collecting anonymous student-council ballots.

## Local setup

Requirements: Node.js 20+ and the MongoDB service installed on the computer.

1. Install dependencies from the project folder:

   ```sh
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

2. Configure `server/.env` directly. This workspace already has the active file with local and Atlas URIs; keep the credentials private. Election start and end times are entered in Somalia time (`Africa/Mogadishu`, UTC+3). At the start time, scheduled voting opens automatically; it closes at the end time.

3. Create the first admin once, using the local database:

   ```sh
   npm --prefix server run create-admin -- admin "your-password" "Administrator Name"
   ```

4. Start the app:

   ```sh
   npm run dev
   ```

The client is at `http://localhost:5173`; the API is at `http://localhost:5000`. The MongoDB database is named `Election-system` and can be viewed in Compass by connecting to `mongodb://localhost:27017`.

To switch between local MongoDB and Atlas, keep both URI variables in the ignored `server/.env` and switch `NODE_ENV`: use `NODE_ENV=development` for `MONGO_URI_DEV`, or comment that line and uncomment `NODE_ENV=production` to use `MONGO_URI_PRO`. Both URIs use the `Election-system` database. Keep Atlas credentials private and restart the server after switching. The login cookie follows `CLIENT_URL`, so using Atlas from `http://localhost` still allows local sign-in; set `CLIENT_URL` to your HTTPS app URL when deploying.

MongoDB creates the database and collections on the first write. The admin account creates the first `users` collection; election, candidate, and ballot collections are created as those records are added.

## How it works

- Admins create an election and register candidates for Guddoomiye and Guddoomiye ku xigeen.
- **Go to Election** opens the public voter page at `/vote`. It shows the next scheduled election’s candidates before the start time for preview; vote submission unlocks at the scheduled Somalia time and closes at the scheduled end time.
- Ballots contain both selections in one MongoDB document and do not include voter identity.
- Results are available to admins after an election ends.

There is no voter roster or voter login. As a result, the app cannot verify voter eligibility or prevent the same person from submitting another ballot. It does validate that both selected candidates belong to the open election and the correct positions.

## API summary

- Admin authentication: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Public voting: `GET /api/voting/active-election`, `GET /api/voting/candidates/:electionId`, `POST /api/voting/submit`
- Admin election, candidate, admin-user, overview, and report endpoints: `/api/admin`

Candidate images are stored as files in `server/uploads`. Keep `.env` files private; they are excluded from Git.
