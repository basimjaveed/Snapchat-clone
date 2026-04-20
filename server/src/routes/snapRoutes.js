const express = require('express');
const router = express.Router();
const multer = require('multer');
const { sendSnap, getReceivedSnaps, viewSnap } = require('../controllers/snapController');
const { protect } = require('../middleware/auth');

// Multer config for buffer storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(protect);

router.post('/send', upload.single('media'), sendSnap);
router.get('/received', getReceivedSnaps);
router.put('/:id/view', viewSnap);

module.exports = router;
