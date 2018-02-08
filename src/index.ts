import { AcMode } from './entities/AcUnit';
import { RoomChangeEmitter } from './entities/Room';
import * as devices from './hardware';
import Promise from 'bluebird';
import { Log } from './libs/log';
import {io} from './server';

Promise.longStackTraces();

devices.ac.onChange.subscribe(() => {
  io.emit('acUnitChanged', devices.ac.getDto());
});

devices.rooms.forEach((room) => {
  room.onChange.subscribe((event) => {
    if (event.emitter === RoomChangeEmitter.thermostat) { // avoid echo effect, reflect only when event emitted by thermostat
      io.emit('zoneChanged', room.getDto());
    }
  });
});

io.on('connection', (socket: SocketIO.Socket) => {
  Log.info('a user connected');

  socket.emit('data', {
    acUnit: devices.ac.getDto(),
    zones: devices.rooms.map((room) => room.getDto()),
    intakeFanEnabled: devices.vavCtrl.intakeFanEnabled,
    exhaustFanEnabled: devices.vavCtrl.exhaustFanEnabled,
  });

  socket.on('gui.changeZone', (resp) => {
    Log.info('change Zone event', resp);
    const { tempSetpoint, sync, enabled } = resp.data;
    devices.rooms[resp.id].setDto({ tempSetpoint, sync, enabled });

    socket.broadcast.emit('zoneChanged', devices.rooms[resp.id].getDto());
  });

  socket.on('changeIntakeFan', (value: boolean) => {
    Log.info('enableIntakeFan event', value);
    devices.vavCtrl.changeIntakeFanStatus(value);

    socket.broadcast.emit('changeIntakeFan', value);
  });

  socket.on('changeExhaustFanStatus', (value: boolean) => {
    Log.info('changeExhaustFanStatus event', value);
    devices.vavCtrl.changeExhaustFanStatus(value);

    socket.broadcast.emit('changeExhaustFanStatus', value);
  });

  socket.on('changeAcMode', (value: AcMode) => {
    Log.info('changeAcMode event', value);
    devices.ac.setMode(value);

    socket.broadcast.emit('changeAcMode', value);
  });
});
