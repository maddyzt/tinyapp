// using express, bodyParser
const express = require("express");
const app = express();
const PORT = 8080 // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({ extended: true}))
// set view engine to ejs
app.set("view engine", "ejs");

// defines a function that generates a random 6 character string
function generateRandomString() {
  let i = Math.random().toString(36).slice(2, 8);
  return i;
}

// define urlDatabase object
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// gets the variables from the urlDatabase object to display in the urls_index page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// defines the post route when submitting a brand new url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
  // console.log(req.body);  // Log the POST request body to the console
  // res.send("Ok"); 
});

// renders the urls_new views page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// gets the variables from the parameter to display in the urls_show page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

// redirects to long url
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// returns the urlDatabase object in JSON when user goest to /urls.json 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// defines the post route to remove a URL from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls/`);
});

// defines the post route to edit a URL from the urls_show page (on submit)
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.updatedURL;
  res.redirect(`/urls`);
});

// server is listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


