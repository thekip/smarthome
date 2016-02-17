'use strict';

const _ = require('lodash');
const constants = require('./modbus-rtu/constants');
//constants.DEBUG = true;

const devices = require('./controlLoop');
const Promise = require('bluebird');

Promise.longStackTraces();
const io = require('./server').io;

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.emit('data', {
    acUnit: prepareDto(devices.ac),
    zones: _.map(devices.rooms, (room) => {
      return prepareDto(room);
    })
  });

  socket.on('gui.setZoneSetpoint', (data) => {
    console.log('receive setPoint event', data);
    devices.rooms[data.id].setTempSetpoint(data.setpoint);

    socket.broadcast.emit('zoneChanged', {
      data: prepareDto(devices.rooms[data.id])
    })
  });

  socket.on('gui.setZoneEnable', (data) => {
    console.log('receive setRoomEnable event');
    devices.rooms[data.id].setEnable(data.value);

    socket.broadcast.emit('zoneChanged', {
      data: prepareDto(devices.rooms[data.id])
    })
  });
});

_.forEach(devices.rooms, (room, i) => {
  room.onChange.bind((event) => {
    if (event.emitter == 'thermostat') { // avoid echo effect, reflect only when event emitted by thermostat
      io.emit('zoneChanged', {
        data: prepareDto(room)
      })
    }
  });
});

function prepareDto(obj) {
  const dto = {};
  _.each(obj, (value, key) => {
    if (!_.startsWith(key, '_')) {
      dto[key] = value;
    }
  });

  return dto;
}
