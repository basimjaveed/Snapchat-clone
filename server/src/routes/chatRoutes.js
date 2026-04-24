const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, clearConversation, deleteConversation } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', sendMessage);
router.delete('/messages/:conversationId/clear', clearConversation);
router.delete('/delete/:conversationId', deleteConversation);

module.exports = router;
