import mongoose from 'mongoose';

const electionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, description: { type: String, default: '' },
  electionType: { type: String, default: 'Student Council Election' }, academicYear: { type: String, default: '' },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  status: { type: String, enum: ['Draft', 'Scheduled', 'Active', 'Completed', 'Cancelled'], default: 'Draft' },
  instructions: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

electionSchema.pre('validate', function () {
  if (this.endDate <= this.startDate) this.invalidate('endDate', 'End date must be after the start date.');
});
export default mongoose.model('Election', electionSchema);
