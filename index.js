'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080);

var io = socketIO.listen(app);

var cameraSocket;
var viewerSocket;

io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('camera connect', function() {
    log('Received request to connect camera');

    cameraSocket = socket;
    cameraSocket.emit('camera connected', cameraSocket.id)
  });

  socket.on('viewer connect', function() {
    log('Received request to connect viewer');

    viewerSocket = socket;
    viewerSocket.emit('viewer connected', viewerSocket.id)
    cameraSocket.emit('viewer connected', viewerSocket.id)
  });

  socket.on('bye', function(){
    console.log('received bye');
  });

});
