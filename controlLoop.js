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

    //находим включенные термостаты
    var enabledTherms = _.filter(devices.thermostats, {enabled: true});

    //если есть включенные термостаты, включаем кондей, иначе выключаем
    devices.ac.setEnabled(enabledTherms.length !== 0);

    if (enabledTherms.length !== 0) {
        //задаем кондею setpoint по самому нижнему значению из термостатов (для режима обогрев по самому верхнему))
        devices.ac.setTempSetpoint(Math.ceil(_.min(enabledTherms, 'tempSetpoint').tempSetpoint));

        //задаем в кондей температуру в комнате по самому верхнему значению из термостатов (для режима обогрев по самому нижнему)
        //Округление для охлаждения производим в нижнюю сторону, а для обгрева в верхнюю сторону
        devices.ac.setAmbientTemp(Math.floor(_.max(enabledTherms, 'roomTemp').roomTemp));
    } else {
        //если термостаты отключены, то сбрасываем на стандартные настройки кондиционера, что бы можно было управлять с его пульта.
        devices.ac.setDefaultAmbientTemp();
    }

    devices.ac.update().done(function(){
       // console.log('AC Unit. '+ devices.ac.toString());
    }, function(err){
        console.log(err);
    })
}