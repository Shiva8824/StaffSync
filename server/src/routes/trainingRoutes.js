const express = require('express');
const { body } = require('express-validator');
const {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  enrollTraining,
  deleteTraining,
} = require('../controllers/trainingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

const trainingValidation = [
  body('title').trim().notEmpty().withMessage('Training title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('trainer').trim().notEmpty().withMessage('Trainer name is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
  validate,
];

router.use(protect);

router
  .route('/')
  .get(getTrainings)
  .post(authorize('HR', 'Manager'), trainingValidation, createTraining);

router
  .route('/:id')
  .get(getTrainingById)
  .put(authorize('HR', 'Manager'), updateTraining)
  .delete(authorize('HR'), deleteTraining);

router.post('/:id/enroll', enrollTraining);

module.exports = router;
