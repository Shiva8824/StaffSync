const express = require('express');
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendanceHistory,
  getTeamAttendance,
  getAllAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/my-history', getMyAttendanceHistory);
router.get('/team', authorize('Manager', 'HR'), getTeamAttendance);
router.get('/all', authorize('HR'), getAllAttendance);

module.exports = router;
