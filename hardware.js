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

  const enabledRooms = _.filter(devices.rooms, (room) => room.isActive);

  // если есть включенные комнаты, включаем кондей, иначе выключаем
  devices.ac.setEnabled(enabledRooms.length !== 0);

  if (enabledRooms.length !== 0) {
    // задаем кондею setpoint по самому нижнему значению из термостатов (для режима обогрев по самому верхнему))
    // задаем в кондей температуру в комнате по самому верхнему значению из термостатов (для режима обогрев по самому нижнему)
    // Округление для охлаждения производим в нижнюю сторону, а для обгрева в верхнюю сторону
    if (devices.ac.mode === AcUnit.MODES.COOL) {
      devices.ac.setTempSetpoint(Math.ceil(_.min(enabledRooms, 'tempSetpoint').tempSetpoint));
      devices.ac.setAmbientTemp(Math.floor(_.max(enabledRooms, 'ambientTemp').ambientTemp));
    } else if (devices.ac.mode === AcUnit.MODES.HEAT) {
      devices.ac.setTempSetpoint(Math.ceil(_.max(enabledRooms, 'tempSetpoint').tempSetpoint));
      devices.ac.setAmbientTemp(Math.ceil(_.min(enabledRooms, 'ambientTemp').ambientTemp));
    }
  } else {
    // если термостаты отключены, то сбрасываем на стандартные настройки кондиционера, что бы можно было управлять с его пульта.
    devices.ac.resetControls();
  }

  const dumpersStatus = devices.rooms.map(room => room.dumper.isOpened ? 'Opened' : 'Closed').join(', ');
  log.info(`Dumpers status: [${dumpersStatus}]`);

  devices.ac.update().done();
}
