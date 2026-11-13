import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true, lowercase: true, unique: true },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin'], required: true, default: 'admin' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
