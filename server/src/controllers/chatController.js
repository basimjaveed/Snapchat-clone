const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Snap = require('../models/Snap');

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
      // Ensure we only look at valid populated participants
      const validParticipants = conv.participants.filter(p => p && p._id);
      
      // Try to find the OTHER participant
      let other = validParticipants.find((p) => p._id.toString() !== userId.toString());
      
      // Fallback: if it's a conversation with self or other is missing, 
      // use the first participant or a dummy object
      if (!other && validParticipants.length > 0) {
        other = validParticipants[0];
      }

      const unread = conv.unreadCount?.get(userId.toString()) || 0;
      return {
        _id: conv._id,
        conversationId: conv.conversationId,
        friend: other || { displayName: 'Unknown User', username: 'unknown' },
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

    // Send Push Notification
    const receiver = await User.findById(receiverId).select('pushToken displayName');
    if (receiver && receiver.pushToken) {
      const { sendPushNotification } = require('../utils/notifications');
      sendPushNotification(
        receiver.pushToken,
        `${req.user.displayName}`,
        text.trim(),
        { type: 'message', conversationId }
      );
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const clearConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is member of conversation (if it exists)
    const conversation = await Conversation.findOne({ conversationId, participants: userId });

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    if (conversation) {
      // Update conversation record to reflect cleared status
      await Conversation.findOneAndUpdate(
        { conversationId },
        { 
          $set: { 
            lastMessage: null,
            [`unreadCount.${userId}`]: 0 
          } 
        }
      );
    }

    // Notify participants via socket
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (conversation) {
      conversation.participants.forEach(participantId => {
        const socketId = onlineUsers?.get(participantId.toString());
        if (socketId) {
          io.to(socketId).emit('conversation_cleared', { conversationId });
        }
      });
    }

    res.json({ success: true, message: 'Conversation cleared successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/chat/conversations/:conversationId
const deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    console.log(`🗑️ Deleting conversation ${conversationId} for user ${userId}`);

    // We can either delete the whole conversation or just "hide" it for this user.
    // For simplicity, we delete the conversation record and all messages.
    await Conversation.findOneAndDelete({ conversationId, participants: userId });
    await Message.deleteMany({ conversationId });

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, getMessages, sendMessage, clearConversation, deleteConversation };
