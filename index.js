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
    zones: _.map(devices.rooms, (room) => room.getDto())
  });

  socket.on('gui.changeZone', (resp) => {
    console.log('change Zone event', resp);
    _.assign(devices.rooms[resp.id], _.pick(resp.data, ['tempSetpoint', 'sync', 'enabled']) );

    socket.broadcast.emit('zoneChanged', devices.rooms[resp.id].getDto());
  });

  devices.ac.onChange.bind(() => {
    io.emit('acUnitChanged', prepareDto(devices.ac))
  });

  _.forEach(devices.rooms, (room, i) => {
    room.onChange.bind((event) => {
      if (event.emitter == 'thermostat') { // avoid echo effect, reflect only when event emitted by thermostat
        io.emit('zoneChanged', room.getDto())
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
});
