var _ = require('lodash');
var modbus = require('./modbus-rtu');
var SerialPort = require('serialport').SerialPort;

var AcUnit = require('./devices/AcUnit');
var Thermostat = require('./devices/Thermostat');

var config = require('./config');

var devices = {
    ac: null,
    thermostats: null
}

module.exports = devices;

var master = new modbus.Master(new SerialPort(config.serialPort.device, config.serialPort.params));

devices.ac = new AcUnit(master, config.modbusDevices.acUnitAdress);
devices.thermostats = _.map(config.modbusDevices.termostatsAdresses, function(slave, i) {
    var t = new Thermostat(master, slave);

    t.bind('change', function(){
        console.log('Thermostat '+ i +'. '+ t.toString());
        onThermostatUpdate();
    });

    return t;
});

function onThermostatUpdate() {

    //������� ���������� ����������
    var enabledTherms = _.filter(devices.thermostats, {enabled: true});

    //���� ���� ���������� ����������, �������� ������, ����� ���������
    devices.ac.setEnabled(enabledTherms.length !== 0);

    if (enabledTherms.length !== 0) {
        //������ ������ setpoint �� ������ ������� �������� �� ����������� (��� ������ ������� �� ������ ��������))
        devices.ac.setTempSetpoint(Math.ceil(_.min(enabledTherms, 'tempSetpoint').tempSetpoint));

        //������ � ������ ����������� � ������� �� ������ �������� �������� �� ����������� (��� ������ ������� �� ������ �������)
        //���������� ��� ���������� ���������� � ������ �������, � ��� ������� � ������� �������
        devices.ac.setAmbientTemp(Math.floor(_.max(enabledTherms, 'roomTemp').roomTemp));
    } else {
        //���� ���������� ���������, �� ���������� �� ����������� ��������� ������������, ��� �� ����� ���� ��������� � ��� ������.
        devices.ac.setDefaultAmbientTemp();
    }

    devices.ac.update().done(function(){
       // console.log('AC Unit. '+ devices.ac.toString());
    }, function(err){
        console.log(err);
    })
}