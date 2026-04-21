const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, clearConversation } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', sendMessage);
router.delete('/messages/:conversationId/clear', clearConversation);

module.exports = router;
