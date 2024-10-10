var dbDetails = require("./db-details");

var mysql = require('mysql2');
var bodyParser = require('body-parser');
//var http = require('http');

module.exports = {
	getconnection: ()=>{
	return mysql.createConnection({
		host:dbDetails.host,
		user:'root',
		password:'123456',
		database:"crowdfunding_db"
	});
}
}
