require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(__dirname + "/public"));
const encrypt = require("mongoose-encryption");
mongoose.connect("mongodb://localhost:27017/testDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = {
  title: String,
  picture: String,
  preview: String,
};
const Item = mongoose.model("Item", itemsSchema);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = new mongoose.model("User", userSchema);

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});
var defaultItems = [];

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    if (err) {
      console.log(err);
    } else {
      const newUser = new User({
        email: req.body.username,
        password: hash,
      });
      newUser.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/eminem");
        }
      });
    }
  });
});

app.get("/eminem", (req, res) => {
  var unirest = require("unirest");
  var title, picture, preview;
  var s;
  var req = unirest("GET", "https://deezerdevs-deezer.p.rapidapi.com/search");

  req.query({
    q: "eminem",
  });

  req.headers({
    "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
    "x-rapidapi-key": "2aa5e5eb32msh88f9422e4f8e2b1p1f38cbjsn6c608a4f3740",
    useQueryString: true,
  });

  req.end(function (res) {
    if (res.error) throw new Error(res.error);
    for (var i = 5; i < 20; i++) {
      const item3 = {
        title: res.body.data[i].title,
        picture: res.body.data[i].artist.picture,
        preview: res.body.data[i].preview,
      };

      defaultItems.push(item3);
    }
    title = res.body.data[0].title;
    picture = res.body.data[0].artist.picture;
    preview = res.body.data[0].preview;
    Item.insertMany(defaultItems)
      .then(function () {
        console.log("Data inserted"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });

    console.log(res.body.data[0].title);
    console.log(res.body.data[0].artist.picture);
    console.log(res.body.data[0].preview);
  });
  Item.find({}, function (err, foundItems) {
    console.log(foundItems);
    res.render("index", { newListItems: foundItems });
  });
});
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ email: username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function (err, result) {
          if (result === true) {
            res.render("index");
          }
        });
      }
    }
  });
});
app.post("/eminem", (req, res) => {
  const search = new RegExp(req.body.searching, "i");
  Item.find({ title: search }, function (err, foundItems) {
    console.log(foundItems);
    if (err) {
      console.log(err);
    } else {
      res.render("index", { newListItems: foundItems.splice(-1) });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
