const Training = require('../models/Training');
const Employee = require('../models/Employee');
const { createNotification } = require('../services/notificationService');

// @desc    Get all training programs
// @route   GET /api/trainings
// @access  Private
const getTrainings = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    // Role-based visibility
    if (req.user.role === 'Employee') {
      const userDept = req.user.employeeProfile?.department || '';
      query.$or = [{ department: 'All' }, { department: userDept }];
    } else if (department && department !== 'All') {
      query.department = department;
    }

    const trainings = await Training.find(query)
      .populate('createdBy', 'name email role')
      .populate('participants.employee', 'fullName employeeId department jobTitle')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: trainings.length,
      trainings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single training program
// @route   GET /api/trainings/:id
// @access  Private
const getTrainingById = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('participants.employee', 'fullName employeeId department jobTitle');

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found',
      });
    }

    res.status(200).json({
      success: true,
      training,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new training program
// @route   POST /api/trainings
// @access  Private (HR, Manager)
const createTraining = async (req, res, next) => {
  try {
    const {
      title,
      description,
      trainer,
      department = 'All',
      startDate,
      endDate,
      maxParticipants = 30,
      status = 'Upcoming',
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Training end date cannot be earlier than start date',
      });
    }

    const training = await Training.create({
      title,
      description,
      trainer,
      department,
      startDate: start,
      endDate: end,
      maxParticipants,
      status,
      participants: [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Training program created successfully',
      training,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update training details or status
// @route   PUT /api/trainings/:id
// @access  Private (HR, Manager)
const updateTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found',
      });
    }

    const fields = [
      'title',
      'description',
      'trainer',
      'department',
      'startDate',
      'endDate',
      'maxParticipants',
      'status',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        training[field] = req.body[field];
      }
    });

    if (training.endDate < training.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Training end date cannot be earlier than start date',
      });
    }

    await training.save();

    const populated = await Training.findById(training._id)
      .populate('createdBy', 'name email role')
      .populate('participants.employee', 'fullName employeeId department jobTitle');

    res.status(200).json({
      success: true,
      message: 'Training program updated successfully',
      training: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in training program
// @route   POST /api/trainings/:id/enroll
// @access  Private (Self enrollment or Manager/HR enrolling an employee)
const enrollTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found',
      });
    }

    if (training.status === 'Completed' || training.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot enroll in a training program that is ${training.status.toLowerCase()}`,
      });
    }

    // Determine target employee
    let targetEmployeeId;
    if (req.body.employeeId && ['HR', 'Manager'].includes(req.user.role)) {
      targetEmployeeId = req.body.employeeId;
    } else {
      if (!req.user.employeeProfile) {
        return res.status(400).json({
          success: false,
          message: 'No associated employee profile found to enroll',
        });
      }
      targetEmployeeId = req.user.employeeProfile._id;
    }

    // Check duplicate enrollment
    const alreadyEnrolled = training.participants.some(
      (p) => p.employee.toString() === targetEmployeeId.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already enrolled in this training program',
      });
    }

    // Check capacity
    if (training.participants.length >= training.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'This training program has reached maximum enrollment capacity',
      });
    }

    // Enroll
    training.participants.push({
      employee: targetEmployeeId,
      enrolledAt: new Date(),
      status: 'Enrolled',
    });

    await training.save();

    // Notify employee
    const targetEmployee = await Employee.findById(targetEmployeeId).populate('user');
    if (targetEmployee && targetEmployee.user) {
      await createNotification({
        recipient: targetEmployee.user._id,
        title: 'Enrolled in Training Program',
        message: `You have been enrolled in "${training.title}" led by ${training.trainer}.`,
        type: 'Training',
        link: '/trainings',
      });
    }

    const updated = await Training.findById(training._id)
      .populate('createdBy', 'name email role')
      .populate('participants.employee', 'fullName employeeId department jobTitle');

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in training program',
      training: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete training program
// @route   DELETE /api/trainings/:id
// @access  Private (HR only)
const deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found',
      });
    }

    await training.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Training program removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  enrollTraining,
  deleteTraining,
};
