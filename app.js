const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());

const mongoURI = "mongodb://localhost:27017/User";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
  process.exit(1);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(3000, () => {
    console.log("Server Running at http://localhost:3000/");
  });
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  picture:{type:String, required:true},
  address:{type:String, required:true},
  number:{type:String, required:true},
});

const User = mongoose.model("User", userSchema);

app.use(express.json());

app.post("/register", async (request, response) => {
  const { username, password, picture, address, number } = request.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.status(400).send("User already exists");
    }

    // Ensure that the password field is not empty or undefined
    if (!password || typeof password !== "string") {
      return response.status(400).send("Invalid password");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, picture, address, number });
    response.send("User created successfully");
  } catch (err) {
    console.error(err);
    response.status(500).send("Internal Server Error");
  }
});


app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log(username)
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return response.status(400).send("Invalid user");
    }

    const passwordAuthentication = await bcrypt.compare(password, user.password);
    if (passwordAuthentication) {
      const payload = { username: user.username };
      const jwtToken = jwt.sign(payload, "lokijuhygtf");
      response.send({ jwtToken });
      console.log(jwtToken);
    } else {
      response.status(400).send("Invalid password");
    }
  } catch (err) {
    console.error(err);
    response.status(500).send("Internal Server Error");
  }
});

const authenticateToken = (request, response, next) => {
  const authHeader = request.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return response.status(401).send("Invalid JWT Token");
  }

  jwt.verify(token, "lokijuhygtf", (err, user) => {
    if (err) {
      return response.status(403).send("Invalid JWT Token");
    }

    request.user = user;
    next();
  });
};





module.exports = app;
