import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const secureCookie = () => process.env.CLIENT_URL?.startsWith('https://') ?? process.env.NODE_ENV === 'production';
const cookieOptions = () => ({ httpOnly: true, secure: secureCookie(), sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' });
export async function login(req, res) {
  const { username, password } = req.body;
  if (!username?.trim() || !password) return res.status(400).json({ message: 'Enter your username and password.' });
  const user = await User.findOne({ username: username.trim().toLowerCase(), role: 'admin' }).select('+password');
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Username or password is incorrect.' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', token, cookieOptions()).json({ user: { id: user.id, fullName: user.fullName, role: user.role } });
}
export function logout(req, res) { res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: secureCookie(), path: '/' }).json({ message: 'Signed out.' }); }
export function me(req, res) { res.json({ user: { id: req.user.id, fullName: req.user.fullName, role: req.user.role } }); }
