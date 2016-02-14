var express = require('express'),
    app = express();
var server = require('http').Server(app);
server.listen(80);

app.use(express.static(__dirname + '/frontend'));

module.exports = {
    app: app,
    io: require('socket.io')(server),
}