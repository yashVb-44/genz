// utils.js
const generateImageUrls = (document, req) => {
    if (!document) {
        return
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Process only the fields that are image URLs
    const imageFields = ['drivingLicenseFrontImage', 'panCardImage', 'aadharCardBackImage', 'aadharCardFrontImage', 'image', "registrationCertificateImage", "pollutionCertificateImage", "vehicleInsuranceIamge", "bannerImage", "profileImage"];
    imageFields.forEach((field) => {
        if (document[field]) {
            document[field] = `${baseUrl}/${document[field].replace(/\\/g, '/')}`; // Handle both Unix and Windows paths
        }
    });

    return document;
};

const ganerateOneLineImageUrls = (document, req) => {
    if (!document) {
        return
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/${document.replace(/\\/g, '/')}`
}

// Helper function to convert 24-hour time to 12-hour AM/PM format
function convertToAmPm(time) {
    if (time === null) {
        return
    }
    const [hour, minute] = time?.split(':');
    let hours = parseInt(hour);
    const amPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert hour '0' to '12'
    return `${hours}:${minute} ${amPm}`;
}

function getDayName(dayIndex) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayIndex];
}

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

module.exports = { generateImageUrls, ganerateOneLineImageUrls, convertToAmPm, getDayName, generateOTP };
