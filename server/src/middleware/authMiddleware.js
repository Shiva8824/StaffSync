const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'staffsync_super_secret_jwt_key_2025_experiential_learning'
      );

      // Fetch user without password, populate employee profile
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('employeeProfile');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists or token is invalid',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact HR.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided',
    });
  }
};

module.exports = { protect };
