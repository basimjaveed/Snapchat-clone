const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

// POST /api/friends/request
const sendRequest = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.equals(receiverId)) {
      return res.status(400).json({ success: false, message: "You can't send a friend request to yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if any request exists in either direction
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ success: false, message: 'You are already friends' });
      }
      if (existing.status === 'pending') {
        return res.status(409).json({ success: false, message: 'Friend request already exists' });
      }
      // If rejected, allow resend by updating
      existing.status = 'pending';
      existing.sender = senderId;
      existing.receiver = receiverId;
      await existing.save();
    } else {
      await FriendRequest.create({ sender: senderId, receiver: receiverId });
    }

    // Emit socket notification to receiver if online
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverSocketId = onlineUsers?.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('friend_request_received', {
        from: req.user.toPublicJSON(),
      });
    }

    res.status(201).json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/friends/accept/:requestId
const acceptRequest = async (req, res, next) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId).populate('sender', 'username displayName avatar isOnline');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }
    if (!request.receiver.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'accepted';
    await request.save();

    // Notify sender they were accepted
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const senderSocketId = onlineUsers?.get(request.sender._id.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit('friend_request_accepted', {
        by: req.user.toPublicJSON(),
      });
    }

    res.json({ success: true, message: 'Friend request accepted', friend: request.sender });
  } catch (error) {
    next(error);
  }
};

// PUT /api/friends/reject/:requestId
const rejectRequest = async (req, res, next) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) return res.status(404).json({ success: false, message: 'Friend request not found' });
    if (!request.receiver.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    next(error);
  }
};

// GET /api/friends
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'accepted',
    })
      .populate('sender', 'username displayName avatar isOnline lastSeen')
      .populate('receiver', 'username displayName avatar isOnline lastSeen');

    const friends = requests.map((r) => (r.sender._id.equals(userId) ? r.receiver : r.sender));

    res.json({ success: true, friends });
  } catch (error) {
    next(error);
  }
};

// GET /api/friends/pending
const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending',
    })
      .populate('sender', 'username displayName avatar')
      .sort('-createdAt');

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/friends/:friendId
const removeFriend = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;
    console.log(`👤 Removing friend ${friendId} for user ${userId}`);

    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
      status: 'accepted',
    });

    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendRequest, acceptRequest, rejectRequest, getFriends, getPendingRequests, removeFriend };
