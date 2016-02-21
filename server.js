var express = require('express'),
    compression = require('compression'),
    app = express();
var server = require('http').Server(app);
server.listen(80);

app.use(compression());
app.use(express.static(__dirname + '/frontend'));

module.exports = {
    app: app,
    io: require('socket.io')(server),
}
