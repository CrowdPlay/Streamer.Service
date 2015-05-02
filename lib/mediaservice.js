var oauthSignature = require('oauth-signature');
var random = require('./random');
var request = require('request');
var http = require('http');
var querystring = require('querystring');
var debug = require('debug')('MediaService');

var clipBaseUrl = 'http://previews.7digital.com/clip/{trackId}?';
var subscriptionBaseUrl = 'https://stream.svc.7digital.net/stream/catalogue?formatid=26&trackid={trackId}&';


function createClipUrl(trackId) {
  return clipBaseUrl.replace('{trackId}', trackId);
}

function createSubscriptionUrl(trackId) {
  return subscriptionBaseUrl.replace('{trackId}', trackId);
}


function MediaService(consumer_key, consumer_secret, subscriptionMode) {
  this.consumer_key = consumer_key;
  this.consumer_secret = consumer_secret;
  this.subscriptionMode = !!subscriptionMode;
}

MediaService.prototype.createUrl = function (trackId) {
  var trackUrl = this.subscriptionMode ? createSubscriptionUrl(trackId) : createClipUrl(trackId);

  var parameters = {
    oauth_consumer_key: this.consumer_key,
    oauth_nonce: random.string(16),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
    country: 'GB'
  };
  
  var signature = oauthSignature.generate('GET', trackUrl, parameters, this.consumer_secret, undefined, { encodeSignature: false });

  parameters.oauth_signature = signature;

  return trackUrl + querystring.stringify(parameters);
};

MediaService.prototype.request = function (trackId) {

  var fullUrl = this.createUrl(trackId);
  debug('Requesting url: ' + fullUrl);
  return request.get(fullUrl);
  
};

module.exports.create = function (consumer_key, consumer_secret, subscriptionMode) {
  return new MediaService(consumer_key, consumer_secret, subscriptionMode);
};