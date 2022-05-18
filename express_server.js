// using express, bodyParser
const express = require("express");
const app = express();
const PORT = 8080 // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const req = require("express/lib/request");

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({ extended: true}))
// set view engine to ejs
app.set("view engine", "ejs");

// defines a function that generates a random 6 character string
generateRandomString = () => {
  let i = Math.random().toString(36).slice(2, 8);
  return i;
}

// define urlDatabase object
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

// define users object to store user information
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@email.com",
    password: "purple-monkey-dinosaur",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@email.com",
    password: "dishwasher-funk",
  }
};
 
// defines a function that checks if an email already exists
emailExists = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    };
  };
  return false;
};

// define a function that checks if password matches
passwordMatches = (email, password) => {
  for (let user in users) {
    if (users[user].email === email && users[user].password === password) {
        return true;
      }
    }
  return false;
}

// define a function to get ID from email
returnID = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].id;
    };
  };
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

// gets the variables from the urlDatabase object to display in the urls_index page
app.get("/urls", (req, res) => {
  if (req.cookies.user_id) {
    const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

// defines the post route when submitting a brand new url
app.post("/urls", (req, res) => {
  if (req.cookies.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id
    };
  res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('invalid request', 400);
  }
});

// renders the urls_new views page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] }
  // check if user is logged in
  if (req.cookies.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

// gets the variables from the parameter to display in the urls_show page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL};
  res.render("urls_show", templateVars);
});

// redirects to long url
app.get("/u/:shortURL", (req, res) => {
  if (validShortURL(req.params.shortURL)) {
    const templateVars = { user: users[req.cookies.user_id]};
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send("invalid URL", 404);
  }

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
  urlDatabase[req.params.shortURL].longURL = req.body.updatedURL;
  res.redirect(`/urls`);
});

// defines the post route to logout from the nav bar
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

// defines get route for registration page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("registration_page", templateVars);
})

// defines route to post user info from registration page to user object
app.post("/register", (req, res) => {
  // check if email or password is empty
  if (req.body.email === "" || req.body.password === "") {
    res.send("Please make sure all fields are completed", 400);
  } 
  // check if email already exists
  else if (emailExists(req.body.email)) {
    res.send("Email already exists", 400);
  } 
  
  else {
  let userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };

  console.log(users);
  res.cookie('user_id', users[userID].id);
  res.redirect('/urls');
};
});

// defines get route for login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("login_page", templateVars);
});

// defines post route for login page
app.post("/login", (req, res) => {
  let userID = returnID(req.body.email);
  if (!emailExists(req.body.email)) {
    res.send("email not found", 403);
  } else if (!passwordMatches(req.body.email, req.body.password)) {
    res.send("incorrect password", 403);
  } else if (passwordMatches(req.body.email, req.body.password)) {
    res.cookie('user_id', userID);
    res.redirect('/urls');
  }
});

// server is listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


