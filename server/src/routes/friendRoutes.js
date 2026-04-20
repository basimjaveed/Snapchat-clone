const express = require('express');
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getFriends,
  getPendingRequests,
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/request', sendRequest);
router.put('/accept/:requestId', acceptRequest);
router.put('/reject/:requestId', rejectRequest);
router.get('/', getFriends);
router.get('/pending', getPendingRequests);

module.exports = router;
