const express = require("express");
const asyncHandler = require('express-async-handler');
const TempBooking = require("../models/tempBooking");
const Booking = require("../models/booking");
const Request = require("../models/request");
const Driver = require("../models/driver");
const User = require("../models/user");

exports.getHomeStatus = asyncHandler(async (req, res) => {
    try {
        const { id, role } = req.user;

        let data = null;

        if (role === "user") {
            // Check if user has an active request
            const activeRequest = await Request.findOne({ user: id, status: "pending" }).lean();

            if (activeRequest) {
                data = {
                    type: "request",
                    message: "You have an active ride request.",
                    request: activeRequest
                };
            } else {
                // Check if user has an ongoing temp booking
                const activeBooking = await TempBooking.findOne({ user: id, status: { $nin: ["completed", "canceled"] } }).lean();
                if (activeBooking) {
                    data = {
                        type: "tempBooking",
                        message: "You have an ongoing ride.",
                        booking: activeBooking
                    };
                }
            }
        } else if (role === "driver") {
            // Check if driver has an active temp booking
            const activeBooking = await TempBooking.findOne({ driver: id, status: { $nin: ["completed", "canceled"] } }).lean();

            if (activeBooking) {
                data = {
                    type: "tempBooking",
                    message: "You have an ongoing ride.",
                    booking: activeBooking
                };
            }
        }

        res.status(200).json({
            type: "success",
            message: data ? "Status found" : "No active status",
            data
        });

    } catch (error) {
        console.error("❌ Error fetching home status:", error);
        res.status(500).json({
            type: "error",
            message: "Error fetching status",
            error: error.message
        });
    }
});

exports.getAdminDashboardStats = asyncHandler(async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // IST offset in minutes (+5:30)
        const IST_OFFSET = 330;

        // Helper function to convert a date to start of day in IST
        const toStartOfDayIST = (date) => {
            const utcDate = new Date(date);
            utcDate.setUTCHours(0, 0, 0, 0); // Set to start of UTC day
            return new Date(utcDate.getTime() + IST_OFFSET * 60 * 1000); // Add IST offset
        };

        // Helper function to convert a date to end of day in IST
        const toEndOfDayIST = (date) => {
            const utcDate = new Date(date);
            utcDate.setUTCHours(23, 59, 59, 999); // Set to end of UTC day
            return new Date(utcDate.getTime() + IST_OFFSET * 60 * 1000); // Add IST offset
        };

        // Parse startDate and endDate, or use default for all-time stats
        const start = startDate ? toStartOfDayIST(startDate) : null;
        const end = endDate ? toEndOfDayIST(endDate) : null;

        // Add filters for createdAt with adjusted IST times
        const dateFilter = {};
        if (start && end) {
            dateFilter.createdAt = { $gte: start, $lte: end };
        } else if (start) {
            dateFilter.createdAt = { $gte: start };
        } else if (end) {
            dateFilter.createdAt = { $lte: end };
        }

        // Total Drivers
        const totalDrivers = await Driver.find(dateFilter).countDocuments();

        // Total Users
        const totalUsers = await User.find(dateFilter).countDocuments();

        // Total Bookings
        const totalBookings = await Booking.find(dateFilter).countDocuments();

        // Respond with admin stats
        return res.status(200).json({
            message: "Admin statistics retrieved successfully",
            type: "success",
            stats: {
                totalDrivers,
                totalUsers,
                totalBookings,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to retrieve admin statistics",
            error: error.message,
            type: "error",
        });
    }
});