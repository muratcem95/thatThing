const mongoose = require('mongoose');

const EmployeeInterestSchema = new mongoose.Schema({
    _employee: {
        type: mongoose.Schema.Types.ObjectId
    },
    _event: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events'
    }]
});

const EmployeeInterest = mongoose.model('employeeInterests', EmployeeInterestSchema);

module.exports = {EmployeeInterest};