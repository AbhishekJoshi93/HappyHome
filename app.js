//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");

app.get("/", (req,res) => {
    res.render(__dirname + "/views/app.ejs");
});

app.get("/home", (req,res) => {
    res.render(__dirname + "/views/home.ejs");
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