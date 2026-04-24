const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const initSocket = (io, onlineUsers) => {
  // Authenticate socket connections with JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    const userName = socket.user.displayName || socket.user.username || 'Unknown User';
    console.log(`🟢 User connected: ${userName} (${userId})`);

    // Join a room specific to this user ID for multi-device support
    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    // Mark user online in DB
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Notify friends that this user is online
    socket.broadcast.emit('user_online', { userId });

    // ────────────────────────────────────────────
    // CHAT EVENTS
    // ────────────────────────────────────────────

    // Client sends: { receiverId, text }
    socket.on('send_message', async (data, ack) => {
      try {
        const { receiverId, text } = data;
        if (!receiverId || !text?.trim()) {
          return ack?.({ success: false, message: 'Invalid message data' });
        }

        const receiverIdStr = receiverId.toString();
        const conversationId = Message.getConversationId(userId, receiverIdStr);

        const message = await Message.create({
          conversationId,
          sender: socket.user._id,
          receiver: receiverIdStr,
          text: text.trim(),
        });

        await message.populate('sender', 'username displayName avatar');

        // Update conversation last message + unread count
        await Conversation.findOneAndUpdate(
          { conversationId },
          {
            conversationId,
            participants: [userId, receiverIdStr],
            lastMessage: message._id,
            lastMessageAt: message.createdAt,
            $inc: { [`unreadCount.${receiverIdStr}`]: 1 },
          },
          { upsert: true, new: true }
        );

        // Deliver to receiver's room (handles multiple devices)
        console.log(`📡 Emitting 'new_message' to room ${receiverIdStr}`);
        io.to(receiverIdStr).emit('new_message', { message });

        // Ack back to sender with saved message
        ack?.({ success: true, message });
      } catch (error) {
        console.error('send_message error:', error);
        ack?.({ success: false, message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', ({ receiverId }) => {
      if (!receiverId) return;
      io.to(receiverId.toString()).emit('user_typing', {
        userId,
        username: socket.user.displayName || socket.user.username || 'Someone',
      });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      if (!receiverId) return;
      io.to(receiverId.toString()).emit('user_stop_typing', { userId });
    });

    // Mark messages as read: { conversationId, senderId }
    socket.on('mark_read', async ({ conversationId, senderId }) => {
      try {
        if (!conversationId || !senderId) return;
        
        const senderIdStr = senderId.toString();
        await Message.updateMany(
          { conversationId, receiver: socket.user._id, read: false },
          { read: true, readAt: new Date() }
        );
        await Conversation.findOneAndUpdate(
          { conversationId },
          { $set: { [`unreadCount.${userId}`]: 0 } }
        );

        // Notify sender's room that messages are read
        io.to(senderIdStr).emit('messages_read', { conversationId, readBy: userId });
      } catch (error) {
        console.error('mark_read error:', error);
      }
    });

    // ────────────────────────────────────────────
    // DISCONNECT
    // ────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${userName}`);
      
      // Only delete from map if this was the last active socket for this user
      const room = io.sockets.adapter.rooms.get(userId);
      if (!room || room.size === 0) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        socket.broadcast.emit('user_offline', { userId, lastSeen: new Date() });
      }
    });
  });
};

module.exports = initSocket;
