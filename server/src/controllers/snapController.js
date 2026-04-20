const Snap = require('../models/Snap');
const cloudinary = require('../config/cloudinary');
const Conversation = require('../models/Conversation');

// POST /api/snaps/send
const sendSnap = async (req, res, next) => {
  try {
    const { receiverId, duration, mediaType } = req.body;
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
    });

    // Update conversation to show "New Snap"
    const conversationId = [senderId.toString(), receiverId.toString()].sort().join('_');
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        conversationId,
        participants: [senderId, receiverId],
        lastMessageAt: new Date(),
        $inc: { [`unreadCount.${receiverId}`]: 1 },
      },
      { upsert: true }
    );

    // Notify receiver
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverSocketId = onlineUsers?.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_snap', { snap });
    }

    res.status(201).json({ success: true, snap });
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
    // But we might want to set a very short expiresAt now
    snap.expiresAt = new Date(+new Date() + snap.duration * 1000); 
    await snap.save();

    res.json({ success: true, message: 'Snap viewed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendSnap, getReceivedSnaps, viewSnap };
