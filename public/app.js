// Grab the articles as a json
$.getJSON("/articles", function(data) {
    // For each one
    for (var i = 0; i < data.length; i++) {
      // Display the apropos information on the page
      $("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "" + "</p>" + "<a href = /readArticle/" + data[i]._id + ">" + "View Thread" + "</a><hr><br>");
    }
  });