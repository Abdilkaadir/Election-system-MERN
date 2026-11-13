import Election from '../models/Election.js';

export async function reconcileElectionStatuses() {
  const time = new Date();
  await Election.updateMany({ status: 'Scheduled', startDate: { $lte: time }, endDate: { $gt: time } }, { $set: { status: 'Active' } });
  await Election.updateMany({ status: { $in: ['Scheduled', 'Active'] }, endDate: { $lte: time } }, { $set: { status: 'Completed' } });
}

export function startElectionScheduler() {
  const run = () => reconcileElectionStatuses().catch(error => console.error('Election status update failed:', error.message));
  run();
  return setInterval(run, 30_000);
}
