const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/analytics', ctrl.getAnalytics);
router.get('/summary', ctrl.getAISummary);
router.get('/users', ctrl.getUsers);
router.post('/users', ctrl.createStaffUser);
router.put('/users/:id/deactivate', ctrl.toggleUserActive);
router.post('/escalate', ctrl.runEscalation);
router.get('/export/pdf', ctrl.exportPDF);
router.get('/export/excel', ctrl.exportExcel);

module.exports = router;
