var _ = require('lodash');
var constants = require('./modbus-rtu/constants');
constants.DEBUG = true;
var devices = require('./controlLoop');
return;

var app = require('./server').app;
var io = require('./server').io;

io.on('connection', function(socket){
    console.log('a user connected');
    socket.emit('data', {
        acUnit: prepareDto(devices.ac),
        thermostats: _.map(devices.thermostats, function (thermostat) {
            return prepareDto(thermostat);
        })
    });

    socket.on('thermostat.changeTemp', function(data){
        devices.thermostats[data.thermostat].setTempSetpoint(data.setpoint)
            .catch(function(err){
                console.log(err);
            }).then(function(data){
                console.log(data);
            })
            .done();
    });

    socket.on('thermostat.setEnable', function (data) {
        devices.thermostats[data.thermostat].setEnable(data.value)
            .catch(function (err) {
                console.log(err);
            }).then(function (data) {
                console.log(data);
            })
            .done();
    });
});

_.forEach(devices.thermostats, function (thermostat, i) {
    thermostat.bind('change', function () {
        io.emit('thermostat.change', {
            index: i,
            data: prepareDto(thermostat)
        })
    });
});

function prepareDto(obj){
    return _.omit(obj, function(value, key){
        return key.indexOf("_") === 0;
    })
}

app.get('/api', function (req, res) {
    res.json({
        acUnit: prepareDto(devices.ac),
        thermostats: _.map(devices.thermostats, function (thermostat) {
           return prepareDto(thermostat);
        })
    });
});

app.get('/api/ac/enable', function (req, res) {
    devices.ac.enable().done(function(){
        res.json({
            acUnit: prepareDto(devices.ac)
        });
    });
});

app.get('/api/ac/disable', function (req, res) {
    devices.ac.disable().done(function(){
        res.json({
            acUnit: prepareDto(devices.ac)
        });
    });
});