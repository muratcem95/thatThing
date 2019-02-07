const mongoose = require('mongoose');

const EmployeeAcceptSchema = new mongoose.Schema({
    _employee: {
        type: mongoose.Schema.Types.ObjectId
    },
    _event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events'
    }
});

const EmployeeAccept = mongoose.model('employeeAccepts', EmployeeAcceptSchema);

module.exports = {EmployeeAccept};