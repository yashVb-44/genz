const asyncHandler = require('express-async-handler');
const Documents = require('../models/documents');
const upload = require('../config/mutler');
const removeUnwantedImages = require('../utils/deletingFiles');
const { generateImageUrls } = require('../utils/utils');

const uploadDocuments = [
    upload.fields([
        { name: 'aadharCardFrontImage', maxCount: 1 },
        { name: 'aadharCardBackImage', maxCount: 1 },
        { name: 'panCardImage', maxCount: 1 },
        { name: 'drivingLicenseFrontImage', maxCount: 1 },
    ]),
    asyncHandler(async (req, res) => {
        try {
            const driverId = req.user.id;

            // Check if user is a driver
            if (req.user.role !== 'driver') {
                removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
                return res.status(403).json({
                    message: 'Forbidden',
                    type: 'error'
                });
            }

            const documentsData = {
                driver: driverId,
            };

            const existingDocumentsData = await Documents.findOne({ driver: driverId });

            if (existingDocumentsData) {
                removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
                return res.status(400).json({
                    message: 'Documents already exists',
                    type: 'error'
                });
            }

            if (req.files.aadharCardFrontImage) {
                documentsData.aadharCardFrontImage = req.files.aadharCardFrontImage[0].path;
            }
            if (req.files.aadharCardBackImage) {
                documentsData.aadharCardBackImage = req.files.aadharCardBackImage[0].path;
            }
            if (req.files.panCardImage) {
                documentsData.panCardImage = req.files.panCardImage[0].path;
            }
            if (req.files.drivingLicenseFrontImage) {
                documentsData.drivingLicenseFrontImage = req.files.drivingLicenseFrontImage[0].path;
            }

            const documents = new Documents(documentsData);
            await documents.save();

            return res.status(201).json({
                message: 'Documents added successfully',
                type: 'success',
                documents,
            });
        } catch (error) {
            console.log(error);
            removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
            return res.status(500).json({
                message: 'Failed to add documents',
                error: error.message,
                type: 'error',
            });
        }
    }),
];

const getDocuments = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        let documents;

        if (id) {
            let documents = await Documents.findById(id).populate('driver');
            if (!documents) {
                return res.status(404).json({
                    message: 'Documents not found',
                    type: 'error',
                });
            }

            if (user.role === 'admin' || (user.role === 'driver' && documents.driver.equals(user.id))) {
                documents = generateImageUrls(documents.toObject(), req); // Convert to plain object and generate URLs
                return res.status(200).json({
                    documents,
                    type: 'success',
                });
            } else {
                return res.status(403).json({
                    message: 'Forbidden',
                    type: 'error',
                });
            }
        } else {
            if (user.role === 'admin') {
                documents = await Documents.find().populate('driver');
            } else if (user.role === 'driver') {
                documents = await Documents.find({ driver: user.id }).populate('driver');
            } else {
                return res.status(403).json({
                    message: 'Forbidden',
                    type: 'error',
                });
            }

            documents = documents.map((documents) => generateImageUrls(documents.toObject(), req)); // Convert to plain object and generate URLs
            return res.status(200).json({
                documents,
                type: 'success',
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to retrieve documents',
            error: error.message,
            type: 'error',
        });
    }
});

const updateDocuments = [
    upload.fields([
        { name: 'aadharCardFrontImage', maxCount: 1 },
        { name: 'aadharCardBackImage', maxCount: 1 },
        { name: 'panCardImage', maxCount: 1 },
        { name: 'drivingLicenseFrontImage', maxCount: 1 },
    ]),
    asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;

            let documents = await Documents.findById(id).populate('driver');

            if (!documents) {
                removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
                return res.status(404).json({
                    message: 'Documents not found',
                    type: 'error',
                });
            }

            // Allow updates if the user is an admin or the driver who created the documents
            if (user.role === 'admin' || (user.role === 'driver' && documents.driver.equals(user.id))) {
                const oldImages = [];
                if (req.files.aadharCardFrontImage) {
                    oldImages.push(documents.aadharCardFrontImage);
                    documents.aadharCardFrontImage = req.files.aadharCardFrontImage[0].path;
                }
                if (req.files.aadharCardBackImage) {
                    oldImages.push(documents.aadharCardBackImage);
                    documents.aadharCardBackImage = req.files.aadharCardBackImage[0].path;
                }
                if (req.files.panCardImage) {
                    oldImages.push(documents.panCardImage);
                    documents.panCardImage = req.files.panCardImage[0].path;
                }
                if (req.files.drivingLicenseFrontImage) {
                    oldImages.push(documents.drivingLicenseFrontImage);
                    documents.drivingLicenseFrontImage = req.files.drivingLicenseFrontImage[0].path;
                }

                await documents.save();
                removeUnwantedImages(oldImages);
                return res.status(200).json({
                    message: 'Documents updated successfully',
                    type: 'success',
                    documents,
                });
            } else {
                removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
                return res.status(403).json({
                    message: 'Forbidden',
                    type: 'error',
                });
            }
        } catch (error) {
            removeUnwantedImages(Object.values(req.files).flat().map(file => file.path));
            return res.status(500).json({
                message: 'Failed to update documents',
                error: error.message,
                type: 'error',
            });
        }
    }),
];

module.exports = {
    uploadDocuments,
    getDocuments,
    updateDocuments
};
