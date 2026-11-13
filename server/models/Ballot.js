import mongoose from 'mongoose';

const ballotSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
  chairpersonCandidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  deputyChairpersonCandidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', default: null },
  submittedAt: { type: Date, default: Date.now }
}, { versionKey: false });
export default mongoose.model('Ballot', ballotSchema);
