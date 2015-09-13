var _ = require('lodash');
var constants = require('./modbus-rtu/constants');
constants.DEBUG = true;
var devices = require('./controlLoop');

var app = require('./server').app;
var io = require('./server').io;

io.on('connection', function(socket){
    console.log('a user connected');

    socket.emit('data', {
        acUnit: prepareDto(devices.ac),
        rooms: _.map(devices.rooms, function (room) {
            return prepareDto(room);
        })
    });

    socket.on('gui.changeRoomTemp', function(data){
        devices.rooms[data.id].setTempSetpoint(data.setpoint).done();
    });

    socket.on('gui.setRoomEnable', function (data) {
        devices.rooms[data.id].setEnable(data.value).done();
    });
});

_.forEach(devices.rooms, function (room, i) {
    room.bind('change', function () {
        io.emit('room.change', {
            index: i,
            data: prepareDto(room)
        })
    });
});

function prepareDto(obj){
    return _.omit(obj, function(value, key){
        return key.indexOf("_") === 0;
    })
}