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

  const dumpersStatus = devices.rooms.map(room => room.dumper.isOpened ? 'Opened' : 'Closed').join(', ');
  log.info(`Dumpers status: [${dumpersStatus}]`);

  devices.ac.update().done();
}
