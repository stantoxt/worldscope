var rfr = require('rfr');

var Utility = rfr('app/util/Utility');
var UserService = rfr('app/services/UserService');
var StreamService = rfr('app/services/StreamService');

var logger = Utility.createLogger(__filename);

function Service() {
}

var Class = Service.prototype;

/////// USER APIs ///////
Class.createNewUser = function (particulars) {
  logger.debug('Creating new user: %j', particulars);
  return UserService.createNewUser(particulars);
};

Class.getUserByPlatform = function (platformType, platformId) {
  logger.debug('Getting user by platform %s %s', platformType, platformId);
  return UserService.getUserByPlatform(platformType, platformId);
};

Class.getUserById = function (id) {
  logger.debug('Getting user by id %s', id);
  return UserService.getUserById(id);
};

Class.updateUserParticulars = function (userId, particulars) {
  logger.debug('Updating user particulars %s %j', userId, particulars);
  return UserService.updateParticulars(userId, particulars);
};
///////////////////////

/////// STREAM APIs ///////
Class.createNewStream = function (userId, streamDetails) {
  logger.debug('Creating new stream: %j', streamDetails);
  return StreamService.createNewStream(userId, streamDetails);
};

Class.getStreamById = function (streamId) {
  logger.debug('Getting stream by id: %j', streamId);
  return StreamService.getStreamById(streamId);
};

Class.getListOfStreams = function () {
  logger.debug('Getting list of streams');
  //return stub
  return [];
};

///////////////////////

module.exports = new Service();
