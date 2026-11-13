import mongoose from 'mongoose';

const adminAuditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, default: '' },
  occurredAt: { type: Date, default: Date.now }
}, { versionKey: false });
export default mongoose.model('AdminAudit', adminAuditSchema);
