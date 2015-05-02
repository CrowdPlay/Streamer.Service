var consumer_key = process.env["seven_digital_consumer_key"];
var consumer_secret = process.env["seven_digital_consumer_secret"];
var moody_service_baseurl = process.env["moody_service_baseurl"];

var fs = require('fs');
var util = require('util');
var express = require('express');
var clipService = require('./lib/clipservice').create(consumer_key, consumer_secret);
var moodyService = require('./lib/moodyservice').create(moody_service_baseurl);

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

  moodyService.getRoomTrack(1, function (err, trackId) {
    if (err) return res.status(500).write('Moody service down??? ' + err);

    console.log('Moody service said the current trackId is ' + trackId);

    var filename = __dirname + '/clips/' + trackId;

    if (!fs.existsSync(filename)) {
      var writeStream = fs.createWriteStream(filename);
      var request = clipService.request(trackId);
      request.pipe(writeStream);
      return request.on('end', function () {
        piperClip(trackId, filename, res);
      });
    }

    piperClip(trackId, filename, res);

  });
});

app.use('/', express.static(__dirname + '/public'));

module.exports = app;