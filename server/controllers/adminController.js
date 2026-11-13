import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Ballot from '../models/Ballot.js';

const allowedStatuses = ['Draft', 'Scheduled', 'Active', 'Completed', 'Cancelled'];
export async function overview(req, res) {
  const [totalElections, activeElections, completedElections, totalCandidates, ballotsCast] = await Promise.all([
    Election.countDocuments(), Election.countDocuments({ status: 'Active' }), Election.countDocuments({ status: 'Completed' }),
    Candidate.countDocuments(), Ballot.countDocuments()
  ]);
  res.json({ totalElections, activeElections, completedElections, totalCandidates, ballotsCast });
}
export async function listElections(req, res) {
  const elections = await Election.find().sort({ createdAt: -1 });
  const electionsWithBallots = new Set((await Ballot.distinct('electionId')).map(id => String(id)));
  res.json({ elections: elections.map(election => ({ ...election.toObject(), hasBallots: electionsWithBallots.has(election.id) })) });
}
export async function createElection(req, res) {
  const { name, startDate, endDate, status } = req.body;
  if (!name?.trim() || !startDate || !endDate) return res.status(400).json({ message: 'Election name, start time, and end time are required.' });
  if (status && !['Draft', 'Scheduled'].includes(status)) return res.status(400).json({ message: 'New elections must be Draft or Scheduled.' });
  const election = await Election.create({ ...req.body, createdBy: req.user.id, status: status || 'Draft' });
  res.status(201).json({ election });
}
export async function updateElection(req, res) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ message: 'Election not found.' });
  if (!['Draft', 'Scheduled', 'Completed'].includes(election.status) || await Ballot.exists({ electionId: election.id })) return res.status(409).json({ message: 'Only elections without submitted ballots can be edited or rescheduled.' });
  for (const key of ['name', 'description', 'electionType', 'academicYear', 'startDate', 'endDate', 'instructions', 'status']) {
    if (req.body[key] !== undefined) election[key] = req.body[key];
  }
  if (!['Draft', 'Scheduled'].includes(election.status)) return res.status(400).json({ message: 'Election status must be Draft or Scheduled while editing.' });
  if (election.status === 'Completed') election.status = 'Scheduled';
  await election.save(); res.json({ election });
}
export async function setElectionStatus(req, res) {
  const { status } = req.body;
  if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid election status.' });
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ message: 'Election not found.' });
  if (status === 'Active' && new Date() < election.startDate) return res.status(409).json({ message: 'This election cannot be activated before its scheduled start time.' });
  election.status = status; await election.save(); res.json({ election });
}
export async function deleteElection(req, res) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ message: 'Election not found.' });
  if (election.status === 'Completed' || await Ballot.exists({ electionId: election.id })) return res.status(409).json({ message: 'Elections with submitted ballots or completed status cannot be deleted.' });
  await Candidate.deleteMany({ electionId: election.id }); await Election.deleteOne({ _id: election.id }); res.json({ message: 'Election deleted.' });
}
export async function listCandidates(req, res) {
  const filter = {};
  if (req.query.electionId && mongoose.isValidObjectId(req.query.electionId)) filter.electionId = req.query.electionId;
  if (req.query.position) filter.position = req.query.position;
  res.json({ candidates: await Candidate.find(filter).populate('electionId', 'name status').sort({ createdAt: -1 }) });
}
export async function createCandidate(req, res) {
  const { fullName, electionId, position } = req.body;
  if (!fullName?.trim() || !mongoose.isValidObjectId(electionId) || !['chairperson', 'deputy'].includes(position)) return res.status(400).json({ message: 'Enter a name, election, and valid position.' });
  const election = await Election.findById(electionId);
  if (!election || !['Draft', 'Scheduled'].includes(election.status) || await Ballot.exists({ electionId: election.id })) return res.status(409).json({ message: 'Candidates can only be added to a draft or scheduled election before any votes are cast.' });
  const candidate = await Candidate.create({ ...req.body, image: req.file ? `/uploads/${req.file.filename}` : req.body.image || '' });
  res.status(201).json({ candidate });
}
export async function updateCandidate(req, res) {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });
  const targetElectionId = req.body.electionId || candidate.electionId;
  if (!mongoose.isValidObjectId(targetElectionId)) return res.status(400).json({ message: 'Select a valid election.' });
  const election = await Election.findById(targetElectionId);
  if (!election || !['Draft', 'Scheduled'].includes(election.status) || await Ballot.exists({ electionId: targetElectionId })) return res.status(409).json({ message: 'Candidates can only be edited in a draft or scheduled election before any votes are cast.' });
  for (const key of ['fullName', 'faculty', 'department', 'studentId', 'position', 'biography', 'status']) if (req.body[key] !== undefined) candidate[key] = req.body[key];
  candidate.electionId = targetElectionId;
  if (req.file) candidate.image = `/uploads/${req.file.filename}`;
  await candidate.save(); res.json({ candidate });
}
export async function deleteCandidate(req, res) {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });
  const election = await Election.findById(candidate.electionId);
  if (!election || !['Draft', 'Scheduled'].includes(election.status) || await Ballot.exists({ electionId: election.id })) return res.status(409).json({ message: 'Candidates can only be removed from a draft or scheduled election before any votes are cast.' });
  await candidate.deleteOne(); res.json({ message: 'Candidate removed.' });
}
export async function listAdmins(req, res) { res.json({ admins: await User.find({ role: 'admin' }).select('fullName username email isActive createdAt') }); }
export async function createAdmin(req, res) {
  const { fullName, username, password, email } = req.body;
  if (!fullName || !username || !password) return res.status(400).json({ message: 'Full name, username, and password are required.' });
  if (password.length < 10) return res.status(400).json({ message: 'Use a password with at least 10 characters.' });
  const user = await User.create({ fullName, username, email, password: await bcrypt.hash(password, 12), role: 'admin' });
  res.status(201).json({ admin: { id: user.id, fullName: user.fullName, username: user.username } });
}
export async function reportSummary(req, res) {
  const election = await Election.findById(req.params.electionId);
  if (!election) return res.status(404).json({ message: 'Election not found.' });
  if (election.status !== 'Completed' && election.endDate > new Date()) return res.status(403).json({ message: 'Results are available after the election has ended.' });
  const [ballotsCast, chair, deputy, hasDeputyCandidates] = await Promise.all([
    Ballot.countDocuments({ electionId: election.id }), aggregatePosition(election.id, 'chairperson'), aggregatePosition(election.id, 'deputy'),
    Candidate.exists({ electionId: election.id, position: 'deputy', status: 'Active' })
  ]);
  res.json({ summary: { ballotsCast }, chairperson: chair, deputy, hasDeputyCandidates: Boolean(hasDeputyCandidates) });
}
async function aggregatePosition(electionId, position) {
  const [counts, total] = await Promise.all([
    Ballot.aggregate([{ $match: { electionId: new mongoose.Types.ObjectId(electionId) } }, { $group: { _id: position === 'chairperson' ? '$chairpersonCandidateId' : '$deputyChairpersonCandidateId', votes: { $sum: 1 } } }, { $sort: { votes: -1 } }, { $lookup: { from: 'candidates', localField: '_id', foreignField: '_id', as: 'candidate' } }, { $unwind: '$candidate' }, { $project: { _id: 0, candidateId: '$_id', fullName: '$candidate.fullName', image: '$candidate.image', faculty: '$candidate.faculty', votes: 1 } }]),
    Ballot.countDocuments({ electionId })
  ]);
  const results = counts.map((row, i) => ({ ...row, percentage: total ? Number((row.votes * 100 / total).toFixed(2)) : 0, rank: i + 1 }));
  const tie = results.length > 1 && results[0].votes === results[1].votes;
  return { results, winner: results.length && !tie ? results[0] : null, tied: tie, validBallots: total };
}
