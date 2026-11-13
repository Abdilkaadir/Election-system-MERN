import mongoose from 'mongoose';

export async function connectDB() {
  const environment = (process.env.NODE_ENV || 'development').toLowerCase();
  const localEnvironment = environment === 'development';
  const variableName = localEnvironment ? 'MONGO_URI_DEV' : 'MONGO_URI_PRO';
  const uri = process.env[variableName];
  if (!uri) throw new Error(`${variableName} is missing. Add it to server/.env.`);
  await mongoose.connect(uri);
  console.log(`MongoDB connected (${environment}) (${mongoose.connection.name}).`);
}
