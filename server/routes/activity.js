import express from 'express';
import Activity from '../models/Activity.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get last 20 activities
router.get('/', authenticate, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('userId', 'username')
      .populate('taskId', 'title')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;