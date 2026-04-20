const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

// Check if two users are friends
const areFriends = async (userId1, userId2) => {
  const request = await FriendRequest.findOne({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 },
    ],
    status: 'accepted',
  });
  return !!request;
};

// GET /api/chat/conversations
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'username displayName avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort('-lastMessageAt');

    const formatted = conversations.map((conv) => {
      const other = conv.participants.find((p) => !p._id.equals(userId));
      const unread = conv.unreadCount?.get(userId.toString()) || 0;
      return {
        _id: conv._id,
        conversationId: conv.conversationId,
        friend: other,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: unread,
      };
    });

    res.json({ success: true, conversations: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/messages/:conversationId
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { cursor, limit = 30 } = req.query;

    const query = { conversationId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('sender', 'username displayName avatar');

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    // Reset unread count for this user
    await Conversation.findOneAndUpdate(
      { conversationId },
      { $set: { [`unreadCount.${req.user._id}`]: 0 } }
    );

    res.json({
      success: true,
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit),
      nextCursor: messages.length > 0 ? messages[0].createdAt : null,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/chat/messages
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const friends = await areFriends(senderId, receiverId);
    if (!friends) {
      return res.status(403).json({ success: false, message: 'You can only message friends' });
    }

    const conversationId = Message.getConversationId(senderId, receiverId);

    const message = await Message.create({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      text: text.trim(),
    });

    await message.populate('sender', 'username displayName avatar');

    // Upsert conversation record
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        conversationId,
        participants: [senderId, receiverId],
        lastMessage: message._id,
        lastMessageAt: message.createdAt,
        $inc: { [`unreadCount.${receiverId}`]: 1 },
      },
      { upsert: true, new: true }
    );

    // Emit via socket
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverSocketId = onlineUsers?.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_message', { message });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, getMessages, sendMessage };
