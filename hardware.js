'use strict';

const _ = require('lodash');
const modbus = require('modbus-rtu');
const SerialPort = require('serialport').SerialPort;

const AcUnit = require('./entities/AcUnit');
const Thermostat = require('./entities/Thermostat');
const Dumper = require('./entities/Dumper');
const VavController = require('./entities/VavController');
const Room = require('./entities/Room');
const log = require('./libs/log');
const acUpdateLogic = require('./logic/ac-update-logic').acUpdateLogic;
const chalk = require('chalk');

const config = require('./config');

/**
 *
 * @type {{ac: AcUnit, rooms: Room[], aShield: VavController}}
 */
const devices = {
  ac: null,
  rooms: null,
  vavCtrl: null,
};

module.exports = devices;

// My system splitted to 2 buses.
// One bus is high-speed for acUnit, Analog Shield, and other devices wich support high speed communication
// and second bus especially for thermostats. Because they didn't support speed higher than 2400.
const highSpeedBus = new modbus.Master(new SerialPort(config.bus1.device, config.bus1.params), { endPacketTimeout: 50 });
const lowSpeedBus = new modbus.Master(new SerialPort(config.bus2.device, config.bus2.params), { responseTimeout: 800 });

devices.ac = new AcUnit(highSpeedBus, config.modbusDevices.acUnitAddress);
devices.vavCtrl = new VavController(highSpeedBus, config.modbusDevices.analogShieldAddress);

/**
 *
 * @type {Room[]}
 */
devices.rooms = _.map(config.rooms, (roomConfig) => {
  const thermostat = new Thermostat(lowSpeedBus, roomConfig.thermostatAddress);
  const dumper = new Dumper(roomConfig.dumperPort, devices.vavCtrl);

  const room = new Room(thermostat, dumper, devices.ac);

  room.onChange.bind(onRoomUpdate);

  return room;
});

devices.ac.update().then(() => {
  // just for debug purposes, log AC status
  log.info(devices.ac.toString());
});

function onRoomUpdate() {
  devices.rooms.forEach((room) => {
    room.updateDumperPosition();
  });

  acUpdateLogic(devices.ac, devices.rooms);
  devices.ac.update().done();
  printStatus();
}

function printStatus() {
  const dumpersStatus = devices.rooms.map(room => room.dumper.isOpened ? chalk.green('Opened') : 'Closed').join(', ');
  const roomsStatus = devices.rooms.map(room => room.enabled ? chalk.green('Enabled') : 'Disabled').join(', ');

  const modes = ['Auto', 'Heat', 'Dry', 'Fan', 'Cool'];

  log.info(chalk.bold('AC status: ' + (devices.ac.enabled ? chalk.green('On') : chalk.yellow('Off')) + ' Mode: ' + chalk.yellow(modes[devices.ac.mode])));
  log.info(chalk.bold(`Rooms status: [${roomsStatus}]`));
  log.info(chalk.bold(`Dumpers status: [${dumpersStatus}]`));
}
