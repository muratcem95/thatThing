const session = require('client-sessions');

const {Admin} = require('./../models/admin');
const {Employee} = require('./../models/employee');

var authenticateAdmin = (req, res, next) => {
    if (req.session && req.session.admin) { 
        Admin.findById({ _id: req.session.admin._id }, function (err, admin) {
            if(admin) {
                req.admin = admin;
                delete req.admin.password; 
                req.session.admin = admin;
                res.locals.admin = admin;
            };
            next();
        });
    } else {
        res.redirect('/mainPage');
        next();
    };
};

var authenticateEmployee = (req, res, next) => {
    if (req.session && req.session.employee) { 
        Employee.findById({ _id: req.session.employee._id }, function (err, employee) {
            if(employee) {
                req.employee = employee;
                delete req.employee.password; 
                req.session.employee = employee;
                res.locals.employee = employee;
            };
            next();
        });
    } else {
        res.redirect('/mainPage');
        next();
    };
};

module.exports = {authenticateAdmin, authenticateEmployee};