var _ = require('lodash');
var modbus = require('./modbus-rtu');
var SerialPort = require('serialport').SerialPort;
var adapter485 = require('./pi-485-serial-adapter')
var AcUnit = require('./devices/AcUnit');
var Thermostat = require('./devices/Thermostat');
var gpio = require('pi-gpio')

var config = require('./config');

var devices = {
    ac: null,
    thermostats: null
}

module.exports = devices;

var serial = new SerialPort(config.serialPort.device, config.serialPort.params);
adapter485.attach(serial, 12);


function loop() {
    master.readHoldingRegisters(2, 0, 4)
        .finally(function(){
            setTimeout(loop, 1000);
        }).done(function(data) {
            console.log(data);
        }, function(err){
            console.log(err);
        });
}

var master = new modbus.Master(serial, function(){
    loop()
});

//devices.ac = new AcUnit(master, config.modbusDevices.acUnitAdress);
//devices.thermostats = _.map(config.modbusDevices.termostatsAdresses, function(slave, i) {
//    var t = new Thermostat(master, slave, true);
//
//    t.bind('change', function(){
//        console.log('Thermostat '+ i + '. '+ t.toString());
//        onThermostatUpdate();
//    });
//
//    return t;
//});

//
//var pin = 12;
//
//
//(function loop() {
//    gpio.close(pin);
//gpio.open(pin, "output pulldown", function(err) {
//    if (err)
//        console.log(err);
//
//    gpio.write(pin, 1, function(err) {          // Set pin 16 high (1)
//        console.log('pin setted to 1', err);
//
//
//        setTimeout(function() {
//            gpio.write(pin, 0, function(err){
//                console.log('pin setted to 0', err);
//                setTimeout(function() {
//                    loop();
//                }, 2000)
//            })
//        }, 2000)
//        //serial.drain(function(){
//        //    gpio.write(pin, 0, function(err){
//        //        console.log('pin setted to 0', err);
//        //    });
//        //})
//    });
//});
//})()



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
        devices.ac.resetControls();
    }

    devices.ac.update().done(function(){
       // console.log('AC Unit. '+ devices.ac.toString());
    }, function(err){
        console.log(err);
    })
}