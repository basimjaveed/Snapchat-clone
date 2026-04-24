const express = require('express');
const router = express.Router();
const { searchUsers, getUserProfile, updateProfile, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);
router.delete('/me', deleteAccount);

// Handle invalid ObjectId for /users/new or other non-ObjectId routes
router.get('/new', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = router;
