var _ = require('lodash');
var MicroEvent = require('microevent');
var moment = require('moment');

var ModbusCrcError = require('modbus-rtu/errors').crc;
var TimeoutError = require('bluebird').TimeoutError;

module.exports = AnalogShield;

var OUTPUT_1_10V_REGISTERS = [0, 1, 2, 3, 4];


function AnalogShield(modbusMaster, modbusAddr) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;
}

//MicroEvent.mixin(AnalogShield);

_.extend(AnalogShield.prototype, {
    /**
     * Set value for 1-10 output port
     * @param adr port address
     * @param value 0-255
     */
    setAnalogOutput: function (adr, value) {
        return this._modbusMaster.writeSingleRegister(this._modbusAddr, OUTPUT_1_10V_REGISTERS[adr], value, 100);
    },


});

