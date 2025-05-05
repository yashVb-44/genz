const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/vehicle');

const upload = require('../config/mutler'); // adjust path as needed
const removeUnwantedImages = require('../utils/deletingFiles');
const { generateImageUrls, ganerateOneLineImageUrls } = require('../utils/utils');

// Upload vehicle documents and add vehicle
exports.uploadVehicleDocuments = [
    upload.fields([
        { name: 'vehicleInsuranceIamge', maxCount: 1 },
        { name: 'pollutionCertificateImage', maxCount: 1 },
        { name: 'registrationCertificateImage', maxCount: 1 },
    ]),
    asyncHandler(async (req, res) => {
        try {
            const user = req.user;

            if (user.role !== 'driver') {
                removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
                return res.status(403).json({
                    message: 'Forbidden',
                    type: 'error'
                });
            }

            const vehicleData = {
                driver: user.id,
                ...req.body,
            };

            if (req.files.vehicleInsuranceIamge) {
                vehicleData.vehicleInsuranceIamge = req.files.vehicleInsuranceIamge[0].path;
            }
            if (req.files.pollutionCertificateImage) {
                vehicleData.pollutionCertificateImage = req.files.pollutionCertificateImage[0].path;
            }
            if (req.files.registrationCertificateImage) {
                vehicleData.registrationCertificateImage = req.files.registrationCertificateImage[0].path;
            }

            const vehicle = new Vehicle(vehicleData);
            await vehicle.save();

            return res.status(201).json({
                message: 'Vehicle added successfully',
                vehicle,
                type: 'success',
            });

        } catch (error) {
            removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
            return res.status(500).json({
                message: 'Failed to add vehicle',
                error: error.message,
                type: 'error',
            });
        }
    })
];

// Get all or one vehicle
exports.getVehicle = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (id) {
            let vehicle = await Vehicle.findOne({ _id: id, isDeleted: false }).populate('driverId');

            if (!vehicle) {
                return res.status(404).json({
                    message: 'Vehicle not found',
                    type: 'error',
                });
            }

            vehicle = generateImageUrls(vehicle.toObject(), req); // Convert to plain object and generate URLs

            return res.status(200).json({
                vehicle,
                type: 'success',
            });
        }

        let vehiclesDetails = await Vehicle.find({ driver: user.id, isDeleted: false }).populate('driver');
        vehiclesDetails = vehiclesDetails.map((vehicle) => {
            return {
                ...vehicle.toObject(), // Ensure we return a plain object
                registrationCertificateImage: ganerateOneLineImageUrls(vehicle.registrationCertificateImage, req),
                pollutionCertificateImage: ganerateOneLineImageUrls(vehicle.pollutionCertificateImage, req),
                vehicleInsuranceIamge: ganerateOneLineImageUrls(vehicle.vehicleInsuranceIamge, req)
            };
        });
        return res.status(200).json({
            vehiclesDetails,
            type: 'success',
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to retrieve vehicles',
            error: error.message,
            type: 'error'
        });
    }
});

// Update vehicle details
exports.updateVehicle = [
    upload.fields([
        { name: 'vehicleInsuranceIamge', maxCount: 1 },
        { name: 'pollutionCertificateImage', maxCount: 1 },
        { name: 'registrationCertificateImage', maxCount: 1 },
    ]),
    asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;

            const vehicle = await Vehicle.findById(id);

            if (!vehicle || vehicle.isDeleted) {
                removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
                return res.status(404).json({
                    message: 'Vehicle not found',
                    type: 'error',
                });
            }

            // Allow updates only by admin or the driver who created the vehicle
            if (user.role !== 'admin' && (!vehicle.driver || !vehicle.driver.equals(user.id))) {
                removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
                return res.status(403).json({
                    message: 'Forbidden',
                    type: 'error',
                });
            }

            const oldImages = [];

            if (req.files.vehicleInsuranceIamge) {
                oldImages.push(vehicle.vehicleInsuranceIamge);
                vehicle.vehicleInsuranceIamge = req.files.vehicleInsuranceIamge[0].path;
            }
            if (req.files.pollutionCertificateImage) {
                oldImages.push(vehicle.pollutionCertificateImage);
                vehicle.pollutionCertificateImage = req.files.pollutionCertificateImage[0].path;
            }
            if (req.files.registrationCertificateImage) {
                oldImages.push(vehicle.registrationCertificateImage);
                vehicle.registrationCertificateImage = req.files.registrationCertificateImage[0].path;
            }

            // Update other body fields
            Object.assign(vehicle, req.body);
            await vehicle.save();

            // Remove old image files from storage
            removeUnwantedImages(oldImages);

            return res.status(200).json({
                message: 'Vehicle updated successfully',
                vehicle,
                type: 'success',
            });

        } catch (error) {
            removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
            return res.status(500).json({
                message: 'Failed to update vehicle',
                error: error.message,
                type: 'error',
            });
        }
    })
];