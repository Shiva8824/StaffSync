const express = require('express');
const { body } = require('express-validator');
const {
  applyLeave,
  getMyLeaves,
  getLeavesForReview,
  reviewLeave,
  cancelLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

const leaveValidation = [
  body('leaveType').notEmpty().withMessage('Leave type is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
  body('reason').trim().notEmpty().withMessage('Reason for leave is required'),
  validate,
];

router.use(protect);

router.post('/', leaveValidation, applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/', authorize('Manager', 'HR'), getLeavesForReview);
router.patch('/:id/review', authorize('Manager', 'HR'), reviewLeave);
router.patch('/:id/cancel', cancelLeave);

module.exports = router;
