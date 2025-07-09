import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { authenticate } from '../middleware/auth.js';
import { io } from '../index.js';

const router = express.Router();

// Get all tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Check for unique title and column name validation
    const columnNames = ['Todo', 'In Progress', 'Done'];
    if (columnNames.includes(title)) {
      return res.status(400).json({ message: 'Task title cannot match column names' });
    }

    const existingTask = await Task.findOne({ title });
    if (existingTask) {
      return res.status(400).json({ message: 'Task title must be unique' });
    }

    const task = new Task({
      title,
      description,
      priority: priority || 'Medium',
      createdBy: req.userId
    });

    await task.save();
    await task.populate('createdBy', 'username email');

    // Log activity
    const activity = new Activity({
      action: 'created',
      taskId: task._id,
      userId: req.userId,
      details: { title }
    });
    await activity.save();

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check for unique title if changing
    if (title && title !== task.title) {
      const columnNames = ['Todo', 'In Progress', 'Done'];
      if (columnNames.includes(title)) {
        return res.status(400).json({ message: 'Task title cannot match column names' });
      }

      const existingTask = await Task.findOne({ title });
      if (existingTask) {
        return res.status(400).json({ message: 'Task title must be unique' });
      }
    }

    const oldStatus = task.status;
    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo !== undefined) {
      updates.assignedTo = assignedTo || null;
    }
    updates.lastModified = new Date();
    updates.lastModifiedBy = req.userId;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('assignedTo', 'username email')
     .populate('createdBy', 'username email');

    // Log activity
    let action = 'updated';
    if (status && status !== oldStatus) {
      action = 'moved';
    }
    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
      action = 'assigned';
    }

    const activity = new Activity({
      action,
      taskId: task._id,
      userId: req.userId,
      details: updates
    });
    await activity.save();

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Smart assign task
router.post('/:id/smart-assign', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is already assigned
    if (task.assignedTo) {
      return res.status(400).json({ message: 'Task is already assigned' });
    }

    // Get all users
    const users = await User.find();
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'No users available for assignment' });
    }
    
    // Count active tasks for each user
    const userTaskCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Task.countDocuments({
          assignedTo: user._id,
          status: { $in: ['Todo', 'In Progress'] }
        });
        return { user, count };
      })
    );

    // Find user with fewest active tasks
    const userWithFewestTasks = userTaskCounts.reduce((min, current) => 
      current.count < min.count ? current : min
    );

    // Assign task to that user
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo: userWithFewestTasks.user._id,
        lastModified: new Date(),
        lastModifiedBy: req.userId
      },
      { new: true }
    ).populate('assignedTo', 'username email')
     .populate('createdBy', 'username email');

    // Log activity
    const activity = new Activity({
      action: 'smart_assigned',
      taskId: task._id,
      userId: req.userId,
      details: { 
        assignedTo: userWithFewestTasks.user.username,
        activeTasks: userWithFewestTasks.count
      }
    });
    await activity.save();

    res.json(updatedTask);
  } catch (error) {
    console.error('Smart assign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Log activity
    const activity = new Activity({
      action: 'deleted',
      taskId: task._id,
      userId: req.userId,
      details: { title: task.title }
    });
    await activity.save();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.find().select('username email');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;