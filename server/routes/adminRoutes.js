import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { unlink, readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { auditAdmin } from '../middleware/auditAdmin.js';
import * as admin from '../controllers/adminController.js';
const router = Router();
const imageUpload = multer({ storage: multer.diskStorage({ destination: 'uploads/', filename: (req, file, cb) => cb(null, `${randomUUID()}${({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' })[file.mimetype] || extname(file.originalname)}`) }), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype); cb(ok ? null : new Error('Use a JPG, PNG, or WebP image.'), ok); } });
async function validateImageFile(req, res, next) {
  if (!req.file) return next();
  try {
    const bytes = await readFile(req.file.path);
    const ok = req.file.mimetype === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : req.file.mimetype === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!ok) { await unlink(req.file.path); return res.status(400).json({ message: 'The uploaded file is not a valid image of the selected format.' }); }
    next();
  } catch (error) { next(error); }
}
router.use(requireAuth, requireAdmin, auditAdmin);
router.get('/overview', admin.overview);
router.get('/elections', admin.listElections); router.post('/elections', admin.createElection); router.put('/elections/:id', admin.updateElection); router.patch('/elections/:id/status', admin.setElectionStatus); router.delete('/elections/:id', admin.deleteElection);
router.get('/candidates', admin.listCandidates); router.post('/candidates', imageUpload.single('image'), validateImageFile, admin.createCandidate); router.put('/candidates/:id', imageUpload.single('image'), validateImageFile, admin.updateCandidate); router.delete('/candidates/:id', admin.deleteCandidate);
router.get('/admins', admin.listAdmins); router.post('/admins', admin.createAdmin);
router.get('/reports/:electionId', admin.reportSummary);
export default router;
