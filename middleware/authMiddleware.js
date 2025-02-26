// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');

const authenticateAndAuthorize = (requiredRoles) => (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({
            message: 'No token provided',
            type: 'error'
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!requiredRoles.includes(decoded.role)) {
            return res.status(403).json({
                message: 'Forbidden',
                type: 'error'
            });
        }

        req.user = decoded; // Add decoded info to request for use in routes
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token',
            type: 'error'
        });
    }
};


module.exports = { authenticateAndAuthorize };
