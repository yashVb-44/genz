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