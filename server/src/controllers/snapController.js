const Snap = require('../models/Snap');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// POST /api/snaps/send
const sendSnap = async (req, res, next) => {
  try {
    const { receiverId, duration, mediaType, filter, isMirrored } = req.body;
    const senderId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file provided' });
    }

    // Upload to Cloudinary (buffer if using multer.memoryStorage or file path)
    // For simplicity, we assume multer is configured to provide the file buffer or path
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'snaps', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const snap = await Snap.create({
      sender: senderId,
      receiver: receiverId,
      mediaUrl: result.secure_url,
      mediaType: mediaType || 'image',
      duration: duration || 5,
      filter: filter || 'none',
      isMirrored: isMirrored === 'true',
    });

    const conversationId = [senderId.toString(), receiverId.toString()].sort().join('_');

    // Create a Message entry so it shows up in the chat conversation
    const message = await Message.create({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      text: 'Sent a Snap',
      mediaUrl: result.secure_url,
      mediaId: snap._id,
      type: 'snap',
    });

    await message.populate('sender', 'username displayName avatar');

    const conversation = await Conversation.findOne({ conversationId });
    
    let streakUpdate = {};
    const now = new Date();

    if (conversation && conversation.streak) {
      const { streak } = conversation;
      const lastSnapAt = streak.lastSnapAt;
      const lastSenderId = streak.lastSenderId;

      if (!lastSnapAt) {
        streakUpdate = {
          'streak.count': 1,
          'streak.lastSnapAt': now,
          'streak.lastSenderId': senderId,
        };
      } else {
        const hoursSinceLast = (now - lastSnapAt) / (1000 * 60 * 60);

        if (hoursSinceLast > 48) {
          // Streak expired
          streakUpdate = {
            'streak.count': 1,
            'streak.lastSnapAt': now,
            'streak.lastSenderId': senderId,
          };
        } else if (hoursSinceLast > 22) { // Using 22h to be a bit more lenient than strict 24h
          // New day streak continuation
          if (lastSenderId && lastSenderId.toString() !== senderId.toString()) {
            streakUpdate = {
              'streak.count': streak.count + 1,
              'streak.lastSnapAt': now,
              'streak.lastSenderId': senderId,
            };
          } else {
            streakUpdate = { 'streak.lastSnapAt': now };
          }
        } else {
          // Just update timestamp/sender within the same day
          streakUpdate = {
            'streak.lastSnapAt': now,
            'streak.lastSenderId': senderId,
          };
        }
      }
    } else {
      streakUpdate = {
        'streak.count': 1,
        'streak.lastSnapAt': now,
        'streak.lastSenderId': senderId,
      };
    }

    // Update conversation to show the message, unread count, and streak
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        conversationId,
        participants: [senderId, receiverId],
        lastMessage: message._id,
        lastMessageAt: new Date(),
        $inc: { [`unreadCount.${receiverId}`]: 1 },
        $set: streakUpdate,
      },
      { upsert: true, new: true }
    );

    // Notify receiver via socket
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverSocketId = onlineUsers?.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_snap', { snap });
      io.to(receiverSocketId).emit('new_message', { message });
    }

    // Send Push Notification
    const receiver = await User.findById(receiverId).select('pushToken displayName');
    if (receiver && receiver.pushToken) {
      const { sendPushNotification } = require('../utils/notifications');
      sendPushNotification(
        receiver.pushToken,
        'New Snap! ⚡',
        `${req.user.displayName} sent you a snap.`,
        { type: 'snap', snapId: snap._id }
      );
    }

    res.status(201).json({ success: true, snap });

    // Schedule deletion from Cloudinary after 30 minutes
    const publicId = result.public_id;
    setTimeout(async () => {
      try {
        console.log(`Auto-deleting Cloudinary asset: ${publicId}`);
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error(`Failed to auto-delete asset ${publicId}:`, err);
      }
    }, 30 * 60 * 1000); // 30 minutes
  } catch (error) {
    next(error);
  }
};

// GET /api/snaps/received
const getReceivedSnaps = async (req, res, next) => {
  try {
    const snaps = await Snap.find({ 
      receiver: req.user._id, 
      viewed: false 
    })
    .populate('sender', 'username displayName avatar')
    .sort('-createdAt');

    res.json({ success: true, snaps });
  } catch (error) {
    next(error);
  }
};

// PUT /api/snaps/:id/view
const viewSnap = async (req, res, next) => {
  try {
    const snap = await Snap.findById(req.params.id);
    if (!snap) return res.status(404).json({ success: false, message: 'Snap not found' });
    
    if (!snap.receiver.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    snap.viewed = true;
    snap.viewedAt = new Date();
    // After viewing, it will be deleted by TTL index eventually
    snap.expiresAt = new Date(+new Date() + snap.duration * 1000); 
    await snap.save();

    // Also delete the message from the chat timeline so it "disappears"
    const message = await Message.findOneAndDelete({ mediaId: snap._id });
    
    // Notify clients to remove this message from their state
    if (message) {
      const io = req.app.get('io');
      io.emit('message_deleted', { 
        messageId: message._id, 
        conversationId: message.conversationId 
      });
    }

    res.json({ success: true, message: 'Snap viewed and removed from chat' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendSnap, getReceivedSnaps, viewSnap };
