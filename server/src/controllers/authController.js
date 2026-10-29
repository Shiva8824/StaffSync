const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Helper to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'staffsync_super_secret_jwt_key_2025_experiential_learning',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new employee user account
// @route   POST /api/auth/register
// @access  Public (Enforces Employee role only - HR accounts must be seeded or provisioned by HR)
const register = async (req, res, next) => {
  try {
    const { name, email, password, department, jobTitle, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Explicitly enforce role as 'Employee' for public registration
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'Employee',
      isActive: true,
    });

    await user.save();

    // Auto-generate employeeId
    const count = await Employee.countDocuments();
    const employeeId = `EMP-${String(count + 101).padStart(4, '0')}`;

    // Create associated Employee profile
    const employee = await Employee.create({
      employeeId,
      user: user._id,
      fullName: name,
      department: department || 'Engineering',
      jobTitle: jobTitle || 'Software Engineer',
      phoneNumber: phoneNumber || '',
      joiningDate: new Date(),
      employmentStatus: 'Active',
    });

    // Link employee profile to user
    user.employeeProfile = employee._id;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        employeeProfile: {
          id: employee._id,
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          department: employee.department,
          jobTitle: employee.jobTitle,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user and explicitly include password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('employeeProfile');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact Human Resources.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        employeeProfile: user.employeeProfile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'employeeProfile',
        populate: {
          path: 'manager',
          select: 'fullName employeeId jobTitle department',
        },
      });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client destroys token)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
