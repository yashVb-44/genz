const express = require("express");
const asyncHandler = require('express-async-handler');
// const { calculateFare } = require("../services/fareService");
const Fare = require("../models/fare");
const { calculateFare } = require("../services/fareService");

exports.addNewFare = asyncHandler(async (req, res) => {
    try {
        const { city, vehicleType } = req.body
        const existingCityFare = await Fare.findOne({ city: { $regex: `^${city}$`, $options: 'i' }, vehicleType });

        if (existingCityFare) {
            return res.status(400).json({
                message: 'Fare for this city already exists',
                type: 'error'
            });
        }

        const fare = await Fare.create({
            ...req.body
        })

        // await fare.save()
        return res.status(200).json({
            message: 'Fare added successfully',
            type: 'success',
            fare
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to add fare',
            error: error.message,
            type: 'error',
        });
    }
})

exports.updateFare = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const fare = await Fare.findOne({ _id: id });

        if (!fare) {
            return res.status(404).json({
                message: 'Fare not found',
                type: 'error',
            });
        }

        const { city, ...updateData } = req.body;
        // Update only the provided fields
        Object.assign(fare, updateData);

        await fare.save();

        return res.status(200).json({
            message: 'Fare updated successfully',
            type: 'success',
            fare,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update fare',
            error: error.message,
            type: 'error',
        });
    }
});

exports.getFare = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (id) {
            // Fetch a single fare by ID
            const fare = await Fare.findById(id);
            if (!fare) {
                return res.status(404).json({
                    message: 'Fare not found',
                    type: 'error',
                });
            }
            return res.status(200).json({
                message: 'Fare fetched successfully',
                type: 'success',
                fare,
            });
        } else {
            // Fetch all fares
            const fares = await Fare.find();
            return res.status(200).json({
                message: 'All fares fetched successfully',
                type: 'success',
                fares,
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch fare(s)',
            error: error.message,
            type: 'error',
        });
    }
});

exports.getFaresForAdmin = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        // Build filter query
        let filter = {};
        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { city: regex },
            ];
        }

        const totalFares = await Fare.countDocuments(filter);

        let fares = await Fare.find(filter)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .sort({ createdAt: -1 });

        fares = fares.map((fare) => {
            let vehicleTypeName = "";
            if (fare.vehicleType === "0") {
                vehicleTypeName = "moto"; // Fixed spelling
            } else if (fare.vehicleType === "1") {
                vehicleTypeName = "auto";
            } else if (fare.vehicleType === "2") {
                vehicleTypeName = "go";
            } else if (fare.vehicleType === "3") {
                vehicleTypeName = "premier";
            }
            return {
                ...fare.toObject(), // Ensure we return a plain object
                vehicleTypeName,
            };
        });


        res.status(200).json({
            type: 'success',
            message: 'Fare list retrieved successfully',
            totalFares,
            totalPages: Math.ceil(totalFares / limitNumber),
            currentPage: pageNumber,
            fares,
        });
    } catch (error) {
        console.error('Error fetching fares list:', error);
        res.status(500).json({
            type: 'error',
            message: 'Error fetching fares list',
            error: error.message,
        });
    }
};

exports.deleteFare = async (req, res) => {
    try {
        const fareId = req.params.id
        let fare = await Fare.findById(fareId);
        fare.isDeleted = true
        await fare.save()

        res.status(200).json({
            type: 'success',
            message: 'Fare deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            type: 'error',
            message: 'Error for delete fare',
            error: error.message
        });
    }
}


exports.getEstimateFare = asyncHandler(async (req, res) => {
    try {
        const { vehicleType, city, distance, duration, waitingTime, isNight } = req.query;

        if (!vehicleType || !city || !distance || !duration) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        const fare = await calculateFare(
            vehicleType,
            city,
            parseFloat(distance),
            parseFloat(duration),
            parseFloat(waitingTime || 0),
            isNight === "true"
        );

        return res.status(200).json({
            message: 'Estimate fare fetched successfully',
            type: 'success',
            fare,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch estimate fare',
            error: error.message,
            type: 'error',
        });
    }
});