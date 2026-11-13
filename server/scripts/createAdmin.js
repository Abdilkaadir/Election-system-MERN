import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const [username, password, ...nameParts] = process.argv.slice(2);
const fullName = nameParts.join(' ');
if (!username || !password || !fullName) throw new Error('Usage: npm run create-admin -- <username> <password> <full name>');
await connectDB();
try {
  await User.create({ username, password: await bcrypt.hash(password, 12), fullName, role: 'admin' });
  console.log(`Administrator ${username} created.`);
} finally { await mongoose.disconnect(); }
