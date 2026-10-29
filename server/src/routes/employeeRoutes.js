const express = require('express');
const { body } = require('express-validator');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

const employeeCreationValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email address is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  validate,
];

router.use(protect);

router
  .route('/')
  .get(getEmployees)
  .post(authorize('HR'), employeeCreationValidation, createEmployee);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(authorize('HR'), deleteEmployee);

module.exports = router;
