const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    signUpDate: {
        type: Date
    },
    tokens: [{
        access: {
            type: String,
            required: true,        
        },
        token: {
            type: String,
            required: true,
        }
    }]
});

EmployeeSchema.methods.toJSON = function() {
    var employee = this;
    
    var employeeObject = employee.toObject();
    return _.pick(employeeObject, ['_id', 'email']);
};

EmployeeSchema.methods.generateAuthToken = function() {
    var employee = this;
    
    var access = 'auth';
    var token = jwt.sign({_id:employee._id.toHexString(), access}, 'abc123').toString();
    
    if(employee.tokens.length === 0) {
        employee.tokens = employee.tokens.concat([{access, token}]);
    };
    
    return employee.save().then(() => {
        return token;
    });
};

EmployeeSchema.methods.removeToken = function(token) {
    var employee = this;
    
    return employee.update({
        $pull: {
            tokens: {token}
        }
    });
};

EmployeeSchema.statics.findByToken = function(token) {
    var Employee = this;
    
    try {
        var decoded = jwt.verify(token, 'abc123');
    } catch(e) {
        Promise.reject();
    };
    
    return Employee.findOne({
        _id: decoded._id,
        'tokens.access': 'auth',
        'tokens.token': token
    });
};

EmployeeSchema.statics.findByCredentials = function(email, password) {
    var Employee = this;
    
    return Employee.findOne({email}).then((employee) => {
        if(!employee) {
            return console.log('The email can not be found.');
        };
        
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, employee.password, (e, res) => {
                if(res) {
                    resolve(employee);
                } else {
                    reject();
                };
            });
        });
    });
};

EmployeeSchema.pre('save', function(next) {
    var employee = this;
    
    if(employee.isModified('password')) {
        bcrypt.genSalt(10, (e, salt) => {
            bcrypt.hash(employee.password, salt, (e, hash) => {
                employee.password = hash;
                next();
            });
        });
    } else {
        next();
    };
});

const Employee = mongoose.model('employees', EmployeeSchema);

module.exports = {Employee};