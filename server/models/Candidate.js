import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true }, image: { type: String, default: '' },
  faculty: { type: String, default: '' }, department: { type: String, default: '' }, studentId: { type: String, default: '' },
  position: { type: String, enum: ['chairperson', 'deputy'], required: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
  biography: { type: String, default: '' }, status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
candidateSchema.index({ electionId: 1, position: 1, fullName: 1 });
export default mongoose.model('Candidate', candidateSchema);
