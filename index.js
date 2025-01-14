const express = require("express");
const session = require("express-session");
const passport = require("passport");

const connectDb = require("./db/connect");
const apiV1Route = require("./routes/api.v1.route");

const PORT = process.env.PORT || 6666;
const app = express();
const cors = require("cors");

require("./strategies/JWTStrategy");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(session({ secret: process.env.SESSION_SEC, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const start = async () => {
  app.listen(PORT, () => console.log(`Server started to: http://localhost:${PORT}`));
  await connectDb();
};

app.use("/api/v1", apiV1Route);

start();
