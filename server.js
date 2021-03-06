var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var PORT = process.env.PORT || 8080;

// Initialize Express
var app = express();

var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Middleware

// Morgan logger for logging requests
app.use(logger("dev"));
// Body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Serve public folder as static
app.use(express.static("public"));

app.use(bodyParser.json());

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/artScrape");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/artScraper";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

var routes = require('./controller/controller.js');
app.use('/', routes);

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});