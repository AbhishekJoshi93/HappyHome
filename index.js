//jshint esversion:8

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const multer  = require('multer');
const path = require('path');
// var upload = multer({ dest: 'public/uploads/' });

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

require('events').EventEmitter.prototype._maxListeners = 0;

const app = express();

const twilio = require('twilio');
const client = new twilio('AC0c395964073c8ef0a1f933549a7d9be7', '9a2887c8d8cc4f7a39957e7eb61b1ebb');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
const botName = 'Chat Room Bot';

app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use("/uploads", express.static(__dirname+'/public/uploads'));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname));
    }
  });
   
var upload = multer({ storage: storage });

app.use(session({
    secret: "Secret for password.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(`mongodb+srv://abhijoshi:abhijoshi@happyhomedb-35kqn.mongodb.net/HappyHomeDB`, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});

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
    propertyimage: String,
    leaselike: Number,    
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
    propertyimage: String,
    salelike: Number,   
});

const userSchema = new mongoose.Schema({
    email: String, 
    password: String,
    rating: { type: Number, default: 0 },
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

const metaSchema = new mongoose.Schema({
    totaluser: {type:Number,default:0},
    totalpropertysoldlist: {type:Number,default:0},
    totalpropertyleaselist: {type:Number,default:0},
    totalpropertysold: {type:Number,default:0},
    totalpropertylease: {type:Number,default:0},
    totalfeedback: {type:Number,default:0}
});


userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Msg = new mongoose.model("Msg", messageSchema);
const Meta = new mongoose.model("Meta", metaSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res) => {
    res.render(__dirname + "/views/app.ejs");
});

app.get("/login", (req,res) => {
    res.render(__dirname + "/views/login.ejs", {err:"Welcome Back"});
});

app.post("/login", (req,res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if(err){
            res.render(__dirname + "/views/login.ejs", {err:err.name});
        }else{
                passport.authenticate("local",{failureRedirect:"/register"})(req,res, function(){
                    if(err){
                        console.log(err);
                        res.render(__dirname + "/views/login.ejs", {err:err.name});
                    }
                User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                    res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull Login"});
                });
            });
        }
    });
});

app.get("/register", (req,res) => {
    res.render(__dirname + "/views/register.ejs", {err:"Hello New User"});
});

app.post("/register", (req,res) => {
    User.register({username: req.body.username}, req.body.password, function(err,user) {
        if(err){
            console.log(err);
            res.render(__dirname + "/views/register.ejs", {err:err.name});
        }else{
            passport.authenticate("local")(req,res, function(){

                Meta.find({},function(err,result){
                    result[0].totaluser++;
                    result[0].save(function(){});
                });

            res.render(__dirname + "/views/login.ejs", {err:"Enter Again"});
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
                res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Hey " + req.user.username});
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

                    Meta.find({},function(err,result){
                        result[0].totalpropertysoldlist++;
                        result[0].save(function(){});
                    });

                    User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                        res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull Sale Property Listed"});
                    });
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

                    Meta.find({},function(err,result){
                        result[0].totalpropertyleaselist++;
                        result[0].save(function(){});
                    });

                    User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                        res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull Lease Property Listed"});
                    });
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
            from: +13214504842
        }).then((message) => console.log());
        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
            res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"SMS Is Send"});
        });
    }else{
        res.redirect("/");
    }
});

app.get("/vip/viplogin", (req,res) => {
    if(req.isAuthenticated()){
        User.findById(req.user.id,(err,resultcancel) => {
            if(resultcancel.vipacc){
                User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                    res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Already VIP Access"});
                });
            }else if(!resultcancel.vipacc){                
                res.redirect("/vip/viplogin/for");
            }
        });
    }else{
        res.redirect("/");
    }
});

app.get("/vip/viplogin/for",async (req,res) => {
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

app.get("/home/unsuccessvip", (req,res) => {
    if(req.isAuthenticated()){
        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
            res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Unsuccessfull VIP Access"});
        });
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
                        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                            res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull VIP Access"});
                        });
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
    socket.emit('message', formatMessage(botName, 'Welcome to Chat Room!', " "));
    
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
        res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: "EnterRoom",welmsg: "Welcome To Chat Room"});  
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
                    res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: req.body.room,welmsg: "Room Created"});
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
                    res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: "NotFound",welmsg: "Room Not Found"});
                }
                else if(foundRoom){
                    foundRoom[0].users.push(req.body.username);
                    foundRoom[0].save(function(err){
                        if(err){
                            console.log(err);
                        }
                            res.render(__dirname + "/views/message.ejs",{email: req.user.username,roomid: req.body.room,welmsg: "Successfull Join Room"});
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

app.post("/deleteproperty", (req,res) => {
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    let i = 0;
                    foundUser.saleproperty.forEach(function(element){
                        const id = req.body.refid;
                        if(element._id == id){
                            foundUser.saleproperty.splice(i,1);
                            i++;
                        }
                    });
                    foundUser.save(function(){
                        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                            res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull Deleted"});
                        });
                    });
                }
            }
        });
    }else{
        res.redirect("/");
    }
});

app.post("/deletepropertylease", (req,res) => {
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    let i = 0;
                    foundUser.leaseproperty.forEach(function(element){
                        const id = req.body.refid;
                        if(element._id == id){
                            foundUser.leaseproperty.splice(i,1);
                            i++;
                        }
                    });
                    foundUser.save(function(){
                        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                            res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull Deleted"});
                        });
                    });
                }
            }
        });
    }else{
        res.redirect("/");
    }
});

app.post("/soldproperty", (req,res) => {
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    let i = 0;
                    foundUser.saleproperty.forEach(function(element){
                        const id = req.body.refid;
                        if(element._id == id){
                            foundUser.saleproperty.splice(i,1);
                            i++;
                        }
                    });
                    foundUser.save(function(){});
                        Meta.find({},function(err,result){
                            result[0].totalpropertysold++;
                            result[0].save(function(){});
                        });
                        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                            res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull Sold"});
                        });
                }
            }
        });
    }else{
        res.redirect("/");
    }
});

app.post("/soldpropertylease", (req,res) => {
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    let i = 0;
                    foundUser.leaseproperty.forEach(function(element){
                        const id = req.body.refid;
                        if(element._id == id){
                            foundUser.leaseproperty.splice(i,1);
                            i++;
                        }
                    });
                    foundUser.save(function(){});
                        Meta.find({},function(err,result){
                            result[0].totalpropertylease++;
                            result[0].save(function(){});
                        });
                        User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                            res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Successfull Sold"});
                        });
                }
            }
        });
    }else{
        res.redirect("/");
    }
});

app.get("/aboutus", (req,res) => {
    if(req.isAuthenticated()){
        Meta.find({},function(err,resullt){
            res.render(__dirname + "/views/aboutus.ejs",{obj: resullt[0]});
        });
    }else{
        res.redirect("/");
    }
});

app.post("/rating", (req,res) => {
    if(req.isAuthenticated()){

        User.findById(req.user.id,function(err,founduser){
            founduser.rating = req.body.ratingpro;
            founduser.save(function(err){
                Meta.find({},function(err,result){
                    result[0].totalfeedback++;
                    result[0].save(function(){});
                });
                User.find({vipacc: "true"},'saleproperty leaseproperty',(err,result) => {
                    res.render(__dirname + "/views/home.ejs",{viplist: result,msg:"Thanks For Feedback"});
                });
            });
        });
    }else{
        res.redirect("/");
    }
});

let port = process.env.PORT; 

if(port == null || port == ""){
    port = 3000;
}

server.listen(port, () => {
    console.log("Website is running");
});

//completed