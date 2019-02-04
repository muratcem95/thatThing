const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
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
    date: {
        type: Date,
        trim: true,
        required: true
    },
    address: {
        type: String,
        trim: true,
        required: true
    },
    postalCode: {
        type: String,
        trim: true,
        required: true
    },
    jobPosition: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    notes: {
        type: String,
        trim: true,
        default: null
    },
    full: {
        type: Boolean,
        default: false
    },
    creator: {
        type: String,
        required: true
    }
});

const Event = mongoose.model('events', EventSchema);

module.exports = {Event};