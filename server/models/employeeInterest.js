const mongoose = require('mongoose');

const EmployeeInterestSchema = new mongoose.Schema({
    _employee: {
        type: mongoose.Schema.Types.ObjectId
    },
    _event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events'
    },
    _unique: {
        type: String,
        unique: true
    }
});

const EmployeeInterest = mongoose.model('employeeInterests', EmployeeInterestSchema);

module.exports = {EmployeeInterest};