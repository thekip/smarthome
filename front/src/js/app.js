require('angular-route');

var ngModule = require('angular').module('ClimateControlApp', ['ngRoute']);

require('./controllers/ThermostatCtrl')(ngModule);

module.exports = ngModule;