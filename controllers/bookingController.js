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

// 🟢 Get booking details by ID
exports.getBookingDetails = asyncHandler(async (req, res) => {
    try {
        const { id: userId, role } = req.user;
        const { id: bookingId } = req.params;

        if (!bookingId) {
            return res.status(400).json({ message: "Missing bookingId", type: "error" });
        }

        const booking = await Booking.findById(bookingId)
            .populate("driver", "name email mobileNo profileImage")
            .populate("user", "name email mobileNo profileImage");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found", type: "error" });
        }

        if (role !== "admin") {
            if (role === "user" ? booking?.user?._id?.toString() !== userId : booking.driver?._id?.toString() !== userId) {
                return res.status(403).json({ message: "Unauthorized access", type: "error" });
            }
        }

        return res.status(200).json({
            message: "Booking details fetched successfully",
            type: "success",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch booking details",
            error: error.message,
            type: "error",
        });
    }
}
);

exports.getBookingsForAdmin = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, userId, driverId } = req.query;

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        // Build filter query
        let filter = {};

        if (userId) filter.user = userId;
        if (driverId) filter.driver = driverId;

        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { rideId: regex },
            ];
        }

        const totalBookings = await Booking.countDocuments(filter);

        let bookings = await Booking.find(filter)
            .populate('user', 'name mobileNo')
            .populate('driver', 'name mobileNo')
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .sort({ createdAt: -1 });

        res.status(200).json({
            type: 'success',
            message: 'Bookings list retrieved successfully',
            totalBookings,
            totalPages: Math.ceil(totalBookings / limitNumber),
            currentPage: pageNumber,
            bookings,
        });
    } catch (error) {
        console.error('Error fetching bookings list:', error);
        res.status(500).json({
            type: 'error',
            message: 'Error fetching bookings list',
            error: error.message,
        });
    }
};