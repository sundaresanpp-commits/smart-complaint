const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.get('/', protect, ctrl.getMyNotifications);
router.put('/:id/read', protect, ctrl.markAsRead);
router.put('/read-all', protect, ctrl.markAllAsRead);

module.exports = router;
