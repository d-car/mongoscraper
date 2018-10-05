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

//index
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

      //ensures that no empty title or links are sent to mongodb
      if (result.title !== "" && result.link !== "") {
        //check for duplicates
        if (titlesArray.indexOf(result.title) == -1) {

          // push the saved title to the array 
          titlesArray.push(result.title);

          // only add the article if is not already there
          Article.count({ title: result.title }, function (err, test) {
            //if the test is 0, the entry is unique and good to save
            if (test == 0) {

              //using Article model, create new object
              var entry = new Article(result);

              //save entry to mongodb
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
        // Log that scrape is working, just the content was missing parts
        else {
          console.log('Article already exists.')
        }

      }
      // Log that scrape is working, just the content was missing parts
      else {
        console.log('Not saved to DB, missing data')
      }



      // Create a new Article using the `result` object built from scraping
    //   Article.create(result)
    //     .then(function (dbArticle) {
    //       // View the added result in the console
    //       console.log(dbArticle);
    //     });
    })
    res.redirect('/');

    // If we were able to successfully scrape and save an Article, send a message to the client
    console.log("Scrape Successful")
  })
    .catch(function (err) {
      // If an error occurred, send it to the client
      return res.json(err);
    })
});

// Route for getting all Articles from the db
router.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
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
        //grab article from link
        request(link, function (error, response, html) {
          var $ = cheerio.load(html)
          // console.log("this is the html", html);


          $('article').each(function (i, element) {
            hbsObj.body = $(this).children('.messageText').text();
            //send article body and comments to article.handlbars through hbObj
            res.render('Article', hbsObj);
            //prevents loop through so it doesn't return an empty hbsObj.body
            return false;
          });
        });
      }

    });
});

// Create a new comment

router.post('/comment/:id', function (req, res) {
  var content = req.body.comment
  var articleId = req.params.id;
  console.log("this is the comment", content)

  //submitted form
  var commentObj = {
    body: content
  };

  //using the Comment model, create a new comment
  var newComment = new Comment(commentObj);

  newComment.save(function (err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id)
      console.log(articleId)
      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { 'comment': doc._id } }, { new: true })
        //execute everything
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