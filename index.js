var _ = require('lodash');
var constants = require('./modbus-rtu/constants');
//constants.DEBUG = true;
var devices = require('./controlLoop');
var Promise =  require('bluebird');

Promise.longStackTraces();
var app = require('./server').app;
var io = require('./server').io;

io.on('connection', function(socket){
    console.log('a user connected');

    socket.emit('data', {
        acUnit: prepareDto(devices.ac),
        zones: _.map(devices.rooms, function (room) {
            return prepareDto(room);
        })
    });

    socket.on('gui.setZoneSetpoint', function(data){
        console.log('receive setPoint event', data);
        devices.rooms[data.id].setTempSetpoint(data.setpoint);
    });

    socket.on('gui.setZoneEnable', function (data) {
        console.log('receive setRoomEnable event');
        devices.rooms[data.id].setEnable(data.value);
    });
});

_.forEach(devices.rooms, function (room, i) {
    room.bind('change', function () {
        io.emit('zoneChanged', {
            data: prepareDto(room)
        })
    });
});

function prepareDto(obj) {
    const dto = {};
    _.each(obj, function(value, key) {
        if (!_.startsWith(key, '_')) {
            dto[key] = value;
        }
    });

    return dto;
}