const Wallet = require('../models/wallet');
const User = require('../models/user');

const geteUserId = async ({ mobileNo }) => {
    // console.log("check", ownerType, amountType, ownerId, amount)
    try {
        let user

        user = await User.findOne({ mobileNo })

        if (user) {
            return { success: true, message: 'User id get succssfully', user };
        } else {
            throw new Error("user not found for this mobile number.");
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error updating wallet', error };
    }
};

module.exports = { geteUserId }  