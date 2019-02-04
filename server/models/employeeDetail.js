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
    birthDate: {
        type: String,
        required: true
    },
    city: {
        type: String,
        trim: true,
        required: true
    },
    postalCode: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    resume: {
        type: String,
        trim: true,
        default: null
    },
    _creator: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employees'
    }]
});

const EmployeeDetail = mongoose.model('employeeDetails', EmployeeDetailSchema);

module.exports = {EmployeeDetail};