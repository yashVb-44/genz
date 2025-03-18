const asyncHandler = require("express-async-handler");
const Booking = require("../models/booking");

// 🟢 Get user bookings with filters, pagination, and sorting
exports.getUserBookings = asyncHandler(async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { status, startDate, endDate, page = 1, limit = 10, sort = "desc" } = req.query;

        if (!userId) {
            return res.status(400).json({ message: "Missing userId", type: "error" });
        }

        const query = { user: userId };

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by date range
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // Pagination
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const skip = (pageNumber - 1) * pageSize;

        // Sorting
        const sortOrder = sort === "asc" ? 1 : -1;

        // Fetch bookings with filters, pagination, and sorting
        const bookings = await Booking.find(query)
            .populate("driver", "name email mobileNo profileImage")
            .populate("user", "name email mobileNo profileImage")
            .sort({ createdAt: sortOrder })
            .skip(skip)
            .limit(pageSize);

        // Get total count (for pagination metadata)
        const totalBookings = await Booking.countDocuments(query);

        return res.status(200).json({
            message: "User bookings fetched successfully",
            type: "success",
            total: totalBookings,
            totalPages: Math.ceil(totalBookings / pageSize),
            currentPage: pageNumber,
            bookings,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch user bookings",
            error: error.message,
            type: "error",
        });
    }
});

// 🟢 Get driver bookings with filters, pagination, and sorting
exports.getDriverBookings = asyncHandler(async (req, res) => {
    try {
        const { id: driverId } = req.user;
        const { status, startDate, endDate, page = 1, limit = 10, sort = "desc" } = req.query;

        if (!driverId) {
            return res.status(400).json({ message: "Missing driverId", type: "error" });
        }

        const query = { driver: driverId };

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by date range
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // Pagination
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const skip = (pageNumber - 1) * pageSize;

        // Sorting
        const sortOrder = sort === "asc" ? 1 : -1;

        // Fetch bookings with filters, pagination, and sorting
        const bookings = await Booking.find(query)
            .populate("driver", "name email mobileNo profileImage")
            .populate("user", "name email mobileNo profileImage")
            .sort({ createdAt: sortOrder })
            .skip(skip)
            .limit(pageSize);

        // Get total count (for pagination metadata)
        const totalBookings = await Booking.countDocuments(query);

        return res.status(200).json({
            message: "Driver bookings fetched successfully",
            type: "success",
            total: totalBookings,
            totalPages: Math.ceil(totalBookings / pageSize),
            currentPage: pageNumber,
            bookings,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch driver bookings",
            error: error.message,
            type: "error",
        });
    }
});
