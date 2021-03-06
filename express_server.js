// define constants for / require express, port, bodyParser, cookies, bcrypt
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs/dist/bcrypt");

// require helper functions
const { getUserByEmail } = require("./helpers");

// define use for cookies, bodyParser, express
app.use(cookieSession({
  name: 'session',
  keys: ['super-secret-keys-9-a-4-g-x-9', 'super-secret-keys-3-g-4-l-p-2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({ extended: true}));

// set view engine to ejs
app.set("view engine", "ejs");

// define urlDatabase object
const urlDatabase = {};

// define users object to store user information
const users = {};

// defines a function that generates a random 6 character string
generateRandomString = () => {
  let i = Math.random().toString(36).slice(2, 8);
  return i;
};
 
// define a function that checks if password matches
passwordMatches = (email, password) => {
  for (let user in users) {
    // if (users[user].email === email && users[user].password === password) {
    if (users[user].email === email && bcrypt.compareSync(password, users[user].password)) {
      return true;
    }
  }
  return false;
};

// define a function to get ID from email
returnID = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  }
};

// define a function to see if shortURL exists in database
validShortURL = (urlToCheck) => {
  for (let url in urlDatabase) {
    if (urlToCheck === url) {
      return true;
    }
  }
  return false;
};

// define a function to return URLs in a new object where userID matches logged in user
returnURLs =  (userID) => {
  let urlObject = {};
  // let urlList = [];
  for (let id in urlDatabase) {
    if (urlDatabase[id].userID === userID) {
      // urlList.push(urlDatabase[id].longURL)
      urlObject[id] = {
        longURL: urlDatabase[id].longURL,
        userID: urlDatabase[id].userID
      };
    }
  }
  return urlObject;
};

// GET request to redirect root path to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// GET request for the /urls path (index page)
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    const newObject = returnURLs(req.session.user_id);
    const templateVars = { urls: newObject, user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

// POST request for the /urls path when submitting a brand new url
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(400).send("invalid request");
  }
});

// GET request for the /urls/new path to view new URL form
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  // check if user is logged in
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// GET request for /urls/:shortURL to display the urls_show page
app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id && req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL};
    res.render("urls_show", templateVars);
  } else if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("permission denied");
  } else {
    res.redirect("/login");
  }
});

// GET request to redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  if (validShortURL(req.params.shortURL)) {
    const templateVars = { user: users[req.session.user_id]};
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("invalid URL");
  }
});

// POST request to remove a URL from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id && req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls/`);
  } else {
    res.status(403).send("permission denied");
  }
});

// POST request to submit an edit of the longURL from urls_show
app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id && req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.updatedURL;
    res.redirect(`/urls`);
  } else {
    res.status(403).send("permission denied");
  }
});

// POST request to logout from the nav bar; clears all cookies
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/urls');
});

// GET request to display registration page if not logged in
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }

  const templateVars = { user: users[req.session.user_id] };
  res.render("registration_page", templateVars);
});

// POST request to update user info from registration page to user object
app.post("/register", (req, res) => {
  // check if email or password is empty
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("please make sure all fields are completed");
  // check if email already exists
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("email already exists");
  } else {
    const userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

// GET request to display login page if not logged in
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  
  const templateVars = { user: users[req.session.user_id] };
  res.render("login_page", templateVars);
});

// POST request to login to the app using username and password 
app.post("/login", (req, res) => {
  let userID = returnID(req.body.email);
  if (!getUserByEmail(req.body.email, users)) {
    res.status(403).send("email not found");
  } else if (!passwordMatches(req.body.email, req.body.password)) {
    res.status(403).send("incorrect password");
  } else if (passwordMatches(req.body.email, req.body.password)) {
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

// server is listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


