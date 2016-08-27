'use strict';

const _ = require('lodash');

const devices = require('./hardware');
const Promise = require('bluebird');

Promise.longStackTraces();
const io = require('./server').io;

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.emit('data', {
    acUnit: prepareDto(devices.ac),
    zones: _.map(devices.rooms, (room) => room.getDto()),
    intakeFanEnabled: devices.vavCtrl.intakeFanEnabled,
    exhaustFanEnabled: devices.vavCtrl.exhaustFanEnabled,
  });

  socket.on('gui.changeZone', (resp) => {
    console.log('change Zone event', resp);
    _.assign(devices.rooms[resp.id], _.pick(resp.data, ['tempSetpoint', 'sync', 'enabled']) );

    socket.broadcast.emit('zoneChanged', devices.rooms[resp.id].getDto());
  });

  socket.on('changeIntakeFan', (value) => {
    console.log('enableIntakeFan event', value);
    devices.vavCtrl.changeIntakeFanStatus(value);

    socket.broadcast.emit('changeIntakeFan', value);
  });

  socket.on('changeExhaustFanStatus', (value) => {
    console.log('changeExhaustFanStatus event', value);
    devices.vavCtrl.changeExhaustFanStatus(value);

    socket.broadcast.emit('changeExhaustFanStatus', value);
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
