const User = require('../models/User');

/**
 * @desc    Sync contacts with the server to find registered friends
 * @route   POST /api/contacts/sync
 * @access  Private
 */
exports.syncContacts = async (req, res) => {
  try {
    const { phoneNumbers } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ message: 'Please provide an array of phone numbers' });
    }

    // Find users whose phone number is in the provided list
    // We filter out the current user and return only public info
    const matchedUsers = await User.find({
      phoneNumber: { $in: phoneNumbers },
      _id: { $ne: req.user._id }
    }).select('_id username displayName avatar phoneNumber snapScore');

    res.json({
      success: true,
      count: matchedUsers.length,
      users: matchedUsers
    });
  } catch (error) {
    console.error('Error syncing contacts:', error);
    res.status(500).json({ message: 'Server error during contact sync' });
  }
};

/**
 * @desc    Update current user's phone number
 * @route   PUT /api/contacts/me
 * @access  Private
 */
exports.updateMyPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Simple normalization (in production use a library like libphonenumber-js)
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Check if phone number is already taken
    const existingUser = await User.findOne({ phoneNumber: normalizedPhone });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'This phone number is already linked to another account' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phoneNumber: normalizedPhone },
      { new: true }
    );

    res.json({
      success: true,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
