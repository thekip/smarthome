'use strict';

const _ = require('lodash');

const devices = require('./hardware');
const Promise = require('bluebird');
const log = require('./libs/log');

Promise.longStackTraces();
const io = require('./server').io;

devices.ac.onChange.bind(() => {
  io.emit('acUnitChanged', devices.ac.getDto());
});

devices.rooms.forEach((room) => {
  room.onChange.bind((event) => {
    if (event.emitter === 'thermostat') { // avoid echo effect, reflect only when event emitted by thermostat
      io.emit('zoneChanged', room.getDto());
    }
  });
});

io.on('connection', (socket) => {
  log.info('a user connected');

  socket.emit('data', {
    acUnit: devices.ac.getDto(),
    zones: _.map(devices.rooms, (room) => room.getDto()),
    intakeFanEnabled: devices.vavCtrl.intakeFanEnabled,
    exhaustFanEnabled: devices.vavCtrl.exhaustFanEnabled,
  });

  socket.on('gui.changeZone', (resp) => {
    log.info('change Zone event', resp);
    _.assign(devices.rooms[resp.id], _.pick(resp.data, ['tempSetpoint', 'sync', 'enabled']));

    socket.broadcast.emit('zoneChanged', devices.rooms[resp.id].getDto());
  });

  socket.on('changeIntakeFan', (value) => {
    log.info('enableIntakeFan event', value);
    devices.vavCtrl.changeIntakeFanStatus(value);

    socket.broadcast.emit('changeIntakeFan', value);
  });

  socket.on('changeExhaustFanStatus', (value) => {
    log.info('changeExhaustFanStatus event', value);
    devices.vavCtrl.changeExhaustFanStatus(value);

    socket.broadcast.emit('changeExhaustFanStatus', value);
  });
});

