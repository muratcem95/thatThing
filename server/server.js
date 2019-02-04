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
        notes: req.body.notes
    });
    employer.save().then(() => res.redirect('/admin/home/upcomingEvents')).catch((e) => res.status(400).send(e));
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
        Employer.find({
            _id: events._creator
        }).then((employers) => {
            if(!employers) {
                res.send("oops");
            } else {
                console.log(employers);
                res.render('admin/home/upcomingEvents/upcomingEvents.html', {employers, events});
            }
            
            
        }).catch((e) => res.send("Can not Employer.find"));
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
        Employer.find({
            _id: events._creator
        }).then((employers) => {
            res.render('admin/home/pastEvents/pastEvents.html', {employers, events});
        }).catch((e) => res.send("Can not Employer.find"));
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



app.post('/employeeSignUp', (req, res) => {
    var employee = new Employee({
        email: req.body.employeeSignUpEmail,
        password: req.body.employeeSignUpPassword
    });
    employee.save().then(() => {
        req.session.employee = employee;
        employee.generateAuthToken();
        
        res.redirect('/employee/home/upcomingEvents');
    }).catch((e) => res.status(400).send(e));
});

app.post('/employeeLogIn', (req, res) => {
    Employee.findByCredentials(req.body.employeeLogInEmail, req.body.employeeLogInPassword).then((employee) => {
        req.session.employee = employee;
        employee.generateAuthToken();
        
        res.redirect('/employee/home/upcomingEvents');
    }).catch((e) => res.status(401).send(e));
});

app.get('/employeeLogOut', authenticateEmployee, (req, res) => {
    req.session.employee.removeToken(req.session.employee.tokens[0].token).then(() => {
        req.session.reset();
        
        res.redirect("/mainPage");
    }).catch((e) => res.status(400).send(e));
});

app.get('/employee/home/upcomingEvents', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee;    
    
    res.render('employee/home/upcomingEvents/upcomingEvents.html', {sessEmployee});
});

app.get('/employee/home/interestedEvents', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee; 
    
    EmployeeInterest.find({
        _employee: sessEmployee._id
    }).populate('_event').then((events) => {
        eventsObj = [];
        
        for (var i = 0; i < events.length; i++) { 
            var eventObj = events[i]._event[0];
            eventsObj.push(eventObj);
        };
        
        console.log(eventsObj);
        
        res.render('employee/home/interestedEvents/interestedEvents.html', {sessEmployee, eventsObj});
    }).catch((e) => res.send(e));
});

app.post('/employee/home/interestedEventsDeleteForm', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee; 
    
    EmployeeInterest.findOneAndDelete({
        _event: req.body.eventId,
    }).then(() => res.redirect('/employee/home/upcomingEvents')).catch((e) => res.send(e));
});

app.get('/employee/myAccount', authenticateEmployee, (req, res) => {
    var sessEmployee = req.session.employee;  
    
    EmployeeDetail.findOne({_creator: sessEmployee._id}).then((employeeDetail) => {
        if(!employeeDetail) {
            res.render('employee/myAccount/myAccount.html', {sessEmployee});
        } else {
            res.render('employee/myAccount/myAccount.html', {sessEmployee, employeeDetail});
        };
    }).catch((e) => res.send("Can not EmployeeDetail.find"));
});

app.post('/employee/myAccountprofileImageUpload', (req, res) => {
    if(req.files) {
        var file = req.files.filename,
            filename = file.name;
        file.mv("views/employee/myAccount/uploads/profileImage/"+filename,function(err) {
            if(err) {
                console.log(err);
                res.send("error occured");
            } else {
                var sessEmployee = req.session.employee;   
                
                var fns = JSON.stringify(req.files.filename.name);
                var fn = JSON.parse(fns);
    
                Employee.findById({
                    _id: sessEmployee._id
                }).then((employee) => {
                    EmployeeDetail.findOne({_creator: employee._id}).then((employeeDetail) => {
                        if(!employeeDetail) {
                            var employeeDet = new EmployeeDetail({
                                profileImage: fn
                            });
                            employeeDet.save().then(() => {
                                res.redirect('/employee/myAccount');    
                            }).catch((e) => res.status(400).send(e));
                        } else {
                            EmployeeDetail.findOneAndUpdate({
                                _creator: employee._id
                            }, { 
                                $set: { 
                                    profileImage: fn
                                }
                            }, {
                                new: true
                            }).then(() => {
                                res.redirect('/employee/myAccount');
                            }).catch((e) => console.log(e));
                        };
                    }).catch((e) => res.send("Can not EmployeeDetail.find"));
                }).catch((e) => res.send("Can not Employee.findByIdAndUpdate"));
            };
        });
    };
});

app.post('/employee/myAccountResumeUpload', (req, res) => {
    if(req.files) {
        var file = req.files.filename,
            filename = file.name;
        file.mv("views/employee/myAccount/uploads/resume/"+filename,function(err) {
            if(err) {
                console.log(err);
                res.send("error occured");
            } else {
                var sessEmployee = req.session.employee;   
                
                var fns = JSON.stringify(req.files.filename.name);
                var fn = JSON.parse(fns);
    
                Employee.findById({
                    _id: sessEmployee._id
                }).then((employee) => {
                    EmployeeDetail.findOne({_creator: employee._id}).then((employeeDetail) => {
                        if(!employeeDetail) {
                            var employeeDet = new EmployeeDetail({
                                resume: fn
                            });
                            employeeDet.save().then(() => {
                                res.redirect('/employee/myAccount');    
                            }).catch((e) => res.status(400).send(e));
                        } else {
                            EmployeeDetail.findOneAndUpdate({
                                _creator: employee._id
                            }, { 
                                $set: { 
                                    resume: fn
                                }
                            }, {
                                new: true
                            }).then(() => {
                                res.redirect('/employee/myAccount');
                            }).catch((e) => console.log(e));
                        };
                    }).catch((e) => res.send("Can not EmployeeDetail.find"));
                }).catch((e) => res.send("Can not Employee.findByIdAndUpdate"));
            };
        });
    };
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
                    birthDate: req.body.birthDate,
                    city: req.body.city,
                    postalCode: req.body.postalCode,
                    description: req.body.description,
                    _creator: employee._id
                });
                employeeDet.save().then(() => {
                    res.redirect('/employee/myAccount');    
                }).catch((e) => res.status(400).send(e));
            } else {
                EmployeeDetail.findOneAndUpdate({
                    _creator: employee._id
                }, { 
                    $set: { 
                        name: req.body.name,
                        linkedin: req.body.linkedin,
                        birthDate: req.body.birthDate,
                        city: req.body.city,
                        postalCode: req.body.postalCode,
                        description: req.body.description,
                    }
                }, {
                    new: true
                }).then((emp) => {
                    res.redirect('/employee/myAccount');
                }).catch((e) => res.send("Can not Employee.findOneAndUpdate"));
            };
        }).catch((e) => res.send("Can not EmployeeDetail.find"));
    }).catch((e) => res.send("Can not Employee.findByIdAndUpdate"));
});

app.get('/employee/searchJobs', (req, res) => {
    var sessEmployee = req.session.employee; 
    
    Event.find({
        date: {
            $gte: moment(),
            $lte: moment('2099')
        }
    }).sort('date').then((events) => {
        res.render('employee/searchJobs/searchJobs.html', {sessEmployee, events});
    }).catch((e) => res.send('Can not Event.find'));
});

app.post('/employee/searchJobsInterest', (req, res) => {
    var sessEmployee = req.session.employee;
    
    var employeeInterest = new EmployeeInterest({
        _employee: sessEmployee._id,
        _event: req.body._event
    });
    employeeInterest.save().then(() => {
        var mailOptions = {
            from: sessEmployee.email,
            to: 'muratcem95@gmail.com',
            subject: 'Interested in a job',
            text: 'Employee Id: '+sessEmployee._id+';'+'Event Id: '+req.body._event
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        
        res.redirect('/employee/searchJobs');
    }).catch((e) => res.send('Can not be saved.'));
});




































//IO CONNECTIONS
io.on('connection', (socket) => {
    console.log('New user connected.');
    socket.on('disconnect', () => {
        console.log('User was disconnected');
    });
});
    
server.listen(port, () => console.log(`Server is up on port ${port}`));

