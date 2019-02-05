const mongoose = require('mongoose');

const EmployeeDetailSchema = new mongoose.Schema({
    profileImage: {
        type: String,
        trim: true,
        default: null
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    linkedin: {
        type: String,
        trim: true,
        default: null
    },
    gender: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    birthDate: {
        type: String,
        default: null
    },
    city: {
        type: String,
        trim: true,
        required: true
    },
    country: {
        type: String,
        trim: true,
        required: true
    },
    postalCode: {
        type: String,
        trim: true,
        required: true
    },
    interestedIn: {
        type: String,
        trim: true,
        required: true
    },
    resume: {
        type: String,
        trim: true,
        default: null
    },
    photoId: {
        type: String,
        trim: true,
        required: true
    },
    refOneName: {
        type: String,
        trim: true,
        required: true
    },
    refOneDescription: {
        type: String,
        trim: true,
        required: true
    },
    refOneEmail: {
        type: String,
        trim: true,
        required: true
    },
    refOnePhone: {
        type: Number,
        trim: true,
        required: true
    },
    refTwoName: {
        type: String,
        trim: true,
        required: true
    },
    refTwoDescription: {
        type: String,
        trim: true,
        required: true
    },
    refTwoEmail: {
        type: String,
        trim: true,
        required: true
    },
    refTwoPhone: {
        type: Number,
        trim: true,
        required: true
    },
    _creator: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employees'
    }]
});

const EmployeeDetail = mongoose.model('employeeDetails', EmployeeDetailSchema);

module.exports = {EmployeeDetail};