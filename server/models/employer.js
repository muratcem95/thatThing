const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const EmployerSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    brn: {
        type: Number,
        required: true,
        trim: true,
        unique: true,
        minlength: 7
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not an email'
        }
    },
    phone: {
        type: Number,
        trim: true,
        required: true
    },
    notes: {
        type: String,
        default: null
    }
});

const Employer = mongoose.model('employers', EmployerSchema);

module.exports = {Employer};