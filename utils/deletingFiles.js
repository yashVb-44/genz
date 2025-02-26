const fs = require('fs');
const path = require('path');

// Global function to remove unwanted images
const removeUnwantedImages = (imagePaths) => {
    imagePaths.forEach((imagePath) => {
        try {
            if (imagePath) {
                fs.unlink(path.join(__dirname, '..', imagePath), (err) => {
                    if (err) console.error(`Failed to delete image: ${imagePath}`, err);
                });
            } else {
                return
            }
        } catch (error) {
            return
            console.log(error)
        }
    });
};

module.exports = removeUnwantedImages;
