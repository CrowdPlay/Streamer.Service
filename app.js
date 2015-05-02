var debug = require('debug')('API');
var config = require('./config');

debug('Config loaded: ', config);

var fs = require('fs');
var util = require('util');
var express = require('express');

var mediaService = require('./lib/mediaservice').create(config.consumer_key, config.consumer_secret, config.subscription_mode);
var moodyService = require('./lib/moodyservice').create(config.moody_service_baseurl);

var app = express();

function createDirectories() {
  var cacheDir = __dirname + '/cache';
  if (!fs.existsSync(cacheDir)){
    debug('Creating cache dir...');
    fs.mkdirSync(cacheDir);
  }

  var clipsDir = cacheDir + '/clips';
  if (!fs.existsSync(clipsDir)){
    debug('Creating clips cache dir...');
    fs.mkdirSync(clipsDir);
  }

  var tracksDir = cacheDir + '/tracks';
  if (!fs.existsSync(tracksDir)){
    debug('Creating tracks cache dir...');
    fs.mkdirSync(tracksDir);
  }
}

function pipeMedia(trackId, filename, res) {
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
    if (err) {
      trackId = 43221994;
      debug('Moody service down, defaulting to trackId ' + trackId);
    } else {
      debug('Moody service reported the current trackId is ' + trackId);
    }

    var filename = __dirname + '/cache/' + (config.subscription_mode ? 'tracks/' : 'clips/') + trackId + '.mp3';

    if (!fs.existsSync(filename)) {
      createDirectories();

      var writeStream = fs.createWriteStream(filename);

      var req = mediaService.request(trackId);
      req.on('error', function (err) {
        debug('Media request error: ', err);
        res.status(500).send('Media Service error: ' + err);
      });
      req.pipe(writeStream);
      req.on('end', function () {
        pipeMedia(trackId, filename, res);
      });

      return;
    }

    pipeMedia(trackId, filename, res);
  });
});

app.use('/', express.static(__dirname + '/public'));

module.exports = app;