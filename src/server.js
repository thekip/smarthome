const express = require('express');
const compression = require('compression');
const config = require('./config');

const app = express();
const server = require('http').Server(app);
server.listen(config.httpPort);

app.use(compression());
app.use(express.static(__dirname + '/frontend'));

module.exports = {
  app: app,
  io: require('socket.io')(server),
};
