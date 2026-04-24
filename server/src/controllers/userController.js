const { validationResult } = require('express-validator');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// GET /api/users/search?q=
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { displayName: regex }],
    })
      .select('_id username displayName avatar isOnline')
      .limit(20);

    // Attach friendship status to each result
    const currentUserId = req.user._id;
    const enriched = await Promise.all(
      users.map(async (u) => {
        // Prioritize 'accepted' status if multiple requests exist
        const request = await FriendRequest.findOne({
          $or: [
            { sender: currentUserId, receiver: u._id },
            { sender: u._id, receiver: currentUserId },
          ],
        }).sort({ status: 1 }); // 'accepted' comes before 'pending' alphabetically

        let friendStatus = 'none';
        if (request) {
          if (request.status === 'accepted') friendStatus = 'friends';
          else if (request.status === 'pending') {
            friendStatus = request.sender.equals(currentUserId) ? 'request_sent' : 'request_received';
          }
        }

        return { ...u.toObject(), friendStatus };
      })
    );

    res.json({ success: true, users: enriched });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, pushToken } = req.body;
    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (pushToken) updates.pushToken = pushToken;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    console.log(`🧨 Deleting account for user ${userId}`);

    // 1. Delete user from DB
    await User.findByIdAndDelete(userId);

    // 2. Cleanup related data
    await FriendRequest.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const Snap = require('../models/Snap');

    await Conversation.deleteMany({ participants: userId });
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Snap.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchUsers, getUserProfile, updateProfile, deleteAccount };
