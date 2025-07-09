import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Done'],
    default: 'Todo'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isBeingEdited: {
    type: Boolean,
    default: false
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Done'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to track status changes
taskSchema.pre('save', function(next) {
  if (this.isNew) {
    // For new tasks, add initial status to history
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.createdBy
    }];
  } else if (this.isModified('status')) {
    // For status updates, add to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.lastModifiedBy || this.createdBy || null
    });
  }
  this.lastModified = new Date();
  next();
});

taskSchema.index({ title: 1 }, { unique: true });

export default mongoose.model('Task', taskSchema);