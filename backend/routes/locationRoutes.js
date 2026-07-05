const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/locationController');

router.get('/', ctrl.getLocations);
router.post('/', protect, authorize('admin'), ctrl.createLocation);
router.put('/:id', protect, authorize('admin'), ctrl.updateLocation);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteLocation);

module.exports = router;
