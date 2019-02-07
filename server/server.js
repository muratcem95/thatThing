//CONNECTIVITY SETUP
const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const hbs = require('hbs');
const socketIO = require('socket.io');
const moment = require('moment');
const {ObjectID} = require('mongodb');
const _ = require('lodash');
const nodemailer = require('nodemailer');
const upload = require('express-fileupload');

const {mongoose} = require('./db/mongoose');
const {authenticateAdmin} = require('./middleware/authenticate');
const {authenticateEmployee} = require('./middleware/authenticate');
const {Admin} = require('./models/admin');
const {Employer} = require('./models/employer');
const {Employee} = require('./models/employee');
const {EmployeeDetail} = require('./models/employeeDetail');
const {Event} = require('./models/event');
const {EmployeeInterest} = require('./models/employeeInterest');
const {EmployeeAccept} = require('./models/employeeAccept');
const {EmployeePast} = require('./models/employeePast');

const viewsPath = path.join(__dirname, '../views');
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'muratcem95@gmail.com',
        pass: 'hqkjctddswrplwjm'
    }
});

app.set('views', viewsPath);  
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.get('/', (req, res) => {
    res.redirect('/mainPage');
});

app.use(express.static(viewsPath));
app.use(session({
    cookieName: 'session',
    secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));
app.use(upload());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.get('/mainPage', (req, res) => {
    res.render('mainPage/mainPage.html');
});

app.post('/mainPageBusinessForm', (req, res) => {
    var mailOptions = {
        from: req.body.email,
        to: 'muratcem95@gmail.com',
        subject: 'A business is interest to work with me :)!',
        text: 'Business name: '+req.body.name+'; BRN: '+req.body.brn+'; Email: '+req.body.email+'; Phone: '+req.body.phone+'; Address: '+req.body.address+'.'
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
            res.redirect('/mainPage');
        }
    });
});

app.post('/adminSignUp', (req, res) => {
    var admin = new Admin({
        email: req.body.adminSignUpEmail,
        password: req.body.adminSignUpPassword
    });
    admin.save().then(() => {
        req.session.admin = admin;
        admin.generateAuthToken();
        
        res.redirect('/admin/home/upcomingEvents');
    }).catch((e) => res.status(400).send(e));
});

app.post('/adminLogIn', (req, res) => {
    Admin.findByCredentials(req.body.adminLogInEmail, req.body.adminLogInPassword).then((admin) => {
        req.session.admin = admin;
        admin.generateAuthToken();
        
        res.redirect('/admin/home/upcomingEvents');
    }).catch((e) => res.status(401).send(e));
});

app.get('/adminLogOut', authenticateAdmin, (req, res) => {
    req.session.admin.removeToken(req.session.admin.tokens[0].token).then(() => {
        req.session.reset();
        
        res.redirect("/mainPage");
    }).catch((e) => res.status(400).send(e));
});

app.get('/admin/home/createEmployer', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin; 
    
    res.render('admin/home/createEmployer/createEmployer.html');
});

app.post('/admin/home/createEmployerForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;   
    
    var employer = new Employer({
        name: req.body.name,
        brn: req.body.brn,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        signUpDate: moment(),
        notes: req.body.notes
    });
    employer.save().then(() => res.redirect('/admin/home/employerList')).catch((e) => res.status(400).send(e));
});

app.get('/admin/home/employerList', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
        
    Employer.find().then((employers) => res.render('admin/home/employerList/employerList.html', {employers})).catch((e) => res.send("Can not Employer.find"));
});

app.post('/admin/home/employerListNotesForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
    
    Employer.findByIdAndUpdate({
        _id: req.body.employerId
    }, { 
        $set: { 
            notes: req.body.notes
        }
    }, {
        new: true
    }).then(() => res.redirect('/admin/home/employerList')).catch((e) => res.send("Can not Employer.findByIdAndUpdate"));
});

app.post('/admin/home/employerListDeleteForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;   
    
    Employer.findByIdAndDelete({
        _id: req.body.employerId,
    }).then(() => res.redirect('/admin/home/employerList')).catch((e) => res.send("Can not Employer.findByIdAndDelete"));
});

app.get('/admin/home/createEvent', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin; 
    
    Employer.find().then((employers) => res.render('admin/home/createEvent/createEvent.html', {employers})).catch((e) => res.send('Unable to Employer.find'));
    
    
});

app.post('/admin/home/createEventForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;   
    
    var event = new Event({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        date: req.body.date,
        address: req.body.address,
        postalCode: req.body.postalCode,
        jobPosition: req.body.jobPosition,
        description: req.body.description,
        creator: req.body.creator
    });
    event.save().then(() => {
        res.redirect('/admin/home/upcomingEvents');    
    }).catch((e) => res.status(400).send(e));
});

app.get('/admin/home/upcomingEvents', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
           
    Event.find({
        date: {
            $gte: moment(),
            $lte: moment('2099')
        }
    }).then((events) => {
        res.render('admin/home/upcomingEvents/upcomingEvents.html', {events});
    }).catch((e) => res.send("Can not Event.find"));
});

app.post('/admin/home/upcomingEventsNotesForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
    
    Event.findByIdAndUpdate({
        _id: req.body.eventId
    }, { 
        $set: { 
            notes: req.body.notes
        }
    }, {
        new: true
    }).then(() => res.redirect('/admin/home/upcomingEvents')).catch((e) => res.send("Can not Event.findByIdAndUpdate"));
});

app.post('/admin/home/upcomingEventsFullForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
    
    Event.findById({
        _id: req.body.eventId
    }).then((event) => {
        if(event.full === false) {
            Event.findByIdAndUpdate({
                _id: req.body.eventId
            }, { 
                $set: { 
                    full: true
                }
            }, {
                new: true
            }).then(() => res.redirect('/admin/home/upcomingEvents')).catch((e) => res.send("Can not Event.findByIdAndUpdate"));
        } else {
            Event.findByIdAndUpdate({
                _id: req.body.eventId
            }, { 
                $set: { 
                    full: false
                }
            }, {
                new: true
            }).then(() => res.redirect('/admin/home/upcomingEvents')).catch((e) => res.send("Can not Event.findByIdAndUpdate"));
        };
    }).catch((e) => res.send("Can not Event.findOne"));
});

app.post('/admin/home/upcomingEventsDeleteEventForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;   
    
    Event.findByIdAndDelete({
        _id: req.body.eventId,
    }).then(() => res.redirect('/admin/home/upcomingEvents')).catch((e) => res.send("Can not Event.findByIdAndDelete"));
});

app.get('/admin/home/pastEvents', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
        
    Event.find({
        date: {
            $gte: moment('2000'),
            $lte: moment()
        }
    }).then((events) => {
        res.render('admin/home/pastEvents/pastEvents.html', {events});
    }).catch((e) => res.send("Can not Event.find"));
});

app.post('/admin/home/pastEventsNotesForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
    
    Event.findByIdAndUpdate({
        _id: req.body.eventId
    }, { 
        $set: { 
            notes: req.body.notes
        }
    }, {
        new: true
    }).then((events) => res.redirect('/admin/home/pastEvents')).catch((e) => res.send("Can not Event.findByIdAndUpdate"));
});

app.post('/admin/home/pastEventsFullForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    
    
    Event.findById({
        _id: req.body.eventId
    }).then((event) => {
        if(event.full === false) {
            Event.findByIdAndUpdate({
                _id: req.body.eventId
            }, { 
                $set: { 
                    full: true
                }
            }, {
                new: true
            }).then((events) => res.redirect('/admin/home/pastEvents')).catch((e) => res.send("Can not Event.findByIdAndUpdate"));
        } else {
            Event.findByIdAndUpdate({
                _id: req.body.eventId
            }, { 
                $set: { 
                    full: false
                }
            }, {
                new: true
            }).then((events) => res.redirect('/admin/home/pastEvents')).catch((e) => res.send("Can not Event.findByIdAndUpdate"));
        };
    }).catch((e) => res.send("Can not Event.findOne"));
});

app.post('/admin/home/pastEventsDeleteEventForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;   
    
    Event.findByIdAndDelete({
        _id: req.body.eventId,
    }).then(() => res.redirect('/admin/home/pastEvents')).catch((e) => res.send("Can not Event.findByIdAndDelete"));
});

app.get('/admin/searchEmployees', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;
    
    EmployeeDetail.find().populate('_creator').then((employees) => {
        console.log(employees[0]._creator._id);
        res.render('admin/searchEmployees/searchEmployees.html', {employees});
    }).catch((e) => res.send(e));
});

app.post('/admin/searchEmployeesNotesForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;    

//    Employee.findById({_id: req.body.employeeId}).then((emp) => {
//        console.log(emp);
//        res.redirect('/admin/searchEmployees');
//    }).catch((e) => res.send(e));
    
//    EmployeeDetail.find().then((employees) => {
//        console.log(employees);I
//        res.redirect('/admin/searchEmployees');
//    }).catch((e) => res.send(e));
    
    EmployeeDetail.findOneAndUpdate({
        _creator: req.body.employeeId
    }, { 
        $set: { 
            notes: req.body.notes
        }
    }, {
        new: true
    }).then((employee) => {
        console.log(employee);
        
        res.redirect('/admin/searchEmployees');
    }).catch((e) => res.send(e));
});

app.post('/admin/searchEmployeesDeleteForm', authenticateAdmin, (req, res) => {
    var sessAdmin = req.session.admin;   
    
    Employee.findByIdAndDelete({
        _id: req.body.employeeId,
    }).then(() => res.redirect('/admin/searchEmployees')).catch((e) => res.send(e));
});



app.post('/employeeSignUp', (req, res) => {
    var employee = new Employee({
        email: req.body.employeeSignUpEmail,
        password: req.body.employeeSignUpPassword,
        signUpDate: moment()
    });
    employee.save().then(() => {
        req.session.employee = employee;
        employee.generateAuthToken();
        
        var mailOptions = {
            from: req.body.email,
            to: 'muratcem95@gmail.com',
            subject: 'An employee has just signed up! :)',
            text: 'Employee email: '+req.body.employeeSignUpEmail
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        
        res.redirect('/employee/home/upcomingEvents');
    }).catch((e) => res.send(e));
});

app.post('/employeeLogIn', (req, res) => {
    Employee.findByCredentials(req.body.employeeLogInEmail, req.body.employeeLogInPassword).then((employee) => {
        req.session.employee = employee;
        employee.generateAuthToken();
        
        res.redirect('/employee/home/upcomingEvents');
    }).catch((e) => res.send(e));
});

app.get('/employeeLogOut', authenticateEmployee, (req, res) => {
    req.session.employee.removeToken(req.session.employee.tokens[0].token).then(() => {
        req.session.reset();
        
        res.redirect("/mainPage");
    }).catch((e) => res.send(e));
});

app.get('/employee/home/interestedEvents', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee; 
    
    EmployeeInterest.find({
        _employee: sessEmployee._id
    }).populate('_event').then((events) => res.render('employee/home/interestedEvents/interestedEvents.html', {sessEmployee, events})).catch((e) => res.send(e));
});

app.get('/employee/home/upcomingEvents', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee; 
    
    EmployeeAccept.find({
        _employee: sessEmployee._id
    }).populate('_event').then((events) => res.render('employee/home/upcomingEvents/upcomingEvents.html', {sessEmployee, events})).catch((e) => res.send(e));
});

app.get('/employee/home/pastEvents', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee; 
    
    EmployeePast.find({
        _employee: sessEmployee._id
    }).populate('_event').then((events) => res.render('employee/home/pastEvents/pastEvents.html', {sessEmployee, events})).catch((e) => res.send(e));
});

app.get('/employee/myAccount', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee;  
    
    EmployeeDetail.findOne({_creator: sessEmployee._id}).then((employeeDetail) => {
        if(!employeeDetail) {
            res.render('employee/myAccount/myAccount.html', {sessEmployee});
        } else {
            res.render('employee/myAccount/myAccount.html', {sessEmployee, employeeDetail});
        };
    }).catch((e) => res.send(e));
});

app.post('/employee/myAccountprofileImageUpload', (req, res) => {
    if(req.files) {
        var file = req.files.filename,
            filename = file.name;
        file.mv("views/employee/myAccount/uploads/profileImage/"+filename,function(err) {
            if(err) {
                res.send(err);
            } else {
                var sessEmployee = req.session.employee;   
                
                var fns = JSON.stringify(req.files.filename.name);
                var fn = JSON.parse(fns);
    
                EmployeeDetail.findOne({_creator: sessEmployee._id}).then((employeeDetail) => {
                    if(!employeeDetail) {
                        var employeeDet = new EmployeeDetail({
                            profileImage: fn,
                            _creator: sessEmployee._id
                        });
                        employeeDet.save().then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
                    } else {
                        EmployeeDetail.findOneAndUpdate({
                            _creator: sessEmployee._id
                        }, { 
                            $set: { 
                                profileImage: fn
                            }
                        }, {
                            new: true
                        }).then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
                    };
                }).catch((e) => res.send(e));
            };
        });
    };
});

app.post('/employee/myAccountProfileImageDelete', (req, res) => {
    var sessEmployee = req.session.employee;
        
    EmployeeDetail.findOneAndUpdate({
        _creator: sessEmployee._id
    }, { 
        $set: { 
            profileImage: null
        }
    }, {
        new: true
    }).then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));       
});

app.post('/employee/myAccountResumeUpload', (req, res) => {
    if(req.files) {
        var file = req.files.filename,
            filename = file.name;
        file.mv("views/employee/myAccount/uploads/resume/"+filename,function(err) {
            if(err) {
                res.send(err);
            } else {
                var sessEmployee = req.session.employee;   
                
                var fns = JSON.stringify(req.files.filename.name);
                var fn = JSON.parse(fns);
    
                EmployeeDetail.findOne({_creator: sessEmployee._id}).then((employeeDetail) => {
                    if(!employeeDetail) {
                        var employeeDet = new EmployeeDetail({
                            resume: fn,
                            _creator: sessEmployee._id
                        });
                        employeeDet.save().then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
                    } else {
                        EmployeeDetail.findOneAndUpdate({
                            _creator: sessEmployee._id
                        }, { 
                            $set: { 
                                resume: fn
                            }
                        }, {
                            new: true
                        }).then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
                    };
                }).catch((e) => res.send(e));
            };
        });
    };
});

app.post('/employee/myAccountResumeDelete', (req, res) => {
    var sessEmployee = req.session.employee;
           
    EmployeeDetail.findOneAndUpdate({
        _creator: sessEmployee._id
    }, { 
        $set: { 
            resume: null
        }
    }, {
        new: true
    }).then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));       
});

app.post('/employee/myAccountPhotoIdUpload', (req, res) => {
    if(req.files) {
        var file = req.files.filename,
            filename = file.name;
        file.mv("views/employee/myAccount/uploads/photoId/"+filename,function(err) {
            if(err) {
                res.send(err);
            } else {
                var sessEmployee = req.session.employee;   
                
                var fns = JSON.stringify(req.files.filename.name);
                var fn = JSON.parse(fns);
    
                EmployeeDetail.findOne({_creator: sessEmployee._id}).then((employeeDetail) => {
                    if(!employeeDetail) {
                        var employeeDet = new EmployeeDetail({
                            photoId: fn,
                            _creator: sessEmployee._id
                        });
                        employeeDet.save().then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
                    } else {
                        EmployeeDetail.findOneAndUpdate({
                            _creator: sessEmployee._id
                        }, { 
                            $set: { 
                                photoId: fn
                            }
                        }, {
                            new: true
                        }).then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
                    };
                }).catch((e) => res.send(e));
            };
        });
    };
});

app.post('/employee/myAccountPhotoIdDelete', (req, res) => {
    var sessEmployee = req.session.employee;
          
    EmployeeDetail.findOneAndUpdate({
        _creator: sessEmployee._id
    }, { 
        $set: { 
            photoId: null
        }
    }, {
        new: true
    }).then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));       
});

app.post('/employee/myAccountEdit', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee;    
    
    Employee.findByIdAndUpdate({
        _id: sessEmployee._id
    }, { 
        $set: { 
            email: req.body.email,
        }
    }, {
        new: true
    }).then((employee) => {
        EmployeeDetail.findOne({_creator: employee._id}).then((employeeDetail) => {
            if(!employeeDetail) {
                var employeeDet = new EmployeeDetail({
                    name: req.body.name,
                    linkedin: req.body.linkedin,
                    gender: req.body.gender,
                    phone: req.body.phone,
                    birthDate: req.body.birthDate,
                    city: req.body.city,
                    country: req.body.country,
                    postalCode: req.body.postalCode,
                    interestedIn: req.body.interestedIn,
                    refOneName: req.body.refOneName,
                    refOneDescription: req.body.refOneDescription,
                    refOneEmail: req.body.refOneEmail,
                    refOnePhone: req.body.refOnePhone,
                    refTwoName: req.body.refTwoName,
                    refTwoDescription: req.body.refTwoDescription,
                    refTwoEmail: req.body.refTwoEmail,
                    refTwoPhone: req.body.refTwoPhone,
                    _creator: employee._id
                });
                employeeDet.save().then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
            } else {
                EmployeeDetail.findOneAndUpdate({
                    _creator: employee._id
                }, { 
                    $set: { 
                        name: req.body.name,
                        linkedin: req.body.linkedin,
                        gender: req.body.gender,
                        phone: req.body.phone,
                        birthDate: req.body.birthDate,
                        city: req.body.city,
                        country: req.body.country,
                        postalCode: req.body.postalCode,
                        interestedIn: req.body.interestedIn,
                        refOneName: req.body.refOneName,
                        refOneDescription: req.body.refOneDescription,
                        refOneEmail: req.body.refOneEmail,
                        refOnePhone: req.body.refOnePhone,
                        refTwoName: req.body.refTwoName,
                        refTwoDescription: req.body.refTwoDescription,
                        refTwoEmail: req.body.refTwoEmail,
                        refTwoPhone: req.body.refTwoPhone
                    }
                }, {
                    new: true
                }).then(() => res.redirect('/employee/myAccount')).catch((e) => res.send(e));
            };
        }).catch((e) => res.send(e));
    }).catch((e) => res.send(e));
});

app.get('/employee/searchJobs', (req, res) => {
    var sessEmployee = req.session.employee; 
    
    Event.find({
        date: {
            $gte: moment(),
            $lte: moment('2099')
        }
    }).sort('date').then((events) => res.render('employee/searchJobs/searchJobs.html', {sessEmployee, events})).catch((e) => res.send(e));
});

app.post('/employee/searchJobsInterest', (req, res) => {
    var sessEmployee = req.session.employee;
    
    var employeeInterest = new EmployeeInterest({
        _employee: sessEmployee._id,
        _event: req.body.eventId
    });
    employeeInterest.save().then(() => {
        var mailOptions = {
            from: sessEmployee.email,
            to: 'muratcem95@gmail.com',
            subject: 'Interested in a job',
            text: 'Employee Id: '+sessEmployee._id+';'+'Event Id: '+req.body.eventId
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        
        res.redirect('/employee/searchJobs');
    }).catch((e) => res.send(e));
});




































//IO CONNECTIONS
io.on('connection', (socket) => {
    console.log('New user connected.');
    socket.on('disconnect', () => {
        console.log('User was disconnected');
    });
});
    
server.listen(port, () => console.log(`Server is up on port ${port}`));

