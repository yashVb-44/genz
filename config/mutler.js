const multer = require('multer');
const path = require('path');

// Configure storage for images with dynamic subfolder support
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'uploads/';
        // Set different subfolders based on the type of image
        if (file.fieldname === 'sessionImage') {
            folder += 'sessionImages/';
        } else if (file.fieldname === 'vehicleRepairImage') {
            folder += 'vehicleRepairImages/';
        } else if (file.fieldname === 'insideImage') {
            folder += 'insideImages/';
        } else if (file.fieldname === 'outsideImage') {
            folder += 'outsideImages/';
        } else if (file.fieldname === 'profileImage') {
            folder += 'profileImages/'
        } else if (file.fieldname === 'myVehicleImage') {
            folder += 'myVehicleImages/'
        } else if (file.fieldname === 'beforeServiceImage') {
            folder += 'beforeServiceImages/'
        } else if (file.fieldname === 'afterServiceImage') {
            folder += 'afterServiceImages/'
        } else if (file.fieldname === 'dentImage') {
            folder += 'dentImages/'
        } else if (file.fieldname === 'bannerImage') {
            folder += 'bannerImages/'
        }

        cb(null, folder); // Set the destination folder for the specific image category
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`); // Set the file name to be unique
    },
});

// Filter file type
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 50 }, // Limit file size to 50MB
    fileFilter: fileFilter,
});

module.exports = upload;
