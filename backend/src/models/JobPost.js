const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'electrician',
        'plumber',
        'driver',
        'purohit',
        'carpenter',
        'painter',
        'cleaner',
        'mechanic',
        'other',
      ],
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    budget: {
      type: Number,
      default: 0,
    },
    location: {
      address: {
        type: String,
        required: [true, 'Location address is required'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    priority: {
      type: Number,
      default: 3, // 1 = emergency, 2 = date-bound, 3 = standard
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    applicants: [
      {
        agent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        message: String,
      },
    ],
  },
  { timestamps: true }
);

// Compute priority before saving
jobPostSchema.pre('save', function () {
  if (this.isEmergency) {
    this.priority = 1;
  } else if (this.scheduledAt) {
    this.priority = 2;
  } else {
    this.priority = 3;
  }
});

module.exports = mongoose.model('JobPost', jobPostSchema);
