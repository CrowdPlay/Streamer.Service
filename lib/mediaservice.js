var oauthSignature = require('oauth-signature');
var random = require('./random');
var request = require('request');
var http = require('http');
var querystring = require('querystring');
var debug = require('debug')('MediaService');
var extend = require('util')._extend;
var parseString = require('xml2js').parseString;


var clipBaseUrl = 'http://previews.7digital.com/clip/';
var subscriptionBaseUrl = 'https://stream.svc.7digital.net/stream/catalogue';


function createClipUrl(trackId) {
  return clipBaseUrl + trackId;
}


function MediaService(consumer_key, consumer_secret, subscriptionMode) {
  this.consumer_key = consumer_key;
  this.consumer_secret = consumer_secret;
  this.subscriptionMode = !!subscriptionMode;
}

MediaService.prototype.createUrl = function (url, parameters) {

  var params = extend(parameters || {});
  params.oauth_consumer_key = this.consumer_key;
  params.oauth_nonce = random.string(16);
  params.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
  params.oauth_signature_method = 'HMAC-SHA1';
  params.oauth_version = '1.0';
  
  var signature = oauthSignature.generate('GET', url, params, this.consumer_secret, undefined, { encodeSignature: false });

  parameters.oauth_signature = signature;

  return url + '?' + querystring.stringify(parameters);
};

MediaService.prototype.createTrackUrl = function (trackId) {
  
  var trackUrl;
  var parameters = {
    country: 'GB'
  };

  if (this.subscriptionMode) {
    trackUrl = subscriptionBaseUrl;
    parameters.formatid = 26;
    parameters.trackid = trackId;
  } else {
    trackUrl = createClipUrl(trackId);
  }

  return this.createUrl(trackUrl, parameters);
};

MediaService.prototype.createSearchUrl = function (searchTerm) {
  var url = "http://api.7digital.com/1.2/track/search"

  var parameters = {
    country: 'GB',
    q: searchTerm,
    pagesize: 2
  };

  return this.createUrl(url, parameters);
};

MediaService.prototype.createTrackDetailUrl = function (trackId) {
  var url = "http://api.7digital.com/1.2/track/details";

  var parameters = {
    country: 'GB',
    trackid: trackId
  };

  return this.createUrl(url, parameters);
};

MediaService.prototype.request = function (trackId) {

  var fullUrl = this.createTrackUrl(trackId);
  debug('Requesting url: ' + fullUrl);

  return request.get(fullUrl, function (error, response, body) {
    debug('Media response (%s)', response.statusCode);

    if (response.statusCode != 200){
      debug('Unexpected response: ', body);
      debug(response.headers);
    }
  });
  
};

MediaService.prototype.searchRequest = function (searchTerm, callback) {
  var fullUrl = this.createSearchUrl(searchTerm);
  return request.get(fullUrl, function (error, response, body) {
    if (error) return callback(error);

    debug('Search response (%s)', response.statusCode);

    if (response.statusCode != 200){
      debug('Unexpected response: ', body);
      debug(response.headers);
      return callback(new Error('Unexpected response (' + response.statusCode + ')'));
    }

    parseString(body, function (err, result) {
      if (err) return callback(err);

      if (result.response.searchResults.length === 0) return callback(null, null);
      if (result.response.searchResults[0].totalItems == 0) return callback(null, null);
      
      var track = result.response.searchResults[0].searchResult[0].track[0];

      callback(null, parseInt(track.$.id, 10), parseInt(track.duration, 10));
    });
  });
};

MediaService.prototype.trackDetailRequest = function (trackID, callback) {
  var fullUrl = this.createTrackDetailUrl(trackID);

  return request.get(fullUrl, function (error, response, body) {
    if (error) return callback(error);

    debug('Track detail response (%s)', response.statusCode);

    if (response.statusCode != 200){
      debug('Unexpected response: ', body);
      debug(response.headers);
      return callback(new Error('Unexpected response (' + response.statusCode + ')'));
    }

    parseString(body, function (err, result) {
      if (err) return callback(err);

      var track = result.response.track[0];

      var trackDetail = {
        track: {
          id: track.$.id,
          title: track.title[0]
        },
        trackNumber: track.trackNumber[0]
      };

      if (result.response.track[0].artist.length > 0) {
        var artist = result.response.track[0].artist[0];
        trackDetail.artist = {
          id: artist.$.id,
          name: artist.name[0]
        };
      }
  
      if (result.response.track[0].release.length > 0) {
        var release = result.response.track[0].release[0];
        trackDetail.release ={
          id: release.$.id,
          title: release.title[0],
          type: release.type[0],
          image: release.image[0]
        };
      }

      callback(null, trackDetail);
    });
  });
};

module.exports.create = function (consumer_key, consumer_secret, subscriptionMode) {
  return new MediaService(consumer_key, consumer_secret, subscriptionMode);
};