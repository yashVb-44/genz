const express = require("express");
const asyncHandler = require('express-async-handler');
const TempBooking = require("../models/tempBooking");
const Request = require("../models/request");

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