//jshint esversion:8

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const multer  = require('multer');
const stripe = require('stripe')('sk_test_AbkZh2jDodAGhnLeivoXX61A005bFSQTYJ');
const dotenv = require('dotenv').config();
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
const moment = require('moment');

const app = express();

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;   
const twilio = require('twilio');
const client = new twilio(accountSid, authToken);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
const botName = 'Chat Room Bot';

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now());
    }
  });
   
var upload = multer({ storage: storage });

app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: "Secret for password.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});

const leasepropertySchema = new mongoose.Schema({
    personname: String,
    personnumber: Number,
    type: String,
    typeproperty: String,
    propertyname: String,
    propertynumber: Number,
    propertyfloor: Number,
    propertyarea: String,
    propertycity: String,
    propertystate: String,
    propertypincode: Number,
    propertybudget: Number,
    propertyreraapproved: String,
    propertyreranumber: Number,
    propertysecuritydeposit: String,
    propertypreference: String,
    propertynegotiation: String,
    propertyage: Number,
    propertydescription: String,
    propertynumberrooms: Number,
    propertynumberbathrooms: Number,
    propertyfurnishingtype: String,
    propertysquarearea: Number,
    propertyfacing: String,
    propertynearby: Array,
    propertyamenities: Array,
    propertyfurnishing: Array,
    propertytime: Number,
    propertyimage: String    
});

const salepropertySchema = new mongoose.Schema({
    personname: String,
    personnumber: Number,
    type: String,
    typeproperty: String,
    propertyname: String,
    propertynumber: Number,
    propertyfloor: Number,
    propertyarea: String,
    propertycity: String,
    propertystate: String,
    propertypincode: Number,
    propertybudget: Number,
    propertyreraapproved: String,
    propertyreranumber: Number,
    propertynegotiation: String,
    propertyage: Number,
    propertydescription: String,
    propertynumberrooms: Number,
    propertynumberbathrooms: Number,
    propertyfurnishingtype: String,
    propertysquarearea: Number,
    propertyfacing: String,
    propertynearby: Array,
    propertyamenities: Array,
    propertyfurnishing: Array,
    propertyimage: String    
});

const userSchema = new mongoose.Schema({
    email: String, 
    password: String,
    vipacc: { type: Boolean, default: false },
    saleproperty: [salepropertySchema],
    leaseproperty: [leasepropertySchema],
});

const chatSchema = new mongoose.Schema({
    chatusername: String,
    chatusermsg: String,
    chattime: String
});

const messageSchema = new mongoose.Schema({
    username: String,
    users: Array,
    roomid: String,
    chat: [chatSchema]
});


userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Msg = new mongoose.model("Msg", messageSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res) => {
    res.render(__dirname + "/views/app.ejs");
});

app.get("/login", (req,res) => {
    res.render(__dirname + "/views/login.ejs");
});

app.post("/login", (req,res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if(err){
            res.redirect("/");
        }else{
                passport.authenticate("local")(req,res, function(){
                res.redirect("/home");
            });
        }
    });
});

app.get("/register", (req,res) => {
    res.render(__dirname + "/views/register.ejs");
});

app.post("/register", (req,res) => {
    User.register({username: req.body.username}, req.body.password, function(err,user) {
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/login");
            });
        }
    });
});

app.get("/logout", (req,res) => {
    req.logout();
    res.redirect("/");
});

app.get("/home", (req,res) => {
    if(req.isAuthenticated()){

        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
            res.render(__dirname + "/views/home.ejs",{viplist: result});
        });

    }else{
        res.redirect("/");
    }
});

app.get("/home/buy", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/buyform.ejs");
    }else{
        res.redirect("/");
    }
});

app.post("/home/buy", (req,res) => {
    User.find({
        $and: [
            {"saleproperty.typeproperty": req.body.typeofp},
            {"saleproperty.propertyarea": req.body.areapro},
            {"saleproperty.propertycity": req.body.citypro},
            {"saleproperty.propertystate": req.body.statepro},
            {"saleproperty.propertybudget": {$lte: req.body.budgetprotxt}},
            {"saleproperty.propertyfurnishingtype": req.body.furnishedpro}
        ]
    }, 'saleproperty', (err,result) => {
        if(err){
            console.log(err);
        }else{
            res.render(__dirname + "/views/resultbuy.ejs", {
                saleobj: result,
                typeofp: req.body.typeofp,
                areapro: req.body.areapro,
                citypro: req.body.citypro,
                statepro: req.body.statepro,
                budgetprotxt: req.body.budgetprotxt,
                furnishedpro: req.body.furnishedpro
            });
        }
    });
});

app.get("/home/rent", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/rentform.ejs");
    }else{
        res.redirect("/");
    }
});

app.post("/home/rent", (req,res) => {
    User.find({
        $and: [
            {"leaseproperty.typeproperty": req.body.typeofp},
            {"leaseproperty.propertyarea": req.body.areapro},
            {"leaseproperty.propertycity": req.body.citypro},
            {"leaseproperty.propertystate": req.body.statepro},
            {"leaseproperty.propertybudget": {$lte: req.body.budgetprotxt}},
            {"leaseproperty.propertyfurnishingtype": req.body.furnishedpro}
        ]
    }, 'leaseproperty', (err,result) => {
        if(err){
            console.log(err);
        }else{
            res.render(__dirname + "/views/resultrent.ejs", {
                leaseobj: result,
                typeofp: req.body.typeofp,
                areapro: req.body.areapro,
                citypro: req.body.citypro,
                statepro: req.body.statepro,
                budgetprotxt: req.body.budgetprotxt,
                furnishedpro: req.body.furnishedpro
            });
        }
    });
});

app.get("/home/sale", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/saleform.ejs");
    }else{
        res.redirect("/");
    }
});

app.post("/home/sale", upload.single('imagepro'), (req,res) => {
    const bodydata = {
        personname: req.body.pername,
        personnumber: req.body.perphoneno,
        type: req.body.type,
        typeproperty: req.body.typeofp,
        propertyname: req.body.namepro,
        propertynumber: req.body.numberpro,
        propertyfloor: req.body.floorpro,
        propertyarea: req.body.areapro,
        propertycity: req.body.citypro,
        propertystate: req.body.statepro,
        propertypincode: req.body.pincodepro,
        propertybudget: req.body.budgetprotxt,
        propertyreraapproved: req.body.rera,
        propertyreranumber: req.body.rerano,
        propertynegotiation: req.body.nego,
        propertyage: req.body.ageofpro,
        propertydescription: req.body.despro,
        propertynumberrooms: req.body.noofrooms,
        propertynumberbathrooms: req.body.noofbathrooms,
        propertyfurnishingtype: req.body.furnishedpro,
        propertysquarearea: req.body.areasqpro,
        propertyfacing: req.body.facingpro,
        propertynearby: req.body.nearbypro,
        propertyamenities: req.body.amenitiespro,
        propertyfurnishing: req.body.furnishingpro,
        propertyimage: req.file.filename
    };

    User.findById(req.user.id, function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.saleproperty.push(bodydata);
                foundUser.save(function(){
                    res.redirect("/home");
                });
            }
        }
    });
});

app.get("/home/lease", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/leaseform.ejs");
    }else{
        res.redirect("/");
    }
});

app.post("/home/lease", upload.single('imagepro'), (req,res) => {
    const bodydata = {
        personname: req.body.pername,
        personnumber: req.body.perphoneno,
        type: req.body.type,
        typeproperty: req.body.typeofp,
        propertyname: req.body.namepro,
        propertynumber: req.body.numberpro,
        propertyfloor: req.body.floorpro,
        propertyarea: req.body.areapro,
        propertycity: req.body.citypro,
        propertystate: req.body.statepro,
        propertypincode: req.body.pincodepro,
        propertybudget: req.body.budgetprotxt,
        propertyreraapproved: req.body.rera,
        propertyreranumber: req.body.rerano,
        propertysecuritydeposit: req.body.secdeposit,
        propertypreference: req.body.prefered,
        propertynegotiation: req.body.nego,
        propertyage: req.body.ageofpro,
        propertydescription: req.body.despro,
        propertynumberrooms: req.body.noofrooms,
        propertynumberbathrooms: req.body.noofbathrooms,
        propertyfurnishingtype: req.body.furnishedpro,
        propertysquarearea: req.body.areasqpro,
        propertyfacing: req.body.facingpro,
        propertynearby: req.body.nearbypro,
        propertyamenities: req.body.amenitiespro,
        propertyfurnishing: req.body.furnishingpro,
        propertytime: req.body.timepro,
        propertyimage: req.file.filename
    };

    User.findById(req.user.id, function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.leaseproperty.push(bodydata);
                foundUser.save(function(){
                    res.redirect("/home");
                });
            }
        }
    });
});

app.get("/home/dashboard", (req,res) => {
    if(req.isAuthenticated()){
        User.findById(req.user.id, 'leaseproperty saleproperty', (err,leasesalelists) => { 
            if(err){
                console.log(err);
            }else{
                res.render(__dirname + "/views/dashboard.ejs", {leasesaleobj: leasesalelists});
            }
        });
    }else{
        res.redirect("/");
    }
});

app.post("/interest", (req,res) => {
    if(req.isAuthenticated()){
        client.messages.create({
            body: 'Hello I m interested in your listing on Happy Home. And for further meetings contact me with this room id in chat section => ' + req.body.roomid,
            to: '+91 ' + req.body.refid,
            from: process.env.PHONE_NO
        }).then((message) => console.log(message.sid));
        res.redirect("/home");
    }else{
        res.redirect("/");
    }
});

app.get("/vip/viplogin",async (req,res) => {
    if(req.isAuthenticated()){
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1099,
            currency: 'inr',
            metadata: {integration_check: 'accept_a_payment'},
          });
        res.render(__dirname + "/views/viplogin.ejs",{email: req.user.username});            
    }else{
        res.redirect("/");
    }     
});

app.get("/home/successvip", (req,res) => {
    if(req.isAuthenticated()){

        User.findById(req.user.id, function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    foundUser.vipacc = true;
                    foundUser.save(function(){
                        res.redirect("/home");
                    });
                }
            }
        });
    }else{
        res.redirect("/");
    }
});

io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    
    socket.join(user.room);
    
    Msg.find({roomid: user.room},'chat',function(err,foundMsg){
        if(err){
            console.log(err);
        }else{
            if(foundMsg){
                foundMsg[0].chat.forEach(element => {
                    io.to(user.room).emit('message', formatMessage(element.chatusername, element.chatusermsg, element.chattime));
                });
            }
        }
    });

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Chat Room!', moment().format('h:mm a')));
    
    // Broadcast when a user connects
    socket.broadcast
    .to(user.room)
    .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`, moment().format('h:mm a'))
        );
        
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)

        });
    });
    
    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        
        const bodydata = {
            chatusername: user.username,
            chatusermsg: msg,
            chattime: moment().format('h:mm a')
        };

        Msg.find({roomid: user.room},function(err,foundRoomToAdd){
            if(err){
                console.log(err);
            }else{
                if(foundRoomToAdd){
                    foundRoomToAdd[0].chat.push(bodydata);
                    foundRoomToAdd[0].save(function(err){
                        if(err){
                            console.log(err);
                        }
                        io.to(user.room).emit('message', formatMessage(user.username, msg, moment().format('h:mm a')));
                    });
                }
            }
        });
    });
    
    // Runs when client disconnects
    
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        
        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`, moment().format('h:mm a'))
                );
                
                // Send users and room info
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                });
            }
        });
    });
        
app.get("/message", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: "EnterRoom"});  
    }else{
        res.redirect("/");
    }
});

app.post("/message", (req,res) => {
    if(req.isAuthenticated()){
        const msg = new Msg({
            username: Date.now(),
            roomid: req.body.room
        });
        msg.save(function(err,ms){
            if(err){
                console.log(err);
            }else{
                if(ms){
                    res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: req.body.room});
                }    
            }
        });
    }else{
        res.redirect("/");
    }
});

app.post("/add", (req,res) => {
    if(req.isAuthenticated()){
        Msg.find({roomid: req.body.room}, function(err,foundRoom){
            if(err){
                console.log(err);
            }else{
                if(foundRoom.length===0){
                    res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: "NotFound"});
                }
                else if(foundRoom){
                    foundRoom[0].users.push(req.body.username);
                    foundRoom[0].save(function(err){
                        if(err){
                            console.log(err);
                        }
                            res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: req.body.room});
                    });
                }
            }
        });
    }else{
        res.redirect("/");
    }
});

app.get("/chat", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/chat.ejs");  
    }else{
        res.redirect("/");
    }
});

server.listen("3000", () => {
    console.log("Server is serving");
});
