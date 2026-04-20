const express = require('express');
const router = express.Router();
const { searchUsers, getUserProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);

module.exports = router;
