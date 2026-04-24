const express = require('express');
const router = express.Router();
const { syncContacts, updateMyPhoneNumber } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/sync', syncContacts);
router.put('/me', updateMyPhoneNumber);

module.exports = router;
