const mongoose = require('mongoose');

const EmployeePastSchema = new mongoose.Schema({
    _employee: {
        type: mongoose.Schema.Types.ObjectId
    },
    _event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events'
    }
});

const EmployeePast = mongoose.model('employeePasts', EmployeePastSchema);

module.exports = {EmployeePast};