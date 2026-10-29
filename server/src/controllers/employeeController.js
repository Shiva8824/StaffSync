const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Get all employees (Filtered by role permissions)
// @route   GET /api/employees
// @access  Private (HR: all, Manager: team, Employee: self)
const getEmployees = async (req, res, next) => {
  try {
    const { department, status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    // Role-based visibility
    if (req.user.role === 'Manager') {
      // Managers only see their team or themselves
      if (!req.user.employeeProfile) {
        return res.status(200).json({ success: true, count: 0, employees: [], totalPages: 0, currentPage: 1 });
      }
      query.$or = [
        { manager: req.user.employeeProfile._id },
        { _id: req.user.employeeProfile._id },
      ];
    } else if (req.user.role === 'Employee') {
      // Employees only see their own profile
      if (!req.user.employeeProfile) {
        return res.status(200).json({ success: true, count: 0, employees: [], totalPages: 0, currentPage: 1 });
      }
      query._id = req.user.employeeProfile._id;
    }
    // HR sees all employees (no restriction)

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.employmentStatus = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('user', 'email role isActive')
      .populate('manager', 'fullName employeeId jobTitle department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee details by ID
// @route   GET /api/employees/:id
// @access  Private (HR, Manager for their team, or Employee for self)
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'email role isActive')
      .populate('manager', 'fullName employeeId jobTitle department');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    // Role permission check
    if (req.user.role === 'Employee') {
      if (!req.user.employeeProfile || req.user.employeeProfile._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You may only view your own employee record',
        });
      }
    } else if (req.user.role === 'Manager') {
      const isSelf = req.user.employeeProfile && req.user.employeeProfile._id.toString() === employee._id.toString();
      const isTeam = employee.manager && employee.manager._id.toString() === req.user.employeeProfile?._id.toString();
      if (!isSelf && !isTeam) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You may only view team members reporting to you',
        });
      }
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee record (and user account)
// @route   POST /api/employees
// @access  Private (HR only)
const createEmployee = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      role = 'Employee',
      department,
      jobTitle,
      phoneNumber,
      joiningDate,
      salary,
      manager,
      address,
      emergencyContact,
    } = req.body;

    // Check if user email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists',
      });
    }

    // Auto-generate unique Employee ID
    const count = await Employee.countDocuments();
    let empNumber = count + 101;
    let employeeId = `EMP-${String(empNumber).padStart(4, '0')}`;
    while (await Employee.findOne({ employeeId })) {
      empNumber += 1;
      employeeId = `EMP-${String(empNumber).padStart(4, '0')}`;
    }

    // Create user account
    const user = new User({
      name: fullName,
      email: email.toLowerCase(),
      password: password || 'Password123!',
      role: ['HR', 'Manager', 'Employee'].includes(role) ? role : 'Employee',
      isActive: true,
    });
    await user.save();

    // Create Employee record
    const employee = await Employee.create({
      employeeId,
      user: user._id,
      fullName,
      department: department || 'Engineering',
      jobTitle: jobTitle || 'Team Member',
      phoneNumber: phoneNumber || '',
      joiningDate: joiningDate || new Date(),
      employmentStatus: 'Active',
      salary: salary || 50000,
      manager: manager || null,
      address: address || {},
      emergencyContact: emergencyContact || {},
    });

    // Link user to employee profile
    user.employeeProfile = employee._id;
    await user.save();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('user', 'email role isActive')
      .populate('manager', 'fullName employeeId jobTitle department');

    res.status(201).json({
      success: true,
      message: 'Employee created and user account provisioned successfully',
      employee: populatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee information
// @route   PUT /api/employees/:id
// @access  Private (HR for all fields; Employee only permitted personal fields)
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    if (req.user.role === 'Employee') {
      // Employee can only update their own record and limited fields
      if (!req.user.employeeProfile || req.user.employeeProfile._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only update your own profile',
        });
      }

      // Permitted fields for employees: phoneNumber, address, emergencyContact
      if (req.body.phoneNumber !== undefined) employee.phoneNumber = req.body.phoneNumber;
      if (req.body.address) employee.address = { ...employee.address, ...req.body.address };
      if (req.body.emergencyContact) employee.emergencyContact = { ...employee.emergencyContact, ...req.body.emergencyContact };

      await employee.save();
    } else if (req.user.role === 'HR') {
      // HR has full update permissions
      const fields = [
        'fullName',
        'department',
        'jobTitle',
        'phoneNumber',
        'joiningDate',
        'employmentStatus',
        'manager',
        'salary',
        'address',
        'emergencyContact',
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          employee[field] = req.body[field] === '' ? null : req.body[field];
        }
      });

      // If fullName changed, also update User name
      if (req.body.fullName) {
        await User.findByIdAndUpdate(employee.user, { name: req.body.fullName });
      }

      // If user active status or role is updated
      if (req.body.role || req.body.isActive !== undefined) {
        const updateUserData = {};
        if (req.body.role) updateUserData.role = req.body.role;
        if (req.body.isActive !== undefined) updateUserData.isActive = req.body.isActive;
        await User.findByIdAndUpdate(employee.user, updateUserData);
      }

      await employee.save();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient privileges to update employee records',
      });
    }

    const updatedEmployee = await Employee.findById(employee._id)
      .populate('user', 'email role isActive')
      .populate('manager', 'fullName employeeId jobTitle department');

    res.status(200).json({
      success: true,
      message: 'Employee record updated successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate employee
// @route   DELETE /api/employees/:id
// @access  Private (HR only)
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    // Deactivate user account and set status to Terminated
    employee.employmentStatus = 'Terminated';
    await employee.save();

    await User.findByIdAndUpdate(employee.user, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Employee deactivated and employment status marked as Terminated',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
