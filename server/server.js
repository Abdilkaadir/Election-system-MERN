import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startElectionScheduler } from './services/electionScheduler.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set JWT_SECRET to a random value of at least 32 characters.');
await connectDB();
startElectionScheduler();
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Election API listening on port ${port}.`));
