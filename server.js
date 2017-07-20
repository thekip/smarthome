const express = require('express');
const compression = require('compression');
const app = express();
const server = require('http').Server(app);
server.listen(80);

app.use(compression());
app.use(express.static(__dirname + '/frontend'));

module.exports = {
  app: app,
  io: require('socket.io')(server),
};
