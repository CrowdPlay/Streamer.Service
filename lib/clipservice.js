var oauthSignature = require('oauth-signature');
var random = require('./random');
var request = require('request');
var http = require('http');
var querystring = require('querystring');


function ClipService(consumer_key, consumer_secret) {
  this.consumer_key = consumer_key;
  this.consumer_secret = consumer_secret;
}

ClipService.prototype.createUrl = function (trackId) {
  var trackUrl = url = 'http://previews.7digital.com/clip/' + trackId;

  var parameters = {
    oauth_consumer_key: this.consumer_key,
    oauth_nonce: random.string(16),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
    country: 'GB'
  };
  
  var signature = oauthSignature.generate('GET', url, parameters, this.consumer_secret, undefined, { encodeSignature: false });

  parameters.oauth_signature = signature;


  return url + '?' + querystring.stringify(parameters);
};

ClipService.prototype.request = function (trackId) {

  var fullUrl = this.createUrl(trackId);
  return request.get(fullUrl);
  
};

ClipService.prototype.pipe = function (trackId, response) {

  var fullUrl = this.createUrl(trackId);

  return request.get(fullUrl).pipe(response);

  /*request.get(fullUrl, function (err, res, body) {
    response.set(res.headers);
    response.send(body);
  });*/
};

function to(o) {
  return Object.prototype.toString.call(o);
}

ClipService.prototype.download = function (trackId, callback) {

  var fullUrl = this.createUrl(trackId);

  http.get(fullUrl, function (res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));

    res.on('data', function (data) {
      console.log('DATA: ', data.length);
    }).on('end', function () {
      console.log('END');
      callback();
    });

  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });

  /*request.get(fullUrl, function (err, res, body) {
    response.set(res.headers);
    response.send(body);
  });*/
};

module.exports.create = function (consumer_key, consumer_secret) {
  return new ClipService(consumer_key, consumer_secret);
};