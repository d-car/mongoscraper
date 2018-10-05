var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var bodyParser = require("body-parser");
var axios = require("axios");
var request = require("request");


// Require all models
var Comment = require('../models/Comment.js');
var Article = require('../models/Article.js');

// Middleware
router.use(bodyParser.json());

// Index
router.get("/", function (req, res) {
  res.render("index");
});

// Scraping ResetEra forum for articles

router.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.resetera.com/forums/video-games.7/").then(function (response) {
    // Load into cheerio and assign selector
    var $ = cheerio.load(response.data);
    // console.log($);
    var titlesArray = [];

    // Grab thread titles

    $("li h3").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // No empty title or links allowed in db
      if (result.title !== "" && result.link !== "") {
        // If statement checking for duplicates/multiples
        if (titlesArray.indexOf(result.title) == -1) {

          titlesArray.push(result.title);

          // Add only if test = 0 (article not in database)
          Article.count({ title: result.title }, function (err, test) {
            if (test == 0) {
              // New article using model
              var entry = new Article(result);

              // Save entry to Sdb
              entry.save(function (err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                }
              });

            }
          });
        }
      }
    })
    res.redirect('/');

    // Send confirmation to client console
    console.log("Scrape Successful")
  })
    .catch(function (err) {
      // Send error to client console
      return res.json(err);
    })
});

// Route to grab all articles
router.get("/articles", function (req, res) {
  Article.find({})
    .then(function (dbArticle) {
      // Send to client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // Send error to client if err
      res.json(err);
    });
});

router.get('/readArticle/:id', function (req, res) {
  var articleId = req.params.id;
  var hbsObj = {
    article: [],
    body: []
  };
  // console.log(hbsObj)

  // //find the article at the id
  Article.findOne({ _id: articleId })
    .populate('comment')
    .exec(function (err, doc) {
      if (err) {
        console.log('Error: ' + err);
      } else {
        hbsObj.article = doc;
        var link = "https://www.resetera.com/" + doc.link;
        // console.log("this is the link", link);

        request(link, function (error, response, html) {
          var $ = cheerio.load(html)
          // console.log("this is the html", html);

          $('article').each(function (i, element) {
            hbsObj.body = $(this).children('.messageText').text();
            // Send article body and comments to article.handlbars through hbObj
            res.render('article', hbsObj);
            // Prevents loop through so it doesn't return an empty hbsObj.body
            return false;
          });
        });
      }

    });
});

// New Comments

router.post('/comment/:id', function (req, res) {
  var content = req.body.comment
  var articleId = req.params.id;
  console.log("this is the comment", content)

  // Submitted form
  var commentObj = {
    body: content
  };

  // Create comment with model
  var newComment = new Comment(commentObj);

  newComment.save(function (err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id)
      console.log(articleId)
      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { 'comment': doc._id } }, { new: true })
        .exec(function (err, doc) {
          if (err) {
            console.log(err);
          } else {
            res.redirect('/readArticle/' + articleId);
          }
        });
    }
  });
});


module.exports = router;