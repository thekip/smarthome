'use strict';

const _ = require('lodash');
const modbus = require('./modbus-rtu');
const SerialPort = require('serialport').SerialPort;

const AcUnit = require('./entities/AcUnit');
const Thermostat = require('./entities/Thermostat');
const Dumper = require('./entities/Dumper');
const AnalogShield = require('./entities/AnalogShield');
const Room = require('./entities/Room');

const config = require('./config');

const devices = {
    ac: null,
    rooms: null,
    aShield: null
};

module.exports = devices;

// My system splitted to 2 buses.
// One bus is high-speed for acUnit, Analog Shield, and other devices wich support high speed communication
// and second bus especially for thermostats. Because they didn't support speed higher than 2400.
const highSpeedBus = new modbus.Master(new SerialPort(config.bus1.device, config.bus1.params));
const lowSpeedBus = new modbus.Master(new SerialPort(config.bus2.device, config.bus2.params));

devices.ac = new AcUnit(highSpeedBus, config.modbusDevices.acUnitAddress);
devices.aShield = new AnalogShield(highSpeedBus, config.modbusDevices.analogShieldAddress);

devices.rooms = _.map(config.rooms, (roomConfig) => {
    var thermostat = new Thermostat(lowSpeedBus, roomConfig.thermostatAddress);
    var dumper = new Dumper(roomConfig.dumperPort, devices.aShield);

    var room = new Room(thermostat, dumper, devices.ac);

    room.onChange.bind(() => {
      onRoomUpdate();
    });

    return room;
});

function onRoomUpdate() {
    //находим включенные комнаты
    var enabledRooms = _.filter(devices.rooms, {enabled: true});

    //если есть включенные комнаты, включаем кондей, иначе выключаем
    devices.ac.setEnabled(enabledRooms.length !== 0);

    if (enabledRooms.length !== 0) {
        //задаем кондею setpoint по самому нижнему значению из термостатов (для режима обогрев по самому верхнему))
        devices.ac.setTempSetpoint(Math.ceil(_.min(enabledRooms, 'tempSetpoint').tempSetpoint));

        //задаем в кондей температуру в комнате по самому верхнему значению из термостатов (для режима обогрев по самому нижнему)
        //Округление для охлаждения производим в нижнюю сторону, а для обгрева в верхнюю сторону
        devices.ac.setAmbientTemp(Math.floor(_.max(enabledRooms, 'ambientTemp').ambientTemp));
    } else {
        //если термостаты отключены, то сбрасываем на стандартные настройки кондиционера, что бы можно было управлять с его пульта.
        devices.ac.resetControls();
    }

    devices.ac.update().done(() => {
       // console.log('AC Unit. '+ devices.ac.toString());
    }, (err) => {
        console.log(err);
    })
}
