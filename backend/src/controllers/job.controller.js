const JobPost = require('../models/JobPost');

// POST /api/jobs — create a new job post
const createJob = async (req, res) => {
  try {
    const { title, description, category, isEmergency, budget, location, scheduledAt } = req.body;

    const job = await JobPost.create({
      title,
      description,
      category,
      isEmergency: isEmergency || false,
      budget: budget || 0,
      location: location || { address: 'Not specified', coordinates: [0, 0] },
      scheduledAt: scheduledAt || null,
      postedBy: req.user._id,
    });

    await job.populate('postedBy', 'name email role');

    // ── Real-time: broadcast new job to ALL connected clients ──
    const io = req.app.get('io');
    if (io) {
      io.emit('job:new', job);
    }

    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/jobs — get all open jobs (agents & customers can see)
const getJobs = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status) filter.status = status;
    else filter.status = { $in: ['open', 'assigned'] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const jobs = await JobPost.find(filter)
      .populate('postedBy', 'name email phone')
      .populate('assignedAgent', 'name email')
      .sort({ priority: 1, createdAt: -1 });

    res.json({ jobs, count: jobs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/jobs/:id — single job detail
const getJobById = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id)
      .populate('postedBy', 'name email phone')
      .populate('assignedAgent', 'name email phone skills')
      .populate('applicants.agent', 'name email skills rating hourlyRate');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/jobs/my/posts — jobs posted by current customer
const getMyJobs = async (req, res) => {
  try {
    const jobs = await JobPost.find({ postedBy: req.user._id })
      .populate('assignedAgent', 'name email skills rating')
      .populate('applicants.agent', 'name email skills rating hourlyRate')
      .sort({ createdAt: -1 });
    res.json({ jobs, count: jobs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/jobs/:id/apply — agent applies for a job
const applyForJob = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ message: 'Job is no longer open' });

    const alreadyApplied = job.applicants.some(
      (a) => a.agent.toString() === req.user._id.toString()
    );
    if (alreadyApplied) return res.status(400).json({ message: 'Already applied to this job' });

    job.applicants.push({ agent: req.user._id, message: req.body.message || '' });
    await job.save();
    await job.populate('applicants.agent', 'name email skills rating hourlyRate');

    // ── Real-time: notify the customer who posted this job ──
    const io = req.app.get('io');
    if (io) {
      const customerId = job.postedBy.toString();
      io.to(customerId).emit('job:applied', {
        jobId: job._id,
        agentName: req.user.name,
        jobTitle: job.title,
        applicantCount: job.applicants.length,
      });
      // Also broadcast updated job to all so applicant count refreshes
      io.emit('job:updated', { jobId: job._id, applicantCount: job.applicants.length });
    }

    res.json({ message: 'Application submitted', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/jobs/:id/assign — customer assigns agent
const assignAgent = async (req, res) => {
  try {
    const job = await JobPost.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.assignedAgent = req.body.agentId;
    job.status = 'assigned';
    await job.save();

    // ── Real-time: notify assigned agent ──
    const io = req.app.get('io');
    if (io) {
      io.to(req.body.agentId).emit('job:assigned', {
        jobId: job._id,
        jobTitle: job.title,
      });
      io.emit('job:statusChange', { jobId: job._id, status: 'assigned' });
    }

    res.json({ message: 'Agent assigned successfully', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/jobs/:id/status — update job status
const updateJobStatus = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.status = req.body.status;
    await job.save();

    // ── Real-time: broadcast status change ──
    const io = req.app.get('io');
    if (io) {
      io.emit('job:statusChange', { jobId: job._id, status: job.status });
    }

    res.json({ message: 'Status updated', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createJob, getJobs, getJobById, getMyJobs, applyForJob, assignAgent, updateJobStatus };
