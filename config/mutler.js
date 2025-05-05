const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage with dynamic subfolder and auto-create support
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const baseFolder = 'uploads';
        const subFolder = `${file.fieldname}s`; // e.g., profileImage => profileImages
        const fullPath = path.join(baseFolder, subFolder);
        console.log(`Full path: ${fullPath}`);
        // Create folder if it doesn't exist
        fs.mkdirSync(fullPath, { recursive: true });

        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// Filter file type
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpeg, .jpg, and .png image formats are allowed'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 50 }, // 50MB max
    fileFilter,
});

module.exports = upload;
