/**
 * @module SocketAdapter
 */
'use strict';
var rfr = require('rfr');
var Promise = require('bluebird');
var Iron = Promise.promisifyAll(require('iron'));

var Utility = rfr('app/util/Utility');
var Client = rfr('app/adapters/socket/Client');
var RoomsManager = rfr('app/adapters/socket/RoomsManager');
var ServerConfig = rfr('config/ServerConfig.js');

var logger = Utility.createLogger(__filename);

function SocketAdapter() {
  this.isInitialized = false;
}

var Class = SocketAdapter.prototype;

Class.init = function init(server) {
  this.server = server;
  this.io = require('socket.io')(server.listener);

  this.roomsManager = new RoomsManager(server, this.io);

  this.io.on('connection', (socket) => {
    logger.info('New websocket connection from: ' +
                (socket.conn.request.headers['x-forwarded-for'] ||
                 socket.conn.request.connection.remoteAddress));
    this.__handleIdentifyEvent(socket);
  });

  this.isInitialized = true;
};

/**
 * Handles the `identify` socket.io events that identify a user by cookie
 * @param socket {Socket}
 */
Class.__handleIdentifyEvent = function(socket) {
  socket.on('identify', (cookie) => {
    let cookieData = this.__extractCookieData(cookie);
    Iron.unsealAsync(cookieData, ServerConfig.cookiePassword, Iron.defaults)
    .then((credentials) => {
      if (!credentials || credentials instanceof Error) {
        logger.error('Error decryping cookie from <identify> message');
        return socket.emit('identify', 'ERR');
      }

      let Authenticator = this.server.app.authenticator;
      return Authenticator.validateAccount(this.server, credentials)
      .then((result) => {
        if (!result || result instanceof Error) {
          logger.error(result);
          return socket.emit('identify', 'ERR');
        }
        return this.__createNewClient(socket, credentials);
      });
    }).catch((err) => {
      logger.error(err);
      socket.emit('identify', 'ERR');
    });
  });
};

Class.__extractCookieData = function(cookie) {
  if (!cookie) {
    return '';
  }

  let cookieTokens = cookie.match('sid-worldscope=(.*)');
  if (!cookieTokens || cookieTokens.length <= 0) {
    return '';
  }

  return cookieTokens[1];
};

/**
 * @param roomName {string}
 * @return {Room}
 */
Class.createNewRoom = function(roomName, streamId) {
  return this.roomsManager.createNewRoom(roomName, streamId);
};

/**
 * @param roomName {string}
 */
Class.closeRoom = function(roomName) {
  this.roomsManager.removeRoom(roomName);
};

/**
 * @param socket {Socket}
 * @param credentials {Object}
 */
Class.__createNewClient = function(socket, credentials) {
  return this.server.app.service.getUserById(credentials.userId)
  .then((user) => {
    if (!user || user instanceof Error) {
      throw new Error('Error creating Client for socket. '
                      + `User ${credentials.userId} not found`);
    }
    credentials.alias = user.alias;
    return new Client(socket, credentials);
  }).then((client) => {
    this.roomsManager.addClient(client);
    socket.emit('identify', 'OK');
  }).catch((err) => {
    logger.error(err);
    socket.emit('identify', 'ERR');
  });
};

var socketAdapter = new SocketAdapter();

module.exports = socketAdapter;
