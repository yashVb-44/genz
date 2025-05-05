const mongoose = require('mongoose');

// Schema for FAQ items
const FAQSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    }
});

// Main settings schema
const SettingSchema = new mongoose.Schema({
    isAppActive: {
        type: Boolean,
        default: true, // Default isAppActive to true (app is live)
    },
    isAppActiveUserApp: {
        type: Boolean,
        default: true, // Default isAppActive to true (app is live)
    },
    isAppActiveDriverApp: {
        type: Boolean,
        default: true, // Default isAppActive to true (app is live)
    },
    userFaqs: [FAQSchema], // Array of FAQs
    driverFaqs: [FAQSchema], // Array of FAQs
    userTerms: {
        type: String,
        default: '', // Terms and Conditions
    },
    driverTerms: {
        type: String,
        default: '', // Terms and Conditions
    },
    userPrivacy: {
        type: String,
        default: '', // Privacy Policy
    },
    driverPrivacy: {
        type: String,
        default: '', // Privacy Policy
    },
    userAbout: {
        type: String,
        default: '', // About Us content
    },
    driverAbout: {
        type: String,
        default: '', // About Us content
    },
    support: {
        type: String,
        default: ''
    },
    contact: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    pincode: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    whatsapp: {
        type: String,
        default: ''
    },
    driverInvoiceTerms: {
        type: String,
        default: ''
    },
    userInvoiceTerms: {
        type: String,
        default: ''
    },
    userAppVersion: {
        type: Number,
        default: 0,
    },
    driverAppVersion: {
        type: Number,
        default: 0,
    },
    isUserAppUpdateMandatory: {
        type: Boolean,
        default: false,
    },
    isDriverAppUpdateMandatory: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema);
