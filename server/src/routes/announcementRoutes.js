const express = require('express');
const { body } = require('express-validator');
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

const announcementValidation = [
  body('title').trim().notEmpty().withMessage('Announcement title is required'),
  body('content').trim().notEmpty().withMessage('Announcement content is required'),
  validate,
];

router.use(protect);

router
  .route('/')
  .get(getAnnouncements)
  .post(authorize('HR', 'Manager'), announcementValidation, createAnnouncement);

router
  .route('/:id')
  .get(getAnnouncementById)
  .put(authorize('HR', 'Manager'), updateAnnouncement)
  .delete(authorize('HR', 'Manager'), deleteAnnouncement);

module.exports = router;
