const asyncHandler = require('express-async-handler');
const Driver = require('../models/driver');
const upload = require('../config/mutler');
const geolib = require('geolib');
const { default: mongoose } = require('mongoose');
const { convertToAmPm, generateImageUrls, ganerateOneLineImageUrls, getDayName } = require('../utils/utils');
const { activeDrivers } = require('../utils/activeUsers');
const Vehicle = require('../models/vehicle');
const Documents = require('../models/documents');
// const { getDriverRatings } = require('../utils/rating');


// Get Driver Profile
const getDriverProfile = asyncHandler(async (req, res) => {
    try {
        const driverId = req.params.id || req.user.id;

        // Check if the user is an admin or the driver
        if (req.user.role !== 'admin' && req.user.id !== driverId) {
            return res.status(403).json({
                message: 'Forbidden',
                type: 'error',
            });
        }

        const driver = await Driver.findById(driverId);

        if (!driver) {
            return res.status(404).json({
                message: 'Driver not found',
                type: 'error',
            });
        }

        // Generate profile image URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        if (driver.profileImage) {
            driver.profileImage = `${baseUrl}/${driver.profileImage}`;
        }

        return res.status(200).json({
            driver,
            type: 'success',
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to retrieve driver profile',
            error: error.message,
            type: 'error',
        });
    }
});

// Update Driver Profile
const updateDriverProfile = [
    upload.single('profileImage'),
    asyncHandler(async (req, res) => {
        try {
            const driverId = req.params.id || req.user.id;

            // Check if the user is an admin or the driver
            if (req.user.role !== 'admin' && req.user.id !== driverId) {
                return res.status(403).json({
                    message: 'Forbidden',
                    type: 'error',
                });
            }

            const driver = await Driver.findById(driverId);

            if (!driver) {
                return res.status(404).json({
                    message: 'Driver not found',
                    type: 'error',
                });
            }

            // Update fields
            const { name, mobileNo, email, gender, dateOfBirth, serviceType } = req.body;

            if (name) driver.name = name;
            if (mobileNo) driver.mobileNo = mobileNo;
            if (email) driver.email = email;
            if (gender) driver.gender = gender;
            if (dateOfBirth) driver.dateOfBirth = dateOfBirth;
            if (serviceType) driver.serviceType = serviceType;

            if (req.user.role === 'admin') {
                Object.assign(driver, req.body);
            }

            // Update profile image if provided
            if (req.file) {
                driver.profileImage = req.file.path;
            }

            await driver.save();

            return res.status(200).json({
                message: 'Driver profile updated successfully',
                type: 'success',
                driver,
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Failed to update driver profile',
                error: error.message,
                type: 'error',
            });
        }
    }),
];

// single driver details
const driverDetails = asyncHandler(async (req, res) => {
    try {
        const { driverId, lat, lng, dateTime } = req.body;

        // Ensure necessary parameters are provided
        if (!driverId || !lat || !lng || !dateTime) {
            return res.status(400).json({
                message: 'Please provide all required filters: driverId, lat, lng, dateTime',
                type: 'error',
            });
        }

        // Parse dateTime from the body
        const requestedDateTime = new Date(dateTime);
        const requestedDay = requestedDateTime.getDay();
        const requestedTime = requestedDateTime.getHours() + (requestedDateTime.getMinutes() / 60);

        // Find the garage for the driver and populate relevant data
        const garage = await Garage.findOne({ driver: driverId })
            .populate('shopService') // Populate shop services
            .populate({
                path: 'driver',
            })
            .lean();

        const additionalService = await AdditionalService.findOne({ driver: driverId }).lean();
        const emergencyService = await ServiceRate.findOne({ driver: driverId }).lean();

        if (!garage) {
            return res.status(404).json({
                message: 'Driver not found',
                type: 'error',
            });
        }

        // Fetch gallery images
        const shopGallery = await ShopGallery.findOne({ driver: driverId }).lean();

        // Calculate distance between user's location and garage location
        const distance = geolib.getDistance(
            { latitude: lat, longitude: lng },
            { latitude: garage.lat, longitude: garage.lng }
        );
        const distanceInKm = distance / 1000;

        // Check if the garage is open or closed based on the weeklyTimings
        const todayTimings = garage.weeklyTimings[requestedDay];
        const isOpen = todayTimings.isAvailable && requestedTime >= todayTimings.startTime && requestedTime < todayTimings.endTime;

        // Convert startTime and endTime to AM/PM format
        const startTimeFormatted = convertToAmPm(todayTimings.startTime);
        const endTimeFormatted = convertToAmPm(todayTimings.endTime);

        const status = isOpen
            ? { status: 'Open', message: `Close ${endTimeFormatted}` }
            : { status: 'Closed', message: `Open ${startTimeFormatted}` };

        const ratings = await getDriverRatings({ driverId: garage.driver._id });

        // Prepare the response object
        const response = {
            basicDetails: {
                shopGallery: shopGallery ? {
                    ownerImage: ganerateOneLineImageUrls(shopGallery.ownerImage, req),
                    vehicleRepairImage: ganerateOneLineImageUrls(shopGallery.vehicleRepairImage, req),
                    insideImage: ganerateOneLineImageUrls(shopGallery.insideImage, req),
                    outsideImage: ganerateOneLineImageUrls(shopGallery.outsideImage, req),
                } : {},
                garageName: garage.name,
                status,
                distanceInKm,
            },
            details: {
                driverName: garage.driver.name,
                mobileNo: garage.driver.mobile,
                yearsOfGarage: garage.yearsOfGarage,
                vehicleTypeHandle: garage.vehicalTypeHandle,
                address: garage.address,
                lat: garage.lat,
                lng: garage.lng,
                timeSchedule: garage.weeklyTimings,
                privacyPolicy: garage.privacyPolicy,
            },
            services: {
                shopServices: garage.shopService,
                additionalServices: additionalService,
                emergencyService: emergencyService,
            },
            ratings
        };

        // Return the driver details
        return res.status(200).json({
            driver: response,
            type: 'success',
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to get driver details',
            error: error.message,
            type: 'error',
        });
    }
});

const deActiveDriverAccount = async (req, res) => {
    try {
        const { id } = req.user
        let driver = await Driver.findById(id);
        driver.isActive = false
        await driver.save()

        res.status(200).json({
            type: 'success',
            message: 'account deactivated successfully',
        });
    } catch (error) {
        res.status(500).json({
            type: 'error',
            message: 'Error for deactivate account',
            error: error.message
        });
    }
}

const deleteDriverAccount = async (req, res) => {
    try {
        const { id } = req.user
        let driver = await Driver.findById(id);
        driver.isDeleted = true
        await driver.save()

        res.status(200).json({
            type: 'success',
            message: 'account deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            type: 'error',
            message: 'Error for delete account',
            error: error.message
        });
    }
}

const updateDriverStatus = async (req, res) => {
    try {
        const { id } = req.user;
        let driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({
                type: 'error',
                message: 'Driver not found',
            });
        }

        // Toggle online status
        driver.isOnline = !driver.isOnline;
        driver.isAvailableForRide = driver.isOnline;
        await driver.save();

        let socketId = activeDrivers.get(id.toString());
        if (driver.isOnline) {
            console.log(`✅ Driver is now ONLINE: ${id} (Socket: ${socketId || 'Unknown'})`);
        } else {
            console.log(`🚫 Driver is now OFFLINE: ${id} (Socket retained)`);
        }

        res.status(200).json({
            type: 'success',
            message: 'Status updated successfully',
            isOnline: driver.isOnline,
            isAvailableForRide: driver.isAvailableForRide
        });

    } catch (error) {
        console.error("❌ Error updating driver status:", error);
        res.status(500).json({
            type: 'error',
            message: 'Error updating status',
            error: error.message
        });
    }
};


const getDriversForAdmin = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query; // Get search term, page, and limit from query parameters

        // Ensure page and limit are valid integers
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        // Build search query based on name, email, or mobile number
        let searchQuery = {};
        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i'); // Case-insensitive partial match
            searchQuery = {
                $or: [
                    { name: regex },
                    { email: regex },
                    { mobileNo: regex }
                ]
            };
        }

        // Calculate total drivers matching the query
        const totalDrivers = await Driver.countDocuments(searchQuery);

        // Fetch paginated drivers from the database
        let drivers = await Driver.find(searchQuery)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        drivers = drivers.map((driver) => {
            let vehicleTypeName = "";
            if (driver.vehicleType === "0") {
                vehicleTypeName = "moto"; // Fixed spelling
            } else if (driver.vehicleType === "1") {
                vehicleTypeName = "auto";
            } else if (driver.vehicleType === "2") {
                vehicleTypeName = "go";
            } else if (driver.vehicleType === "3") {
                vehicleTypeName = "premier";
            }
            return {
                ...driver.toObject(), // Ensure we return a plain object
                vehicleTypeName,
                profileImage: ganerateOneLineImageUrls(driver.profileImage, req)
            };
        });

        // drivers = drivers.map((driver) => generateImageUrls(driver.toObject(), req));

        // Send response
        res.status(200).json({
            type: 'success',
            message: 'Driver list retrieved successfully',
            totalDrivers,
            totalPages: Math.ceil(totalDrivers / limitNumber),
            currentPage: pageNumber,
            drivers,
        });
    } catch (error) {
        res.status(500).json({
            type: 'error',
            message: 'Error fetching drivers list',
            error: error.message
        });
    }
};

const deleteDriverByAdmin = async (req, res) => {
    try {
        const driverId = req.params.id
        let driver = await Driver.findById(driverId);
        driver.isDeleted = true
        await driver.save()

        res.status(200).json({
            type: 'success',
            message: 'Driver deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            type: 'error',
            message: 'Error for delete driver',
            error: error.message
        });
    }
}

const getAllDriversListForFilter = async (req, res) => {
    try {
        const drivers = await Driver.find().sort({ createdAt: -1 }).select('name mobileNo');
        res.status(200).json({
            type: 'success',
            message: 'Driver list retrieved successfully',
            drivers,
        });
    } catch (error) {
        res.status(500).json({
            type: 'error',
            message: 'Error fetching driver list',
            error: error.message
        });
    }
};

const singleDriverDetailsForAdmin = asyncHandler(async (req, res) => {
    try {
        const { driverId } = req.body;

        // Ensure necessary parameters are provided
        if (!driverId) {
            return res.status(400).json({
                message: "Please provide driverId",
                type: "error",
            });
        }
        // Find the vehicle for the driver and populate relevant data
        const vehicle = await Vehicle.findOne({ driver: driverId })
            .populate({
                path: "driver",
            })
            .lean();

        if (!vehicle) {
            return res.status(404).json({
                message: "vehicle not found",
                type: "error",
            });
        }

        // Fetch gallery images
        const documents = await Documents.findOne({ driver: driverId }).lean();
        // const ratings = await getDriverRatings({ driverId: garage.driver._id });
        // Prepare the response object
        const response = {
            basicDetails: {
                documents: documents
                    ? {
                        drivingLicenseFrontImage: ganerateOneLineImageUrls(documents.drivingLicenseFrontImage, req),
                        aadharCardFrontImage: ganerateOneLineImageUrls(
                            documents.aadharCardFrontImage,
                            req
                        ),
                        aadharCardBackImage: ganerateOneLineImageUrls(
                            documents.aadharCardBackImage,
                            req
                        ),
                        panCardImage: ganerateOneLineImageUrls(
                            documents.panCardImage,
                            req
                        ),
                    }
                    : {},
            },
            details: {
                driverName: garage.driver.name,
                mobileNo: garage.driver.mobile,
                yearsOfGarage: garage.yearsOfGarage,
                vehicleTypeHandle: garage.vehicalTypeHandle,
                address: garage.address,
                lat: garage.lat,
                lng: garage.lng,
                gstNo: garage.gstNo,
                timeSchedule: garage.weeklyTimings,
                privacyPolicy: garage.privacyPolicy,
                companies: garage.company,
            },
            services: {
                shopServices: services,
                additionalServices: additionalService,
                emergencyService: emergencyService,
            },
            bankName: garage.bankName,
            ifsc: garage.ifsc,
            accountNumber: garage.accountNumber,
            ratings,
        };
        // Return the driver details
        return res.status(200).json({
            driver: response,
            type: "success",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to get driver details",
            error: error.message,
            type: "error",
        });
    }
});


module.exports = {
    getDriverProfile,
    updateDriverProfile,
    driverDetails,
    deleteDriverAccount,
    deActiveDriverAccount,
    updateDriverStatus,
    getDriversForAdmin,
    deleteDriverByAdmin,
    getAllDriversListForFilter,
    singleDriverDetailsForAdmin
};
