"use strict";

//Declare constants and require statements
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const connect = require('connect')
const methodOverride = require('method-override')
    //

//Set and Use Declarations:
app.use(bodyParser.urlencoded());
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
//

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

let templateVars = { urls: urlDatabase };

app.get("/", (req, res) => {
    res.end("Hello!");
});

app.get("/urls", (req, res) => {
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.post("/urls", (req, res) => {
    var prefix = '';
    if ((`${req.body.longURL}`).search('http://')) {
        var prefix = "http://" };
    urlDatabase[generateRandomString()] = `${prefix}${req.body.longURL}`;
    res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
    if (urlDatabase[req.params.id]) {
        res.redirect(`${urlDatabase[req.params.id]}`)
    }
    res.render("urls_index", templateVars);
})

app.delete("/urls/:id", (req, res) => {
    console.log(`A user has deleted: [${req.params.id}: ${urlDatabase[req.params.id]}]`)
    delete urlDatabase[`${req.params.id}`]
    res.redirect("/urls");
})

app.get("/urls/show/:id", (req, res) => {
    let passedIn = {shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
    res.render("urls_show", passedIn);
})

app.put("/urls/:id", (req, res) => {
    var prefix = '';
    if ((`${req.body.longURL}`).search('http://')) {
        var prefix = "http://" };
    urlDatabase[req.params.id] = `${prefix}${req.body.longURL}`;
    res.redirect("/urls");
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    return Math.random().toString(36).slice(2, 8)
};
