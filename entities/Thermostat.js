var _ = require('lodash');
var MicroEvent  = require('microevent');
var moment = require('moment');

var ModbusCrcError = require('modbus-rtu/errors').crc;
var TimeoutError = require('bluebird').TimeoutError;

module.exports = Thermostat;

var ENABLED_REGISTER = 0,
    FAN_SPEED_REGISTER = 1,
    MODE_REGISTER = 2,
    ROOM_TEMP_REGISTER = 3,
    TEMP_SETPOINT_REGISTER = 4,
    MANUAL_WEEKLY_PROG_REGISTER = 5,

    MINUTE_SECOND_REGISTER = 6,
    WEEK_HOUR_REGISTER = 7;

var ENABLED_VALUE = 165,
    DISABLED_VALUE = 90;


function Thermostat(modbusMaster, modbusAddr, noWatch) {
    this._modbusMaster = modbusMaster;
    this._modbusAddr = modbusAddr;

    this.enabled = false;
    this.fanSpeed = null;
    this.mode = null;
    this.roomTemp = null;
    this.tempSetpoint = null;
    this.isWeeklyProgram = null;

    this._rawData = [];
    this._currentData = [];

    if (!noWatch)
        this.watch();
}

MicroEvent.mixin(Thermostat);

_.extend(Thermostat.prototype, {
    update: function () {
        var th = this;
        return this._modbusMaster.readHoldingRegisters(this._modbusAddr, 0, 6).then(function (data) {
            th._rawData = data;

            th.enabled = data[ENABLED_REGISTER] != DISABLED_VALUE;
            th.fanSpeed = data[FAN_SPEED_REGISTER];
            th.mode = data[MODE_REGISTER];
            th.roomTemp = data[ROOM_TEMP_REGISTER] / 2;
            th.tempSetpoint = data[TEMP_SETPOINT_REGISTER] / 2;
            th.isWeeklyProgram = data[MANUAL_WEEKLY_PROG_REGISTER];
        })
    },

    toString: function(){
       return 'Status: '+ (this.enabled ? 'on' : 'off') +
        '; Room temp: ' + this.roomTemp + 'C; Set temp: ' + this.tempSetpoint +'C;'
    },

    /**
     *
     * @param {boolean} value
     */
    setEnable: function(value) {
        return this._modbusMaster.writeSingleRegister(this._modbusAddr, 9, !value ? DISABLED_VALUE : ENABLED_VALUE).then(function(){
            this.enabled = !!value;
            self._currentData[ENABLED_REGISTER] = !value ? DISABLED_VALUE : ENABLED_VALUE;
        });
    },

    enable: function(){
       return this.setEnable(true);
    },

    disable: function(){
        return this.setEnable(false);
    },

    setTempSetpoint: function(temp) {
        return this._modbusMaster.writeSingleRegister(this._modbusAddr, 13, temp * 2).then(function(){
            this.tempSetpoint = temp;
            self._currentData[TEMP_SETPOINT_REGISTER] = temp * 2;
        });
    },

    watch: function () {
        var self = this;

        self.update().finally(function () {
            if (self._currentData.length = 0 && self._rawData.length != 0) {
                self.trigger('ready', self);
            }

            if (!_.isEqual(self._currentData, self._rawData)) {
                self.trigger('change', self);
            }

            self._currentData = self._rawData.slice(0); //clone data array
            setTimeout(function () {
                self.watch();
            }, 300)
        }).catch(ModbusCrcError, TimeoutError, function(err){
            //do nothing
            console.log(err);
        });
    }
})

