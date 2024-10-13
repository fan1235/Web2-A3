var express = require('express');
const cors = require("cors"); 

var app = express();

app.use(cors());

// Import the concert API controller and body-parser
var concertAPI = require("./controllerAPI/api-controller");
var bodyparser=require("body-parser");

// Use body-parser middleware for JSON and URL-encoded data
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));

// Set up the API route for fundraisers
app.use("/api/fundraiser", concertAPI);

// Start the server on port 3060
app.listen(3060,() => {;

console.log("Server up and running on port 3060");
});