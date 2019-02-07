const mongoose = require('mongoose');
const validator = require('validator');

const EmployeeDetailSchema = new mongoose.Schema({
    profileImage: {
        type: String,
        trim: true,
        default: null
    },
    name: {
        type: String,
        trim: true,
        default: null
    },
    linkedin: {
        type: String,
        trim: true,
        default: null
    },
    gender: {
        type: String,
        default: null
    },
    phone: {
        type: Number,
        default: null
    },
    birthDate: {
        type: String,
        default: null
    },
    city: {
        type: String,
        trim: true,
        default: null
    },
    country: {
        type: String,
        trim: true,
        default: null
    },
    postalCode: {
        type: String,
        trim: true,
        default: null
    },
    interestedIn: {
        type: String,
        trim: true,
        default: null
    },
    resume: {
        type: String,
        trim: true,
        default: null
    },
    photoId: {
        type: String,
        trim: true,
        default: null
    },
    refOneName: {
        type: String,
        trim: true,
        default: null
    },
    refOneDescription: {
        type: String,
        trim: true,
        default: null
    },
    refOneEmail: {
        type: String,
        default: null
    },
    refOnePhone: {
        type: Number,
        trim: true,
        default: null
    },
    refTwoName: {
        type: String,
        trim: true,
        default: null
    },
    refTwoDescription: {
        type: String,
        trim: true,
        default: null
    },
    refTwoEmail: {
        type: String,
        default: null
    },
    refTwoPhone: {
        type: Number,
        trim: true,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employees'
    }
});

const EmployeeDetail = mongoose.model('employeeDetails', EmployeeDetailSchema);

module.exports = {EmployeeDetail};