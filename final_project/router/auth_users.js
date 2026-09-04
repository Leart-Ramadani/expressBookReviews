const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// Login as a registered user
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in. Username and password are required." });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }

  let accessToken = jwt.sign(
    { username: username },
    'access',
    { expiresIn: 60 * 60 }
  );

  req.session.authorization = {
    accessToken,
    username
  };

  return res.status(200).json({ message: "User successfully logged in", token: accessToken });
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization ? req.session.authorization.username : null;

  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  if (!review) {
    return res.status(400).json({ message: "Review text is required as a query parameter" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found for given ISBN" });
  }

  book.reviews[username] = review;
  return res.status(200).json({ message: "Review successfully added/updated", reviews: book.reviews });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization ? req.session.authorization.username : null;

  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found for given ISBN" });
  }

  if (!book.reviews[username]) {
    return res.status(404).json({ message: "No review by this user found for the given ISBN" });
  }

  delete book.reviews[username];
  return res.status(200).json({ message: "Review successfully deleted", reviews: book.reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
