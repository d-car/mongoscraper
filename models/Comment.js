var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new CommentSchema object
var CommentSchema = new Schema({
  body: String
});


var Comment = mongoose.model("Comment", CommentSchema);

// Export the Note model
module.exports = Comment;
