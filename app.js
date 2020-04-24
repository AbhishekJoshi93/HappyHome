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

const userSchema = new mongoose.Schema({
    email: String, 
    password: String
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
    res.render(__dirname + "/views/buyform.ejs");
});

app.get("/home/sale", (req,res) => {
    res.render(__dirname + "/views/saleform.ejs");
});

app.get("/home/rent", (req,res) => {
    res.render(__dirname + "/views/rentform.ejs");
});

app.get("/home/lease", (req,res) => {
    res.render(__dirname + "/views/leaseform.ejs");
});

app.listen("3341", () => {
    console.log("Server is serving");
});