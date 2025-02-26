const Setting = require("../models/setting")

const getAllSettings = async () => {
    try {
        const setting = await Setting.findOne()
        return {
            setting
        }
    } catch (error) {
        return
    }
}

module.exports = {getAllSettings}