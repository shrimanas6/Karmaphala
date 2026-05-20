const User = require('../models/User');

// GET /api/agents — list agents, optionally filter by skill + geo
const getAgents = async (req, res) => {
  try {
    const { skill, available, search } = req.query;

    const filter = { role: 'agent' };

    if (skill && skill !== 'all') filter.skills = { $in: [skill] };
    if (available === 'true') filter.isAvailable = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const agents = await User.find(filter)
      .select('-password')
      .sort({ rating: -1, isAvailable: -1 });

    res.json({ agents, count: agents.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/agents/:id
const getAgentById = async (req, res) => {
  try {
    const agent = await User.findOne({ _id: req.params.id, role: 'agent' }).select('-password');
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    res.json({ agent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/agents/availability — toggle availability
const toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ message: `You are now ${user.isAvailable ? 'available' : 'offline'}`, isAvailable: user.isAvailable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/agents/profile — update agent profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, skills, hourlyRate, serviceRadius } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, bio, skills, hourlyRate, serviceRadius },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAgents, getAgentById, toggleAvailability, updateProfile };
