var consumer_key = process.env["seven_digital_consumer_key"];
var consumer_secret = process.env["seven_digital_consumer_secret"];

var express = require('express');
var clipService = require('./lib/clipservice.js').create(consumer_key, consumer_secret);

var app = express();


app.get('/room/1', function (req, res) {
  clipService.get(43221994, res);
});

app.use('/', express.static(__dirname + '/public'));


app.listen(8080);