const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// to parse URL-encoded and JSON data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// to serve static files
app.use(express.static(__dirname));

// route to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

// route to serve concert.html
app.get("/concert", (req, res) => {
    res.sendFile(path.join(__dirname, "concert.html"));
});

// route to serve add_concert.html
app.get("/add_concert", (req, res) => {
    res.sendFile(path.join(__dirname, "add_concert.html"));
});

// route to serve fundraiser.html (pointing to add_concert.html)
app.get("/fundraiser.html", (req, res) => {
    res.sendFile(path.join(__dirname, "add_concert.html"));
});

// Start the server on port 8181
app.listen(8181, () => {
    console.log("Server running on port 8181");
});




