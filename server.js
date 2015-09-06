var app = require('express')();
var http = require('http').Server(app);

var server = http.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at port %s', port)
});

module.exports = {
    app: app,
    io: require('socket.io')(http, {path: '/foo'}),
}