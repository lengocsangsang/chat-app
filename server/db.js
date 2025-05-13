const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// This retrieves the connection object after you connect to the mongoose database.
// It allows you to listen for events such as "connected", "error", "disconnected", etc
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
