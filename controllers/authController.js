// controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const Driver = require('../models/driver');
const generateToken = require('../utils/generateToken');

// OTP Expiry time (e.g., 5 minutes)
const OTP_EXPIRATION_TIME = 5 * 60 * 1000;
// Generate OTP
const otp = Math.floor(1000 + Math.random() * 9000).toString();
// Register User or Driver
const register = asyncHandler(async (req, res) => {
    try {
        const { name, mobileNo, email, gender, country, language, type, serviceType } = req.body;

        // Check if the type is valid
        if (!['user', 'driver'].includes(type)) {
            return res.status(400).json({
                message: 'Invalid type specified',
                type: 'error'
            });
        }

        // Check if the user/driver already exists
        const model = type === 'driver' ? Driver : User;
        const existing = await model.findOne({ mobileNo });
        const existingEmail = await model.findOne({ email });
        if (existing || existingEmail) {
            return res.status(400).json({
                message: 'Account already exists',
                type: 'error'
            });
        }

        // Set OTP expiration time
        const otpExpiresAt = Date.now() + OTP_EXPIRATION_TIME;

        // Create user/driver
        const newAccount = await model.create({
            ...req.body,
            name,
            mobileNo,
            email,
            gender,
            language,
            country,
            otp,
            otpExpiresAt,
            isVerified: false,
            role: type, // Set the role based on type
            ...(type === 'driver' && { serviceType }), // Conditionally add serviceType for drivers
            currentLocation: {
                type: "Point",
                coordinates: req.body.coordinates || [0, 0] // Default to [0,0] if not provided
            }
        });

        // Emit OTP to the client via Socket.io
        const io = req.app.get('io'); // Access the io instance
        io.emit('send_otp', { mobileNo, otp }); // Emit the OTP event

        if (newAccount) {
            return res.status(201).json({
                message: 'OTP sent successfully',
                type: 'success',
                otp: otp
            });
        } else {
            return res.status(400).json({
                message: 'Invalid account data',
                type: 'error'
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Server error',
            type: 'error',
            error: error.message
        });
    }
});

// Send OTP to User or Driver
const sendOtp = asyncHandler(async (req, res) => {
    try {
        const { mobileNo, type } = req.body;

        // Check if the type is valid
        if (!['user', 'driver'].includes(type)) {
            return res.status(400).json({
                message: 'Invalid type specified',
                type: 'error'
            });
        }

        // Find the user/driver by mobile number
        const model = type === 'driver' ? Driver : User;
        const account = await model.findOne({ mobileNo });
        if (!account) {
            return res.status(404).json({
                message: 'Account not found',
                type: 'error'
            });
        }

        if (account.isDeleted) {
            return res.status(400).json({
                message: 'This account is deleted. Please contact support.',
                type: 'error',
            });
        }

        if (!account.isActive) {
            return res.status(400).json({
                message: 'This account is not active. Please contact support.',
                type: 'error',
            });
        }

        if (account.isBlocked) {
            return res.status(400).json({
                message: 'This account is blocked. Please contact support.',
                type: 'error',
            });
        }

        if (!account.isVerified && account.type === "driver") {
            return res.status(400).json({
                message: 'This account is not verified. Please complete verification.',
                type: 'error',
            });
        }

        // Set OTP expiration time
        const otpExpiresAt = Date.now() + OTP_EXPIRATION_TIME;

        // Update account with OTP and expiration time
        account.otp = otp;
        account.otpExpiresAt = otpExpiresAt;
        await account.save();

        // Emit OTP to the client via Socket.io
        const io = req.app.get('io'); // Access the io instance
        io.emit('send_otp', { mobileNo, otp }); // Emit the OTP event

        return res.status(200).json({
            message: 'OTP sent successfully',
            type: 'success',
            otp: otp
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Server error',
            type: 'error',
            error: error.message
        });
    }
});

// Verify OTP and Login User or Driver
const verifyOtp = asyncHandler(async (req, res) => {
    try {
        const { mobileNo, otp, type } = req.body;

        // Check if the type is valid
        if (!['user', 'driver'].includes(type)) {
            return res.status(400).json({
                message: 'Invalid type specified',
                type: 'error'

            });
        }

        // Find the user/driver by mobile number
        const model = type === 'driver' ? Driver : User;
        const account = await model.findOne({ mobileNo });

        if (!account) {
            return res.status(404).json({
                message: 'Account not found',
                type: 'error'
            });
        }

        // Check if OTP matches and is not expired
        if (account.otp !== otp || account.otpExpiresAt < Date.now()) {
            return res.status(400).json({
                message: 'Invalid or expired OTP',
                type: 'error'
            });
        }

        // Mark account as verified
        account.isVerified = true;
        account.isActive = true;
        account.otp = undefined;
        account.otpExpiresAt = undefined;
        await account.save();

        return res.status(200).json({
            _id: account._id,
            name: account.name,
            mobileNo: account.mobileNo,
            email: account.email,
            isVerified: account.isVerified,
            isActive: account.isActive,
            isBlocked: account.isBlocked,
            token: generateToken(account._id, type),
            type: 'success'
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Server error',
            type: 'error',
            error: error.message
        });
    }
});


module.exports = { register, sendOtp, verifyOtp };
