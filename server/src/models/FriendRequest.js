const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent duplicate requests between same two users
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
// Fast lookup by receiver (pending requests)
friendRequestSchema.index({ receiver: 1, status: 1 });
// Fast lookup by sender
friendRequestSchema.index({ sender: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
