"use strict";

require('dotenv').config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const connect = require('connect')
const methodOverride = require('method-override')
const MongoClient = require("mongodb").MongoClient;
const MONGODB_URI = process.env.MONGODB_URI;


app.use(bodyParser.urlencoded());
app.use("/static", express.static(__dirname + "/pictures"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));


var db = null;

MongoClient.connect(MONGODB_URI, (err, database) => {
  if (err) {
    console.log('Could not connect! Unexpected error. Details below.');
    throw err;
  }
  console.log('Connected to the database!');
  db = database;
});


function getLongURL(db, shortURL, cb) {
  let query = { "shortURL": shortURL };
  db.collection("urls").findOne(query, (err, result) => {
    if (result === null) {
      console.log("Got nothin, mate!")
      return cb(err);
    }
    return cb(null, result.longURL);
  });
}

function getShortURL(db, shortURL, cb) {
  let query = { "shortURL": shortURL };
  db.collection("urls").findOne(query, (err, result) => {
    if (err) {
      return cb(err);
    }
    return cb(null, result.shortURL);
  });
};

function checkForHttpPrefix(string) {
  var prefix = '';
  if (!/^(http|https|ftp):\/\/.*$/.test(string)) {
    prefix = "http://"
  }
  return `${prefix}${string}`;
};

//url info page
app.get("/urls/:id", (req, res) => {
  let query = { "shortURL": req.params.id };
  db.collection("urls").findOne(query, (err, result) => {
    if (result === null) {
      res.render("not_found", { shortURL: `${req.params.id}` })
    } else {
      res.render("urls_info", result);
    }
  });
})

//Landing Page:
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// ../urls page:
app.get("/urls", (req, res, next) => {
  db.collection("urls").find().toArray((err, data) => {
    if (!data) next();
    res.render("urls_index", { urls: data });
  });
});

// Create new shortened URL page:
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// inserts data from ../urls/new form submission and loads back to ../urls page
app.post("/urls", (req, res, next) => {
  let prefacedLongUrl = checkForHttpPrefix(`${req.body.longURL}`);
  db.collection("urls").insertOne({ shortURL: generateRandomString(), "longURL": prefacedLongUrl }, (err) => {
      if (err) res.send(err);
    db.collection("urls").find().toArray((err, data) => {
      if (!data) next();
      res.render("urls_index", { "urls": data });
    });
  });
});


// Checks if shortURL exists, redirects to longURL if true, ./not_found if not
app.get("/u/:id", (req, res) => {
  let query = { "shortURL": req.params.id };
  db.collection("urls").findOne(query, (err, result) => {
    if (result === null) {
      res.render("not_found", { shortURL: `${req.params.id}` })
    } else {
      res.redirect(`${result.longURL}`);
    }
  });
});

// delete button from ../urls removes from db then refreshes page
app.delete("/urls/:id", (req, res) => {
  let query = { "shortURL": req.params.id };
  db.collection("urls").findOne(query, (err, result) => {
    if (err || !result) {
      res.send("Something went wrong!");
    } else {
      db.collection("urls").remove(query, 1);
      res.redirect("/urls");
    }
  })
})

// edit button from ../urls sends to edit page of specific pair.
app.get("/urls/show/:id", (req, res) => {
  let query = ({ "shortURL": req.params.id });
  db.collection("urls").findOne(query, (err, result) => {
    if (err || !result) {
      res.send("Something went wrong!");
    } else {
      let passIn = { shortURL: `${result.shortURL}`, longURL: `${result.longURL}` }
      res.render("urls_show", passIn);
    }
  });
});

// submit req from ../urls/show/:id, updates short/long pair, redirects to ../urls
app.put("/urls/:id", (req, res, next) => {
  let prefacedLongUrl = checkForHttpPrefix(`${req.body.longURL}`)
  db.collection("urls").update({ "shortURL": req.params.id }, { $set: { "longURL": prefacedLongUrl } })
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
  return Math.random().toString(36).slice(2, 8)
}
