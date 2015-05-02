var request = require('request');

function MoodyService(apiBaseUrl) {
  this.apiBaseUrl = apiBaseUrl;
}

MoodyService.prototype.getRoomTrack = function (roomId, callback) {

  var url = this.apiBaseUrl + '/room/1';
  console.log('Requesting ' + url + ' ...');
  request.get({url: url, json: true}, function (err, res, body) {
    if (err) return callback(err);
    callback(null, body.id);
  });

};

module.exports.create = function (apiBaseUrl) {
  return new MoodyService(apiBaseUrl);
};