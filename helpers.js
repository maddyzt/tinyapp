// define a function to return user from email
getUserByEmail = (email, database) => {
  for (let user in database) {
    if(database[user].email === email) {
      return user;
    };
  };
};

module.exports = { getUserByEmail };