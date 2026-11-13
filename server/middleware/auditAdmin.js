import AdminAudit from '../models/AdminAudit.js';

export function auditAdmin(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;
    const pieces = req.path.split('/').filter(Boolean);
    const targetType = pieces[0] || 'admin';
    const targetId = pieces[1] && pieces[1] !== 'import' ? pieces[1] : '';
    AdminAudit.create({ actorId: req.user.id, action: `${req.method} ${req.route?.path || req.path}`, targetType, targetId }).catch(error => console.error('Admin activity record failed:', error.message));
  });
  next();
}
