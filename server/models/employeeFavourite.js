const mongoose = require('mongoose');

const EmployeeFavouriteSchema = new mongoose.Schema({
    _employee: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        ref: 'employeeDetails'
    }
});

const EmployeeFavourite = mongoose.model('employeeFavourites', EmployeeFavouriteSchema);

module.exports = {EmployeeFavourite};