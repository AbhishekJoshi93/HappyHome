//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
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
    propertytime: Number    
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
    propertyfurnishing: Array
});

const userSchema = new mongoose.Schema({
    email: String, 
    password: String,
    saleproperty: [salepropertySchema],
    leaseproperty: [leasepropertySchema]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

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
        res.render(__dirname + "/views/home.ejs");
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

});

app.get("/home/rent", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/rentform.ejs");
    }else{
        res.redirect("/");
    }
});

app.post("/home/rent", (req,res) => {
    
});

app.get("/home/sale", (req,res) => {
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/saleform.ejs");
    }else{
        res.redirect("/");
    }
});

app.post("/home/sale", (req,res) => {
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
        propertyfurnishing: req.body.furnishingpro
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

app.post("/home/lease", (req,res) => {
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
        propertytime: req.body.timepro
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

app.listen("3341", () => {
    console.log("Server is serving");
});