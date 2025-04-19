// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Check if token exists in cookies
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).render('error', {
      message: 'Not authorized to access this route',
      error: { status: 401 }
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).render('error', {
      message: 'Not authorized to access this route',
      error: { status: 401 }
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('error', {
        message: `User role ${req.user.role} is not authorized to access this route`,
        error: { status: 403 }
      });
    }
    next();
  };
};