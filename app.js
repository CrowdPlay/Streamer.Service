var consumer_key = process.env["seven_digital_consumer_key"];
var consumer_secret = process.env["seven_digital_consumer_secret"];
var moody_service_baseurl = process.env["moody_service_baseurl"];

var fs = require('fs');
var util = require('util');
var express = require('express');
var clipService = require('./lib/clipservice.js').create(consumer_key, consumer_secret);

var app = express();

(function createClipsDirectory() {
  var dir = __dirname + '/clips';
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
})();

function piperClip(trackId, filename, res) {
  var stats = fs.statSync(filename);
  var readStream = fs.createReadStream(filename);

  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': stats.size,
    'Cache-Control': 'no-cache, no-store',
    'Content-Disposition': 'attachment; filename=' + trackId + '.mp3'
  });

  readStream.pipe(res);
}

app.get('/room/1/stream', function (req, res) {

  var currentTrackId = 43221994;
  var trackfilename = __dirname + '/clips/' + currentTrackId;

  if (!fs.existsSync(trackfilename)) {
    var writeStream = fs.createWriteStream(trackfilename);
    var request = clipService.request(currentTrackId);
    request.pipe(writeStream);
    return request.on('end', function () {
      piperClip(currentTrackId, trackfilename, res);
    });
  }

  piperClip(currentTrackId, trackfilename, res);
});

app.use('/', express.static(__dirname + '/public'));

module.exports = app;