var request = require('request');
var debug = require('debug')('MoodyService');

function MoodyService(apiBaseUrl) {
  this.apiBaseUrl = apiBaseUrl;
}

MoodyService.prototype.getRoomTrack = function (roomId, callback) {

  var url = this.apiBaseUrl + '/room/1';
  debug('Requesting url: ' + url);
  request.get({url: url, json: true}, function (err, res, body) {
    if (err) return callback(err);
    if (res.statusCode != 200) return callback(new Error('Unexpected moody service response (' + res.statusCode + ')'));
    callback(null, body.id);
  });

};

module.exports.create = function (apiBaseUrl) {
  return new MoodyService(apiBaseUrl);
};