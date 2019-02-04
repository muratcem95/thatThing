const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
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

AdminSchema.methods.toJSON = function() {
    var admin = this;
    
    var adminObject = admin.toObject();
    return _.pick(adminObject, ['_id', 'email']);
};

AdminSchema.methods.generateAuthToken = function() {
    var admin = this;
    
    var access = 'auth';
    var token = jwt.sign({_id:admin._id.toHexString(), access}, 'abc123').toString();
    
    if(admin.tokens.length === 0) {
        admin.tokens = admin.tokens.concat([{access, token}]);
    };
    
    return admin.save().then(() => {
        return token;
    });
};

AdminSchema.methods.removeToken = function(token) {
    var admin = this;
    
    return admin.update({
        $pull: {
            tokens: {token}
        }
    });
};

AdminSchema.statics.findByToken = function(token) {
    var Admin = this;
    
    try {
        var decoded = jwt.verify(token, 'abc123');
    } catch(e) {
        Promise.reject();
    };
    
    return Admin.findOne({
        _id: decoded._id,
        'tokens.access': 'auth',
        'tokens.token': token
    });
};

AdminSchema.statics.findByCredentials = function(email, password) {
    var Employer = this;
    
    return Admin.findOne({email}).then((admin) => {
        if(!admin) {
            return console.log('The email can not be found.');
        };
        
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, admin.password, (e, res) => {
                if(res) {
                    resolve(admin);
                } else {
                    reject();
                };
            });
        });
    });
};

AdminSchema.pre('save', function(next) {
    var admin = this;
    
    if(admin.isModified('password')) {
        bcrypt.genSalt(10, (e, salt) => {
            bcrypt.hash(admin.password, salt, (e, hash) => {
                admin.password = hash;
                next();
            });
        });
    } else {
        next();
    };
});

const Admin = mongoose.model('admin', AdminSchema);

module.exports = {Admin};