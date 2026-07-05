const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/complaintController');

router.post('/', protect, upload.single('image'), ctrl.createComplaint);
router.get('/mine', protect, ctrl.getMyComplaints);
router.get('/map/locations', protect, ctrl.getMapData);
router.get('/:id', protect, ctrl.getComplaintById);
router.get('/', protect, authorize('staff', 'admin'), ctrl.getAllComplaints);
router.put('/:id/assign', protect, authorize('admin'), ctrl.assignComplaint);
router.put('/:id/status', protect, authorize('staff', 'admin'), ctrl.updateStatus);
router.post('/:id/feedback', protect, ctrl.submitFeedback);

module.exports = router;
