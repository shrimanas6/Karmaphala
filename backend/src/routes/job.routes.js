const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  applyForJob,
  assignAgent,
  updateJobStatus,
} = require('../controllers/job.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getJobs);
router.post('/', protect, createJob);
router.get('/my/posts', protect, getMyJobs);
router.get('/:id', protect, getJobById);
router.post('/:id/apply', protect, applyForJob);
router.patch('/:id/assign', protect, assignAgent);
router.patch('/:id/status', protect, updateJobStatus);

module.exports = router;
