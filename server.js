var express = require('express'),
    app = express();
var server = require('http').Server(app);

app.use(express.static(__dirname + '/public'));
app.listen(80);

//var server = http.listen(3000, function () {
//    var host = server.address().address;
//    var port = server.address().port;
//
//    console.log('Listening at port %s', port)
//});

module.exports = {
    app: app,
    io: require('socket.io')(server),
}