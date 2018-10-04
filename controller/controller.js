var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var bodyParser = require("body-parser");
var axios = require("axios");
var request = require("request");

// Require all models
var Comment = require('../models/Comment.js');
var Article = require('../models/Article.js');
var db = require("../models");

// Middleware
router.use(bodyParser.json());

//index
router.get("/", function (req, res) {
    res.render("index"); 
});

// Scraping ResetEra forum for articles

router.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    axios.get("https://www.resetera.com/forums/video-games.7/").then(function(response) {
      // Load into cheerio and assign selector
      var $ = cheerio.load(response.data);
      // console.log($);
  
      // Grab thread titles
  
      $("li h3").each(function(i, element) {
        // Save an empty result object
        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
  
        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          });
      });
  
      // If we were able to successfully scrape and save an Article, send a message to the client
      res.send("Scrape Complete");
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      return res.json(err);
    });
});

// Route for getting all Articles from the db
router.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

router.get('/readArticle/:id', function(req, res){
  var articleId = req.params.id;
  var hbsObj = {
    article: [],
    body: []
  };

    // //find the article at the id
    Article.findOne({ _id: articleId })
      .populate('comment')
      .exec(function(err, doc){
      if(err){
        console.log('Error: ' + err);
      } else {
        hbsObj.article = doc;
        var link = doc.link;
        //grab article from link
        request(link, function(error, response, html) {
          var $ = cheerio.load(html);

          $('article blockquote').each(function(i, element){
            hbsObj.body = $(this).children('.messageText').text();
            //send article body and comments to article.handlbars through hbObj
            res.render('article', hbsObj);
            //prevents loop through so it doesn't return an empty hbsObj.body
            return false;
          });
        });
      }

    });
});


module.exports = router;