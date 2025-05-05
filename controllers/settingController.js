const Setting = require('../models/setting'); // Adjust the path to your Setting model

// Controller to get the settings
const getSettings = async (req, res) => {
    try {
        const setting = await Setting.findOne(); // Fetch the single settings document
        if (!setting) {
            return res.status(404).json({
                type: 'error',
                message: 'Settings not found'
            });
        }

        return res.status(200).json({
            type: 'success',
            message: 'Settings fetched successfully',
            setting
        });
    } catch (error) {
        return res.status(500).json({
            type: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};


// Controller to update the settings document
const updateSettings = async (req, res) => {
    try {
        // Find the single settings document
        let setting = await Setting.findOne();
        if (!setting) {
            setting = new Setting(); // Create a new document if it doesn't exist
        }

        // Dynamically update only the fields that are present in req.body
        Object.keys(req.body).forEach(key => {
            setting[key] = req.body[key]; // This will update each field in the settings document
        });

        await setting.save(); // Save the updated document

        return res.status(200).json({
            type: 'success',
            message: 'Settings updated successfully',
            setting
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            type: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};


// Controller to delete the settings (if needed)
const deleteSettings = async (req, res) => {
    try {
        const setting = await Setting.findOneAndDelete(); // This will delete the settings document

        if (!setting) {
            return res.status(404).json({
                type: 'error',
                message: 'Settings not found'
            });
        }

        return res.status(200).json({
            type: 'success',
            message: 'Settings deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            type: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    deleteSettings
};
