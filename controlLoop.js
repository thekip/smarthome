var _ = require('lodash');
var modbus = require('./modbus-rtu');
var SerialPort = require('serialport').SerialPort;

var AcUnit = require('./entities/AcUnit');
var Thermostat = require('./entities/Thermostat');
var Dumper = require('./entities/Dumper');
var AnalogShield = require('./entities/AnalogShield');
var Room = require('./entities/Room');

var config = require('./config');

var devices = {
    ac: null,
    //thermostats: null,
    rooms: null,
    aShield: null
}

module.exports = devices;

var serial = new SerialPort(config.serialPort.device, config.serialPort.params);
var master = new modbus.Master(serial);

devices.ac = new AcUnit(master, config.modbusDevices.acUnitAdress);
devices.aShield = new AnalogShield(master, config.modbusDevices.analogShieldAddress);

devices.rooms = _.map(config.rooms, function(roomConfig) {
    var thermostat = new Thermostat(master, roomConfig.thermostatAddress);
    var dumper = new Dumper(roomConfig.dumperPort, devices.aShield);

    var room = new Room(thermostat, dumper, devices.ac);

    room.bind('change', function(){
        onRoomUpdate();
    });

    return room;
});

//devices.thermostats = _.map(config.modbusDevices.termostatsAdresses, function(slave, i) {
//    var t = new Thermostat(master, slave, true);
//
//    t.bind('change', function(){
//        console.log('Thermostat '+ i + '. '+ t.toString());
//        onRoomUpdate();
//    });
//
//    return t;
//});

function onRoomUpdate() {

    //������� ���������� �������
    var enabledRooms = _.filter(devices.rooms, {enabled: true});

    //���� ���� ���������� �������, �������� ������, ����� ���������
    devices.ac.setEnabled(enabledRooms.length !== 0);

    if (enabledRooms.length !== 0) {
        //������ ������ setpoint �� ������ ������� �������� �� ����������� (��� ������ ������� �� ������ ��������))
        devices.ac.setTempSetpoint(Math.ceil(_.min(enabledRooms, 'tempSetpoint').tempSetpoint));

        //������ � ������ ����������� � ������� �� ������ �������� �������� �� ����������� (��� ������ ������� �� ������ �������)
        //���������� ��� ���������� ���������� � ������ �������, � ��� ������� � ������� �������
        devices.ac.setAmbientTemp(Math.floor(_.max(enabledRooms, 'ambientTemp').ambientTemp));
    } else {
        //���� ���������� ���������, �� ���������� �� ����������� ��������� ������������, ��� �� ����� ���� ��������� � ��� ������.
        devices.ac.resetControls();
    }

    //devices.ac.update().done(function(){
    //   // console.log('AC Unit. '+ devices.ac.toString());
    //}, function(err){
    //    console.log(err);
    //})
}