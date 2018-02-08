import { ModbusMaster } from 'modbus-rtu';
import { AcUnit } from './entities/AcUnit';
import { Dumper } from './entities/Dumper';
import { Room } from './entities/Room';
import { Thermostat } from './entities/Thermostat';
import { VavController } from './entities/VavController';
import SerialPort from 'serialport';
//import SerialPort = require('serialport');
import chalk from 'chalk';
import config from './config';
import { Log } from './libs/log';
import { acUpdateLogic } from './logic/ac-update-logic';


// System split into 2 buses.
// One bus is high-speed for acUnit, Analog Shield, and other devices wich support high speed communication
// and second bus especially for thermostats. Because they didn't support speed higher than 2400.
const highSpeedBus = new ModbusMaster(
  new SerialPort(config.bus1.device, config.bus1.params),
);

const lowSpeedBus = new ModbusMaster(
  new SerialPort(config.bus2.device, config.bus2.params), { responseTimeout: 800 },
);

export const ac = new AcUnit(highSpeedBus, config.modbusDevices.acUnitAddress);
export const vavCtrl = new VavController(highSpeedBus, config.modbusDevices.analogShieldAddress);

ac.onChange.subscribe(onStateChange);

export const rooms: Room[] = config.rooms.map((roomConfig) => {
  const thermostat = new Thermostat(lowSpeedBus, roomConfig.thermostatAddress);
  const dumper = new Dumper(roomConfig.dumperPort, vavCtrl);

  const room = new Room(thermostat, dumper, ac);

  room.onChange.subscribe(onStateChange);

  return room;
});

ac.update().then(() => {
  // just for debug purposes, log AC status
  Log.info(ac.toString());
});

function onStateChange() {
  rooms.forEach((room) => {
    room.updateDumperPosition();
  });

  acUpdateLogic(ac, rooms);
  ac.update().done();
  printStatus();
}

function printStatus() {
  const dumpersStatus = rooms.map((room) => room.dumper.isOpened ? chalk.green('Opened') : 'Closed').join(', ');
  const roomsStatus = rooms.map((room) => room.enabled ? chalk.green('Enabled') : 'Disabled').join(', ');

  const modes = ['Auto', 'Heat', 'Dry', 'Fan', 'Cool'];

  Log.info(chalk.bold('AC status: ' + (ac.enabled ? chalk.green('On') : chalk.yellow('Off')) + ' Mode: ' + chalk.yellow(modes[ac.mode])));
  Log.info(chalk.bold(`Rooms status: [${roomsStatus}]`));
  Log.info(chalk.bold(`Dumpers status: [${dumpersStatus}]`));
}
