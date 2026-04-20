const mongoose = require('mongoose');

const snapSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    duration: {
      type: Number,
      default: 5, // Default 5 seconds
    },
    viewed: {
      type: Boolean,
      default: false,
    },
    viewedAt: {
      type: Date,
      default: null,
    },
    // We will set this when viewed, or use a separate logic
    // Actually, let's use a standard expiry for non-viewed snaps too (e.g. 24h)
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: { expires: 0 }, // TTL index
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Snap', snapSchema);
