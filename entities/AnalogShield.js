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
    update: function () {
        var th = this;
        return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 6).then(function (data) {
            th._rawData = data;

            th.enabled = data[ENABLED_REGISTER] != 90;
            th.fanSpeed = data[FAN_SPEED_REGISTER];
            th.mode = data[MODE_REGISTER];
            th.roomTemp = data[ROOM_TEMP_REGISTER] / 2;
            th.tempSetpoint = data[TEMP_SETPOINT_REGISTER] / 2;
            th.isWeeklyProgram = data[MANUAL_WEEKLY_PROG_REGISTER];
        })
    },

    /**
     * Set value for 1-10 output port
     * @param adr port address
     * @param value 0-255
     */
    setAnalogOutput: function (adr, value) {
        return this._modbusMaster.writeSingleRegister(this._modbusAddr, OUTPUT_1_10V_REGISTERS[adr], value);
    },


});

