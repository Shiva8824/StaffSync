const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { createMultiNotification } = require('../services/notificationService');

// @desc    Get announcements (filtered by user role and department)
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.employeeProfile?.department || '';

    // Conditions for visibility:
    // HR sees all announcements
    // Managers see: 'All', 'Manager', or their department
    // Employees see: 'All', 'Employee', or their department
    let query = { publicationStatus: 'Published' };

    if (userRole === 'HR') {
      // HR can view all, including Drafts if requested
      if (req.query.status) {
        query.publicationStatus = req.query.status;
      } else {
        delete query.publicationStatus; // Show all to HR
      }
    } else if (userRole === 'Manager') {
      query.$or = [
        { audience: 'All' },
        { audience: 'Manager' },
        { audience: userDepartment },
      ];
    } else {
      // Employee
      query.$or = [
        { audience: 'All' },
        { audience: 'Employee' },
        { audience: userDepartment },
      ];
    }

    if (req.query.priority && req.query.priority !== 'All') {
      query.priority = req.query.priority;
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email role')
      .sort({ publicationDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single announcement by ID
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'name email role');
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private (HR, Manager)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, audience = 'All', priority = 'Normal', publicationStatus = 'Published' } = req.body;

    // Only HR can create organization-wide 'All' announcements
    if (audience === 'All' && req.user.role !== 'HR') {
      return res.status(403).json({
        success: false,
        message: 'Only HR administrators can create company-wide announcements',
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      audience,
      priority,
      publicationStatus,
      createdBy: req.user._id,
      publicationDate: new Date(),
    });

    // Notify appropriate users
    if (publicationStatus === 'Published') {
      let recipientUsers = [];
      if (audience === 'All') {
        recipientUsers = await User.find({ _id: { $ne: req.user._id }, isActive: true }).select('_id');
      } else if (audience === 'Manager') {
        recipientUsers = await User.find({ role: 'Manager', _id: { $ne: req.user._id }, isActive: true }).select('_id');
      } else if (audience === 'Employee') {
        recipientUsers = await User.find({ role: 'Employee', _id: { $ne: req.user._id }, isActive: true }).select('_id');
      }

      if (recipientUsers.length > 0) {
        await createMultiNotification({
          recipients: recipientUsers.map((u) => u._id),
          title: `New Announcement: ${title}`,
          message: content.length > 100 ? `${content.slice(0, 97)}...` : content,
          type: 'Announcement',
          link: '/announcements',
        });
      }
    }

    const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (HR, or creator)
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    if (req.user.role !== 'HR' && announcement.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit announcements you authored',
      });
    }

    const { title, content, audience, priority, publicationStatus } = req.body;
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (audience) {
      if (audience === 'All' && req.user.role !== 'HR') {
        return res.status(403).json({
          success: false,
          message: 'Only HR administrators can target announcements to All',
        });
      }
      announcement.audience = audience;
    }
    if (priority) announcement.priority = priority;
    if (publicationStatus) announcement.publicationStatus = publicationStatus;

    await announcement.save();

    const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (HR, or creator)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    if (req.user.role !== 'HR' && announcement.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete announcements you authored',
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
