import mongoose from 'mongoose';
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Ballot from '../models/Ballot.js';

const now = () => new Date();
export async function activeElection(req, res) {
  const time = now();
  const elections = await Election.find({ status: { $in: ['Active', 'Scheduled'] }, endDate: { $gt: time } }).sort({ startDate: 1 });
  const election = elections.find(item => item.startDate <= time) || elections.find(item => item.status === 'Scheduled');
  if (!election) return res.json({ election: null });
  res.json({ election: { id: election.id, name: election.name, instructions: election.instructions, startDate: election.startDate, endDate: election.endDate, canVote: election.startDate <= time && election.endDate > time } });
}
export async function candidates(req, res) {
  if (!mongoose.isValidObjectId(req.params.electionId)) return res.status(400).json({ message: 'Invalid election.' });
  const election = await Election.findById(req.params.electionId);
  if (!election) return res.status(404).json({ message: 'Election not found.' });
  const time = now();
  if (time >= election.endDate || !['Active', 'Scheduled'].includes(election.status) || (time < election.startDate && election.status !== 'Scheduled')) return res.status(403).json({ message: 'Candidates are not available for this election.' });
  const rows = await Candidate.find({ electionId: election.id, status: 'Active' }).select('fullName image position');
  const chairperson = rows.filter(c => c.position === 'chairperson');
  const deputy = rows.filter(c => c.position === 'deputy');
  res.json({ chairperson, deputy, requiresDeputy: deputy.length > 0 });
}
export async function submitVote(req, res) {
  const { electionId, chairpersonCandidateId, deputyChairpersonCandidateId } = req.body;
  if (![electionId, chairpersonCandidateId].every(mongoose.isValidObjectId) || (deputyChairpersonCandidateId && !mongoose.isValidObjectId(deputyChairpersonCandidateId))) return res.status(400).json({ message: 'Select a valid candidate.' });
  const time = now();
  const election = await Election.findOne({ _id: electionId, status: { $in: ['Active', 'Scheduled'] }, startDate: { $lte: time }, endDate: { $gt: time } });
  if (!election) return res.status(409).json({ message: 'Voting is not open for this election.' });
  const [selected, deputyCandidateExists] = await Promise.all([
    Candidate.find({ _id: { $in: [chairpersonCandidateId, deputyChairpersonCandidateId].filter(Boolean) }, electionId, status: 'Active' }),
    Candidate.exists({ electionId, position: 'deputy', status: 'Active' })
  ]);
  const chair = selected.find(c => c.id === chairpersonCandidateId && c.position === 'chairperson');
  const deputy = selected.find(c => c.id === deputyChairpersonCandidateId && c.position === 'deputy');
  if (!chair || (deputyCandidateExists && !deputy) || (!deputyCandidateExists && deputyChairpersonCandidateId)) return res.status(400).json({ message: 'Choose one active candidate for each available position.' });
  await Ballot.create({ electionId, chairpersonCandidateId, deputyChairpersonCandidateId: deputy?.id || null, submittedAt: time });
  res.status(201).json({ message: 'Your vote has been submitted. Thank you for participating.' });
}
