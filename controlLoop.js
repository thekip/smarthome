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
    rooms: null,
    aShield: null
};

module.exports = devices;

var serial = new SerialPort(config.serialPort.device, config.serialPort.params);
var master = new modbus.Master(serial);

devices.ac = new AcUnit(master, config.modbusDevices.acUnitAddress);
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

    devices.ac.update().done(function(){
       // console.log('AC Unit. '+ devices.ac.toString());
    }, function(err){
        console.log(err);
    })
}