const asyncHandler = require('express-async-handler');
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// Register Admin
const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email, name });
    if (adminExists) {
        return res.status(400).json({
            message: 'Admin already exists',
            type: 'error'
        });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const admin = await Admin.create({
        name,
        email,
        password: hashedPassword,
    });

    if (admin) {
        res.status(201).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            message: 'Admin registered successfully',
            type: 'success'
        });
    } else {
        res.status(400).json({
            message: 'Invalid admin data',
            type: 'error'
        });
    }
});

// Login Admin
const loginAdmin = asyncHandler(async (req, res) => {
    const { name, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ name });
    if (!admin) {
        return res.status(401).json({
            message: 'Invalid credentials',
            type: 'error'
        });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return res.status(401).json({
            message: 'Invalid credentials',
            type: 'error'
        });
    }

    // Generate token and send response
    res.status(200).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id, "admin"),
        message: 'Admin logged in successfully',
        type: 'success'
    });
});

// Get Admin Profile
const getAdminProfile = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.user.id);

    if (admin) {
        res.status(200).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            message: 'Admin profile retrieved successfully',
            type: 'success'
        });
    } else {
        res.status(404).json({
            message: 'Admin not found',
            type: 'error'
        });
    }
});

module.exports = {
    registerAdmin,
    loginAdmin,
    getAdminProfile,
};
